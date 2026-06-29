# PalmAR — Nit de l'Albà d'Elx 🌴✨

> *Encén la teua palmera en el cel d'Elx.*

**PalmAR** (= **Palm**eral + **AR**) es una **PWA** para localizar, **apadrinar** y revivir en
**realidad aumentada** las *palmeres* de la **Nit de l'Albà** de Elche — la noche del 13 al 14 de
agosto, cuando el cielo de la ciudad se llena de cohetes que estallan en cascadas doradas con forma
de palmera en honor al Palmeral, Patrimonio de la Humanidad.

Funciona **sin instalar nada ni configurar claves** (modo demo con datos locales), y puede conectarse
a **Supabase** (login y datos reales) y **Stripe** (pago) cuando quieras.

---

## Índice

1. [Funcionalidades](#1-funcionalidades)
2. [Probarla ya (modo demo)](#2-probarla-ya-modo-demo)
3. [Cómo se usa](#3-cómo-se-usa)
4. [Arquitectura y stack](#4-arquitectura-y-stack)
5. [Modelo de datos](#5-modelo-de-datos)
6. [Activar Supabase (login + datos reales)](#6-activar-supabase-login--datos-reales)
7. [Activar Stripe (pago)](#7-activar-stripe-pago)
8. [Desplegar (HTTPS gratis)](#8-desplegar-https-gratis)
9. [Estructura de archivos](#9-estructura-de-archivos)
10. [Notas de mantenimiento](#10-notas-de-mantenimiento)
11. [Solución de problemas](#11-solución-de-problemas)
12. [Trabajar con el repositorio](#12-trabajar-con-el-repositorio)
13. [Legal y notas](#13-legal-y-notas)

---

## 1. Funcionalidades

### Capa pública (gratis, sin registro)
- **Mapa de Elche** (Leaflet + OpenStreetMap) con todas las palmeres.
- **Palmeres oficiales** del Ayuntamiento en lugares y horas reales (marcador ★ dorado):
  Basílica de Santa María (*Palmera de la Mare de Déu*, 00:00), Glorieta, Pont del Bimil·lenari,
  Parc Municipal, Pont Nou…
- **Ficha** de cada palmera: tipo, hora, nota, **descripción**, **dedicatoria**, **galería de fotos/vídeos**
  y comentarios.
- **Simulación** a pantalla completa: cielo nocturno con la **silueta de la Basílica** en sombra y las
  palmeres estallando (motor de partículas en canvas).
- **Modo AR**: cámara al cielo + **brújula GPS/giroscopio** que te guía con una flecha hacia la palmera
  más cercana (distancia y "la tens davant" al alinearte). Sin cámara → cielo estrellado.
- **Compartir** cualquier palmera en redes (**WhatsApp · Instagram · Facebook · X**) con **enlace directo**
  (deep-link) que abre esa palmera en el mapa.
- **Cuenta atrás** a la próxima Nit de l'Albà.
- **Bilingüe**: castellà / valencià, conmutable en caliente.

### Capa de usuario (registro)
- **Cuentas** bajo correo electrónico: registro, login, logout, sesión persistente.
- **Recuperación de contraseña** por correo (ver §6).
- **Perfil individual**: avatar (foto subible o inicial), nombre editable, correo, contador de palmeres,
  acceso a apadrinar, lista de *Les meues palmeres* (compartir / editar / eliminar) y cerrar sesión.
- **Apadrinar una palmera** (asistente de 3 pasos): elegir tipo en un carrusel animado, ubicar en el mapa,
  fijar hora, escribir nota/descripción/dedicatoria, **subir fotos y vídeos**, y publicar tras el pago.
- **Comentarios** (con **avatar** del autor) y **reacciones** (❤️ ✨ 👏 🔥).

---

## 2. Probarla ya (modo demo)

No necesita configurar nada: usa **datos locales** (`localStorage`) y **pago simulado**.

La PWA usa cámara y *service worker*, así que **sírvela por HTTP** (no abras `index.html` con doble clic):

```bash
# dentro de la carpeta del proyecto
python -m http.server 5173
# abre http://localhost:5173
```

> En el móvil, para la **cámara AR** y el **GPS** necesitas **HTTPS**. Lo más fácil es desplegarla (§8)
> o usar un túnel tipo `ngrok http 5173`.

**Datos de prueba**
- Regístrate con cualquier correo y contraseña (se guardan solo en tu navegador).
- Tarjeta de pago de prueba (Stripe test): `4242 4242 4242 4242`, fecha `12/34`, CVC `123`.

---

## 3. Cómo se usa

| Acción | Cómo |
|--------|------|
| **Ver palmeres** | Abre la app → mapa de Elche. Toca un marcador para la ficha. ★ = oficial. |
| **Simular el cielo** | Botón ✦ (FAB) o pestaña *Cel*. Desde una ficha, *Simular al cel*. |
| **Modo AR** | Pestaña *AR* o *Mode AR*. Da permiso de cámara y GPS; sigue la flecha. |
| **Registrarte** | Botón *Entrar* (arriba dcha.) → *Registra't*. |
| **Recuperar contraseña** | *Entrar* → *Has oblidat la contrasenya?* |
| **Tu perfil** | Toca tu nombre/avatar arriba a la derecha. |
| **Cambiar avatar** | En el perfil, toca el círculo del avatar (badge 📷). |
| **Apadrinar** | *Apadrina la teua palmera* (hero, perfil o pestaña +). |
| **Compartir** | Botón *Compartir* en la ficha, o ↗ en *Les meues palmeres*. |
| **Idioma** | Chip *VAL/CAS* arriba a la izquierda. |

---

## 4. Arquitectura y stack

| Capa | Tecnología | Por qué |
|------|------------|---------|
| Frontend | **PWA** vanilla (HTML5 + CSS + JS, sin framework, sin build) | Ligera, instalable, offline, despliegue trivial. |
| Mapa | **Leaflet** + OpenStreetMap / CartoDB | Gratis, sin API key. |
| Animaciones | **Canvas 2D** (motor de partículas propio) | Palmeres fluidas en móvil. |
| AR | `getUserMedia` + Canvas + `DeviceOrientation` + Geolocation | AR sin app nativa. |
| Auth + datos | **Supabase** (Postgres + Auth + RLS) — con **fallback local** | Backend real opcional; la demo va sin él. |
| Pago | **Stripe Checkout** vía **Supabase Edge Function** — con **pasarela simulada** | La clave secreta nunca toca el cliente. |
| Hosting | Vercel / Netlify / Cloudflare / GitHub Pages | HTTPS gratis (obligatorio para PWA, cámara, GPS y pago). |

**Patrón clave — doble backend transparente** (`js/data.js`): si en `js/config.js` hay claves de
Supabase, usa el backend real; si no, cae a `localStorage` con datos de ejemplo. El resto de la app
no sabe cuál está activo (misma API `DB.*`). Igual con `js/payments.js` (Stripe real o simulado).

Los módulos JS se cargan en orden de dependencia (`config → i18n → fireworks → map → ar → data →
payments → app`) y se comunican por `window.*` (`PalmarConfig`, `I18N`, `Fireworks`, `PalmarMap`,
`AR`, `DB`, `Payments`, `PalmarApp`).

---

## 5. Modelo de datos

Definido en [`supabase/schema.sql`](supabase/schema.sql) (con políticas **RLS** y datos de ejemplo).
En modo demo se replica en `localStorage`.

| Tabla | Campos | Acceso |
|-------|--------|--------|
| `profiles` | `id` (=auth.uid), `display_name`, **`avatar_url`**, `lang` | Dueño |
| `palmeras` | `id`, `owner_id`, `owner_name`, `name`, `family_note`, **`description`**, **`dedication`**, **`media`** (jsonb), `firework_type`, `lat`, `lng`, `ignite_at`, `color`, **`is_official`**, `is_paid`, `created_at` | **Lectura pública** · escritura dueño |
| `comments` | `id`, `palmera_id`, `author_id`, `author_name`, **`author_avatar`**, `body`, `created_at` | **Lectura pública** · escritura autenticada |
| `reactions` | `id`, `palmera_id`, `user_id`, `emoji` | **Lectura pública** · escritura autenticada |
| `orders` | `id`, `user_id`, `palmera_id`, `stripe_session_id`, `status`, `amount` | Dueño + Edge Function |

- **`media`**: array `[{ type: 'image'|'video', url }]`. Las imágenes se **comprimen** en cliente a
  JPEG ≤1280px; los vídeos se limitan a 3 MB. El avatar se comprime a 256px.
- **Nota de almacenamiento**: en esta versión los medios y avatares se guardan como **data URLs** (en
  `localStorage` en demo, o en las columnas correspondientes en Supabase). Para producción a gran escala
  conviene migrarlos a **Supabase Storage** y guardar solo la URL pública. *(mejora futura)*

---

## 6. Activar Supabase (login + datos reales)

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. **SQL Editor** → pega y ejecuta [`supabase/schema.sql`](supabase/schema.sql) (es idempotente:
   crea las tablas y, si ya existían, añade las columnas nuevas con `alter table ... add column if not exists`).
3. Copia en `js/config.js`:
   ```js
   SUPABASE_URL: "https://TUPROYECTO.supabase.co",
   SUPABASE_ANON_KEY: "eyJ...",   // Project Settings → API → anon public
   ```
4. **Authentication → Providers → Email**: actívalo (puedes desactivar *Confirm email* en pruebas).
5. **Authentication → URL Configuration → Redirect URLs**: añade la URL de tu app
   (p. ej. `https://tudominio.com/` y `http://localhost:5173/`). Es donde aterriza el enlace de
   recuperación de contraseña.

Con esto el login es real y las palmeres/comentarios se comparten entre usuarios.

### Registro y contraseñas
- **Registro** bajo correo electrónico (el correo es el usuario) + contraseña.
- **Recuperar contraseña**: en el modal de acceso, *"¿Olvidaste la contraseña?"* → Supabase envía un
  **correo con enlace** (`resetPasswordForEmail`); al volver a la app detecta el evento
  `PASSWORD_RECOVERY` y abre el formulario para fijar la nueva contraseña (`updateUser`).
- Personaliza el correo en Supabase → Authentication → **Email Templates → Reset Password**.
- En **modo demo** (sin claves) no hay servidor de correo: el flujo valida que el correo exista y te
  deja fijar la nueva contraseña en el acto, avisando de que en producción se enviaría un email.

### Perfil y avatar
- Nombre visible editable (`display_name` en `auth.user_metadata` + tabla `profiles`).
- Avatar subible (`avatar_url`). El comentario guarda una copia del avatar del autor (`author_avatar`)
  para mostrarlo junto al texto.

---

## 7. Activar Stripe (pago real en modo test)

1. Cuenta en [stripe.com](https://stripe.com) (modo **Test**).
2. Despliega las Edge Functions:
   ```bash
   supabase functions deploy create-checkout --no-verify-jwt
   supabase functions deploy stripe-webhook  --no-verify-jwt
   supabase secrets set STRIPE_SECRET_KEY=sk_test_...
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
   ```
   (`SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` ya están disponibles en las funciones.)
3. Stripe → Developers → Webhooks → endpoint
   `https://TUPROYECTO.supabase.co/functions/v1/stripe-webhook` con el evento
   `checkout.session.completed`.
4. En `js/config.js`:
   ```js
   STRIPE_PUBLISHABLE_KEY: "pk_test_...",
   CHECKOUT_FUNCTION_URL: "https://TUPROYECTO.supabase.co/functions/v1/create-checkout",
   ```

Si estas claves están vacías, la app usa automáticamente el **pago simulado** (imita el flujo con la
tarjeta de prueba para poder enseñarla al instante).

---

## 8. Desplegar (HTTPS gratis)

Es estática: vale cualquier hosting de archivos.

```bash
# Netlify
npx netlify deploy --prod --dir .
# Vercel
npx vercel --prod
```

**GitHub Pages**: Settings → Pages → *Deploy from a branch* → `main` / root. URL del tipo
`https://USUARIO.github.io/palmar-nit-alba/`.

> Recuerda añadir la URL pública a **Supabase Auth → Redirect URLs** (para la recuperación de contraseña)
> y, si usas Stripe, como dominio permitido.

---

## 9. Estructura de archivos

```
PalmAR/
├── index.html                  App principal (PWA)
├── manifest.webmanifest        Instalable (iconos, tema, standalone)
├── sw.js                       Service worker (offline, cache-first del app-shell)
├── css/
│   └── styles.css              Diseño nocturno
├── js/
│   ├── config.js               ← claves Supabase + Stripe (placeholders vacíos = demo)
│   ├── i18n.js                 Textos castellà / valencià
│   ├── fireworks.js            Motor de palmeres (canvas) + silueta Basílica + sonido
│   ├── map.js                  Mapa de Elche (Leaflet) + marcadores + selector de ubicación
│   ├── ar.js                   Modo AR (cámara + brújula GPS/giroscopio)
│   ├── data.js                 Capa de datos: Supabase | fallback local + seed + generador de infografías
│   ├── payments.js             Stripe Checkout | pago simulado
│   └── app.js                  Orquestación / UI (perfil, alta, compartir, comentarios…)
├── icons/                      Iconos PWA
├── supabase/
│   ├── schema.sql              Tablas + RLS + ejemplos (idempotente)
│   └── functions/
│       ├── create-checkout/    Edge Function: crea la sesión de Stripe
│       └── stripe-webhook/     Edge Function: confirma el pago y publica la palmera
├── README.md                   Este documento
├── PLAN-Y-ARQUITECTURA.md      Documento de diseño y arquitectura
└── CHANGELOG.md                Historial de versiones
```

---

## 10. Notas de mantenimiento

- **Versionado de assets**: `index.html` referencia los JS/CSS con `?v=N`. **Al cambiar un archivo
  estático, sube ese `N`** (y la versión del cache en `sw.js`, `palmar-vN`) para que los navegadores
  sirvan la versión nueva y no la cacheada. (Estado actual: `?v=10`, `palmar-v10`.)
- **Datos de ejemplo (demo)**: el *seed* de `localStorage` está versionado con la clave
  `palmar_seeded_vN` en `js/data.js`. Si cambias los datos de ejemplo, sube esa versión para regenerarlos.
- **Sin paso de build**: editas y recargas. No hay `npm install` ni bundler.

---

## 11. Solución de problemas

| Síntoma | Causa / solución |
|---------|------------------|
| No veo cambios tras editar | Caché del navegador. Sube `?v=N` en `index.html` y `palmar-vN` en `sw.js`, o recarga forzada. |
| La cámara AR no abre | Necesita **HTTPS** (o `localhost`). Despliega o usa un túnel. Da permiso de cámara. |
| La brújula AR no apunta | Necesita **GPS + giroscopio** (móvil real con permisos). En escritorio muestra el cielo libre. |
| No llega el correo de recuperación | Revisa **Redirect URLs** y la plantilla de correo en Supabase. En demo no hay correo (se restablece en el acto). |
| El pago no redirige | Faltan claves de Stripe → usa el pago simulado. Para real, revisa §7. |
| Las palmeres no aparecen | Mira la consola; en demo se regeneran solas al cargar. |

---

## 12. Trabajar con el repositorio

```bash
git clone https://github.com/vmateu-tesa/palmar-nit-alba.git
cd palmar-nit-alba
python -m http.server 5173   # http://localhost:5173

# guardar cambios
git add -A
git commit -m "describe tu cambio"
git push
```

> `js/config.js` se versiona **con placeholders vacíos**: no subas claves reales. Para no exponerlas,
> mantén tus claves en una copia local no commiteada o en variables del hosting.

---

## 13. Legal y notas

- Experiencia **simbólica y digital**: PalmAR **no** gestiona ni autoriza pirotecnia real.
- Antes de producción: **política de privacidad / cookies (RGPD)**, moderación de comentarios,
  migrar medios a Supabase Storage y pasar Stripe a modo *live*.
- Solo se guardan datos mínimos (correo, nombre visible, avatar opcional).
- *Visca Elx i la Mare de Déu de l'Assumpció.* 🌴
```
