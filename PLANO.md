# SetGear — Plano de Reconstrução e Integração com o SetProd

> Documento de planejamento. Nada de código foi alterado ainda.
> Atualizado: 17/08/2026 — v2, com as decisões de arquitetura, acervo, QR e design.

---

## 0. Decisões tomadas

| Questão | Decisão |
|---|---|
| Plataforma | **Web + PWA.** Não React Native. |
| App | **Separado** do SetProd — deploy e origem próprios. |
| Backend | **Mesmo projeto Supabase**, motor de sync copiado do SetProd. |
| Interface entre os apps | SetProd → SetGear: projetos e diárias, **read-only**. SetGear → SetProd: **só resumo agregado** por diária. Nunca o inventário. |
| Acervo de equipamento | **Uma conta dona de tudo.** `proprietarios` é rótulo, não login. |
| Quem cria diária | Só o SetProd. O SetGear **não pode**. |
| Backup | Export XLSX/CSV para humanos + JSON para restore. **Sem Google Sheets.** |
| Design | Tokens do SetProd + accent próprio. apple-design para movimento; React Bits para o shell. |
| Nome | "SetGear" provisório — não chumbar em componente. |

Detalhamento das respostas em **§9**.

---

## 1. Diagnóstico: o que o SetGear é hoje

**Stack:** React 18 · Vite 5 · TypeScript 5.2 · Tailwind 3 · ~3.960 linhas · 17 componentes.

**Estado:** protótipo de UI funcional e bem acabado visualmente, sobre uma base de
dados que não sustenta as features prometidas.

### 1.1 O que funciona e deve ser preservado

O valor real do produto está aqui:

| Feature | Onde | Por que preservar |
|---|---|---|
| Prompt de container ("item só ou mala inteira?") | `ContainerPromptModal` | É o diferencial. Resolve o problema real do set. |
| Check em cascata pai → filhos | `store.updateItemLocationStatus` | Escaneia a Pelican, marca tudo dentro. |
| Diária zerada / montagem sob demanda | `App.tsx` + busca | Evita burocracia de pré-cadastro. |
| Trava de fase (volta bloqueada até saída completa) | `isSaidaComplete` | Impede encerrar diária com item perdido. |
| Fluxo de bateria (pendente → carregando → 100%/não-100%) | `BatteryCheckModal` | Específico e certo para o domínio. |
| Selo `[VERIFICADO ✓]` para check via QR | `validado_por_qr` | Distingue conferência manual de escaneada. |

### 1.2 Lacunas: documentado mas inexistente

Verificado por busca no código, não por leitura da doc:

| Prometido no README / SETGEAR-FUNCIONAMENTO | Realidade |
|---|---|
| Supabase, multiusuário, sync | **Zero uso.** `src/lib/supabase.ts` cria o client e nenhum arquivo o importa. `supabase/schema.sql` nunca foi aplicado. |
| Scanner de QR real | **Simulado.** `html5-qrcode` está no `package.json` e nunca é importado. O `ScannerModal` é input de texto + 4 botões chumbados. |
| 4 fases (Pré-Set → Carro Ida → No Set → Wrap) | **Só 2** (saída/volta). `no_set` e `pendente_wrap` não aparecem em nenhum arquivo. |
| Barra de progresso do Wrap | `WrapProgressBar.tsx` existe e **nunca é renderizado**. Órfão. |
| Exportação em PDF | É `window.print()` na modal. Sem folha de estilo de impressão. |
| React Native + Expo | É web puro — e está certo, ver §2. |

### 1.3 Dívida estrutural — trava qualquer feature nova

1. **Existe apenas uma diária.** `activeDaily` é objeto literal chumbado no store.
   `setDailyDate()` troca a data e **zera `equipamentos_ids`** — trocar de diária
   destrói a conferência. Sem histórico.
2. **Status é global, não por diária.** `itemStatusMap` é indexado por
   `equipamento_id`. O schema SQL faz certo (`UNIQUE(diaria_id, equipamento_id)`),
   o código não. O status de ontem contamina a diária de hoje.
3. **Permissão por substring de nome.** `canUserEditEquipment` faz
   `proprietario_nome.includes(userName)` — "Ana" casa com "Mariana"; nome vazio
   casa com todo mundo.
4. **Senhas em texto puro** em `lumavi_setgear_passwords_v4`. DevTools → senha de admin.
5. **`notify()` reescreve as 6 chaves do localStorage a cada mudança.** Cada toque
   serializa o inventário inteiro.
6. **Dois design systems em conflito.** O `tailwind.config.js` define a paleta
   CineCore 95 que **nenhum componente usa**; todos usam One UI com hex chumbado.
   As cores do Tailwind são código morto.
