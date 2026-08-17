import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db/db';
import { store } from './store';
import { INITIAL_EQUIPMENT } from './dadosIniciais';

/**
 * As regras que este arquivo protege são as que doem quando quebram.
 *
 * A cascata de container e as travas de fase são o produto: se a cascata vazar
 * para a mala errada, ou se a trava liberar o encerramento com item pendente, o
 * app afirma que está tudo no carro quando não está — e alguém descobre no dia
 * seguinte, sem o equipamento.
 */

/** Zera o banco e o espelho, para cada teste começar do mesmo lugar. */
async function bancoLimpo() {
  // Drena o que o teste anterior deixou na fila. Sem isto, o `db.delete()`
  // abaixo derruba o banco no meio de uma gravação pendente e o console enche
  // de DatabaseClosedError — erro do arranjo do teste, não do código.
  await store.aguardarGravacoes();
  await db.delete();
  await db.open();
  // @ts-expect-error — reabrir o store exige derrubar a marca de pronto, que é
  // privada de propósito. É o único lugar que faz isso, e só no teste.
  store.pronto = false;
  await store.init();
  // O admin passa por qualquer checagem de proprietário; sem isto, metade dos
  // testes esbarraria na permissão em vez de testar o que pretende.
  store.setUserRole('admin');
}

/** Coloca todo o inventário de demonstração na diária ativa. */
function montarDiariaCompleta() {
  for (const e of INITIAL_EQUIPMENT) store.addEquipmentToDaily(e.id, false);
}

function statusDe(id: string) {
  return store.getDailyEquipments().find(e => e.id === id)?.status_locacao;
}

beforeEach(bancoLimpo);

describe('check em cascata de container', () => {
  it('marcar o container marca os itens dentro dele', () => {
    montarDiariaCompleta();

    store.updateItemLocationStatus('cont-01', 'no_carro_ida');

    expect(statusDe('cont-01')).toBe('no_carro_ida');
    expect(statusDe('item-101')).toBe('no_carro_ida');
    expect(statusDe('item-102')).toBe('no_carro_ida');
  });

  it('não vaza para itens de outro container', () => {
    montarDiariaCompleta();

    store.updateItemLocationStatus('cont-01', 'no_carro_ida');

    // As baterias vivem no cont-02 e não foram tocadas.
    expect(statusDe('cont-02')).toBe('pendente_base');
    expect(statusDe('item-201')).toBe('pendente_base');
    expect(statusDe('item-202')).toBe('pendente_base');
  });

  it('não afeta item avulso, que não tem container', () => {
    montarDiariaCompleta();

    store.updateItemLocationStatus('cont-01', 'no_carro_ida');

    expect(statusDe('item-401')).toBe('pendente_base');
  });

  it('marcar um filho não arrasta o container nem os irmãos', () => {
    montarDiariaCompleta();

    store.updateItemLocationStatus('item-101', 'no_carro_ida');

    expect(statusDe('item-101')).toBe('no_carro_ida');
    expect(statusDe('cont-01')).toBe('pendente_base');
    expect(statusDe('item-102')).toBe('pendente_base');
  });
});

