/**
 * A identidade do app, num lugar só.
 *
 * O nome é provisório e vai mudar. Antes disto ele vivia espalhado: os
 * componentes diziam "Lumavi SetGear", o package.json dizia
 * "setgear-cinecore95" e a documentação dizia "CineCore 95" — três nomes para o
 * mesmo app, e nenhum jeito de trocar sem caçar string por string.
 *
 * A versão tem o mesmo problema mas pior: `v1.2.0` estava escrito à mão em
 * quatro telas, enquanto o package.json dizia 1.0.0. Uma versão que ninguém
 * atualiza é pior que nenhuma, porque o relatório de bug afirma com confiança
 * de qual build veio o problema — e erra. Agora ela vem do package.json na hora
 * de construir (ver `define` no vite.config.ts).
 *
 * Ao renomear o app, alinhar também o `manifest` do vite.config.ts: o nome do
 * ícone instalado no celular não passa por aqui.
 */

export const APP_NOME = 'SetGear';

/** Como o app se apresenta por extenso, em telas de entrada e relatórios. */
export const APP_DESCRICAO = 'Controle de Equipamento de Set';

/** Injetada no build a partir do package.json. Nunca escrever à mão. */
export const APP_VERSAO = __VERSAO_APP__;

/** Pronta para exibir: "v2.0.0". */
export const APP_VERSAO_LABEL = `v${APP_VERSAO}`;
