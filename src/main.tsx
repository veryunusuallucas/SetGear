import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { store } from './services/store';
import './index.css';

const raiz = ReactDOM.createRoot(document.getElementById('root')!);

/**
 * O banco carrega antes do primeiro render.
 *
 * O IndexedDB é assíncrono, e as telas leem o estado de forma sincronizada. Se o
 * app renderizasse antes, a primeira tela apareceria vazia e piscaria ao ser
 * preenchida — e, pior, a tela de primeira configuração apareceria para quem já
 * tem senha definida, porque `hasConfiguredPasswords()` ainda não saberia a
 * resposta.
 *
 * Esperar é o certo aqui: a carga é local e leva poucos milissegundos.
 */
store
  .init()
  .catch(erro => {
    // Falhar aqui significa não ter dado nenhum. É melhor entrar com o banco
    // vazio e deixar a pessoa trabalhar do que travar numa tela morta — o que
    // ela conferir agora ainda tem chance de ser gravado.
    console.error('[SetGear] Não foi possível abrir o banco local.', erro);
  })
  .finally(() => {
    raiz.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  });
