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
  Veiculo,
  BugReport
} from '../types/setgear';

const STORAGE_KEY_EQUIPAMENTOS = 'lumavi_setgear_equipamentos_v4';
const STORAGE_KEY_STATUS = 'lumavi_setgear_status_v4';
const STORAGE_KEY_USER = 'lumavi_setgear_user_v4';
const STORAGE_KEY_PROJECTS = 'lumavi_setgear_projects_v4';
const STORAGE_KEY_PASSWORDS = 'lumavi_setgear_passwords_v4';
const STORAGE_KEY_BUGS = 'lumavi_setgear_bugs_v4';

const INITIAL_VEHICLES: Veiculo[] = [
  { id: 'v-1', nome: 'Carro 1 - Van Câmera & Luz' },
  { id: 'v-2', nome: 'Carro 2 - Van Grip & Suportes' },
];

// Inventário Master (Database Completo)
const INITIAL_EQUIPMENT: Equipamento[] = [
  {
    id: 'cont-01',
    nome: 'Pelican 1510 - Kit Câmera RED Komodo',
    categoria_id: 'cat-5',
    categoria_nome: 'Containers & Cases',
    proprietario_id: 'prop-eugenio',
    proprietario_nome: 'Eugenio (DP)',
    qr_code_id: 'CONTAINER-RED-01',
    e_container: true,
    container_pai_id: null,
    carro_id: 'v-1',
    carro_nome: 'Carro 1 - Van Câmera & Luz',
  },
  {
    id: 'cont-02',
    nome: 'Case Rígido - Kit Baterias V-Mount',
    categoria_id: 'cat-5',
    categoria_nome: 'Containers & Cases',
    proprietario_id: 'prop-cinerent',
    proprietario_nome: 'Locadora CineRent SP',
    qr_code_id: 'CONTAINER-BAT-02',
    e_container: true,
    container_pai_id: null,
    carro_id: 'v-1',
    carro_nome: 'Carro 1 - Van Câmera & Luz',
  },
  {
    id: 'item-101',
    nome: 'Corpo RED Komodo 6K (Cinza Tático)',
    categoria_id: 'cat-1',
    categoria_nome: 'Câmeras & Corpos',
    proprietario_id: 'prop-eugenio',
    proprietario_nome: 'Eugenio (DP)',
    qr_code_id: 'EQ-CAM-6K-01',
    e_container: false,
    container_pai_id: 'cont-01',
    carro_id: 'v-1',
    carro_nome: 'Carro 1 - Van Câmera & Luz',
  },
  {
    id: 'item-102',
    nome: 'Monitor On-Camera SmallHD Cine 7',
    categoria_id: 'cat-1',
    categoria_nome: 'Câmeras & Corpos',
    proprietario_id: 'prop-eugenio',
    proprietario_nome: 'Eugenio (DP)',
    qr_code_id: 'EQ-MON-SM7-02',
    e_container: false,
    container_pai_id: 'cont-01',
    carro_id: 'v-1',
    carro_nome: 'Carro 1 - Van Câmera & Luz',
  },
  {
    id: 'item-201',
    nome: 'Bateria V-Mount FXLION Nano Two 98Wh #01',
    categoria_id: 'cat-3',
    categoria_nome: 'Baterias & Energia',
    proprietario_id: 'prop-cinerent',
    proprietario_nome: 'Locadora CineRent SP',
    qr_code_id: 'BAT-VM-98-01',
    e_container: false,
    container_pai_id: 'cont-02',
    carro_id: 'v-1',
    carro_nome: 'Carro 1 - Van Câmera & Luz',
  },
  {
    id: 'item-202',
    nome: 'Bateria V-Mount FXLION Nano Two 98Wh #02',
    categoria_id: 'cat-3',
    categoria_nome: 'Baterias & Energia',
    proprietario_id: 'prop-cinerent',
    proprietario_nome: 'Locadora CineRent SP',
    qr_code_id: 'BAT-VM-98-02',
    e_container: false,
    container_pai_id: 'cont-02',
    carro_id: 'v-1',
    carro_nome: 'Carro 1 - Van Câmera & Luz',
  },
  {
    id: 'item-401',
    nome: 'Tripé de Carbono Sachtler Flowtech 75',
    categoria_id: 'cat-4',
    categoria_nome: 'Suportes & Grips',
    proprietario_id: 'prop-eugenio',
    proprietario_nome: 'Eugenio (DP)',
    qr_code_id: 'TRIPOD-FLOWTECH-75',
    e_container: false,
    container_pai_id: null,
    carro_id: 'v-2',
    carro_nome: 'Carro 2 - Van Grip & Suportes',
  }
];

