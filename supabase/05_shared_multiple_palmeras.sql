-- Elx al Cel — palmeras compartidas, visibles al instante y sin limite por usuario.
-- Migracion idempotente: se puede ejecutar de nuevo sin duplicar politicas.

begin;

create table if not exists public.palmeras (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  dedication text not null check (char_length(dedication) between 1 and 120),
  time text not null default '23:30',
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  style text not null default 'dorada',
  status text not null default 'approved',
  created_at timestamptz not null default now()
);

alter table public.palmeras add column if not exists email text;
alter table public.palmeras add column if not exists status text not null default 'approved';
alter table public.palmeras alter column status set default 'approved';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.palmeras'::regclass
      and conname = 'palmeras_email_format'
  ) then
    alter table public.palmeras add constraint palmeras_email_format
      check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');
  end if;
end $$;

-- Publica las altas antiguas que quedaron pendientes por la politica anterior.
update public.palmeras set status = 'approved' where status = 'pending';

alter table public.palmeras enable row level security;

drop policy if exists "palmeras_public_read_approved" on public.palmeras;
drop policy if exists "palmeras_public_read" on public.palmeras;
create policy "palmeras_public_read"
  on public.palmeras for select
  to anon, authenticated
  using (status = 'approved');

drop policy if exists "palmeras_public_insert" on public.palmeras;
create policy "palmeras_public_insert"
  on public.palmeras for insert
  to anon, authenticated
  with check (
    status = 'approved'
    and char_length(dedication) between 1 and 120
    and lat between -90 and 90
    and lng between -180 and 180
    and email is not null
    and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  );

-- PostgREST solo puede leer campos publicos; el email queda oculto.
revoke select on public.palmeras from anon, authenticated;
grant select (id, name, dedication, time, lat, lng, style, created_at)
  on public.palmeras to anon, authenticated;
revoke insert on public.palmeras from anon, authenticated;
grant insert (name, email, dedication, time, lat, lng, style)
  on public.palmeras to anon, authenticated;

create index if not exists palmeras_public_created_idx
  on public.palmeras (status, created_at desc);

-- Permite que clientes futuros usen Supabase Realtime; el cliente actual
-- tambien refresca cada 10 s como respaldo para redes moviles inestables.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'palmeras'
     ) then
    alter publication supabase_realtime add table public.palmeras;
  end if;
end $$;

notify pgrst, 'reload schema';
commit;
