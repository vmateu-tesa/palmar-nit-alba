-- Elx al Cel — Palmeras ciudadanas públicas
-- Ejecutar en el SQL Editor de Supabase (proyecto nuevo).

create table if not exists public.palmeras (
  id uuid primary key default gen_random_uuid(),
  name text,
  dedication text not null check (char_length(dedication) between 1 and 120),
  time text not null default '23:30',
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  style text not null default 'dorada',
  created_at timestamptz not null default now()
);

-- Evita que se acumule spam sin límite: cada palmera pública queda visible
-- para siempre salvo que la borres a mano desde el panel de Supabase.
alter table public.palmeras enable row level security;

-- Cualquiera puede leer el listado público (así se pintan en el mapa de todos).
create policy "palmeras_public_read"
  on public.palmeras for select
  to anon
  using (true);

-- Cualquiera puede añadir su palmera (sin login, coherente con la app actual).
create policy "palmeras_public_insert"
  on public.palmeras for insert
  to anon
  with check (
    char_length(dedication) between 1 and 120
    and lat between -90 and 90
    and lng between -180 and 180
  );

-- Nota: no se permite update/delete público a propósito (evita que cualquiera
-- borre palmeras ajenas). Si un usuario quiere borrar la suya, por ahora
-- tendría que pedírtelo a vos y lo borrás desde Table Editor en Supabase.