export class SetGearStore {
  private static instance: SetGearStore;
  
  private equipments: Equipamento[] = [];
  private itemStatusMap: Record<string, DiariaItemStatus> = {};
  private bugReports: BugReport[] = [];
  private passwords: { adminPass: string; opPass: string } = { adminPass: 'admin123', opPass: 'op123' };
  
  private activeUser: Profile = {
    id: 'usr-eugenio',
    nome: 'Eugenio',
    cargo: 'operador',
  };

  private projects: Projeto[] = [
    {
      id: 'proj-tropeiro',
      nome: 'O ÚLTIMO TROPEIRO',
      descricao: 'Longa-metragem de época. Gravações em locações externas rurais.',
      criador_id: 'usr-eugenio',
      diretor: 'Carlos Alberto',
      dp_fotografia: 'Eugenio',
      diretor_arte: 'Mariana Silva',
      gaffer: 'Beto Luz',
      operador_camera: 'Fernanda Lima',
      veiculos: INITIAL_VEHICLES,
      diarias_datas: ['18/07', '19/07', '20/07'],
    }
  ];

  private activeProject: Projeto = this.projects[0];

  // Diária Ativa (Inicia com lista de equipamentos zerada/adicionados sob demanda)
  private activeDaily: Diaria = {
    id: 'd-tropeiro',
    projeto_id: 'proj-tropeiro',
    projeto_nome: 'O ÚLTIMO TROPEIRO',
    data_diaria: '18/07',
    horario_saida: '10:00',
    status: 'em_andamento',
    equipamentos_ids: ['cont-01', 'item-101', 'item-102', 'cont-02', 'item-201', 'item-202', 'item-401'],
  };

