# SetGear

Controle de equipamento de cinema: **o que sai da base, o que chega no set e o que volta.**

O problema que ele resolve é o de sempre numa produção audiovisual: acessório que
some no transporte e no wrap. Um cabo, uma bateria, uma chave Allen — nada
aparece na hora, e a conta chega depois.

> ⚠️ **Em reconstrução.** O app funciona hoje como protótipo local (dados no
> navegador, sem servidor). Boa parte da infraestrutura descrita no plano ainda
> não existe. Este README descreve **o que há**, não o que se pretende — a seção
> [Estado atual](#estado-atual) é explícita sobre a diferença.

---

## A ideia

### Malas container e check em cascata
Equipamento de set vive dentro de cases. Escanear o QR da Pelican marca a mala
**e tudo que está dentro dela** de uma vez, em vez de conferir 14 acessórios um
a um. Ao adicionar um item que pertence a um case, o app pergunta:

> *"Só este item, ou a mala inteira com os acessórios?"*

### Diária zerada
Toda diária começa **sem nenhum equipamento**. Monta-se sob demanda, por busca ou
scanner. É de propósito: pré-cadastrar tudo é a burocracia que faz um app de set
ser abandonado na segunda semana.

### Trava de fase
A conferência de volta só abre depois que a de saída fecha, e a diária não se
encerra com item pendente fora do veículo. A trava é o produto — sem ela, é uma
lista de compras.

### Baterias têm ciclo próprio
`pendente` → `carregando` → e, na saída, a pergunta que importa: *"está 100%?"*.
Se não estiver, o aviso fica em laranja, visível.

### Selo `VERIFICADO ✓`
Item conferido por QR é marcado diferente de item conferido no olho. Quando algo
sumir, essa distinção é a que responde "conferimos de fato?".

---

## Estado atual

O que **funciona**:

- Conferência em duas fases (saída / volta) com a trava entre elas
- Malas container com check em cascata
- Diária zerada com montagem por busca
- Ciclo de carga de bateria
- Cadastro de acervo (nome, categoria, dono, QR, container, veículo)
- Três níveis de acesso por senha (admin / operador / visualização)
- Registro de bugs com exportação do log
- Relatório da diária via impressão do navegador

O que **ainda não existe**, apesar de aparecer em documentação antiga:

| | Situação |
|---|---|
| Supabase / multiusuário / sincronização | Não implementado. Os dados vivem só no `localStorage` do aparelho. |
| Leitor de QR pela câmera | O scanner aceita código digitado; a leitura por câmera é da Fase 3. |
| 4 fases (Pré-Set → Carro Ida → No Set → Wrap) | Hoje são 2 (saída / volta). |
| Barra de progresso do wrap | Componente escrito, ainda não ligado à tela. |
| PDF com layout próprio | Hoje é a impressão do navegador. |
| Agenda de disponibilidade do equipamento | Da Fase 3. |

Segurança, para não haver ilusão: as senhas ficam em **texto puro** no
`localStorage` e os três papéis são separação de interface, **não** fronteira de
segurança. Autenticação de verdade é da Fase 2. Não use este app, no estado
atual, para guardar nada que precise de sigilo.

---

## Como vai crescer

O SetGear é irmão do **SetProd** (pré-produção, ordem do dia, financeiro,
decupagem). A divisão de responsabilidade é deliberada:

- **SetProd** é a fonte da verdade sobre *quando se filma* — cria projetos e diárias.
- **SetGear** é a fonte da verdade sobre *o que embarcou* — nunca cria diária, só consome.

E a ponte entre eles é estreita de propósito: a produção recebe **contagens**
("Câmera: 47 itens, 47 saíram, 46 voltaram, 1 pendente"), nunca o inventário. Quem
tem o equipamento não precisa expor o acervo para dizer que está tudo no carro.

O plano completo — arquitetura, fases, riscos e o que foi decidido e por quê —
está em [`PLANO.md`](PLANO.md).

---

## Rodando

Requer Node.js 20+.

```bash
npm install
```

```bash
npm run dev
```

Outros comandos: `npm run build` (produção), `npm run lint` (oxlint),
`npm run preview` (servir o build).

O Supabase ainda não é usado em runtime, mas o `.env.example` já documenta as
variáveis — e o ponto importante: são as **mesmas credenciais do SetProd**, porque
é o projeto compartilhado que faz a diária atravessar de um app para o outro.

---

## Stack

React 19 · TypeScript 6 · Vite 8 · Tailwind CSS · PWA (offline) · oxlint

Alinhada com a do SetProd de propósito: os dois vão compartilhar a camada de
sincronização, e divergir de toolchain significaria portar cada correção duas vezes.

---

## Licença

Projeto pessoal, sem licença definida. Todos os direitos reservados.