describe('travas de fase', () => {
  it('diária vazia não conta como saída completa', () => {
    // Sem isto, uma diária em que ninguém adicionou nada passaria por
    // "conferida", e o encerramento liberaria de bandeja.
    expect(store.getDailyEquipments()).toHaveLength(0);
    expect(store.isSaidaComplete()).toBe(false);
    expect(store.isVoltaComplete()).toBe(false);
  });

  it('saída só fecha quando nenhum item está pendente na base', () => {
    montarDiariaCompleta();
    expect(store.isSaidaComplete()).toBe(false);

    for (const e of INITIAL_EQUIPMENT) store.updateItemLocationStatus(e.id, 'no_carro_ida');

    expect(store.isSaidaComplete()).toBe(true);
  });

  it('um único item pendente segura a saída inteira', () => {
    montarDiariaCompleta();
    for (const e of INITIAL_EQUIPMENT) store.updateItemLocationStatus(e.id, 'no_carro_ida');
    expect(store.isSaidaComplete()).toBe(true);

    store.updateItemLocationStatus('item-401', 'pendente_base');

    expect(store.isSaidaComplete()).toBe(false);
    expect(store.getPendingItemsForPhase('saida').map(e => e.id)).toEqual(['item-401']);
  });

  it('item ignorado não impede o fechamento da volta', () => {
    montarDiariaCompleta();
    for (const e of INITIAL_EQUIPMENT) store.updateItemLocationStatus(e.id, 'no_carro_volta');
    store.ignoreItem('item-401');

    expect(store.isVoltaComplete()).toBe(true);
  });

  it('volta não fecha com item que ficou no set', () => {
    montarDiariaCompleta();
    for (const e of INITIAL_EQUIPMENT) store.updateItemLocationStatus(e.id, 'no_carro_volta');
    store.updateItemLocationStatus('item-201', 'pendente_base');

    expect(store.isVoltaComplete()).toBe(false);
    expect(store.getPendingItemsForPhase('volta').map(e => e.id)).toEqual(['item-201']);
  });
});

describe('isolamento de status entre diárias', () => {
  it('a conferência de uma diária não aparece na outra', () => {
    // Este era o bug: o status vivia indexado só por equipamento_id, então a
    // diária nova nascia com a conferência da anterior já marcada.
    montarDiariaCompleta();
    for (const e of INITIAL_EQUIPMENT) store.updateItemLocationStatus(e.id, 'no_carro_ida');
    expect(store.isSaidaComplete()).toBe(true);

    store.setDailyDate('19/07');
    montarDiariaCompleta();

    for (const e of INITIAL_EQUIPMENT) {
      expect(statusDe(e.id)).toBe('pendente_base');
    }
    expect(store.isSaidaComplete()).toBe(false);
  });

  it('trocar de data preserva a conferência da diária anterior', () => {
    // E este era o outro: setDailyDate() fazia equipamentos_ids = [], apagando
    // a conferência do dia anterior sem aviso e sem como voltar.
    montarDiariaCompleta();
    for (const e of INITIAL_EQUIPMENT) store.updateItemLocationStatus(e.id, 'no_carro_ida');
    const dataOriginal = store.getActiveDaily().data_diaria;

    store.setDailyDate('19/07');
    expect(store.getDailyEquipments()).toHaveLength(0);

    store.setDailyDate(dataOriginal);

    expect(store.getDailyEquipments()).toHaveLength(INITIAL_EQUIPMENT.length);
    expect(store.isSaidaComplete()).toBe(true);
  });

  it('voltar para a mesma data reusa a diária, não cria outra', () => {
    const antes = store.getDailiesForActiveProject().length;

    store.setDailyDate('19/07');
    store.setDailyDate('20/07');
    store.setDailyDate('19/07');

    expect(store.getDailiesForActiveProject()).toHaveLength(antes + 2);
  });
});

describe('persistência no Dexie', () => {
  it('a conferência sobrevive a um recarregamento', async () => {
    montarDiariaCompleta();
    store.updateItemLocationStatus('cont-01', 'no_carro_ida');
    await store.aguardarGravacoes();

    // Descarta o espelho em memória e relê tudo do banco.
    await store.recarregarDoZero();

    expect(statusDe('cont-01')).toBe('no_carro_ida');
    expect(statusDe('item-101')).toBe('no_carro_ida');
  });

  it('grava o status com a chave composta (diária, equipamento)', async () => {
    montarDiariaCompleta();
    const diariaId = store.getActiveDaily().id;
    store.updateItemLocationStatus('item-101', 'no_carro_ida');
    await store.aguardarGravacoes();

    const linha = await db.diaria_itens_status.get([diariaId, 'item-101']);

    expect(linha).toBeDefined();
    expect(linha?.status_locacao).toBe('no_carro_ida');
    expect(linha?.diaria_id).toBe(diariaId);
  });

  it('apagar equipamento limpa o status dele em todas as diárias', async () => {
    montarDiariaCompleta();
    store.updateItemLocationStatus('item-401', 'no_carro_ida');
    store.setDailyDate('19/07');
    store.addEquipmentToDaily('item-401', false);
    await store.aguardarGravacoes();

    expect(await db.diaria_itens_status.where('equipamento_id').equals('item-401').count()).toBe(2);

    store.deleteEquipment('item-401');
    await store.aguardarGravacoes();

    expect(await db.diaria_itens_status.where('equipamento_id').equals('item-401').count()).toBe(0);
    expect(await db.equipamentos.get('item-401')).toBeUndefined();
  });

  it('apagar um container deixa os filhos órfãos, não os apaga', async () => {
    store.deleteEquipment('cont-01');
    await store.aguardarGravacoes();

    const filho = await db.equipamentos.get('item-101');
    expect(filho).toBeDefined();
    expect(filho?.container_pai_id).toBeNull();
  });
});