7. **`alert()` nativo** no store para erro de permissão.
8. **Sem git, sem testes, sem lint.** O diretório não é repositório.

---

## 2. Plataforma: web + PWA

- O SetProd é **web** (Vite + React 19), `vite-plugin-pwa`, Vercel, GitHub,
  offline via **Dexie/IndexedDB**.
- Dois apps para fundir, um em web e outro em RN = duas camadas de UI, dois builds.
- O motor de sync do SetProd **é** Dexie, que é IndexedDB, que é web. Portar para
  RN significaria trocar por SQLite e reescrever o sync.
- QR no navegador: `getUserMedia` + `html5-qrcode` (já instalado) ou
  `BarcodeDetector`. Funciona em PWA instalado no Android/iOS moderno.

Nativo só se aparecer necessidade que o PWA não atende (ex.: NFC no iOS).

---

## 3. Arquitetura-alvo

```
   ┌──────────────────────┐                    ┌──────────────────────┐
   │       SetProd        │                    │       SetGear        │
   │  (produção/direção)  │                    │    (fotografia)      │
   │  origem própria      │                    │  origem própria      │
   ├──────────────────────┤                    ├──────────────────────┤
   │  Dexie "SetMoneyDB"  │                    │  Dexie "SetGearDB"   │
   └──────────┬───────────┘                    └──────────┬───────────┘
              │                                            │
              │  ①  projetos + diarias  ───────────────►   │  read-only
              │                                            │
              │  ◄────────  ②  resumo por diária  ─────────│  agregado
              │                                            │
              │            ✗  inventário NUNCA sobe  ✗     │
              │                                            │
              └────────────────────┬───────────────────────┘
                                   │
                    ┌──────────────▼────────────────┐
                    │      Supabase Postgres        │
                    │  registros    (SetProd)       │
                    │  acervo_*     (SetGear, RLS   │
                    │                por dono)      │
                    │  diaria_resumo (a ponte)      │
                    └───────────────────────────────┘
```

**Regra de ouro herdada do SetProd:** o app **sempre** lê do Dexie, **nunca** do
Postgres. O Postgres é transporte, não banco de consulta. É isso que faz o app
funcionar num set sem sinal.

### 3.1 App separado: o que isso custa e por que está ok

**IndexedDB é escopado por origem.** Dois apps em domínios diferentes **não podem
compartilhar o Dexie** — a diária só chega no SetGear via Supabase, ou seja,
**precisa de internet ao menos uma vez**.

Eu tinha levantado isso como objeção. **A objeção perde força na prática:** a
diária é criada na pré-produção, dias antes da filmagem, não às 5h da manhã na van.
Basta o SetGear ter sincronizado uma vez antes de sair da base — e a partir daí ele
opera 100% offline no set, que é o que importa.

O que se ganha em troca é o que você pediu: **separação real de dados.** Não é só
separação de UI — em origens diferentes, com RLS diferente, o cliente do SetProd
literalmente não tem como consultar o inventário. É fronteira de segurança, não
convenção.

**Consequência para o desenvolvimento:** o SetGear precisa do **próprio** Dexie e do
**próprio** loop de sync. Mas **copia o código** do SetProd (`db.ts`, `sync.ts`,
`sincronizacao.ts`) em vez de reinventar. Não é reescrita, é replicação.

### 3.1b A ponte estreita: o que a produção vê

Você foi específico: a produção precisa saber *se tudo foi e voltou*, mas **não** o
que existe no acervo. Isso define uma interface deliberadamente estreita:

**① SetProd → SetGear** (read-only): `projetos`, `diarias`, e de brinde `veiculos`
e `motoristas` (os comboios da Ordem do Dia passam a ser os veículos reais da
conferência — hoje o SetGear tem `INITIAL_VEHICLES` chumbado).

**② SetGear → SetProd** (só agregado): uma linha por diária, escopada por
`projeto_id`, contendo **contagens e pendências — nunca itens**:

```
diaria_resumo {
  diaria_id, projeto_id,
  por_departamento: [
    { nome: "Câmera", total: 47, saiu: 47, voltou: 46, pendente: 1 },
    { nome: "Luz",    total: 82, saiu: 82, voltou: 82, pendente: 0 }
  ],
  fase_atual: "wrap",
  pendencias: 1,          // só o número
  fechada: false
}
```

A produção enxerga "falta 1 item de Câmera" e sabe que precisa esperar o wrap. Não
enxerga *qual* item, nem que você tem uma Komodo. Se algum dia quiser expor o nome
do item pendente, é um campo a mais — mas o padrão é fechado.

**Por que essa direção é a certa:** a produção precisa de um *sinal de status*, não
de um inventário. Dar o inventário seria dar dado que ela não usa e não deveria
guardar — inclusive por seguro e responsabilidade sobre equipamento de terceiros.

