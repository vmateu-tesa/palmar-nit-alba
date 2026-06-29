# PalmAR — Plan y Arquitectura

> **PalmAR** · *Encén la teua palmera en el cel d'Elx*
> App PWA para localizar, registrar y revivir en realidad aumentada las **palmeres** de la **Nit de l'Albà** de Elche.

---

## 1. Concepto

La **Nit de l'Albà** (noche del 13 al 14 de agosto, víspera de la Asunción) llena el cielo de Elche de miles de **palmeres**: cohetes que estallan en lo alto y dejan caer una cascada de luz dorada con forma de palmera, en honor al Palmeral (Patrimonio de la Humanidad). La noche culmina con la gran **Palmera de la Mare de Déu**, lanzada desde la Basílica de Santa María.

**PalmAR** convierte esa tradición en una experiencia digital:

- **Nombre**: *PalmAR* = **Palm**eral + **AR** (realidad aumentada). Se lee como "palmar".
- **Idea fuerza**: cada familia puede **apadrinar su propia palmera** en el cielo virtual de Elche, situarla en el mapa, ponerle una **nota familiar**, elegir su animación y **reconocerla** la noche de l'Albà apuntando con la cámara.
- **Doble capa**: una capa **pública y gratuita** (ver todas las palmeres, sin registro) y una capa **premium de pago** (registrar la tuya, personalizarla, comentar).

---

## 2. Funcionalidades

### Capa pública (gratis, sin login)

- Mapa de Elche con **todas las palmeres** registradas.
- Ficha de cada palmera: tipo, hora de encendido, nota familiar y comentarios.
- **Simulación** de cualquier palmera sobre el plano.
- **Modo AR**: apuntar al cielo con la cámara y ver palmeres simuladas.
- Cuenta atrás para la próxima Nit de l'Albà.
- Selector de idioma **castellano / valencià**.

### Capa premium (login + pago único)

- **Registrar tu palmera**: ubicación en el mapa, **hora de encendido**, **tipo** elegido en un carrusel de animaciones, **nota familiar** (dedicatoria).
- **Pago** mediante Stripe (Checkout) antes de publicarla.
- **Simulación personalizada** sobre el plano de Elche tras el alta.
- **Interacción social**: comentar y reaccionar a las palmeres de otras familias.
- Gestión de tus palmeres (editar, eliminar).

---

## 3. Stack tecnológico

| Capa | Tecnología | Por qué |
|------|------------|---------|
| Frontend | **PWA** (HTML5 + CSS + JavaScript vanilla, sin framework) | Ligera, instalable, offline, sin build. Fácil de mantener y desplegar. |
| Mapa | **Leaflet** + OpenStreetMap | Gratuito, sin API key, ideal para Elche. |
| Animaciones | **Canvas 2D** (motor de partículas propio) | Palmeres auténticas y fluidas en móvil. |
| AR | **WebRTC** `getUserMedia` + Canvas overlay + `DeviceOrientation` | AR sin app nativa, funciona en el navegador del móvil. |
| Auth + datos | **Supabase** (Postgres + Auth + RLS) | Backend gestionado, login real, datos compartidos, fila por seguridad. |
| Pago | **Stripe Checkout** vía **Supabase Edge Function** | Cobro seguro (la clave secreta nunca toca el cliente). Modo test para desarrollo. |
| Hosting | Vercel / Netlify / Cloudflare Pages | HTTPS gratuito (obligatorio para PWA, cámara y pago). |

> **Por qué sin framework**: una PWA estática es trivial de desplegar en cualquier CDN, arranca al instante, y el código es 100% legible y portable. Si más adelante crece, se puede migrar a React/Svelte sin rehacer el backend.

---

## 4. Arquitectura

```mermaid
flowchart TD
    subgraph Cliente["📱 PWA (navegador del móvil)"]
        UI[Interfaz bilingüe]
        FW[Motor de palmeres - Canvas]
        MAP[Mapa Leaflet]
        AR[Modo AR - cámara]
        SW[Service Worker - offline]
    end

    subgraph Supabase["☁️ Supabase"]
        AUTH[Auth - email/OAuth]
        DB[(Postgres + RLS)]
        EF[Edge Function - create-checkout]
    end

    STRIPE[💳 Stripe Checkout]

    UI --> AUTH
    UI --> DB
    MAP --> DB
    UI -->|Registrar palmera| EF
    EF -->|crea sesión| STRIPE
    STRIPE -->|webhook pago OK| EF
    EF -->|marca pagada| DB
    SW -.cachea.-> UI
```

**Flujo resumido**: el cliente lee palmeres directamente de Postgres (con políticas RLS que permiten lectura pública). Para registrar una palmera de pago, el cliente llama a una Edge Function que crea la sesión de Stripe; tras el pago, un webhook confirma y publica la palmera.

---

## 5. Modelo de datos (Supabase / Postgres)

| Tabla | Campos clave | Acceso |
|-------|--------------|--------|
| `profiles` | `id` (=auth.uid), `display_name`, `lang` | Dueño |
| `palmeras` | `id`, `owner_id`, `name`, `family_note`, `firework_type`, `lat`, `lng`, `ignite_at`, `color`, `is_paid`, `created_at` | **Lectura pública** · escritura dueño |
| `comments` | `id`, `palmera_id`, `author_id`, `author_name`, `body`, `created_at` | **Lectura pública** · escritura autenticada |
| `reactions` | `id`, `palmera_id`, `user_id`, `emoji` | **Lectura pública** · escritura autenticada |
| `orders` | `id`, `user_id`, `palmera_id`, `stripe_session_id`, `status`, `amount` | Dueño + Edge Function |

