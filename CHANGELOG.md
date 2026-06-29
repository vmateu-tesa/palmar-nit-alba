# Changelog — PalmAR

Todas las versiones notables del proyecto. Las versiones se corresponden con el parámetro `?v=N` de los
assets en `index.html` y la versión de caché `palmar-vN` del service worker.

El formato sigue, de forma ligera, [Keep a Changelog](https://keepachangelog.com/).

## [v10] — 2026-06-29
### Añadido
- **Avatar en los comentarios**: cada comentario guarda el avatar del autor (`author_avatar`) y se
  muestra junto al texto; los autores sin foto muestran su inicial.

## [v9] — 2026-06-29
### Añadido
- **Avatar de usuario subible**: foto de perfil (comprimida a 256px) en el perfil y como miniatura
  junto al nombre en el botón de cuenta. Campo `avatar_url` en `profiles` (Supabase) y en el usuario local.

## [v8] — 2026-06-29
### Añadido
- **Perfil individual** (sustituye al menú de cuenta): avatar con inicial, nombre editable, correo,
  contador de palmeres, botón *Apadrina una palmera*, lista *Les meues palmeres* (compartir/editar/eliminar)
  y cerrar sesión. `DB.updateProfile()`.

## [v7] — 2026-06-29
### Añadido
- **Silueta de la Basílica de Santa María** (en sombra) como fondo de las infografías de palmeres
  (SVG) y del cielo del canvas de los fuegos (simulación, carrusel, previews).

## [v6] — 2026-06-29
### Añadido
- **Servicio de cuentas completo**: registro/login bajo correo, y **recuperación de contraseña**
  (Supabase `resetPasswordForEmail` + evento `PASSWORD_RECOVERY`; en demo, restablecimiento en el acto).
- Modal de acceso con 4 estados: entrar / registro / recuperar / nueva contraseña.

## [v5] — 2026-06-29
### Cambiado
- Panel de compartir: **Instagram** en lugar de Telegram (copia el enlace + abre Instagram, ya que no
  admite compartir por URL).

## [v3–v4] — 2026-06-29
### Añadido
- **Fotos/vídeos, descripción y dedicatoria** en las palmeres (alta, ficha con galería y visor, edición).
- **Compartir en redes** (WhatsApp/Facebook/X + copiar enlace) y **deep-link** `?palmera=ID`.
- **Modo AR con brújula**: GPS + giroscopio + flecha hacia la palmera más cercana con distancia.
- **Palmeres oficiales** del Ayuntamiento en lugares y horas reales (marcador ★).
- **Infografías** SVG de ejemplo para las palmeres oficiales.
- Versionado de assets (`?v=N`) para evitar problemas de caché.

## [v1–v2] — Prototipo inicial
### Añadido
- PWA bilingüe (castellà/valencià) instalable y offline (service worker).
- Mapa de Elche (Leaflet) con palmeres y fichas.
- Motor de palmeres en canvas (carrusel, simulación, modo AR con cámara).
- Comentarios y reacciones.
- Capa de datos con doble backend (Supabase | `localStorage`) y pago (Stripe | simulado).
- `schema.sql` con tablas + RLS y Edge Functions de Stripe (checkout + webhook).