### 3.2 O motor de sync que já existe no SetProd

Não reescrever nada disso. Está maduro e resolve problemas difíceis:

- **`registros`**: uma tabela genérica `(projeto_id, tabela, id, dados jsonb)`
  espelhando as 22 tabelas do Dexie.
- **Dois relógios**: `atualizado_em` (cliente) decide **quem vence** no LWW;
  `recebido_em` (servidor) decide **o que falta** baixar (cursor).
- **Outbox** (`sync_queue`) + evento `EVENTO_ALTERACAO` → alteração sobe em ~2s.
- **`MARCA_REMOTA`** na transação Dexie, para não entrar em ping-pong infinito de
  eco quando aplica o que veio do servidor.
- **RLS** por `projeto_membros` + `super_admins` + Edge Function de convite.

### 3.3 Tabelas novas que o SetGear acrescenta

Entram no mesmo Dexie e na mesma lista `TABELAS_SINCRONIZADAS`:

| Tabela | Conteúdo | Escopo |
|---|---|---|
| `equipamentos` | acervo master, com `e_container`, `container_pai_id`, `foto_id` | **global (por dono)** |
| `categorias_equip` | Câmeras, Lentes, Baterias, Grip, Cases | global |
| `proprietarios` | locadoras e donos | global |
| `reservas` | **intenção** de uso: item × projeto × intervalo de datas | global ↔ projeto |
| `diaria_itens_status` | chave **`[diaria_id+equipamento_id]`** — corrige a dívida nº 2 | por projeto |
| `checagens` | log append-only: quem checou, quando, via QR ou manual | por projeto |

Reusa, sem duplicar: `projetos`, `diarias`, `veiculos`, `motoristas`, `perfis`,
`departamentos`, `logs`.

### 3.4 Como o requisito da diária se resolve

> "quando cria uma diária no SetProd, automaticamente aparece uma no SetGear"

Não é ponte a construir — é consequência da arquitetura:

1. SetProd cria uma `Diaria` no Dexie.
2. Mesma origem → **o SetGear já a vê**, no mesmo instante, sem rede.
3. Em outro aparelho: sobe pra `registros` em ~2s, desce pelo cursor.

O SetGear **não cria** diárias — ele as **consome** e anexa sua camada de
logística. O SetProd é a fonte da verdade sobre *quando se filma*; o SetGear,
sobre *o que embarcou*.

**De brinde:** os `comboios` e `veiculos` da Ordem do Dia passam a ser os veículos
reais do SetGear. Hoje o SetGear tem `INITIAL_VEHICLES` chumbado.

---

## 4. Capacidade do Supabase — não é o gargalo

Estimativa para um acervo de 500 itens e 40 diárias/ano:

| Dado | Volume |
|---|---|
| `equipamentos` (500 × ~400 B) | ~200 KB |
| `diaria_itens_status` (500 × 40 = 20k linhas × ~250 B) | ~5 MB |
| `checagens` (log de 1 ano) | ~4 MB |
| **Total/ano** | **~10 MB de 500 MB (2%)** |

O sync sobe **deltas por cursor**, não a base inteira — egress também é pequeno.

**Os limites reais a planejar são outros:**

1. **Storage: 1 GB no free tier.** Foto de equipamento é uma feature que você vai
   querer (é o que faz um assistente reconhecer a peça). A 200 KB comprimido →
   ~5.000 fotos. **Precisa de compressão client-side antes do upload**, e o
   SetProd já tem `migracaoAnexos.ts` para reusar como referência.
2. **O free tier pausa o projeto após ~7 dias sem atividade.** Para um app
   sazonal, parado meses entre produções, isso é risco operacional real — o
   primeiro acesso da nova produção falha. Mitigação: um ping agendado, ou o
   plano pago quando houver produção ativa.

### 4.1 Backup — e por que não Google Sheets

Você perguntou se vale fazer backup no Google Sheets. **Minha recomendação é não** —
e a razão é que "backup" e "compartilhar com humanos" são dois problemas diferentes
que o Sheets resolve mal ao mesmo tempo.

O que o Sheets custa: OAuth do Google (ou service account + Edge Function),
credencial a rotacionar, limites de API, e — o pior — **não é caminho de restore**.
Você não reconstrói o app a partir de uma planilha sem escrever um importador
inteiro. É trabalho de integração recorrente por um benefício que dá pra ter mais
barato.

**Você já tem três camadas de backup de graça:**