describe('prompt de container ao adicionar', () => {
  it('incluir a mala inteira traz o container e todos os filhos', () => {
    store.addEquipmentToDaily('item-101', true);

    const ids = store.getDailyEquipments().map(e => e.id).sort();
    expect(ids).toEqual(['cont-01', 'item-101', 'item-102']);
  });

  it('incluir só o item não traz o resto da mala', () => {
    store.addEquipmentToDaily('item-101', false);

    expect(store.getDailyEquipments().map(e => e.id)).toEqual(['item-101']);
  });

  it('bateria entra na diária com carga pendente', () => {
    store.addEquipmentToDaily('item-201', false);

    const bateria = store.getDailyEquipments().find(e => e.id === 'item-201');
    expect(bateria?.status_carga).toBe('pendente');
  });

  it('item que não é bateria não pede carga', () => {
    store.addEquipmentToDaily('item-401', false);

    expect(store.getDailyEquipments()[0].status_carga).toBe('nao_requer');
  });
});

describe('leitura de QR', () => {
  it('código desconhecido falha sem alterar a diária', () => {
    const r = store.updateByQRCode('NAO-EXISTE-123', 'no_carro_ida');

    expect(r.success).toBe(false);
    expect(store.getDailyEquipments()).toHaveLength(0);
  });

  it('escanear a mala adiciona e marca tudo, com selo de verificado', () => {
    const r = store.updateByQRCode('CONTAINER-RED-01', 'no_carro_ida');

    expect(r.success).toBe(true);
    expect(r.isContainer).toBe(true);
    expect(statusDe('item-101')).toBe('no_carro_ida');
    expect(store.getDailyEquipments().find(e => e.id === 'item-101')?.validado_por_qr).toBe(true);
  });

  it('o código é reconhecido sem depender de maiúscula', () => {
    expect(store.updateByQRCode('container-red-01', 'no_carro_ida').success).toBe(true);
  });
});

describe('permissão do operador', () => {
  it('nome vazio não dá acesso a tudo', () => {
    // `qualquerCoisa.includes('')` é sempre verdadeiro — sem a guarda, um
    // usuário sem nome poderia mexer no acervo inteiro.
    store.setUserRole('operador');
    store.setActiveUserName('');

    const equip = store.getMasterEquipments()[0];
    expect(store.canUserEditEquipment(equip)).toBe(false);
  });

  it('operador mexe no equipamento do próprio nome', () => {
    store.setUserRole('operador');
    store.setActiveUserName('Eugenio');

    const doEugenio = store.getMasterEquipments().find(e => e.id === 'item-101')!;
    expect(store.canUserEditEquipment(doEugenio)).toBe(true);
  });

  it('operador não mexe no equipamento de outro dono', () => {
    store.setUserRole('operador');
    store.setActiveUserName('Eugenio');

    const daLocadora = store.getMasterEquipments().find(e => e.id === 'item-201')!;
    expect(store.canUserEditEquipment(daLocadora)).toBe(false);
  });
});