La SQL completa con `CREATE TABLE`, políticas **RLS** y datos de ejemplo está en `supabase/schema.sql`.

---

## 6. Flujos de usuario

**A. Visitante (gratis)**
Abre la app → ve el mapa de Elche con palmeres → toca una → ve ficha, nota y comentarios → pulsa *Simular* o *Modo AR* → disfruta. Sin registro.

**B. Registrar palmera (premium)**
Login → *Añadir palmera* → elige tipo en el **carrusel** → marca ubicación en el mapa → fija **hora de encendido** → escribe **nota familiar** → **pago Stripe** → al confirmar, se publica y se lanza la **simulación** sobre el plano.

**C. Modo AR**
*Modo AR* → permiso de cámara → apunta al cielo → toca para lanzar palmeres → giroscopio ancla la escena. Sin cámara, fondo de cielo estrellado.

---

## 7. Pago (Stripe, modo test)

1. Cliente pulsa *Pagar y publicar*.
2. Llama a la Edge Function `create-checkout` (lleva `palmera_id` y el JWT de Supabase).
3. La función crea una **Checkout Session** con la clave **secreta** de Stripe (solo en el servidor) y devuelve la URL.
4. El cliente redirige a Stripe; en modo test se usa la tarjeta `4242 4242 4242 4242`.
5. Stripe llama al **webhook** → la función marca `orders.status = 'paid'` y `palmeras.is_paid = true`.
6. El cliente vuelve a la app y ve su palmera publicada.

> **Demo sin claves**: si no hay claves de Stripe configuradas, la app usa una **pasarela simulada** que imita el flujo (tarjeta de prueba, confirmación) para poder enseñarla al instante.

---

## 8. PWA y offline

- `manifest.webmanifest`: nombre, iconos, `display: standalone`, color de tema nocturno → **instalable** en la pantalla de inicio.
- `sw.js`: cachea el *app-shell* (HTML, CSS, JS, Leaflet) con estrategia *cache-first*; los datos van *network-first*.
- Funciona **offline** para ver la última versión cacheada y las animaciones.

---

## 9. Estructura de archivos

```
APP Fuegos artificiales/
├── PLAN-Y-ARQUITECTURA.md      ← este documento
├── README.md                   ← puesta en marcha
├── index.html                  ← app principal
├── manifest.webmanifest
├── sw.js                       ← service worker (offline)
├── css/
│   └── styles.css              ← diseño nocturno
├── js/
│   ├── config.js               ← claves Supabase + Stripe (placeholders)
│   ├── i18n.js                 ← textos castellano/valencià
│   ├── fireworks.js            ← motor de palmeres (canvas)
│   ├── map.js                  ← mapa Leaflet
│   ├── ar.js                   ← modo AR cámara
│   ├── data.js                 ← Supabase + fallback local
│   ├── payments.js             ← Stripe + fallback simulado
│   └── app.js                  ← orquestación / UI
├── icons/                      ← iconos PWA (192, 512, maskable)
└── supabase/
    ├── schema.sql              ← tablas + RLS + ejemplos
    └── functions/
        └── create-checkout/
            └── index.ts        ← Edge Function de Stripe
```

---

## 10. Roadmap por fases

| Fase | Entregable | Estado |
|------|-----------|--------|
| **0 — Prototipo** | PWA funcional con datos locales + pago simulado | ✅ Este entregable |
| **1 — Backend real** | Conectar Supabase (auth + datos compartidos) | Claves en `config.js` + `schema.sql` listo |
| **2 — Pago real** | Stripe modo test con Edge Function | Código listo, requiere cuenta Stripe |
| **3 — Producción** | Dominio, HTTPS, webhook, modo live de Stripe | Pendiente |
| **4 — Crecimiento** | Notificaciones push la noche de l'Albà, ranking, fotos reales | Futuro |

---

## 11. Costes estimados (orientativos)

| Servicio | Plan inicial | Coste |
|----------|-------------|-------|
| Supabase | Free tier (hasta 50k usuarios auth, 500 MB DB) | **0 €** |
| Stripe | Sin cuota fija | ~**1,5% + 0,25 €** por transacción |
| Hosting (Vercel/Netlify) | Free / Hobby | **0 €** |
| Dominio `.es` | Anual | ~**10–15 €/año** |
| Mapa (OpenStreetMap) | — | **0 €** |

Arranque casi a coste cero; solo se paga comisión cuando alguien registra una palmera.

---

## 12. Consideraciones legales y de seguridad

- **Datos personales (RGPD)**: solo se guarda email y nombre visible; añadir política de privacidad y aviso de cookies antes de producción.
- **Pirotecnia real**: la app es **simbólica/digital**; no gestiona ni autoriza pirotecnia física. Conviene un descargo de responsabilidad.
- **Menores**: registro y pago solo para mayores de edad.
- **RLS de Supabase**: lectura pública de palmeres y comentarios; escritura solo del dueño/autenticado. Las claves **secretas** (Stripe) viven únicamente en la Edge Function.
- **Moderación**: prever reporte de comentarios para la capa social.

---

*Documento vivo — se actualizará a medida que avance el desarrollo.*
