-- ===========================================================================
-- SetGear — Acervo de equipamento: dono, membros e espelho dos dados
-- ===========================================================================
--
-- Pode rodar quantas vezes quiser: tudo é "if not exists" / "or replace" /
-- drop-and-create das políticas.
--
-- ORDEM IMPORTA: tabelas antes das funções, funções antes das políticas. Uma
-- função em `language sql` tem o corpo validado na hora de criar — se citar
-- tabela que ainda não existe, o arquivo quebra no meio. (Mesma lição do
-- multiusuario.sql do SetProd.)
--
-- POR QUE ESTE ARQUIVO É SEPARADO DO SetProd:
--
-- No SetProd, tudo é escopado por `projeto_id`: o dado nasce e morre com a
-- produção. O acervo de equipamento não funciona assim — a mesma lente atravessa
-- cinco produções e continua sendo a mesma lente. Escopar o acervo por projeto
-- obrigaria a recadastrar tudo a cada trabalho, que é exatamente a burocracia
-- que faz um app de set ser abandonado.
-- ===========================================================================


-- ###########################################################################
-- PARTE 1 — TABELAS
-- ###########################################################################

-- ---------------------------------------------------------------------------
-- 1.1 O acervo
-- ---------------------------------------------------------------------------
-- Um "acervo" é uma coleção de equipamento com um dono. Hoje há um só. A tabela
-- existe mesmo assim, e essa é uma decisão deliberada — ver 1.2.