| Camada | O que é | Protege de |
|---|---|---|
| **Dexie / IndexedDB** | cópia local completa em cada aparelho | queda de internet, Supabase fora do ar |
| **Supabase Postgres** | cópia durável no servidor | perda/roubo/formatação do aparelho |
| **Export em arquivo** | download sob demanda | apagar sem querer, migração, fim do Supabase |

Cada aparelho que já sincronizou é, por si, um backup completo. Isso é uma
propriedade boa do local-first, e é melhor do que a maioria dos apps tem.

**O que fazer, então:**

- **XLSX/CSV sob demanda, para humanos.** Cliente puro (sem API, sem auth): lista de
  acervo com dono e valor de reposição (útil para **seguro** e para acerto com
  locadora), e relatório de conferência por diária. É isso que você mandaria pra
  produção, pro seguro ou pro contador — e é o que você provavelmente queria do
  Sheets. Aqui é um clique, sem integração.
- **JSON completo, para restore.** É o backup de verdade, com importador que
  reconstrói o Dexie. O SetProd já tem `backup.ts` — reusar.

**Se depois você quiser o Sheets** especificamente como *painel ao vivo* para alguém
que não tem acesso ao app, aí ele faz sentido — mas como **publicação**, alimentada
pelo `diaria_resumo` de §3.1b, e não como backup. Fica pra depois, se a necessidade
aparecer.

---

## 5. Acervo, dono e disponibilidade

Você pediu: *"um database com as infos do equipamento, dono e quando ele vai estar
sendo usado."* Isso decide que o acervo é **global, por dono** — ele reaparece em
toda produção.

### 5.1 Modelo

- **`equipamentos`** — global: nome, categoria, dono, QR, container, foto, nº de série, valor de reposição.
- **`reservas`** — *intenção*: "este item está comprometido com o projeto X de 10 a 18/09", registrável **antes** de as diárias existirem.
- **uso real** — *fato*: derivado de `diarias.data` + `diaria_itens_status`.

Os dois são necessários: reserva serve pra planejar, uso serve pra auditar.

### 5.2 A feature que justifica o modelo: conflito de agenda

Mesmo item reservado em dois projetos com datas sobrepostas → **alerta**. Impede
double-booking da mesma lente. É o que transforma o SetGear de checklist em
sistema de gestão de acervo.

Visualização: timeline por item (onde ele está, semana a semana). O SetProd já tem
`StripboardTimeline.tsx` como referência de padrão.

### 5.3 O risco que evaporou

Na v1 eu tinha marcado isto como **o maior risco do plano**: um acervo que atravessa
projetos precisaria de um escopo de autorização novo (`dono_id` + membership +
políticas próprias), colidindo com a RLS do SetProd, que escopa tudo por `projeto_id`.

**Sua resposta nº 2 elimina esse risco.** Se existe **uma única conta dona de tudo**,
e `proprietarios` (Eugenio, CineRent) é apenas um **campo de rótulo** e não uma conta
de login, então a RLS do acervo é a mais simples que existe:

```sql
-- Uma linha. É isso.
create policy "acervo: so o dono" on acervo_equipamentos
  for all to authenticated
  using (dono_id = auth.uid()) with check (dono_id = auth.uid());
```

Sem membership, sem convite, sem hierarquia de permissão no acervo. E como a
produção nunca tem linhas nessas tabelas, a separação de dados de §3.1b sai de graça
junto.

**Fica um detalhe a resolver:** a conta de fotografia precisa ler as diárias do
SetProd, e a RLS do SetProd exige ser membro do projeto. Então essa conta é
**membro do projeto** (papel `equipe`, para ler diárias) **e** dona do acervo (para
o inventário). São dois papéis na mesma conta, sem conflito — e o convite pra virar
membro já existe no SetProd.

**Nota:** o SetGear ainda mantém os 3 papéis internos (admin/operador/visualizador)
para uso **dentro** do app — o assistente marca item, o admin cadastra e apaga. Isso
é controle de UI dentro de uma conta, não autenticação separada. Simples de fazer, e
não é fronteira de segurança — vale ser explícito sobre isso pra ninguém contar com
ela como se fosse.

---

## 5.4 Grupos / Kits — o que você chamou de "grupos de equipamentos"

Você disse que o SetGear "pode criar grupos de equipamentos e tudo sobre
equipamentos". Vale separar dois conceitos que hoje o app confunde num só:

| | **Container** | **Grupo / Kit** |
|---|---|---|
| O que é | mala/case **físico** (Pelican 1510) | agrupamento **lógico** ("Kit Básico Câmera") |
| Um item pertence a | **um** container só | **vários** grupos ao mesmo tempo |
| Existe no código? | ✅ `e_container` + `container_pai_id` | ❌ **não existe** |
| Para que serve | check em cascata (escaneia a mala, marca tudo) | montar a diária em 1 toque |

