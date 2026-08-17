import { db, CFG, lerConfig, gravarConfig } from '../db/db';
import { migrarDoLocalStorage } from '../db/migracao';
import {
  INITIAL_EQUIPMENT,
  INITIAL_VEHICLES,
  projetoExemplo,
} from './dadosIniciais';
import type {
  Equipamento,
  Projeto,
  Diaria,
  DiariaItemStatus,
  ItemLocationStatus,
  BatteryStatus,
  UserRole,
  Profile,
  DailyPhase,
  BugReport,
  Checagem,
} from '../types/setgear';

/**
 * O estado do app, agora sobre Dexie (IndexedDB).
 *
 * DUAS CAMADAS, DE PROPÓSITO:
 *
 *   - O Dexie é a camada durável. Toda escrita vai para lá.
 *   - Um espelho em memória atende as leituras, que continuam sincronizadas.
 *
 * O motivo do espelho é que o Dexie é assíncrono e a interface lê durante o
 * render. Manter as leituras sincronizadas foi o que permitiu trocar toda a
 * persistência sem tocar em nenhum dos 17 componentes — o diff desta fase é da
 * camada de dados, e só dela. Quando a interface migrar para `useLiveQuery`
 * (numa fase de UI), o espelho sai.
 *
 * Antes disto o estado morava em `localStorage`, e cada mudança reserializava as
 * seis chaves inteiras — inclusive o inventário completo, a cada toque num item.
 */

/** Chave do espelho de status. O par (diária, equipamento) é o que identifica. */
function chaveStatus(diariaId: string, equipamentoId: string): string {
  return `${diariaId}|${equipamentoId}`;
}

/**
 * Id único sem depender do relógio.
 *
 * `crypto.randomUUID` existe no navegador e no Node moderno. O fallback cobre
 * contexto sem `crypto` seguro (http em rede local, que é cenário real quando se
 * testa o app pelo celular no set).
 */
function novoId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function ehBateria(equip: Equipamento | undefined): boolean {
  if (!equip) return false;
  return equip.categoria_id === 'cat-3' || equip.nome.toLowerCase().includes('bateria');
}

function statusNovo(diariaId: string, equipamentoId: string, bateria: boolean): DiariaItemStatus {
  return {
    id: `s-${diariaId}-${equipamentoId}`,
    diaria_id: diariaId,
    equipamento_id: equipamentoId,
    status_carga: bateria ? 'pendente' : 'nao_requer',
    status_locacao: 'pendente_base',
    validado_por_qr: false,
    bateria_alerta_100: false,
    bateria_carregando: false,
  };
}

export class SetGearStore {
  private static instance: SetGearStore;

  // ---- Espelho em memória ----
  private equipments: Equipamento[] = [];
  private projects: Projeto[] = [];
  private dailies: Diaria[] = [];
  private statuses = new Map<string, DiariaItemStatus>();
  private checagens: Checagem[] = [];

  /**
   * Próximo número de sequência do rastro.
   *
   * Retomado de `max(seq) + 1` ao carregar, para que o contador não reinicie a
   * cada abertura do app e volte a empatar com o que já está gravado.
   */
  private proximoSeq = 1;

  private bugReports: BugReport[] = [];
  private passwords: { adminPass: string; opPass: string } = { adminPass: 'admin123', opPass: 'op123' };
  private senhasConfiguradas = false;

  private activeUser: Profile = { id: 'usr-local', nome: 'Eugenio', cargo: 'operador' };
  private activeProjectId: string | null = null;
  private activeDailyId: string | null = null;

  private listeners: (() => void)[] = [];
  private pronto = false;

  /**
   * Fila de escrita.
   *
   * Serializa as gravações no Dexie para que duas mudanças rápidas (tocar dois
   * itens seguidos) não disputem a mesma transação. Erro aqui significa dado que
   * está na tela e não no disco, então ele é registrado alto — silêncio seria
   * mostrar ao usuário uma conferência que não sobreviveu ao refresh.
   */
  private fila: Promise<unknown> = Promise.resolve();

  private constructor() {}