create table if not exists public.acervos (
  id         text primary key,
  nome       text not null,
  criado_por uuid not null default auth.uid(),
  criado_em  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 1.2 Quem pode mexer no acervo
-- ---------------------------------------------------------------------------
-- ESTA TABELA É O SEGURO CONTRA A MIGRAÇÃO QUE VEM.
--
-- Hoje o acesso é uma conta única de fotografia, compartilhada. O caminho óbvio
-- e errado seria amarrar o acervo direto ao `auth.uid()` dessa conta:
--
--     using (dono_id = auth.uid())   -- ← não fazer isto
--
-- Funciona hoje, e no dia em que cada pessoa tiver a própria conta é preciso
-- reparentar a posse de todo o inventário — migração de dado, com risco, no
-- ativo mais valioso do app.
--
-- Com uma tabela de membros, o mesmo dia vira INSERIR LINHAS. O acervo pertence
-- a um `acervo_id` estável, e quem pode mexer é uma lista. Hoje a lista tem um
-- nome; amanhã tem cinco. Nada de dado se move.
--
-- O custo de fazer isso agora é uma tabela com uma linha. O custo de não fazer
-- é uma migração no acervo.

create table if not exists public.acervo_membros (
  acervo_id  text not null references public.acervos(id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,

  -- 'dono'      → cadastra, apaga, convida
  -- 'operador'  → confere itens na diária, usa o scanner
  -- 'leitor'    → só olha
  papel      text not null default 'operador',

  -- Quem esta pessoa é DENTRO da equipe, para o rastro de conferência dizer
  -- "o Pedro" e não "fotografia". Enquanto a conta é compartilhada, o SetGear
  -- preenche isto com o nome digitado na entrada — declarado, não verificado.
  -- Quando cada um tiver conta, passa a ser a identidade real e o rastro deixa
  -- de depender de honestidade.
  apelido    text,

  criado_em  timestamptz not null default now(),
  primary key (acervo_id, usuario_id)
);

create index if not exists idx_acervo_membros_usuario
  on public.acervo_membros (usuario_id);

-- ---------------------------------------------------------------------------
-- 1.3 O espelho dos dados do SetGear
-- ---------------------------------------------------------------------------
-- Mesmo desenho do `registros` do SetProd, e pelos mesmos motivos. Uma tabela
-- para todas as tabelas do Dexie; o app consulta o IndexedDB, nunca isto aqui.
-- O Postgres é transporte e cópia durável, não banco de consulta.

create table if not exists public.registros_acervo (
  acervo_id text  not null references public.acervos(id) on delete cascade,
  tabela    text  not null,
  id        text  not null,
  dados     jsonb,

  -- DOIS RELÓGIOS, DOIS TRABALHOS (lição herdada do SetProd):
  --   atualizado_em (cliente) decide QUEM VENCE  → eixo do LWW
  --   recebido_em   (servidor) decide O QUE FALTA → eixo do cursor
  -- Se o cursor usasse o relógio do cliente, um celular com a hora adiantada
  -- gravaria o cursor no futuro e pararia de receber mudanças. Sem erro, sem
  -- aviso — só silêncio.
  atualizado_em bigint      not null,
  recebido_em   timestamptz not null default now(),

  -- Lápide. Apagar de verdade faria a linha ressuscitar no próximo pull de quem
  -- estava offline: sem a lápide, o outro lado não tem como saber que sumiu.
  deletado  boolean not null default false,

  autor_id  uuid default auth.uid(),

  primary key (acervo_id, tabela, id)
);

-- O índice do pull incremental: "o que mudou neste acervo desde o cursor".
create index if not exists idx_registros_acervo_cursor
  on public.registros_acervo (acervo_id, recebido_em);


-- ###########################################################################
-- PARTE 2 — FUNÇÕES
-- ###########################################################################
--
-- SECURITY DEFINER não é enfeite: uma política em `acervo_membros` que consulte
-- `acervo_membros` entra em recursão infinita e o Postgres aborta a consulta. A
-- função roda como dona da tabela, fora da RLS, e corta o laço.
--
-- `search_path` fixo fecha o buraco clássico de SECURITY DEFINER: sem ele, quem
-- controlasse o search_path apontaria `acervo_membros` para uma tabela própria.

create or replace function public.e_membro_acervo(p_acervo text)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.acervo_membros
     where acervo_id = p_acervo and usuario_id = auth.uid()
  ) or public.e_admin();
$$;

create or replace function public.papel_no_acervo(p_acervo text)
returns text
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select coalesce(
    (select papel from public.acervo_membros
      where acervo_id = p_acervo and usuario_id = auth.uid()),
    case when public.e_admin() then 'dono' else null end
  );
$$;

-- Igual ao `projeto_livre_para_fundar` do SetProd, e pelo mesmo motivo: alguém
-- precisa conseguir entrar como primeiro membro do próprio acervo, senão não há
-- como começar. Livre = sem membros E sem dados. As duas condições, porque só a
-- primeira deixaria um acervo abandonado ser adotado por qualquer um que
-- soubesse o id — e aí o inventário inteiro vaza.
create or replace function public.acervo_livre_para_fundar(p_acervo text)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select not exists (select 1 from public.acervo_membros   where acervo_id = p_acervo)
     and not exists (select 1 from public.registros_acervo where acervo_id = p_acervo);
$$;


-- ###########################################################################
-- PARTE 3 — POLÍTICAS
-- ###########################################################################

-- ---------------------------------------------------------------------------
-- 3.1 acervos
-- ---------------------------------------------------------------------------

alter table public.acervos enable row level security;

drop policy if exists "acervos: membros leem" on public.acervos;
create policy "acervos: membros leem" on public.acervos
  for select to authenticated using (public.e_membro_acervo(id));

drop policy if exists "acervos: qualquer um cria o seu" on public.acervos;
create policy "acervos: qualquer um cria o seu" on public.acervos
  for insert to authenticated with check (criado_por = auth.uid());

drop policy if exists "acervos: dono renomeia" on public.acervos;
create policy "acervos: dono renomeia" on public.acervos
  for update to authenticated
  using (public.papel_no_acervo(id) = 'dono')
  with check (public.papel_no_acervo(id) = 'dono');

-- ---------------------------------------------------------------------------
-- 3.2 acervo_membros
-- ---------------------------------------------------------------------------

alter table public.acervo_membros enable row level security;

drop policy if exists "membros do acervo: leitura" on public.acervo_membros;
create policy "membros do acervo: leitura" on public.acervo_membros
  for select to authenticated using (public.e_membro_acervo(acervo_id));

-- O primeiro membro entra sozinho; depois disso, só o dono adiciona gente.
drop policy if exists "membros do acervo: fundador entra sozinho" on public.acervo_membros;
create policy "membros do acervo: fundador entra sozinho" on public.acervo_membros
  for insert to authenticated
  with check (
    (usuario_id = auth.uid() and public.acervo_livre_para_fundar(acervo_id))
    or public.papel_no_acervo(acervo_id) = 'dono'
  );

drop policy if exists "membros do acervo: dono ajusta" on public.acervo_membros;
create policy "membros do acervo: dono ajusta" on public.acervo_membros
  for update to authenticated
  using (public.papel_no_acervo(acervo_id) = 'dono' or usuario_id = auth.uid())
  with check (public.papel_no_acervo(acervo_id) = 'dono' or usuario_id = auth.uid());

drop policy if exists "membros do acervo: sair ou ser removido" on public.acervo_membros;
create policy "membros do acervo: sair ou ser removido" on public.acervo_membros
  for delete to authenticated
  using (usuario_id = auth.uid() or public.papel_no_acervo(acervo_id) = 'dono');

-- ---------------------------------------------------------------------------
-- 3.3 registros_acervo
-- ---------------------------------------------------------------------------

alter table public.registros_acervo enable row level security;

drop policy if exists "registros do acervo: membros leem" on public.registros_acervo;
create policy "registros do acervo: membros leem" on public.registros_acervo
  for select to authenticated using (public.e_membro_acervo(acervo_id));

-- Leitor não escreve. É o papel de quem só precisa consultar o que existe —
-- produção olhando um relatório, por exemplo — e não deveria poder alterar
-- conferência nem cadastro.
drop policy if exists "registros do acervo: membros criam" on public.registros_acervo;
create policy "registros do acervo: membros criam" on public.registros_acervo
  for insert to authenticated
  with check (public.papel_no_acervo(acervo_id) in ('dono', 'operador'));

drop policy if exists "registros do acervo: membros alteram" on public.registros_acervo;
create policy "registros do acervo: membros alteram" on public.registros_acervo
  for update to authenticated
  using (public.papel_no_acervo(acervo_id) in ('dono', 'operador'))
  with check (public.papel_no_acervo(acervo_id) in ('dono', 'operador'));

-- Sem política de DELETE, de propósito: apagar é `deletado = true`. Uma
-- exclusão de verdade faria o registro ressuscitar no próximo pull de quem
-- estava offline.


-- ###########################################################################
-- PARTE 4 — GUARDA DO LWW
-- ###########################################################################
-- Impede que uma escrita mais VELHA sobrescreva uma mais nova. Sem isto, um
-- aparelho que estava offline sobe o estado antigo dele por cima do atual ao
-- reconectar — e a conferência de hoje volta a ser a de ontem.

create or replace function public.guarda_lww_acervo()
returns trigger
language plpgsql
as $$
begin
  if new.atualizado_em < old.atualizado_em then
    return old;
  end if;
  new.recebido_em := now();
  return new;
end;
$$;

drop trigger if exists trg_guarda_lww_acervo on public.registros_acervo;
create trigger trg_guarda_lww_acervo
  before update on public.registros_acervo
  for each row execute function public.guarda_lww_acervo();


-- ###########################################################################
-- DEPENDÊNCIA
-- ###########################################################################
-- `e_admin()` e `super_admins` vêm do multiusuario.sql do SetProd. Rodar aquele
-- arquivo primeiro. Reaproveitar em vez de duplicar é de propósito: dois
-- conceitos de super-admin no mesmo banco divergiriam no primeiro ajuste.
