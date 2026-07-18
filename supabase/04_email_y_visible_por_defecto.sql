-- Elx al Cel — Email obligatorio + visibilidad inmediata (moderación posterior)
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de schema.sql, 02_votes.sql y
-- 03_moderation.sql.
--
-- Cambia el modelo: ya NO hace falta aprobar antes de publicar. Toda palmera
-- nueva es visible al instante (status default 'approved'). El "admin" sos
-- vos, ya logueado en el dashboard de Supabase: para moderar después, andá a
-- Table Editor → palmeras y:
--   · Borrar la fila → desaparece para siempre.
--   · Cambiar status a 'rejected' → se oculta sin borrar el registro (útil
--     para guardar evidencia de abuso sin que se vea públicamente).

-- 1) Visible por defecto en vez de pendiente de revisión.
alter table public.palmeras alter column status set default 'approved';

-- 2) Email de quien crea la palmera (para poder contactar en caso de abuso).
--    Nullable a nivel de columna para no romper filas viejas sin email;
--    lo exigimos de verdad en la política de inserción (paso 4).
alter table public.palmeras add column if not exists email text;
alter table public.palmeras add constraint palmeras_email_format
  check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');

-- 3) Lectura pública: solo lo que siga en 'approved' (así el admin puede
--    "borrar" ocultando, sin tocar la tabla, con status='rejected').
drop policy if exists "palmeras_public_read_approved" on public.palmeras;
drop policy if exists "palmeras_public_read" on public.palmeras;
create policy "palmeras_public_read"
  on public.palmeras for select
  to anon
  using (status = 'approved');

-- 4) Inserción pública: ahora exige un email con formato válido.
drop policy if exists "palmeras_public_insert" on public.palmeras;
create policy "palmeras_public_insert"
  on public.palmeras for insert
  to anon
  with check (
    char_length(dedication) between 1 and 120
    and lat between -90 and 90
    and lng between -180 and 180
    and email is not null
    and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  );

-- 5) El email NUNCA se expone públicamente, aunque alguien pida
--    select=email directo a la API (es dato de contacto, no para mostrar
--    en el mapa). Solo vos lo ves, desde Table Editor con tu propia sesión.
revoke select (email) on public.palmeras from anon;
