-- Elx al Cel — Votos de palmeras ciudadanas
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de schema.sql.
-- Cada dispositivo (voter_id generado en el navegador, sin login) puede
-- votar una vez por palmera. La restricción "un voto por dispositivo y
-- palmera" la impone la clave única (palmera_id, voter_id).

create table if not exists public.palmera_votes (
  id uuid primary key default gen_random_uuid(),
  palmera_id uuid not null references public.palmeras(id) on delete cascade,
  voter_id uuid not null,
  created_at timestamptz not null default now(),
  unique (palmera_id, voter_id)
);

alter table public.palmera_votes enable row level security;

-- Cualquiera puede leer los votos (para contar y saber si ya votó).
create policy "votes_public_read"
  on public.palmera_votes for select
  to anon
  using (true);

-- Cualquiera puede votar una vez por palmera (la unicidad la garantiza
-- la restricción UNIQUE de la tabla, no hace falta lógica extra aquí).
create policy "votes_public_insert"
  on public.palmera_votes for insert
  to anon
  with check (true);

-- Sin update/delete público: un voto no se puede retirar desde el cliente
-- (evita manipulación fácil del conteo). Se puede borrar a mano si hace falta.

-- Vista con el conteo de votos por palmera, para no tener que traer todas
-- las filas de palmera_votes al cliente solo para contar.
create or replace view public.palmera_vote_counts as
  select palmera_id, count(*)::int as votes
  from public.palmera_votes
  group by palmera_id;

grant select on public.palmera_vote_counts to anon;
