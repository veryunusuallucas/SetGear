import { db, CFG, lerConfig, gravarConfig } from './db';
import type {
  Equipamento,
  Projeto,
  Diaria,
  DiariaItemStatus,
  BugReport,
  Profile,
} from '../types/setgear';

/**
 * Traz para o Dexie o que ficou no localStorage da versão anterior.
 *
 * Roda uma vez e deixa uma marca; chamar de novo não faz nada. Antes de gravar
 * qualquer coisa, guarda um backup cru de todas as chaves — se a conversão
 * estiver errada de um jeito que ninguém previu, o acervo original ainda está
 * lá para ser recuperado à mão. O acervo é o dado que o usuário digitou item por
 * item; perdê-lo numa migração seria imperdoável.
 *
 * As chaves antigas NÃO são apagadas, pelo mesmo motivo.
 */

const CHAVES_ANTIGAS = {
  EQUIPAMENTOS: 'lumavi_setgear_equipamentos_v4',
  STATUS: 'lumavi_setgear_status_v4',
  USER: 'lumavi_setgear_user_v4',
  PROJECTS: 'lumavi_setgear_projects_v4',
  PASSWORDS: 'lumavi_setgear_passwords_v4',
  BUGS: 'lumavi_setgear_bugs_v4',
} as const;

export const CHAVE_BACKUP = 'setgear_backup_pre_dexie';

/**
 * Há localStorage neste ambiente?
 *
 * Nos testes (Node) não há, e antes disto cada chave ausente era relatada como
 * "corrompida" — seis erros no console dizendo algo que não aconteceu. Log que
 * mente é pior que log nenhum: ele manda procurar defeito onde não há, e ensina
 * a ignorar o console.
 */
function temLocalStorage(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage !== null;
  } catch {
    // Acessar localStorage pode lançar quando o navegador bloqueia
    // armazenamento (modo restrito, cookies de terceiros negados).
    return false;
  }
}

function lerJSON<T>(chave: string): T | null {
  if (!temLocalStorage()) return null;
  try {
    const cru = localStorage.getItem(chave);
    return cru === null ? null : (JSON.parse(cru) as T);
  } catch (erro) {
    console.error(`[SetGear] '${chave}' está corrompida e foi ignorada na migração.`, erro);
    return null;
  }
}

/** Copia as chaves antigas cruas, sem interpretar, antes de qualquer escrita. */
function guardarBackup(): void {
  if (!temLocalStorage()) return;
  if (localStorage.getItem(CHAVE_BACKUP)) return;

  const bruto: Record<string, string | null> = {};
  for (const chave of Object.values(CHAVES_ANTIGAS)) {
    bruto[chave] = localStorage.getItem(chave);
  }
  const temAlgo = Object.values(bruto).some(v => v !== null);
  if (!temAlgo) return;

  localStorage.setItem(
    CHAVE_BACKUP,
    JSON.stringify({ salvo_em: new Date().toISOString(), dados: bruto })
  );
}

export interface ResultadoMigracao {
  executou: boolean;
  equipamentos: number;
  projetos: number;
  diarias: number;
  status: number;
  bugs: number;
}

export async function migrarDoLocalStorage(): Promise<ResultadoMigracao> {
  const vazio: ResultadoMigracao = {
    executou: false, equipamentos: 0, projetos: 0, diarias: 0, status: 0, bugs: 0,
  };

  if (await lerConfig(CFG.MIGRACAO_LOCALSTORAGE, false)) return vazio;

  const equipamentos = lerJSON<Equipamento[]>(CHAVES_ANTIGAS.EQUIPAMENTOS);
  const projetos = lerJSON<Projeto[]>(CHAVES_ANTIGAS.PROJECTS);
  const statusAntigo = lerJSON<Record<string, DiariaItemStatus>>(CHAVES_ANTIGAS.STATUS);
  const usuario = lerJSON<Profile>(CHAVES_ANTIGAS.USER);
  const senhas = lerJSON<{ adminPass: string; opPass: string }>(CHAVES_ANTIGAS.PASSWORDS);
  const bugs = lerJSON<BugReport[]>(CHAVES_ANTIGAS.BUGS);

  const naoHaNada = !equipamentos && !projetos && !statusAntigo && !usuario && !senhas && !bugs;
  if (naoHaNada) {
    // Instalação nova: marca como migrada para não procurar de novo a cada abertura.
    await gravarConfig(CFG.MIGRACAO_LOCALSTORAGE, true);
    return vazio;
  }

  guardarBackup();

  const resultado: ResultadoMigracao = { ...vazio, executou: true };

  await db.transaction(
    'rw',
    [db.equipamentos, db.projetos, db.diarias, db.diaria_itens_status, db.bugs, db.configuracoes],
    async () => {
      if (equipamentos?.length) {
        await db.equipamentos.bulkPut(equipamentos);
        resultado.equipamentos = equipamentos.length;
      }

      if (projetos?.length) {
        await db.projetos.bulkPut(projetos);
        resultado.projetos = projetos.length;
      }

      // A versão antiga tinha UMA diária, chumbada no código e sem registro
      // próprio. Reconstruímos uma linha para ela a partir do primeiro projeto,
      // porque é a única a que o status salvo pode pertencer.
      const primeiro = projetos?.[0];
      let diariaId: string | null = null;

      if (primeiro) {
        diariaId = `d-migrada-${primeiro.id}`;
        const diaria: Diaria = {
          id: diariaId,
          projeto_id: primeiro.id,
          projeto_nome: primeiro.nome,
          data_diaria: primeiro.diarias_datas?.[0] ?? 'migrada',
          horario_saida: '10:00',
          status: 'em_andamento',
          equipamentos_ids: Object.keys(statusAntigo ?? {}),
        };
        await db.diarias.put(diaria);
        resultado.diarias = 1;
      }

      // O status antigo era indexado só por equipamento_id. Ao trazer para a
      // chave composta, ele passa a pertencer explicitamente à diária acima —
      // que é o que ele sempre foi de fato, só não estava dito em lugar nenhum.
      if (statusAntigo && diariaId) {
        const linhas: DiariaItemStatus[] = Object.entries(statusAntigo).map(
          ([equipamentoId, st]) => ({
            ...st,
            id: st.id ?? `s-${diariaId}-${equipamentoId}`,
            diaria_id: diariaId,
            equipamento_id: equipamentoId,
          })
        );
        await db.diaria_itens_status.bulkPut(linhas);
        resultado.status = linhas.length;
      }

      if (bugs?.length) {
        await db.bugs.bulkPut(bugs);
        resultado.bugs = bugs.length;
      }

      if (usuario) await db.configuracoes.put({ chave: CFG.USUARIO_ATIVO, valor: usuario });
      if (senhas) await db.configuracoes.put({ chave: CFG.SENHAS, valor: senhas });
      if (primeiro) await db.configuracoes.put({ chave: CFG.PROJETO_ATIVO, valor: primeiro.id });
      if (diariaId) await db.configuracoes.put({ chave: CFG.DIARIA_ATIVA, valor: diariaId });

      await db.configuracoes.put({ chave: CFG.MIGRACAO_LOCALSTORAGE, valor: true });
    }
  );

  console.info('[SetGear] Migração do localStorage concluída:', resultado);
  return resultado;
}