  private listeners: (() => void)[] = [];

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): SetGearStore {
    if (!SetGearStore.instance) {
      SetGearStore.instance = new SetGearStore();
    }
    return SetGearStore.instance;
  }

  private loadFromStorage() {
    try {
      const savedEquip = localStorage.getItem(STORAGE_KEY_EQUIPAMENTOS);
      const savedStatus = localStorage.getItem(STORAGE_KEY_STATUS);
      const savedUser = localStorage.getItem(STORAGE_KEY_USER);
      const savedProj = localStorage.getItem(STORAGE_KEY_PROJECTS);
      const savedPass = localStorage.getItem(STORAGE_KEY_PASSWORDS);
      const savedBugs = localStorage.getItem(STORAGE_KEY_BUGS);

      if (savedEquip) {
        this.equipments = JSON.parse(savedEquip);
      } else {
        this.equipments = INITIAL_EQUIPMENT;
        this.saveEquipments();
      }

      if (savedStatus) {
        this.itemStatusMap = JSON.parse(savedStatus);
      }

      if (savedUser) {
        this.activeUser = JSON.parse(savedUser);
      }

      if (savedProj) {
        this.projects = JSON.parse(savedProj);
        if (this.projects.length > 0) this.activeProject = this.projects[0];
      }

      if (savedPass) {
        this.passwords = JSON.parse(savedPass);
      }

      if (savedBugs) {
        this.bugReports = JSON.parse(savedBugs);
      }
    } catch (erro) {
      // Um JSON corrompido em qualquer uma das seis chaves cai aqui e o
      // inventário inteiro é trocado pelos dados de demonstração. Antes isso
      // acontecia em silêncio: quem perdesse o acervo não teria como saber por
      // quê. O registro no console é o mínimo — a Fase 1 troca o localStorage
      // pelo Dexie e passa a tratar cada chave em separado, para que uma falha
      // não leve o resto junto.
      console.error('[SetGear] Falha ao ler os dados salvos; o acervo voltou ao padrão.', erro);
      this.equipments = INITIAL_EQUIPMENT;
    }
  }

  private saveEquipments() {
    localStorage.setItem(STORAGE_KEY_EQUIPAMENTOS, JSON.stringify(this.equipments));
  }

  private saveStatus() {
    localStorage.setItem(STORAGE_KEY_STATUS, JSON.stringify(this.itemStatusMap));
  }

  private saveUser() {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(this.activeUser));
  }

  private saveProjects() {
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(this.projects));
  }

  private savePasswords() {
    localStorage.setItem(STORAGE_KEY_PASSWORDS, JSON.stringify(this.passwords));
  }

  private saveBugs() {
    localStorage.setItem(STORAGE_KEY_BUGS, JSON.stringify(this.bugReports));
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.saveEquipments();
    this.saveStatus();
    this.saveUser();
    this.saveProjects();
    this.savePasswords();
    this.saveBugs();
    this.listeners.forEach(l => l());
  }

  // --- GERENCIAMENTO DE SENHAS INICIAIS (1ª CONFIGURAÇÃO) ---
  public hasConfiguredPasswords(): boolean {
    return !!localStorage.getItem(STORAGE_KEY_PASSWORDS);
  }

  public setupInitialPasswords(adminPass: string, opPass: string) {
    this.passwords = { adminPass, opPass };
    this.savePasswords();
    this.notify();
  }

  public validatePassword(role: UserRole, inputPass: string): boolean {
    if (role === 'admin') return inputPass === this.passwords.adminPass;
    if (role === 'operador') return inputPass === this.passwords.opPass;
    return true;
  }

  // --- GERENCIAMENTO DE BUGS ---
  public saveBugReport(titulo: string, descricao: string): BugReport {
    const newBug: BugReport = {
      id: `bug-${Date.now()}`,
      titulo,
      descricao,
      data_criacao: new Date().toLocaleDateString('pt-BR'),
      autor: this.activeUser.nome,
      status: 'pendente',
    };
    this.bugReports.unshift(newBug);
    this.saveBugs();
    this.notify();
    return newBug;
  }

  public getBugReports(): BugReport[] {
    return this.bugReports;
  }

  // --- EQUIPAMENTOS NA DIÁRIA ATIVA (MONTAGEM SOB DEMANDA) ---
  public getDailyEquipments(): Equipamento[] {
    const activeIds = this.activeDaily.equipamentos_ids || [];
    return this.equipments
      .filter(eq => activeIds.includes(eq.id))
      .map(eq => {
        const st = this.itemStatusMap[eq.id] || {
          status_carga: 'nao_requer',
          status_locacao: 'pendente_base',
          validado_por_qr: false,
          bateria_alerta_100: false,
          bateria_carregando: false,
        };
        return {
          ...eq,
          status_carga: st.status_carga,
          status_locacao: st.status_locacao,
          validado_por_qr: st.validado_por_qr,
          bateria_alerta_100: st.bateria_alerta_100,
          bateria_carregando: st.bateria_carregando,
        };
      });
  }

  public getMasterEquipments(): Equipamento[] {
    return this.equipments;
  }

  public addEquipmentToDaily(equipmentId: string, includeFullContainer: boolean = false) {
    if (!this.activeDaily.equipamentos_ids.includes(equipmentId)) {
      this.activeDaily.equipamentos_ids.push(equipmentId);
    }

    // Inicializar status se não existir
    if (!this.itemStatusMap[equipmentId]) {
      const equip = this.equipments.find(e => e.id === equipmentId);
      const isBattery = equip?.categoria_id === 'cat-3' || (equip?.nome || '').toLowerCase().includes('bateria');
      this.itemStatusMap[equipmentId] = {
        id: `s-${Date.now()}`,
        diaria_id: this.activeDaily.id,
        equipamento_id: equipmentId,
        status_carga: isBattery ? 'pendente' : 'nao_requer',
        status_locacao: 'pendente_base',
        validado_por_qr: false,
        bateria_alerta_100: false,
        bateria_carregando: false,
      };
    }

    // Se incluir o container completo: adiciona o container pai e todos os filhos
    if (includeFullContainer) {
      const target = this.equipments.find(e => e.id === equipmentId);
      const containerId = target?.e_container ? target.id : target?.container_pai_id;
      
      if (containerId) {
        if (!this.activeDaily.equipamentos_ids.includes(containerId)) {
          this.activeDaily.equipamentos_ids.push(containerId);
        }
        const children = this.equipments.filter(e => e.container_pai_id === containerId);
        children.forEach(child => {
          if (!this.activeDaily.equipamentos_ids.includes(child.id)) {
            this.activeDaily.equipamentos_ids.push(child.id);
          }
          if (!this.itemStatusMap[child.id]) {
            const isBat = child.categoria_id === 'cat-3' || child.nome.toLowerCase().includes('bateria');
            this.itemStatusMap[child.id] = {
              id: `s-${Date.now()}-${child.id}`,
              diaria_id: this.activeDaily.id,
              equipamento_id: child.id,
              status_carga: isBat ? 'pendente' : 'nao_requer',
              status_locacao: 'pendente_base',
              validado_por_qr: false,
              bateria_alerta_100: false,
              bateria_carregando: false,
            };
          }
        });
      }
    }

    this.notify();
  }

  public getActiveUser(): Profile {
    return this.activeUser;
  }

  public setActiveUserName(name: string) {
    this.activeUser.nome = name;
    this.notify();
  }

  public setUserRole(role: UserRole) {
    this.activeUser.cargo = role;
    this.notify();
  }

  public getProjects(): Projeto[] {
    return this.projects;
  }

  public getActiveProject(): Projeto {
    return this.activeProject;
  }

  public setActiveProject(projectId: string) {
    const found = this.projects.find(p => p.id === projectId);
    if (found) {
      this.activeProject = found;
      this.activeDaily.projeto_id = found.id;
      this.activeDaily.projeto_nome = found.nome;
      if (found.diarias_datas.length > 0) {
        this.activeDaily.data_diaria = found.diarias_datas[0];
      }
      this.notify();
    }
  }

  public createProject(projData: Omit<Projeto, 'id'>) {
    const newProj: Projeto = {
      ...projData,
      id: `proj-${Date.now()}`,
      criador_id: this.activeUser.id,
    };
    this.projects.push(newProj);
    this.setActiveProject(newProj.id);
  }

  public getActiveDaily(): Diaria {
    return this.activeDaily;
  }

  public setDailyDate(dateStr: string) {
    this.activeDaily.data_diaria = dateStr;
    // Quando seleciona uma nova diária zerada, reseta os equipamentos adicionados
    this.activeDaily.equipamentos_ids = [];
    this.notify();
  }

  public canUserEditEquipment(equipment: Equipamento): boolean {
    if (this.activeUser.cargo === 'admin') return true;
    const ownerName = (equipment.proprietario_nome || '').toLowerCase();
    const userName = (this.activeUser.nome || '').toLowerCase();
    return ownerName.includes(userName) || userName.includes(ownerName);
  }

  // --- GERENCIAMENTO DE CARGA E 100% DE BATERIA ---
  public updateBatteryStatus(equipmentId: string, newBatteryStatus: BatteryStatus) {
    const current = this.itemStatusMap[equipmentId];
    if (current) {
      this.itemStatusMap[equipmentId] = {
        ...current,
        status_carga: newBatteryStatus,
        bateria_alerta_100: newBatteryStatus === 'nao_100_porcento',
        updated_at: new Date().toISOString(),
      };
      this.notify();
    }
  }

  public toggleBatteryCharging(equipmentId: string) {
    const current = this.itemStatusMap[equipmentId];
    if (current) {
      const isCharging = !current.bateria_carregando;
      this.itemStatusMap[equipmentId] = {
        ...current,
        bateria_carregando: isCharging,
        status_carga: isCharging ? 'carregando' : 'pendente',
      };
      this.notify();
    }
  }

  public setBattery100(equipmentId: string, is100: boolean) {
    const current = this.itemStatusMap[equipmentId];
    if (current) {
      this.itemStatusMap[equipmentId] = {
        ...current,
        status_carga: is100 ? '100_porcento' : 'nao_100_porcento',
        bateria_alerta_100: !is100,
        bateria_carregando: false,
      };
      this.notify();
    }
  }

  public updateItemLocationStatus(equipmentId: string, newStatus: ItemLocationStatus, viaQR: boolean = false) {
    const targetEquip = this.equipments.find(e => e.id === equipmentId);
    if (targetEquip && !this.canUserEditEquipment(targetEquip)) {
      alert(`Permissão restrita: Este equipamento pertence a '${targetEquip.proprietario_nome}'. Apenas ele ou o Admin podem alterá-lo.`);
      return;
    }

    const current = this.itemStatusMap[equipmentId] || {
      id: `s-${Date.now()}`,
      diaria_id: this.activeDaily.id,
      equipamento_id: equipmentId,
      status_carga: 'nao_requer',
      status_locacao: 'pendente_base',
      validado_por_qr: false,
    };

    this.itemStatusMap[equipmentId] = {
      ...current,
      status_locacao: newStatus,
      validado_por_qr: viaQR || current.validado_por_qr,
      updated_at: new Date().toISOString(),
    };

    if (targetEquip?.e_container) {
      const children = this.equipments.filter(e => e.container_pai_id === equipmentId);
      children.forEach(child => {
        if (this.canUserEditEquipment(child)) {
          const childCurrent = this.itemStatusMap[child.id] || {
            id: `s-${Date.now()}-${child.id}`,
            diaria_id: this.activeDaily.id,
            equipamento_id: child.id,
            status_carga: 'nao_requer',
            status_locacao: 'pendente_base',
            validado_por_qr: false,
          };
          this.itemStatusMap[child.id] = {
            ...childCurrent,
            status_locacao: newStatus,
            validado_por_qr: viaQR || childCurrent.validado_por_qr,
            updated_at: new Date().toISOString(),
          };
        }
      });
    }

    this.notify();
  }

  public updateByQRCode(qrCode: string, targetStatus: ItemLocationStatus): { success: boolean; message: string; isContainer: boolean; equipment?: Equipamento } {
    const found = this.equipments.find(e => e.qr_code_id.toLowerCase() === qrCode.trim().toLowerCase());
    if (!found) {
      return { 
        success: false, 
        message: `QR Code '${qrCode}' não encontrado no inventário master.`,
        isContainer: false 
      };
    }

    // Se o item não estiver na diária ativa, adiciona
    this.addEquipmentToDaily(found.id, true);

    this.updateItemLocationStatus(found.id, targetStatus, true);
    
    return {
      success: true,
      message: `Item VERIFICADO ✓: '${found.nome}' adicionado e atualizado.`,
      isContainer: found.e_container,
      equipment: found,
    };
  }

  public ignoreItem(equipmentId: string) {
    this.updateItemLocationStatus(equipmentId, 'ignorado');
  }

  public assignEquipmentToCar(equipmentId: string, carroId: string | null, carroNome: string | null) {
    this.equipments = this.equipments.map(e => {
      if (e.id === equipmentId || e.container_pai_id === equipmentId) {
        return { ...e, carro_id: carroId, carro_nome: carroNome };
      }
      return e;
    });
    this.notify();
  }

  // REGRAS DAS 2 FASES (SAÍDA vs VOLTA) COM DIÁRIA ZERADA
  public getPendingItemsForPhase(phase: DailyPhase): Equipamento[] {
    const dailyItems = this.getDailyEquipments();
    if (phase === 'saida') {
      return dailyItems.filter(e => e.status_locacao === 'pendente_base');
    } else {
      return dailyItems.filter(e => e.status_locacao !== 'no_carro_volta' && e.status_locacao !== 'ignorado');
    }
  }

  public isSaidaComplete(): boolean {
    const dailyItems = this.getDailyEquipments();
    if (dailyItems.length === 0) return false;
    return dailyItems.every(e => e.status_locacao !== 'pendente_base');
  }

  public isVoltaComplete(): boolean {
    const dailyItems = this.getDailyEquipments();
    if (dailyItems.length === 0) return false;
    return dailyItems.every(e => e.status_locacao === 'no_carro_volta' || e.status_locacao === 'ignorado');
  }

  public addEquipment(equip: Omit<Equipamento, 'id'>) {
    const newEquip: Equipamento = {
      ...equip,
      id: `eq-${Date.now()}`,
    };
    this.equipments.push(newEquip);
    this.addEquipmentToDaily(newEquip.id, false);
    this.notify();
  }

  public deleteEquipment(id: string) {
    if (this.activeUser.cargo !== 'admin') return;
    this.equipments = this.equipments.filter(e => e.id !== id);
    this.activeDaily.equipamentos_ids = this.activeDaily.equipamentos_ids.filter(eId => eId !== id);
    delete this.itemStatusMap[id];
    this.equipments = this.equipments.map(e => e.container_pai_id === id ? { ...e, container_pai_id: null } : e);
    this.notify();
  }

  public resetAllToDefault() {
    this.equipments = INITIAL_EQUIPMENT;
    this.activeDaily.equipamentos_ids = ['cont-01', 'item-101', 'item-102', 'cont-02', 'item-201', 'item-202', 'item-401'];
    this.notify();
  }
}

export const store = SetGearStore.getInstance();