  public static getInstance(): SetGearStore {
    if (!SetGearStore.instance) SetGearStore.instance = new SetGearStore();
    return SetGearStore.instance;
  }

  // =====================================================================
  // INICIALIZAÇÃO
  // =====================================================================

  /** Migra o que houver, carrega o espelho e semeia se o banco estiver vazio. */
  public async init(): Promise<void> {
    if (this.pronto) return;

    await migrarDoLocalStorage();

    if ((await db.equipamentos.count()) === 0 && (await db.projetos.count()) === 0) {
      await this.semear();
    }

    await this.recarregarEspelho();
    this.pronto = true;
  }

  public estaPronto(): boolean {
    return this.pronto;
  }

  /**
   * Relê tudo do banco, descartando o espelho atual.
   *
   * Necessária quando o conteúdo do Dexie muda por fora do store: é o caso da
   * restauração de um backup e, na Fase 2, da chegada de dados do servidor pelo
   * sync — nos dois, o espelho em memória fica velho e não há como saber o que
   * mudou item por item.
   */
  public async recarregarDoZero(): Promise<void> {
    await this.fila;
    await this.recarregarEspelho();
    this.pronto = true;
    this.notify();
  }

  /** Garante que tudo o que foi enfileirado chegou ao disco. */
  public async aguardarGravacoes(): Promise<void> {
    await this.fila;
  }

  private async semear(): Promise<void> {
    const diaria: Diaria = {
      id: `d-${projetoExemplo.id}-0`,
      projeto_id: projetoExemplo.id,
      projeto_nome: projetoExemplo.nome,
      data_diaria: projetoExemplo.diarias_datas[0],
      horario_saida: '10:00',
      status: 'em_andamento',
      // Diária zerada: nada de equipamento pré-adicionado. É a regra do produto.
      equipamentos_ids: [],
    };

    await db.transaction('rw', [db.equipamentos, db.projetos, db.diarias, db.configuracoes], async () => {
      await db.equipamentos.bulkPut(INITIAL_EQUIPMENT);
      await db.projetos.put(projetoExemplo);
      await db.diarias.put(diaria);
      await db.configuracoes.put({ chave: CFG.PROJETO_ATIVO, valor: projetoExemplo.id });
      await db.configuracoes.put({ chave: CFG.DIARIA_ATIVA, valor: diaria.id });
    });
  }

  private async recarregarEspelho(): Promise<void> {
    const [equipamentos, projetos, diarias, status, checagens, bugs] = await Promise.all([
      db.equipamentos.toArray(),
      db.projetos.toArray(),
      db.diarias.toArray(),
      db.diaria_itens_status.toArray(),
      db.checagens.toArray(),
      db.bugs.toArray(),
    ]);

    this.equipments = equipamentos;
    this.projects = projetos;
    this.dailies = diarias;
    this.checagens = checagens;
    this.bugReports = bugs;

    this.proximoSeq = checagens.reduce((maior, c) => Math.max(maior, c.seq ?? 0), 0) + 1;

    this.statuses.clear();
    for (const st of status) {
      this.statuses.set(chaveStatus(st.diaria_id, st.equipamento_id), st);
    }

    const senhas = await lerConfig<{ adminPass: string; opPass: string } | null>(CFG.SENHAS, null);
    if (senhas) {
      this.passwords = senhas;
      this.senhasConfiguradas = true;
    }

    const usuario = await lerConfig<Profile | null>(CFG.USUARIO_ATIVO, null);
    if (usuario) this.activeUser = usuario;

    this.activeProjectId = await lerConfig<string | null>(CFG.PROJETO_ATIVO, null);
    this.activeDailyId = await lerConfig<string | null>(CFG.DIARIA_ATIVA, null);

    // Garante que sempre haja projeto e diária ativos: `getActiveDaily()` é
    // sincronizado e não pode devolver nada.
    if (!this.activeProjectId || !this.projects.some(p => p.id === this.activeProjectId)) {
      this.activeProjectId = this.projects[0]?.id ?? null;
    }
    if (!this.activeDailyId || !this.dailies.some(d => d.id === this.activeDailyId)) {
      const doProjeto = this.dailies.filter(d => d.projeto_id === this.activeProjectId);
      this.activeDailyId = doProjeto[0]?.id ?? null;
    }
  }