**Por que o grupo importa:** hoje a "diária zerada" é conceitualmente certa, mas na
prática você adiciona 80 itens um por um, toda diária. Um grupo resolve isso —
"Diária de estúdio" ou "Kit externa noturna" viram um toque. É a feature que faz a
diária zerada deixar de ser tediosa sem abrir mão de ser zerada.

E são **ortogonais**: a lente vive na Pelican (container) e pode estar no "Kit
Básico" e no "Kit Noturno" (grupos). Modelar como uma coisa só quebraria um dos dois.

Nova tabela: `grupos` + `grupo_itens` (N:N). É trabalho pequeno com retorno diário
grande — priorizar cedo na Fase 3.

---

## 6. Etiquetagem e catalogação

### 6.1 Etiquetas físicas

| Opção | Custo aprox. | Veredito |
|---|---|---|
| Papel comum + fita adesiva larga por cima | ~grátis | Funciona bem melhor do que parece. Bom pra testar. |
| Folha adesiva A4 (Pimaco/Avery) + laser | barato | 20–65 etiquetas/folha. Frágil a suor e atrito de cabo. |
| **Impressora térmica Bluetooth (Niimbot D11/B21)** | ~R$150–250 | **Melhor custo-benefício.** Imprime do celular, sob demanda, no set. |
| Etiquetas de patrimônio em vinil (gráfica) | médio | Mais durável, sem impressora. Mas conjunto fixo de códigos. |
| NFC (toque, sem linha de visão, funciona no escuro) | ~R$1–2/tag | Atraente pra set escuro, mas **Web NFC é só Android/Chrome** — não pode ser o caminho principal. |

*Preços de memória, podem estar desatualizados — conferir antes de comprar.*

### 6.2 O gargalo real: catalogar 300+ itens

Nenhuma escolha de etiqueta resolve isso. O fluxo resolve:

1. **Desacoplar colar de nomear.** Imprimir folhas de códigos sequenciais genéricos
   (`SG-0001`…`SG-0500`), colar em tudo de uma vez, e só depois passar escaneando e
   nomeando. Muito mais rápido que nomear → imprimir → colar, item por item.
2. **Modo Catalogação contínuo.** A câmera fica aberta: escaneia → nomeia → volta
   pra câmera. Sem fechar modal a cada item.
3. **Criação em lote com numeração.** "Bateria V-Mount #01…#12" numa tacada. Hoje
   o app te faria digitar 12 vezes.
4. **Duplicar item** para gêmeos.
5. **Foto** como identificação — ajuda quem não conhece o equipamento.
6. **Ditado por voz** para o nome (`SpeechRecognition`), com fallback de teclado.

### 6.3 Regras do código QR

- **Código curto e opaco, não URL.** URL num QR de patrimônio gasta densidade
  (módulos menores = leitura pior no escuro) e vaza domínio.
- **Texto legível impresso embaixo do QR.** Quando o scanner falha — etiqueta
  amassada, suja, escuro, luva — a pessoa lê com o olho e digita. O input manual
  deixa de ser fallback de desenvolvedor e passa a ser fallback de campo.
- Nível de correção de erro alto (Q ou H): a etiqueta vai amassar e sujar.

---

## 7. Design

### 7.1 As fontes

| Fonte | O que é | Como usar |
|---|---|---|
| **apple-design** (skill) | Princípios de movimento fluido e materiais, das talks da Apple | Movimento: **integral**. Materiais: **seletivo** (ver 7.4). |
| **React Bits** | 165+ componentes animados. 4 categorias (text, UI, components, backgrounds). Variantes JS/TS × CSS/Tailwind. MIT + Commons Clause. | Variante **TS-CSS** — é o padrão do SetProd (CSS com variáveis, não Tailwind). **Você já usa**: `ui/webgl/Silk.tsx` e `WarpText.tsx` são React Bits. |
| **superdesign** | **Não é biblioteca.** É agente de design AI (extensão de IDE / web app) que gera mockups em `.superdesign/`. | Ferramenta de exploração — gerar variações de tela antes de implementar. Não é fonte de código. |

### 7.2 Tokens: família compartilhada, accent próprio

O SetProd usa CSS custom properties em `index.css`:

```
--bg-primary: #121212    --accent: #ffd700 (dourado)
--bg-surface: #1a1a1a    --color-success: #4ade80
--bg-active:  #222222    --color-warning: #fb923c
--border-color: #333333  --color-danger:  #f87171
--radius-sm/md/lg: 8/12/16px
```

O SetGear hoje é `#0f0f0f` com azul `#00A3FF`. Os escuros já são quase idênticos.

**Decisão:** adotar os tokens do SetProd inteiros — neutros, raios, success/warning/danger
— e **manter accent próprio para o SetGear**. Dois motivos:

