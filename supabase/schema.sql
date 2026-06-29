-- =====================================================================
-- PalmAR — Esquema de base de datos (Supabase / PostgreSQL)
-- Pégalo en el editor SQL de Supabase y ejecútalo.
-- =====================================================================
create extension if not exists "pgcrypto";

-- ---------- Tablas ----------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url   text,
  lang         text default 'va',
  created_at   timestamptz default now()
);
alter table public.profiles add column if not exists avatar_url text;

create table if not exists public.palmeras (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid references auth.users(id) on delete set null,
  owner_name    text,
  name          text not null,
  family_note   text,
  description   text,
  dedication    text,
  media         jsonb default '[]'::jsonb,   -- [{type:'image'|'video', url}]
  firework_type text not null default 'palmera_or',
  lat           double precision,
  lng           double precision,
  ignite_at     text,
  color         text,
  is_official   boolean default false,
  is_paid       boolean default false,
  created_at    timestamptz default now()
);

-- Si la tabla ya existía, añade las columnas nuevas (idempotente):
alter table public.palmeras add column if not exists description text;
alter table public.palmeras add column if not exists dedication  text;
alter table public.palmeras add column if not exists media       jsonb default '[]'::jsonb;
alter table public.palmeras add column if not exists is_official boolean default false;

create table if not exists public.comments (
  id            uuid primary key default gen_random_uuid(),
  palmera_id    uuid references public.palmeras(id) on delete cascade,
  author_id     uuid references auth.users(id) on delete set null,
  author_name   text,
  author_avatar text,
  body          text not null,
  created_at    timestamptz default now()
);
alter table public.comments add column if not exists author_avatar text;

create table if not exists public.reactions (
  id         uuid primary key default gen_random_uuid(),
  palmera_id uuid references public.palmeras(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete cascade,
  emoji      text not null,
  created_at timestamptz default now(),
  unique (palmera_id, user_id, emoji)
);

create table if not exists public.orders (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users(id) on delete set null,
  palmera_id        uuid references public.palmeras(id) on delete cascade,
  stripe_session_id text,
  status            text default 'pending',
  amount            integer,
  created_at        timestamptz default now()
);

-- ---------- Row Level Security ----------
alter table public.profiles  enable row level security;
alter table public.palmeras  enable row level security;
alter table public.comments  enable row level security;
alter table public.reactions enable row level security;
alter table public.orders    enable row level security;

-- palmeras: lectura pública de las pagadas; el dueño gestiona las suyas
drop policy if exists palmeras_public_read on public.palmeras;
create policy palmeras_public_read on public.palmeras for select using (is_paid = true);
drop policy if exists palmeras_owner_all on public.palmeras;
create policy palmeras_owner_all on public.palmeras for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- comments: lectura pública, escritura del autor autenticado
drop policy if exists comments_read on public.comments;
create policy comments_read on public.comments for select using (true);
drop policy if exists comments_insert on public.comments;
create policy comments_insert on public.comments for insert with check (auth.uid() = author_id);
drop policy if exists comments_delete on public.comments;
create policy comments_delete on public.comments for delete using (auth.uid() = author_id);

-- reactions: lectura pública, escritura del usuario autenticado
drop policy if exists reactions_read on public.reactions;
create policy reactions_read on public.reactions for select using (true);
drop policy if exists reactions_write on public.reactions;
create policy reactions_write on public.reactions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- orders: solo el dueño los ve (la Edge Function usa service_role y omite RLS)
drop policy if exists orders_owner on public.orders;
create policy orders_owner on public.orders for select using (auth.uid() = user_id);

-- profiles
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select using (true);
drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles for all
  using (auth.uid() = id) with check (auth.uid() = id);

-- ---------- Crear perfil automáticamente al registrarse ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Datos de ejemplo ----------
-- Palmeres OFICIALS de l'Ajuntament d'Elx (llocs i hores reals)
insert into public.palmeras (owner_name,name,firework_type,lat,lng,ignite_at,family_note,description,dedication,color,is_official,is_paid) values
 ('Ajuntament d''Elx','Palmera de la Mare de Déu','palmera_verge',38.2659,-0.6986,'00:00','La gran palmera blanca llançada des del campanar de la Basílica de Santa María.','Més de 1.300 coets ascendeixen verticalment fins als 300 metres des de la torre de la Basílica, il·luminant tot Elx en honor a la Mare de Déu de l''Assumpció.','A la Mare de Déu de l''Assumpció, patrona d''Elx.','#fff3c4',true,true),
 ('Ajuntament d''Elx','Glorieta · Plaça de Baix','palmera_or',38.2668,-0.6996,'23:15','Inici de la Nit de l''Albà al cor de la ciutat.','Una de les primeres palmeres en encendre''s, al costat de l''Ajuntament.',null,'#ffce5c',true,true),
 ('Ajuntament d''Elx','Pont del Bimil·lenari','palmera_colors',38.2680,-0.7012,'23:30','Des d''ací es veuen totes les palmeres de la ciutat.','El millor mirador de la Nit de l''Albà.',null,'#9d6bff',true,true),
 ('Ajuntament d''Elx','Parc Municipal','palmera_plata',38.2708,-0.7000,'23:20','Palmeres sobre el Palmeral, Patrimoni de la Humanitat.',null,null,'#bfe0ff',true,true),
 ('Ajuntament d''Elx','Pont Nou','carcassa',38.2650,-0.6975,'23:40','Carcasses de color sobre el llit del Vinalopó.',null,null,'#ff6b6b',true,true);
-- Palmeres de famílies (exemple)
insert into public.palmeras (owner_name,name,firework_type,lat,lng,ignite_at,family_note,color,is_paid) values
 ('Família Mas','Família Mas','palmera_or',38.2682,-0.7126,'23:30','En memòria de l''iaio Vicent, que mai es perdia una Albà.','#ffce5c',true),
 ('Penya El Tro','Penya El Tro','carcassa',38.2655,-0.7050,'23:45','Visca Elx i la Mare de Déu de l''Assumpció!','#ff6b6b',true),
 ('Els Quatre Cantons','Els Quatre Cantons','palmera_colors',38.2731,-0.7008,'00:00','Per molts anys, Marina! La teua primera Albà.','#9d6bff',true),
 ('Casa Antón','Casa Antón','palmera_plata',38.2620,-0.7180,'23:15','La nostra primera Albà junts.','#bfe0ff',true),
 ('Comparsa La Vila','Comparsa La Vila','palmera_verge',38.2700,-0.6990,'00:30','Per tots els que ja no hi són però seguixen mirant el cel.','#fff3c4',true);
