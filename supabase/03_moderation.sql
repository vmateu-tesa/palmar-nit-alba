-- Elx al Cel — Moderación de palmeras ciudadanas
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de schema.sql y 02_votes.sql.
--
-- Antes: cualquiera podía publicar y aparecía al instante para todos.
-- Ahora: toda palmera nueva entra como 'pending' y SOLO es visible
-- públicamente cuando vos la pasás a 'approved' (desde Table Editor,
-- filtrando por status=pending). Así controlás que lo que se vea en el
-- mapa sea de verdad y no spam/broma.

alter table public.palmeras
  add column if not exists status text not null default 'pending'
  check (status in ('pending', 'approved', 'rejected'));

-- Reemplaza la política de lectura: el público solo ve las aprobadas.
drop policy if exists "palmeras_public_read" on public.palmeras;
create policy "palmeras_public_read_approved"
  on public.palmeras for select
  to anon
  using (status = 'approved');

-- La inserción sigue abierta (entra como 'pending' por el default de la
-- columna; el cliente no puede forzar otro status porque no hay policy
-- de update pública, y el insert no necesita mandarlo).
-- La policy "palmeras_public_insert" de schema.sql no cambia.

-- Para moderar: Supabase → Table Editor → palmeras → filtrar status =
-- 'pending' → cambiar la celda status a 'approved' (se publica) o
-- 'rejected' (queda oculta para siempre, no hace falta borrarla).