1. Você precisa saber em qual app está, num relance, às 5h da manhã.
2. Dourado **colide semanticamente** com o âmbar de "pendente/carregando" — o
   accent de marca não pode ser confundido com estado de bateria.

O azul `#00A3FF` atual já serve: não colide com âmbar nem com verde. Dois apps
irmãos, mesma família, accent diferente.

**Trabalho:** migrar do Tailwind com hex chumbado para CSS custom properties, como
o SetProd. Isso também mata a paleta CineCore 95 morta (dívida nº 6).

### 7.3 Onde a apple-design se aplica de verdade

A interação central do SetGear é **marcar item como conferido, centenas de vezes
por diária**. Hoje é um botão. É o lugar que mais merece craft:

| Interação | Técnica | Valor da skill |
|---|---|---|
| **Swipe no card** para checar: direita = OK, esquerda = ignorar | Tracking 1:1 com Pointer Events + `setPointerCapture`, respeitando o offset da pega; rubber-band na borda; projeção de momentum no release; handoff de velocidade | §2, §5, §6, §9 |
| Prompt de container / bateria | **Bottom sheet**, não modal centralizado — alcance de uma mão numa van. `damping 0.8`, `response 0.3` | §4 |
| Scanner abrindo | **Materializa**: blur + scale juntos, não fade de opacidade | §12 |
| Barra de progresso do Wrap | Spring, não `transition` CSS. Leve overshoot ao cravar 100% — o momentum comunica conquista | §4 |
| Feedback de toque | No **pointer-down**, nunca no release | §1 |
| Scan bem-sucedido | **Haptic** (Vibration API) no mesmo frame do visual | §13 |

O haptic não é enfeite: num set barulhento você não ouve o beep, e muitas vezes
não está olhando a tela enquanto escaneia. Vibração é o único canal que chega.

`framer-motion` já está no SetProd — a ferramenta de spring está disponível.

### 7.4 Onde eu divirjo da Apple, de propósito

Translucidez e vibrancy são bonitas, e o contexto do SetGear é: 5h da manhã,
escuro, com luva, com pressa, tela suja. Vidro sobre vidro em baixo contraste
falha ali.

- **Movimento: adoto integral.** Springs, interruptibilidade, momentum, 1:1.
- **Materiais: seletivo.** Translucidez fica no chrome (nav, toolbar). O fluxo de
  check é **alto contraste, superfície sólida**.
- **Alvos de 56px+**, não 44 — luva grossa e van em movimento.
- **Honrar `prefers-contrast: more`** com superfícies quase sólidas e borda
  definida, e `prefers-reduced-motion` com cross-fade.
- **Tracking tipográfico por tamanho** (§15): o SetProd usa muito CAIXA ALTA, que
  precisa de tracking positivo em corpo pequeno e negativo em display. Um
  `letter-spacing` único está errado em algum tamanho.

### 7.5 React Bits — com restrição

Usar no **shell**, não no fluxo de trabalho:

- ✅ **Sim**: background da LockScreen (precedente do `Silk.tsx`), contador animado
  do progresso de Wrap, transições entre fases.
- ❌ **Não**: nada de texto animado na lista de itens. Uma lista de 200
  equipamentos com animação por item é ruído, e §16.6 (simplicidade) e §16.7
  (craft = nada é aleatório) mandam cortar.

---

## 8. Fases de execução

### Fase 0 — Fundação  *(quase concluída)*
- ✅ Pasta `.md/` com o material antigo + `CONTEXTO.md` para a IA. `.gitignore` + `.gitattributes`.
- ✅ `git init` e baseline commitado (`8fec827`), para que os upgrades sejam reversíveis.
- ✅ Toolchain alinhado ao SetProd: React 19.2, Vite 8, TS 6, `oxlint`, `vite-plugin-pwa` (`a8745be`).
  Rendeu 72 erros de compilação — 47 mecânicos, 25 de código morto real. Build e lint sem avisos.
- ✅ `APP_NOME` / `APP_VERSAO` em `src/config/app.ts`. A versão agora vem do
  `package.json` no build; antes `v1.2.0` estava escrito à mão em 4 telas enquanto
  o `package.json` dizia `1.0.0`.
- ✅ Manifest PWA + service worker gerando (`sw.js`, `manifest.webmanifest`), favicon próprio.
- ✅ `.env.example`.
- ⬜ Repo `SetGear` no GitHub (**depende de você** — ver §9b).
- ⬜ Deploy na Vercel; validar instalação do PWA no Android e iOS.