  // =====================================================================
  // PERSISTÊNCIA
  // =====================================================================

  private enfileirar(operacao: () => Promise<unknown>): void {
    this.fila = this.fila
      .then(operacao)
      .catch(erro => console.error('[SetGear] Falha ao gravar no banco local.', erro));
  }

  private notify(): void {
    this.listeners.forEach(l => l());
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // =====================================================================
  // SENHAS
  // =====================================================================

  public hasConfiguredPasswords(): boolean {
    return this.senhasConfiguradas;
  }

  public setupInitialPasswords(adminPass: string, opPass: string) {
    this.passwords = { adminPass, opPass };
    this.senhasConfiguradas = true;
    this.enfileirar(() => gravarConfig(CFG.SENHAS, this.passwords));
    this.notify();
  }

  public validatePassword(role: UserRole, inputPass: string): boolean {
    if (role === 'admin') return inputPass === this.passwords.adminPass;
    if (role === 'operador') return inputPass === this.passwords.opPass;
    return true;
  }

  // =====================================================================
  // BUGS
  // =====================================================================

  public saveBugReport(titulo: string, descricao: string): BugReport {
    const novo: BugReport = {
      id: `bug-${Date.now()}`,
      titulo,
      descricao,
      data_criacao: new Date().toLocaleDateString('pt-BR'),
      autor: this.activeUser.nome,
      status: 'pendente',
    };
    this.bugReports.unshift(novo);
    this.enfileirar(() => db.bugs.put(novo));
    this.notify();
    return novo;
  }

  public getBugReports(): BugReport[] {
    return this.bugReports;
  }

  // =====================================================================
  // USUÁRIO
  // =====================================================================

  public getActiveUser(): Profile {
    return this.activeUser;
  }

  public setActiveUserName(name: string) {
    this.activeUser = { ...this.activeUser, nome: name };
    this.enfileirar(() => gravarConfig(CFG.USUARIO_ATIVO, this.activeUser));
    this.notify();
  }

  public setUserRole(role: UserRole) {
    this.activeUser = { ...this.activeUser, cargo: role };
    this.enfileirar(() => gravarConfig(CFG.USUARIO_ATIVO, this.activeUser));
    this.notify();
  }

  /**
   * Permissão do operador sobre um equipamento.
   *
   * Compara o nome do dono com o nome do usuário por substring, e isso é fraco:
   * "Ana" casa com "Mariana". A guarda de nome vazio abaixo existe porque
   * `qualquerCoisa.includes('')` é sempre verdadeiro — sem ela, um usuário sem
   * nome poderia mexer em tudo.
   *
   * A correção de verdade é da Fase 2, com autenticação e `perfil_id` no lugar
   * de comparar texto digitado. Enquanto isso, isto NÃO é uma fronteira de
   * segurança: é conveniência de interface.
   */
  public canUserEditEquipment(equipment: Equipamento): boolean {
    if (this.activeUser.cargo === 'admin') return true;

    const dono = (equipment.proprietario_nome || '').toLowerCase().trim();
    const usuario = (this.activeUser.nome || '').toLowerCase().trim();
    if (!dono || !usuario) return false;

    return dono.includes(usuario) || usuario.includes(dono);
  }

  // =====================================================================
  // PROJETOS
  // =====================================================================

  public getProjects(): Projeto[] {
    return this.projects;
  }

  public getActiveProject(): Projeto {
    const encontrado = this.projects.find(p => p.id === this.activeProjectId);
    if (encontrado) return encontrado;
    // Só acontece antes do `init()` ou com banco vazio. Devolver um projeto
    // vazio evita que a tela quebre enquanto carrega.
    return this.projects[0] ?? { ...projetoExemplo, id: 'sem-projeto', nome: 'Sem projeto', diarias_datas: [], veiculos: [] };
  }

  public setActiveProject(projectId: string) {
    const projeto = this.projects.find(p => p.id === projectId);
    if (!projeto) return;

    this.activeProjectId = projeto.id;

    // Seleciona a diária deste projeto, criando a primeira se ainda não houver.
    // Antes, trocar de projeto reaproveitava a mesma diária chumbada.
    const doProjeto = this.dailies.filter(d => d.projeto_id === projeto.id);
    if (doProjeto.length > 0) {
      this.activeDailyId = doProjeto[0].id;
    } else {
      const nova = this.criarDiaria(projeto, projeto.diarias_datas[0] ?? 'sem data');
      this.activeDailyId = nova.id;
    }

    this.enfileirar(async () => {
      await gravarConfig(CFG.PROJETO_ATIVO, this.activeProjectId);
      await gravarConfig(CFG.DIARIA_ATIVA, this.activeDailyId);
    });
    this.notify();
  }

  public createProject(projData: Omit<Projeto, 'id'>) {
    const novo: Projeto = {
      ...projData,
      id: `proj-${Date.now()}`,
      criador_id: this.activeUser.id,
      veiculos: projData.veiculos?.length ? projData.veiculos : INITIAL_VEHICLES,
    };
    this.projects.push(novo);
    this.enfileirar(() => db.projetos.put(novo));
    this.setActiveProject(novo.id);
  }

  // =====================================================================
  // DIÁRIAS
  // =====================================================================

  /** Cria a diária no espelho e agenda a gravação. Não mexe no que está ativo. */
  private criarDiaria(projeto: Projeto, data: string): Diaria {
    const nova: Diaria = {
      id: `d-${projeto.id}-${data.replace(/\W/g, '')}-${Date.now()}`,
      projeto_id: projeto.id,
      projeto_nome: projeto.nome,
      data_diaria: data,
      horario_saida: '10:00',
      status: 'em_andamento',
      equipamentos_ids: [],
    };
    this.dailies.push(nova);
    this.enfileirar(() => db.diarias.put(nova));
    return nova;
  }

  public getActiveDaily(): Diaria {
    const encontrada = this.dailies.find(d => d.id === this.activeDailyId);
    if (encontrada) return encontrada;
    const projeto = this.getActiveProject();
    return {
      id: 'sem-diaria',
      projeto_id: projeto.id,
      projeto_nome: projeto.nome,
      data_diaria: projeto.diarias_datas?.[0] ?? '—',
      horario_saida: '10:00',
      status: 'planejada',
      equipamentos_ids: [],
    };
  }

  public getDailiesForActiveProject(): Diaria[] {
    return this.dailies.filter(d => d.projeto_id === this.activeProjectId);
  }

  /**
   * Troca a diária ativa para a data pedida.
   *
   * Antes esta função fazia `equipamentos_ids = []` na única diária que existia —
   * ou seja, mudar de data APAGAVA a conferência do dia anterior, sem aviso e
   * sem como voltar. Agora cada data tem a sua própria diária: a de ontem
   * continua intacta, e voltar para ela mostra exatamente o que foi conferido.
   */
  public setDailyDate(dateStr: string) {
    const projeto = this.getActiveProject();

    const existente = this.dailies.find(
      d => d.projeto_id === projeto.id && d.data_diaria === dateStr
    );

    const alvo = existente ?? this.criarDiaria(projeto, dateStr);
    this.activeDailyId = alvo.id;

    this.enfileirar(() => gravarConfig(CFG.DIARIA_ATIVA, this.activeDailyId));
    this.notify();
  }

  // =====================================================================
  // EQUIPAMENTOS NA DIÁRIA
  // =====================================================================

  private statusDe(equipamentoId: string): DiariaItemStatus | undefined {
    return this.statuses.get(chaveStatus(this.getActiveDaily().id, equipamentoId));
  }

  private gravarStatus(st: DiariaItemStatus): void {
    this.statuses.set(chaveStatus(st.diaria_id, st.equipamento_id), st);
    this.enfileirar(() => db.diaria_itens_status.put(st));
  }

  public getDailyEquipments(): Equipamento[] {
    const diaria = this.getActiveDaily();
    const ids = diaria.equipamentos_ids ?? [];

    return this.equipments
      .filter(eq => ids.includes(eq.id))
      .map(eq => {
        const st = this.statuses.get(chaveStatus(diaria.id, eq.id));
        return {
          ...eq,
          status_carga: st?.status_carga ?? 'nao_requer',
          status_locacao: st?.status_locacao ?? 'pendente_base',
          validado_por_qr: st?.validado_por_qr ?? false,
          bateria_alerta_100: st?.bateria_alerta_100 ?? false,
          bateria_carregando: st?.bateria_carregando ?? false,
          conferido_por: st?.conferido_por,
          conferido_em: st?.conferido_em,
        };
      });
  }

  public getMasterEquipments(): Equipamento[] {
    return this.equipments;
  }

  public addEquipmentToDaily(equipmentId: string, includeFullContainer: boolean = false) {
    const diaria = this.getActiveDaily();
    if (diaria.id === 'sem-diaria') return;

    const incluir = (id: string) => {
      if (!diaria.equipamentos_ids.includes(id)) diaria.equipamentos_ids.push(id);
      if (!this.statuses.has(chaveStatus(diaria.id, id))) {
        const equip = this.equipments.find(e => e.id === id);
        this.gravarStatus(statusNovo(diaria.id, id, ehBateria(equip)));
      }
    };

    incluir(equipmentId);

    if (includeFullContainer) {
      const alvo = this.equipments.find(e => e.id === equipmentId);
      const containerId = alvo?.e_container ? alvo.id : alvo?.container_pai_id;
      if (containerId) {
        incluir(containerId);
        for (const filho of this.equipments.filter(e => e.container_pai_id === containerId)) {
          incluir(filho.id);
        }
      }
    }

    this.enfileirar(() => db.diarias.put(diaria));
    this.notify();
  }

  // =====================================================================
  // BATERIAS
  // =====================================================================

  public updateBatteryStatus(equipmentId: string, newBatteryStatus: BatteryStatus) {
    const atual = this.statusDe(equipmentId);
    if (!atual) return;
    this.gravarStatus({
      ...atual,
      status_carga: newBatteryStatus,
      bateria_alerta_100: newBatteryStatus === 'nao_100_porcento',
      updated_at: new Date().toISOString(),
    });
    this.notify();
  }

  public toggleBatteryCharging(equipmentId: string) {
    const atual = this.statusDe(equipmentId);
    if (!atual) return;
    const carregando = !atual.bateria_carregando;
    this.gravarStatus({
      ...atual,
      bateria_carregando: carregando,
      status_carga: carregando ? 'carregando' : 'pendente',
      updated_at: new Date().toISOString(),
    });
    this.notify();
  }

  public setBattery100(equipmentId: string, is100: boolean) {
    const atual = this.statusDe(equipmentId);
    if (!atual) return;
    this.gravarStatus({
      ...atual,
      status_carga: is100 ? '100_porcento' : 'nao_100_porcento',
      bateria_alerta_100: !is100,
      bateria_carregando: false,
      updated_at: new Date().toISOString(),
    });
    this.notify();
  }

  // =====================================================================
  // CONFERÊNCIA
  // =====================================================================

  public updateItemLocationStatus(
    equipmentId: string,
    newStatus: ItemLocationStatus,
    viaQR: boolean = false
  ) {
    const diaria = this.getActiveDaily();
    const alvo = this.equipments.find(e => e.id === equipmentId);

    if (alvo && !this.canUserEditEquipment(alvo)) {
      alert(
        `Permissão restrita: Este equipamento pertence a '${alvo.proprietario_nome}'. Apenas ele ou o Admin podem alterá-lo.`
      );
      return;
    }

    const agora = new Date().toISOString();
    const quem = this.activeUser.nome || 'não identificado';

    const marcar = (id: string, emCascata: boolean) => {
      const equip = this.equipments.find(e => e.id === id);
      const atual =
        this.statuses.get(chaveStatus(diaria.id, id)) ??
        statusNovo(diaria.id, id, ehBateria(equip));

      // Remarcar para o mesmo status não é acontecimento: sem esta guarda, abrir
      // a tela e tocar duas vezes no mesmo botão encheria o histórico de linhas
      // idênticas, e um histórico ruidoso não é consultado.
      if (atual.status_locacao !== newStatus) {
        this.registrarChecagem({
          // Id aleatório, e não derivado do relógio: `chk-${Date.now()}-${id}`
          // colidia entre duas conferências do mesmo item no mesmo
          // milissegundo, e o `put` sobrescrevia a primeira — o log PERDIA
          // linha, que é a única coisa que um append-only não pode fazer.
          id: novoId(),
          seq: this.proximoSeq++,
          diaria_id: diaria.id,
          equipamento_id: id,
          equipamento_nome: equip?.nome ?? id,
          de: atual.status_locacao,
          para: newStatus,
          via_qr: viaQR,
          em_cascata: emCascata,
          por_nome: quem,
          em: agora,
        });
      }

      this.gravarStatus({
        ...atual,
        status_locacao: newStatus,
        validado_por_qr: viaQR || atual.validado_por_qr,
        conferido_por: quem,
        conferido_em: agora,
        updated_at: agora,
      });
    };

    marcar(equipmentId, false);

    // Check em cascata: marcar o container marca o que está dentro dele.
    if (alvo?.e_container) {
      for (const filho of this.equipments.filter(e => e.container_pai_id === equipmentId)) {
        if (this.canUserEditEquipment(filho)) marcar(filho.id, true);
      }
    }

    this.notify();
  }

  // =====================================================================
  // RASTRO DE CONFERÊNCIA
  // =====================================================================

  private registrarChecagem(c: Checagem): void {
    this.checagens.push(c);
    this.enfileirar(() => db.checagens.put(c));
  }

  /**
   * Mais recente primeiro.
   *
   * Ordena por `em` e desempata por `seq`. Sem o desempate, uma cascata de
   * container — que marca vários itens no mesmo milissegundo — sairia em ordem
   * arbitrária, e o histórico de uma mala aberta ficaria ilegível.
   */
  private maisRecentePrimeiro(a: Checagem, b: Checagem): number {
    const porTempo = b.em.localeCompare(a.em);
    return porTempo !== 0 ? porTempo : b.seq - a.seq;
  }

  /** Histórico da diária ativa. */
  public getChecagensDaDiaria(): Checagem[] {
    const diariaId = this.getActiveDaily().id;
    return this.checagens
      .filter(c => c.diaria_id === diariaId)
      .sort((a, b) => this.maisRecentePrimeiro(a, b));
  }

  /** Por onde um equipamento andou, em todas as diárias. */
  public getChecagensDoEquipamento(equipamentoId: string): Checagem[] {
    return this.checagens
      .filter(c => c.equipamento_id === equipamentoId)
      .sort((a, b) => this.maisRecentePrimeiro(a, b));
  }

  public updateByQRCode(
    qrCode: string,
    targetStatus: ItemLocationStatus
  ): { success: boolean; message: string; isContainer: boolean; equipment?: Equipamento } {
    const alvo = qrCode.trim().toLowerCase();
    const encontrado = this.equipments.find(e => e.qr_code_id.toLowerCase() === alvo);

    if (!encontrado) {
      return {
        success: false,
        message: `QR Code '${qrCode}' não encontrado no inventário master.`,
        isContainer: false,
      };
    }

    this.addEquipmentToDaily(encontrado.id, true);
    this.updateItemLocationStatus(encontrado.id, targetStatus, true);

    return {
      success: true,
      message: `Item VERIFICADO ✓: '${encontrado.nome}' adicionado e atualizado.`,
      isContainer: encontrado.e_container,
      equipment: encontrado,
    };
  }

  public ignoreItem(equipmentId: string) {
    this.updateItemLocationStatus(equipmentId, 'ignorado');
  }

  public assignEquipmentToCar(equipmentId: string, carroId: string | null, carroNome: string | null) {
    const afetados: Equipamento[] = [];

    this.equipments = this.equipments.map(e => {
      if (e.id === equipmentId || e.container_pai_id === equipmentId) {
        const atualizado = { ...e, carro_id: carroId, carro_nome: carroNome };
        afetados.push(atualizado);
        return atualizado;
      }
      return e;
    });

    if (afetados.length > 0) this.enfileirar(() => db.equipamentos.bulkPut(afetados));
    this.notify();
  }

  // =====================================================================
  // FASES E TRAVAS
  // =====================================================================

  public getPendingItemsForPhase(phase: DailyPhase): Equipamento[] {
    const itens = this.getDailyEquipments();
    if (phase === 'saida') {
      return itens.filter(e => e.status_locacao === 'pendente_base');
    }
    return itens.filter(e => e.status_locacao !== 'no_carro_volta' && e.status_locacao !== 'ignorado');
  }

  public isSaidaComplete(): boolean {
    const itens = this.getDailyEquipments();
    if (itens.length === 0) return false;
    return itens.every(e => e.status_locacao !== 'pendente_base');
  }

  public isVoltaComplete(): boolean {
    const itens = this.getDailyEquipments();
    if (itens.length === 0) return false;
    return itens.every(e => e.status_locacao === 'no_carro_volta' || e.status_locacao === 'ignorado');
  }

  // =====================================================================
  // ACERVO
  // =====================================================================

  public addEquipment(equip: Omit<Equipamento, 'id'>) {
    const novo: Equipamento = { ...equip, id: `eq-${Date.now()}` };
    this.equipments.push(novo);
    this.enfileirar(() => db.equipamentos.put(novo));
    this.addEquipmentToDaily(novo.id, false);
    this.notify();
  }

  public deleteEquipment(id: string) {
    if (this.activeUser.cargo !== 'admin') return;

    this.equipments = this.equipments.filter(e => e.id !== id);

    // Órfãos: quem estava dentro do container apagado perde o pai, e não o item.
    const orfaos = this.equipments
      .filter(e => e.container_pai_id === id)
      .map(e => ({ ...e, container_pai_id: null }));
    if (orfaos.length > 0) {
      this.equipments = this.equipments.map(e =>
        e.container_pai_id === id ? { ...e, container_pai_id: null } : e
      );
    }

    // Sai de TODAS as diárias, não só da ativa: o item deixou de existir.
    const diariasAfetadas = this.dailies.filter(d => d.equipamentos_ids.includes(id));
    for (const d of diariasAfetadas) {
      d.equipamentos_ids = d.equipamentos_ids.filter(eId => eId !== id);
    }

    for (const chave of [...this.statuses.keys()]) {
      if (chave.endsWith(`|${id}`)) this.statuses.delete(chave);
    }

    this.enfileirar(async () => {
      await db.equipamentos.delete(id);
      if (orfaos.length > 0) await db.equipamentos.bulkPut(orfaos);
      if (diariasAfetadas.length > 0) await db.diarias.bulkPut(diariasAfetadas);
      await db.diaria_itens_status.where('equipamento_id').equals(id).delete();
    });

    this.notify();
  }

  public resetAllToDefault() {
    this.equipments = [...INITIAL_EQUIPMENT];
    const diaria = this.getActiveDaily();
    diaria.equipamentos_ids = INITIAL_EQUIPMENT.map(e => e.id);

    for (const e of INITIAL_EQUIPMENT) {
      if (!this.statuses.has(chaveStatus(diaria.id, e.id))) {
        this.statuses.set(chaveStatus(diaria.id, e.id), statusNovo(diaria.id, e.id, ehBateria(e)));
      }
    }

    this.enfileirar(async () => {
      await db.equipamentos.clear();
      await db.equipamentos.bulkPut(INITIAL_EQUIPMENT);
      await db.diarias.put(diaria);
      await db.diaria_itens_status.bulkPut([...this.statuses.values()]);
    });

    this.notify();
  }
}

export const store = SetGearStore.getInstance();
