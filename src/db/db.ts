import Dexie from 'dexie';
import type { Table } from 'dexie';
import type {
  Equipamento,
  Projeto,
  Diaria,
  DiariaItemStatus,
  BugReport,
  Checagem,
} from '../types/setgear';

/**
 * O banco local do SetGear.
 *
 * O app lê SEMPRE daqui, nunca do servidor — mesma regra do SetProd. O Postgres
 * (Fase 2) é transporte e cópia durável, não banco de consulta. É isso que faz o
 * app funcionar numa van sem sinal, que é onde ele mais importa.
 *
 * Nome diferente do `SetMoneyDB` do SetProd de propósito: os dois apps rodam em
 * origens separadas, e IndexedDB é escopado por origem — não há como
 * compartilhar o banco entre eles nem por acidente. A troca de dados acontece
 * pelo Supabase (§3.1 do PLANO.md).
 */

/** Guarda ajuste solto do app: senhas, usuário ativo, o que está selecionado. */
export interface Configuracao {
  chave: string;
  valor: unknown;
}

export class SetGearDB extends Dexie {
  equipamentos!: Table<Equipamento, string>;
  projetos!: Table<Projeto, string>;
  diarias!: Table<Diaria, string>;
  diaria_itens_status!: Table<DiariaItemStatus, [string, string]>;
  checagens!: Table<Checagem, string>;
  bugs!: Table<BugReport, string>;
  configuracoes!: Table<Configuracao, string>;

  constructor() {
    super('SetGearDB');

    this.version(1).stores({
      // `qr_code_id` é índice único: é a etiqueta física colada na mala, e duas
      // malas com o mesmo código fariam o scanner marcar a errada.
      equipamentos: 'id, &qr_code_id, container_pai_id, categoria_id, proprietario_id',

      projetos: 'id',

      diarias: 'id, projeto_id, data_diaria, [projeto_id+data_diaria]',

      // A CHAVE COMPOSTA É O CONSERTO CENTRAL DESTA FASE.
      //
      // Antes o status vivia num objeto indexado só por `equipamento_id`. O tipo
      // já trazia `diaria_id`, mas ninguém usava — então a conferência de ontem
      // aparecia como se fosse a de hoje: o item entrava na diária nova já
      // marcado "no carro", e a trava de wrap liberava o encerramento com
      // equipamento que nunca foi conferido. É o pior tipo de bug para este app,
      // porque ele *esconde* exatamente aquilo que o app existe para mostrar.
      //
      // Com a chave composta, o mesmo equipamento tem um status por diária, e o
      // banco impede a colisão em vez de confiar na disciplina de quem escreve.
      diaria_itens_status: '[diaria_id+equipamento_id], diaria_id, equipamento_id',

      bugs: 'id, data_criacao',

      configuracoes: 'chave',
    });

    // v2 — o rastro de conferência.
    //
    // Versão nova em vez de mexer na v1, mesmo o app ainda não estando no ar:
    // quem já abriu a v1 (o navegador de desenvolvimento) tem um banco com o
    // schema antigo, e o Dexie recusa a abertura se o schema mudar sem subir a
    // versão. Acrescentar tabela é migração automática — não há dado a converter.
    //
    // `conferido_por` e `conferido_em` entraram em `diaria_itens_status` sem
    // aparecer aqui de propósito: não são índices, e o Dexie só declara neste
    // lugar o que serve para busca. Campo não indexado é gravado de qualquer
    // forma.
    this.version(2).stores({
      // Indexado por diária (para montar o histórico da diária) e por
      // equipamento (para responder "onde este item andou").
      checagens: 'id, diaria_id, equipamento_id, em, [diaria_id+equipamento_id]',
    });
  }
}

export const db = new SetGearDB();

/** Chaves usadas em `configuracoes`, num lugar só para não virar string solta. */
export const CFG = {
  SENHAS: 'senhas',
  USUARIO_ATIVO: 'usuario_ativo',
  PROJETO_ATIVO: 'projeto_ativo_id',
  DIARIA_ATIVA: 'diaria_ativa_id',
  MIGRACAO_LOCALSTORAGE: 'migracao_localstorage_v4',
} as const;

/** Lê um ajuste, devolvendo o padrão quando ainda não há nada gravado. */
export async function lerConfig<T>(chave: string, padrao: T): Promise<T> {
  const linha = await db.configuracoes.get(chave);
  return linha === undefined ? padrao : (linha.valor as T);
}

export async function gravarConfig(chave: string, valor: unknown): Promise<void> {
  await db.configuracoes.put({ chave, valor });
}