**Código morto encontrado no caminho** (registrado porque é sintoma, não acidente):
`TacticalCard` recebia `userRole` e nunca usava — quem decide permissão é
`store.canUserEditEquipment()`. A prop sugeria controle por papel no card, e não
havia. Mesmo padrão em `HeaderNavbar.activeView`, `ProjectManagerView.equipments`
e `ExportReportModal.activePhase`: passados e ignorados. Removidos.

### Fase 1 — Trocar o store pelo Dexie  ✅ *(concluída — `881c02a`)*
- ✅ `store.ts` portado para Dexie. **Duas camadas**: o Dexie é durável, um
  espelho em memória atende as leituras sincronizadas. Foi o espelho que
  permitiu trocar toda a persistência **sem tocar em nenhum dos 17 componentes**.
- ✅ Dívida nº 2: chave composta `[diaria_id+equipamento_id]` em `diaria_itens_status`.
- ✅ Dívida nº 1: múltiplas diárias com histórico. Trocar de data não apaga mais nada.
- ✅ Migração do localStorage com **backup cru antes de qualquer escrita**, sem
  apagar as chaves antigas, idempotente. Reconstrói uma diária para o status órfão.
- ✅ **26 testes** (vitest + fake-indexeddb): cascata de container, travas de fase,
  isolamento entre diárias, persistência, leitura de QR, permissão.
- ✅ `SeletorDiaria` — ver lacuna abaixo.
- ⬜ `EVENTO_ALTERACAO` e os hooks de carimbo do SetProd: ficam para a Fase 2,
  onde servem ao sync (aqui não teriam a quem avisar).

**Correção do diagnóstico:** eu descrevi as dívidas nº 1 e nº 2 como bugs *em
produção* — "o status de ontem contamina a diária de hoje". **Não era o caso.**
Nenhum componente chamava `setDailyDate()`, então havia uma diária só,
alcançável, para sempre — e sem uma segunda diária não havia colisão. Eram bugs
**latentes**. O que os torna urgentes é a Fase 2: quando as diárias vierem do
SetProd, existir várias deixa de ser hipótese.

**A lacuna que isso revelou, essa sim real:** um projeto com três datas de
gravação só deixava usar a primeira. Daí o `SeletorDiaria`, que troca a diária
ativa e mostra quantos equipamentos cada uma tem. Ele lê do store, então a Fase 2
troca a *fonte* das diárias sem invalidá-lo.

**Também corrigido:** a migração relatava "chave corrompida" quando simplesmente
não havia `localStorage` (Node, ou navegador com armazenamento bloqueado). Log
que mente manda procurar defeito onde não há.

### Fase 2 — Sync, Auth e a ponte
- Copiar `sync.ts` / `sincronizacao.ts` do SetProd. Não reescrever.
- Supabase Auth real. **Aposentar as senhas em texto puro** (dívida nº 4).
- RLS do acervo: `dono_id = auth.uid()` (§5.3 — simples agora).
- A conta de fotografia entra como membro do projeto no SetProd, para ler as diárias.
- **Ingestão read-only** de `projetos` / `diarias` / `veiculos` (§3.1b ①).
- **Publicação do `diaria_resumo`** agregado (§3.1b ②).
- Corrigir dívida nº 3: permissão por `perfil_id`, não por substring — deixando
  explícito que os papéis internos são controle de UI, não fronteira de segurança.
- Indicador de "última sincronização" na interface (ver Riscos).

### Fase 3 — Features
- **Scanner de QR real** (`html5-qrcode` ou `BarcodeDetector`), com input manual como fallback de campo. Atalhos de simulação atrás de flag de dev.
- **Gerador de etiquetas QR** para impressão em folha, com código legível embaixo (§6.3). Sem isso o scanner não tem o que ler.
- **Modo Catalogação** contínuo + criação em lote com numeração (§6.2).
- **As 4 fases** (Pré-Set → Carro Ida → No Set → Wrap), com o `WrapProgressBar` órfão finalmente renderizado e a trava de encerramento.
- **Grupos / Kits** (§5.4) — trabalho pequeno, retorno diário grande. Priorizar cedo.
- **Reservas + detecção de conflito** de agenda (§5.2).
- **PDF de verdade**, reusando `impressao.ts` / `exportacao.ts` / `relatorios.ts` do SetProd.
- **Export XLSX/CSV** (acervo p/ seguro; conferência p/ produção) + **JSON de restore** (§4.1).
- **Foto de equipamento** com compressão client-side antes do upload (§4).

### Fase 4 — Design (paralelizável com a 3)
- Migrar Tailwind + hex chumbado → CSS custom properties do SetProd (mata a dívida nº 6).
- Accent próprio do SetGear.
- Swipe-to-check com springs e momentum (§7.3) — a peça de maior impacto.
- Bottom sheets, haptics, alvos de 56px, `prefers-*`.
- React Bits no shell (§7.5).
- Opcional: gerar variações de tela no superdesign antes de implementar.

