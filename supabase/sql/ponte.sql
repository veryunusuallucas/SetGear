-- ===========================================================================
-- SetGear ⇄ SetProd — A ponte estreita
-- ===========================================================================
--
-- Rodar DEPOIS de multiusuario.sql (SetProd) e acervo.sql (SetGear).
-- Pode rodar quantas vezes quiser.
--
-- ---------------------------------------------------------------------------
-- POR QUE UMA PONTE, E NÃO MEMBRESIA
-- ---------------------------------------------------------------------------
--
-- O caminho curto seria adicionar a conta de fotografia como membro do projeto
-- no SetProd. Ela leria as diárias e pronto. Mas a política do SetProd é:
--
--     create policy "registros: membros leem" on public.registros
--       for select to authenticated using (public.e_membro(projeto_id));
--
-- Uma política só, sem filtro por tabela — e `registros` espelha as 22 tabelas
-- do Dexie. Membro do projeto lê TUDO: `despesas`, `acertos`, e em `perfis` o
-- cpf, o telefone, o valor_diaria e — o mais grave — `info_medica`, `alergias`,
-- `medicamentos_continuos` e `plano_saude` de toda a equipe.
--
-- Com uma conta de fotografia compartilhada entre assistentes, isso é um login
-- compartilhado para prontuário de equipe. Não vale a diária.
--
-- Então a ponte é explícita e estreita nos DOIS sentidos:
--
--   SetProd → SetGear : `projeto_publicado` — projeto, diárias, veículos. Nada mais.
--   SetGear → SetProd : `diaria_resumo`     — CONTAGENS. Nunca itens.
--
-- Nenhum dos lados vira membro do outro. Cada um publica o pouco que o outro
-- precisa, e o resto continua invisível — inclusive para o banco.
-- ===========================================================================


-- ###########################################################################
-- PARTE 1 — O VÍNCULO
-- ###########################################################################

-- "Esta produção compartilha logística de equipamento com este acervo."
--
-- É a produção que decide, não o acervo: quem cria o vínculo tem que ser membro
-- do projeto. Assim ninguém que descubra um projeto_id se conecta a ele por
-- conta própria para ler as diárias.

create table if not exists public.projeto_acervo (
  projeto_id text not null,
  acervo_id  text not null references public.acervos(id) on delete cascade,
  criado_por uuid not null default auth.uid(),
  criado_em  timestamptz not null default now(),
  primary key (projeto_id, acervo_id)
);

create index if not exists idx_projeto_acervo_acervo
  on public.projeto_acervo (acervo_id);


-- ###########################################################################
-- PARTE 2 — FUNÇÕES
-- ###########################################################################

-- "Algum acervo do qual eu sou membro está vinculado a este projeto?"
--
-- SECURITY DEFINER com search_path fixo, pelos mesmos motivos do resto: cortar
-- recursão de RLS e fechar o sequestro de search_path.
create or replace function public.acervo_ve_projeto(p_projeto text)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1
      from public.projeto_acervo pa
     where pa.projeto_id = p_projeto
       and public.e_membro_acervo(pa.acervo_id)
  );
$$;

-- "Este acervo está vinculado a este projeto?" — usada na escrita do resumo.
create or replace function public.acervo_vinculado(p_projeto text, p_acervo text)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.projeto_acervo
     where projeto_id = p_projeto and acervo_id = p_acervo
  );
$$;

-- ---------------------------------------------------------------------------
-- A garantia de privacidade, no banco e não na promessa
-- ---------------------------------------------------------------------------
-- O combinado é que o resumo leve CONTAGENS e nunca nome de equipamento. Um
-- combinado que vive só no código do cliente se rompe no primeiro descuido —
-- alguém acrescenta um campo "itens_pendentes" para depurar, e o inventário
-- passa a vazar para a produção sem ninguém perceber.
--
-- Esta função é a garantia estrutural: o banco recusa a linha se aparecer
-- qualquer chave fora da lista. Se um dia o resumo precisar de campo novo, é
-- preciso vir aqui e decidir de propósito — que é exatamente o ponto.

create or replace function public.resumo_so_contagens(p jsonb)
returns boolean
language sql
immutable
as $$
  select
    -- Tem que ser um array (ou ausente).
    coalesce(jsonb_typeof(p), 'array') = 'array'
    -- Todo elemento tem que ser objeto.
    and not exists (
      select 1
        from jsonb_array_elements(coalesce(p, '[]'::jsonb)) as elem
       where jsonb_typeof(elem) <> 'object'
    )
    -- E nenhum objeto pode ter chave fora da lista.
    and not exists (
      select 1
        from jsonb_array_elements(coalesce(p, '[]'::jsonb)) as elem,
             jsonb_object_keys(elem) as chave
       where chave not in ('nome', 'total', 'saiu', 'voltou', 'pendente')
    );
$$;


-- ###########################################################################
-- PARTE 3 — SetProd → SetGear
-- ###########################################################################

-- O que o SetGear precisa saber da produção, e só isso.
--
-- Publicado pelo SetProd a cada alteração de diária. É uma projeção, não um
-- espelho: os campos abaixo são uma lista fechada, e ampliá-la é uma decisão
-- consciente e não um efeito colateral de sincronizar mais uma tabela.

