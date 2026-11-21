-- =====================================================================
-- RPG Manager · V3 · Passo 1: tabelas e regras de segurança
--
-- Como usar: no Supabase, abra "SQL Editor", cole este arquivo inteiro
-- e clique em "Run". Pode rodar de novo sem problema: ele não duplica nada.
--
-- Ideia geral:
--   campanhas       → uma linha por campanha (nome, capa, código, dono)
--   dados_campanha  → os dados de cada campanha, um por "tipo"
--                     (personagens, batalha, mapa, imagens, anuncio),
--                     igual ao Armazenamento.ler/salvar do armazenamento.js
--   jogadores       → quem entrou em qual campanha pelo código
--
-- Segurança (RLS = "Row Level Security", regras por linha):
--   - só o MESTRE (dono) cria e edita a campanha e os dados dela;
--   - quem entrou com o código só LÊ;
--   - quem não entrou não vê nada.
-- =====================================================================


-- ---------- Código da campanha ----------
-- 6 letras/números, sem os que se confundem (0/O, 1/I/L). Ex.: K7P2QX
create or replace function public.gerar_codigo()
returns text
language sql
volatile
as $$
    select string_agg(
        substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 1 + floor(random() * 31)::int, 1),
        ''
    )
    from generate_series(1, 6);
$$;


-- ---------- Tabelas ----------
create table if not exists public.campanhas (
    id         uuid primary key default gen_random_uuid(),
    dono       uuid not null default auth.uid() references auth.users(id) on delete cascade,
    nome       text not null,
    imagem     text,                                         -- capa que aparece na roda
    codigo     text not null unique default public.gerar_codigo(),
    criada_em  timestamptz not null default now()
);

create table if not exists public.dados_campanha (
    campanha_id    uuid not null references public.campanhas(id) on delete cascade,
    tipo           text not null check (tipo in ('personagens', 'batalha', 'mapa', 'imagens', 'anuncio')),
    valor          jsonb,
    atualizado_em  timestamptz not null default now(),
    primary key (campanha_id, tipo)
);

create table if not exists public.jogadores (
    campanha_id  uuid not null references public.campanhas(id) on delete cascade,
    usuario      uuid not null default auth.uid() references auth.users(id) on delete cascade,
    entrou_em    timestamptz not null default now(),
    primary key (campanha_id, usuario)
);


-- ---------- Funções de apoio para as regras ----------
-- "security definer" roda com permissão total, mas só responde sim/não.
-- Assim as regras de uma tabela podem consultar a outra sem dar loop.

create or replace function public.eh_dono(p_campanha uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1 from campanhas
        where id = p_campanha and dono = auth.uid()
    );
$$;

create or replace function public.pode_ver(p_campanha uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select public.eh_dono(p_campanha)
        or exists (
            select 1 from jogadores
            where campanha_id = p_campanha and usuario = auth.uid()
        );
$$;

-- O jogador entra digitando o código. Esta é a ÚNICA forma de alguém
-- virar jogador de uma campanha (ninguém consegue se inserir na mão).
create or replace function public.entrar_com_codigo(p_codigo text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_campanha uuid;
begin
    if auth.uid() is null then
        raise exception 'Precisa estar conectado para entrar';
    end if;

    select id into v_campanha
    from campanhas
    where codigo = upper(trim(p_codigo));

    if v_campanha is null then
        raise exception 'Código não encontrado';
    end if;

    insert into jogadores (campanha_id, usuario)
    values (v_campanha, auth.uid())
    on conflict do nothing;

    return v_campanha;
end;
$$;


-- ---------- Ligar a segurança por linha ----------
alter table public.campanhas      enable row level security;
alter table public.dados_campanha enable row level security;
alter table public.jogadores      enable row level security;


-- ---------- Regras: campanhas ----------
-- "dono = auth.uid()" vem primeiro de propósito: ao criar uma campanha,
-- a pode_ver() ainda não enxerga a linha nova (veja 02-corrige-ver-campanha.sql)
drop policy if exists "ver campanha" on public.campanhas;
create policy "ver campanha" on public.campanhas
    for select to authenticated
    using (dono = auth.uid() or public.pode_ver(id));

-- Só conta de verdade (e-mail e senha) cria campanha. Os jogadores
-- entram como "anônimos" e não podem criar.
drop policy if exists "mestre cria campanha" on public.campanhas;
create policy "mestre cria campanha" on public.campanhas
    for insert to authenticated
    with check (
        dono = auth.uid()
        and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
    );

drop policy if exists "mestre edita campanha" on public.campanhas;
create policy "mestre edita campanha" on public.campanhas
    for update to authenticated
    using (dono = auth.uid())
    with check (dono = auth.uid());

drop policy if exists "mestre apaga campanha" on public.campanhas;
create policy "mestre apaga campanha" on public.campanhas
    for delete to authenticated
    using (dono = auth.uid());


-- ---------- Regras: dados da campanha ----------
drop policy if exists "ver dados" on public.dados_campanha;
create policy "ver dados" on public.dados_campanha
    for select to authenticated
    using (public.pode_ver(campanha_id));

drop policy if exists "mestre grava dados" on public.dados_campanha;
create policy "mestre grava dados" on public.dados_campanha
    for insert to authenticated
    with check (public.eh_dono(campanha_id));

drop policy if exists "mestre atualiza dados" on public.dados_campanha;
create policy "mestre atualiza dados" on public.dados_campanha
    for update to authenticated
    using (public.eh_dono(campanha_id))
    with check (public.eh_dono(campanha_id));

drop policy if exists "mestre apaga dados" on public.dados_campanha;
create policy "mestre apaga dados" on public.dados_campanha
    for delete to authenticated
    using (public.eh_dono(campanha_id));


-- ---------- Regras: jogadores ----------
-- O jogador vê a própria entrada; o mestre vê quem entrou na campanha dele.
drop policy if exists "ver jogadores" on public.jogadores;
create policy "ver jogadores" on public.jogadores
    for select to authenticated
    using (usuario = auth.uid() or public.eh_dono(campanha_id));

-- O jogador pode sair; o mestre pode tirar alguém.
drop policy if exists "sair ou tirar jogador" on public.jogadores;
create policy "sair ou tirar jogador" on public.jogadores
    for delete to authenticated
    using (usuario = auth.uid() or public.eh_dono(campanha_id));


-- ---------- Permissões (quem pode usar cada tabela pela API) ----------
-- "authenticated" = qualquer um conectado (mestre ou jogador anônimo).
-- As regras acima decidem O QUE cada um vê e muda.
-- "anon" (não conectado) não recebe nada.
grant select, insert, update, delete on public.campanhas      to authenticated;
grant select, insert, update, delete on public.dados_campanha to authenticated;
grant select, delete                 on public.jogadores      to authenticated;

revoke all on function public.entrar_com_codigo(text) from public, anon;
grant execute on function public.entrar_com_codigo(text) to authenticated;


-- ---------- Tempo real ----------
-- Avisa na hora quem estiver olhando quando os dados mudarem
-- (o mestre move um token → os jogadores veem).
do $$
begin
    alter publication supabase_realtime add table public.dados_campanha;
exception
    when duplicate_object then null;  -- já estava ligado
end $$;