### Fase 5 — Fusão
- SetGear entra como app irmão na mesma origem, tematicamente ao lado de
  `TransporteModule` e `DiariaModule`.
- Navegação cruzada: da diária no SetProd, link direto para a conferência no SetGear.

---

## 9. Respostas às questões abertas

Todas as 5 foram respondidas em 17/08/2026. Registrado aqui o que cada uma decidiu.

### 9.1 App separado, com ponte estreita ✅
**Decisão:** dois apps, origens próprias. SetProd → SetGear manda projetos e diárias
(read-only). SetGear → SetProd manda **só resumo agregado**. A produção sabe se tudo
foi e voltou; **não** vê o acervo.
→ Detalhe em §3.1 e §3.1b. Custo aceito (precisa sincronizar antes de sair da base)
e por que é aceitável: §3.1.

### 9.2 Uma conta dona de tudo ✅
**Decisão:** só a fotografia usa o app. Uma conta dona de todo o acervo.
`proprietarios` (Eugenio, CineRent) é **rótulo**, não login.
→ **Isto eliminou o maior risco do plano.** A RLS do acervo virou uma linha de SQL.
Detalhe em §5.3.

### 9.3 SetGear não cria diária ✅
**Decisão:** só recebe projetos e diárias do SetProd. Em troca, é dono absoluto de
tudo sobre equipamento — incluindo **grupos/kits**, que não existem hoje e ganharam
modelo próprio em §5.4.
→ Consequência boa: sem escrita concorrente na mesma diária, não há conflito de
numeração pra resolver. Simplifica o sync.

### 9.4 Pasta `.md` criada ✅
**Feito.** `lumavi logagens.html` (protótipo) e `SETGEAR-FUNCIONAMENTO.md` (spec
antiga) movidos para lá, junto com `SKILL-apple-design.md`. Criado
`.md/CONTEXTO.md` — briefing para a IA, com o mapa das armadilhas da documentação.
`.gitignore` criado espelhando o do SetProd, com `.md/` e `.claude/` fora do repo.

### 9.5 Nome provisório ✅
**Decisão:** "SetGear" por enquanto, muda depois.
→ **Ação concreta:** o nome **não pode** ser chumbado nos componentes. Hoje há três
nomes vivos — README diz "Lumavi SetGear", `package.json` diz `setgear-cinecore95`,
a doc diz "CineCore 95". Uma constante `APP_NOME` num único lugar, consumida por
todos, faz a troca futura ser um diff de uma linha. Entra na Fase 0.

---

## 9b. O que ainda falta decidir

Só uma coisa, e não é urgente:

**Repositório do SetGear.** Repo próprio no GitHub (`SetGear`, ao lado de `SetProd`)
é o caminho natural agora que os apps são separados. O ponto a resolver é o **código
duplicado**: `db.ts`, `sync.ts` e os tokens de CSS vão existir nos dois repos, e
correção de bug no sync vai precisar ser aplicada duas vezes.

Opções: (a) aceitar a duplicação por enquanto — é pouco código e ele já está estável;
(b) extrair um pacote compartilhado depois, quando doer. **Recomendo (a)**: extrair
pacote agora significa mexer num app em produção para resolver um problema que ainda
não aconteceu.

---

## 10. Riscos

| Risco | Mitigação |
|---|---|
| Fase 1 é reescrita da camada de dados — pode quebrar a UI que funciona | Dexie atrás da mesma interface pública do `store`. UI intocada na Fase 1. |
| Migração do localStorage pode perder acervo cadastrado | Backup JSON antes; reusar `backup.ts` do SetProd. |
| **SetGear sai a campo sem ter sincronizado** — sem diária, no set, sem sinal | Aviso explícito na tela: "última sincronização: há 3 dias". E permitir conferência avulsa, sem diária vinculada, como escape. Ver §3.1. |
| Free tier pausando por inatividade sazonal (§4) | Ping agendado ou plano pago durante produção ativa. |
| Código de sync duplicado nos dois repos | Aceitar por ora (§9b); extrair pacote só quando a duplicação doer de fato. |
| Storage estourando com fotos de equipamento | Compressão client-side obrigatória antes do upload (§4). |

**Riscos que saíram da lista na v2:**
- ~~Escopo de acervo global vs. RLS por projeto~~ → eliminado pela decisão de conta
  única (§5.3). Era o item mais incerto do plano.
- ~~Mexer no Dexie do SetProd afeta app em produção~~ → não se aplica: o SetGear
  tem Dexie próprio (§3.1).
- ~~Um deploy derruba os dois apps~~ → não se aplica: deploys separados.