create table if not exists public.projeto_publicado (
  projeto_id    text primary key,
  nome          text,
  diretor       text,
  dp_fotografia text,

  -- [{ id, numero, data, horario_chamada }]
  diarias       jsonb not null default '[]'::jsonb,
  -- [{ id, nome, placa, tipo }]
  veiculos      jsonb not null default '[]'::jsonb,

  atualizado_em timestamptz not null default now()
);

alter table public.projeto_publicado enable row level security;

-- Quem publica é a produção.
drop policy if exists "publicado: producao escreve" on public.projeto_publicado;
create policy "publicado: producao escreve" on public.projeto_publicado
  for insert to authenticated with check (public.e_membro(projeto_id));

drop policy if exists "publicado: producao atualiza" on public.projeto_publicado;
create policy "publicado: producao atualiza" on public.projeto_publicado
  for update to authenticated
  using (public.e_membro(projeto_id))
  with check (public.e_membro(projeto_id));

-- Quem lê é a produção e o acervo vinculado. O acervo NÃO é membro do projeto:
-- é isto que o mantém longe de `registros`.
drop policy if exists "publicado: producao e acervo leem" on public.projeto_publicado;
create policy "publicado: producao e acervo leem" on public.projeto_publicado
  for select to authenticated
  using (public.e_membro(projeto_id) or public.acervo_ve_projeto(projeto_id));


-- ###########################################################################
-- PARTE 4 — SetGear → SetProd
-- ###########################################################################

-- O que a produção vê da conferência: quantos itens por departamento, quantos
-- saíram, quantos voltaram, quantos faltam. A produção descobre que "falta 1 de
-- Câmera" e sabe que precisa esperar o wrap — sem saber qual item, nem que
-- existe uma Komodo no acervo.

create table if not exists public.diaria_resumo (
  projeto_id text not null,
  diaria_id  text not null,
  acervo_id  text not null references public.acervos(id) on delete cascade,

  -- [{ nome, total, saiu, voltou, pendente }] — a CHECK abaixo é o que garante.
  por_departamento jsonb not null default '[]'::jsonb
    constraint resumo_sem_nome_de_item check (public.resumo_so_contagens(por_departamento)),

  fase_atual text,
  pendencias integer not null default 0,
  fechada    boolean not null default false,

  atualizado_em timestamptz not null default now(),
  primary key (projeto_id, diaria_id)
);

alter table public.diaria_resumo enable row level security;

-- Quem publica é o acervo, e só para projeto ao qual ele está vinculado.
drop policy if exists "resumo: acervo escreve" on public.diaria_resumo;
create policy "resumo: acervo escreve" on public.diaria_resumo
  for insert to authenticated
  with check (
    public.papel_no_acervo(acervo_id) in ('dono', 'operador')
    and public.acervo_vinculado(projeto_id, acervo_id)
  );

drop policy if exists "resumo: acervo atualiza" on public.diaria_resumo;
create policy "resumo: acervo atualiza" on public.diaria_resumo
  for update to authenticated
  using (
    public.papel_no_acervo(acervo_id) in ('dono', 'operador')
    and public.acervo_vinculado(projeto_id, acervo_id)
  )
  with check (
    public.papel_no_acervo(acervo_id) in ('dono', 'operador')
    and public.acervo_vinculado(projeto_id, acervo_id)
  );

drop policy if exists "resumo: producao e acervo leem" on public.diaria_resumo;
create policy "resumo: producao e acervo leem" on public.diaria_resumo
  for select to authenticated
  using (public.e_membro(projeto_id) or public.e_membro_acervo(acervo_id));


-- ###########################################################################
-- PARTE 5 — POLÍTICAS DO VÍNCULO
-- ###########################################################################

alter table public.projeto_acervo enable row level security;

-- A produção convida o acervo. O acervo não se convida.
drop policy if exists "vinculo: producao cria" on public.projeto_acervo;
create policy "vinculo: producao cria" on public.projeto_acervo
  for insert to authenticated with check (public.e_membro(projeto_id));

drop policy if exists "vinculo: producao desfaz" on public.projeto_acervo;
create policy "vinculo: producao desfaz" on public.projeto_acervo
  for delete to authenticated using (public.e_membro(projeto_id));

drop policy if exists "vinculo: os dois lados leem" on public.projeto_acervo;
create policy "vinculo: os dois lados leem" on public.projeto_acervo
  for select to authenticated
  using (public.e_membro(projeto_id) or public.e_membro_acervo(acervo_id));


-- ###########################################################################
-- O QUE ESTE ARQUIVO NÃO FAZ
-- ###########################################################################
--
-- Não toca em `registros` nem em nenhuma política existente do SetProd. Tudo
-- aqui é aditivo. Foi decidido assim de propósito: mexer na política de leitura
-- de um app em produção para restringi-la é uma operação em que errar vaza MAIS,
-- não menos. Se um dia o `registros` for filtrado por papel — que é o modelo de
-- "acessos de fotografia" no plano — é outro arquivo, com outra revisão.
