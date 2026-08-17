# Lumavi SetGear — Sistema de Controle de Equipamentos de Cinema & Set

**Lumavi SetGear** é uma aplicação web progressiva de alta performance e design tático desenvolvida especificamente para a logística, checagem e controle de equipamentos de fotografia, câmera, som, luz e maquinária em produções audiovisuais.

---

## 🎨 Design System: One UI / Material You (Dark Premium)

O aplicativo adota a linguagem de design **One UI / Material You Dark Premium**, otimizada para legibilidade em ambientes de filmagem e operação sob baixa iluminação.

* **Fundo Principal (`--bg-primary`)**: `#0f0f0f`
* **Superfície dos Cards (`--bg-surface`)**: `#1a1a1a` (cantos arredondados em `24px` e bordas suaves `#2a2a2a`)
* **Azul Vibrante Samsung (`--accent-primary`)**: `#00A3FF` (destaques primários, botões de ação e exportação)
* **Verde Esmeralda Soft (`--accent-success`)**: `#2ED5A0` (status PRONTO, 100% OK e selos de verificação)
* **Laranja Soft (`--accent-warning`)**: `#FFB84D` (status PENDENTE, baterias incompletas e avisos)
* **Barra de Navegação Inferior (Bottom Navigation)**: Fixa no rodapé com 4 seções principais (*Projetos*, *Database*, *Bugs*, *Config*).
* **Management Bar nos Cards**: Botões compactos elegantes com ícone aparente por padrão que expandem e revelam a legenda em texto ao passar o mouse (**hover**).

---

## 🚀 Principais Funcionalidades & Regras de Negócio

### 1. 🔑 Primeira Inicialização & Configuração de Senhas
* Ao abrir a aplicação pela primeira vez, o sistema solicita a definição inicial da **Senha de Admin** (padrão: `admin123`) e da **Senha de Operador** (padrão: `op123`).

### 2. 🔒 Autenticação de Entrada (LockScreen Lumavi)
* Apresentada antes de permitir o acesso ao aplicativo.
* **👑 ADMINISTRADOR** (Exige Senha) → Permissão total de edição, criação e exclusão.
* **🛠️ OPERADOR** (Exige Senha + Nome do Usuário) → Permite cadastrar equipamentos/projetos e alterar status **apenas dos equipamentos vinculados ao seu próprio nome**.
* **👁️ VISUALIZAÇÃO / READ-ONLY** (Entrada livre sem senha) → Permite navegar e visualizar todo o acervo e diárias sem permissão de edição.

### 3. 📁 Project Manager (Gestão de Projetos e Diárias)
* Criação de projetos de filmagem com cadastro de chefias do set (**Diretor**, **DP de Fotografia**, **Direção de Arte**, **Gaffer**).
* Definição da frota de veículos (Vans de Câmera, Luz, Grip) e datas das diárias.

### 4. 🎬 Diária Zerada & Montagem Sob Demanda
* Toda diária inicia **zerada** (sem equipamentos pré-adicionados).
* **Prompt Inteligente de Mala/Container**: Ao buscar ou escaneiar um equipamento pertencente a um case (ex: `RED Komodo`), o app pergunta:
  > *"Deseja incluir apenas o item individual ou a MALA CONTAINER INTEIRA com todos os acessórios?"*

### 5. 🚚 Ciclo Tático das 2 Fases (Saída vs Volta)
* **1. SAÍDA (Casa → Set)**: Checagem dos equipamentos levados ao set. Botões `SAÍDA (OK)` e `IGNORAR`.
* **2. VOLTA (Set → Casa)**: Checagem dos equipamentos retornados. Liberada apenas após a conclusão da Saída. Botões `VOLTA (OK)` e `IGNORAR`.

### 6. 🔋 Gestão de Baterias (Carga & 100%)
* Baterias entram na diária com status `PENDENTE` e `SEM CARGA`.
* Permite alternar o status `[CARREGANDO]`.
* Ao confirmar a Saída de uma bateria, o app faz a pergunta:
  > *"Esta bateria está 100% carregada?"*
  * Se **Sim**: Marca `✅ CARGA 100%`.
  * Se **Não**: Marca `⚠️ NÃO ESTÁ 100%` (deixa o aviso laranja em destaque).

### 7. 📷 Leitor QR Code & Selo `[VERIFICADO ✓]`
* Leitor de código de barras / QR Code para identificação instantânea de malas e equipamentos.
* Aplica o selo tático **`[VERIFICADO ✓]`** nos itens checados via scanner.

### 8. 🐛 Gerenciador e Relatório de Bugs
* Registro de erros e sugestões de melhoria salvos no banco Supabase e no `localStorage`.
* Inclui o botão **`COPIAR RELATÓRIO DE BUGS`** para exportar o log formatado em JSON para a equipe de desenvolvimento.

### 9. 📄 Exportação de Relatórios em PDF
* Botão azul **`#00A3FF`** na barra da diária.
* Aciona o componente `<AlertDialog>` caso haja pendências na diária, solicitando confirmação para exportação parcial.

---

## 🛠️ Tecnologias Utilizadas

* **Core**: React 18, Vite, TypeScript.
* **Styling**: Tailwind CSS, Vanilla CSS variáveis One UI.
* **Icons**: Lucide React.
* **Database / Backend**: Supabase integration + localStorage fallback.

---

## 💻 Executando o Projeto Localmente

```bash
# 1. Instalar dependências
npm install

# 2. Executar servidor de desenvolvimento
npm run dev

# 3. Gerar build de produção
npm run build
```

---

*Lumavi SetGear v1.2.0 • Desenvolvido para Produções Cinematográficas.*
