// Dá um IndexedDB em memória para o Dexie rodar fora do navegador.
import 'fake-indexeddb/auto';

// O store chama `alert()` ao barrar edição por permissão. Em Node ele não
// existe, e a chamada derrubaria o teste antes da asserção.
globalThis.alert = (mensagem?: unknown) => {
  console.info('[alert suprimido no teste]', mensagem);
};
