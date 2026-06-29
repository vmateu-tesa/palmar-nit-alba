# PalmAR — Nit de l'Albà d'Elx 🌴✨

PWA para localizar, apadrinar y revivir en **realidad aumentada** las *palmeres* de la **Nit de l'Albà** de Elche.

- Mapa público de Elche con todas las palmeres (gratis, sin login).
- Apadrina la tuya: carrusel de animaciones, ubicación, hora de encendido, nota familiar.
- Pago con Stripe (modo test) y simulación en el cielo.
- Modo AR con la cámara + comentarios y reacciones.
- Bilingüe **castellà / valencià**.

---

## 1. Probarla ya (modo demo)

No necesita configurar nada: usa datos locales y un pago simulado.

Como la PWA usa cámara y service worker, sírvela por HTTP (no abras el `index.html` con doble clic):

```bash
# dentro de la carpeta del proyecto
python -m http.server 5173
# abre http://localhost:5173
```

> En el móvil, para que funcione la **cámara AR** necesitas HTTPS. Lo más fácil es desplegarla (ver §4) o usar un túnel tipo `ngrok http 5173`.

**Datos de prueba**
- Regístrate con cualquier correo y contraseña (se guardan solo en tu navegador).
- Tarjeta de pago de prueba: `4242 4242 4242 4242`, fecha `12/34`, CVC `123`.

---

## 2. Activar Supabase (datos reales y login)

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. SQL Editor → pega y ejecuta `supabase/schema.sql`.
3. Copia en `js/config.js`:
   ```js
   SUPABASE_URL: "https://TUPROYECTO.supabase.co",
   SUPABASE_ANON_KEY: "eyJ...",   // Project Settings → API → anon public
   ```
4. Authentication → Providers → Email: actívalo (puedes desactivar “Confirm email” en pruebas).
5. Authentication → URL Configuration → **Redirect URLs**: añade la URL de tu app
   (p. ej. `https://tudominio.com/` y `http://localhost:5173/`). Es donde aterriza
   el enlace de **recuperación de contraseña**.

Con esto el login es real y las palmeres se comparten entre usuarios.

### Registro y contraseñas

- **Registro** bajo correo electrónico (el correo es el usuario) + contraseña.
- **Recuperar contraseña**: en el modal de acceso, *“¿Olvidaste la contraseña?”* →
  Supabase envía un **correo con un enlace**; al volver a la app detecta el evento
  `PASSWORD_RECOVERY` y abre el formulario para fijar una nueva contraseña.
- Personaliza el texto del correo en Supabase → Authentication → **Email Templates** → *Reset Password*.
- En **modo demo** (sin claves de Supabase) no hay servidor de correo: el flujo de
  recuperación valida que el correo exista y te deja fijar la nueva contraseña en el acto,
  con un aviso de que en producción se enviaría un email.

---

## 3. Activar Stripe (pago real en modo test)

1. Cuenta en [stripe.com](https://stripe.com) (modo **Test**).
2. Despliega las Edge Functions:
   ```bash
   supabase functions deploy create-checkout --no-verify-jwt
   supabase functions deploy stripe-webhook  --no-verify-jwt
   supabase secrets set STRIPE_SECRET_KEY=sk_test_...
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
   ```
   (`SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` ya están disponibles en las funciones.)
3. En el panel de Stripe → Developers → Webhooks → añade el endpoint
   `https://TUPROYECTO.supabase.co/functions/v1/stripe-webhook` con el evento
   `checkout.session.completed`.
4. En `js/config.js`:
   ```js
   STRIPE_PUBLISHABLE_KEY: "pk_test_...",
   CHECKOUT_FUNCTION_URL: "https://TUPROYECTO.supabase.co/functions/v1/create-checkout",
   ```

Si estas claves están vacías, la app usa automáticamente el **pago simulado**.

---

## 4. Desplegar (HTTPS gratis)

Es estática: vale cualquier hosting de archivos.

```bash
# Netlify
npx netlify deploy --prod --dir .
# o Vercel
npx vercel --prod
```

Recuerda poner la URL pública como dominio permitido en Supabase Auth.

---

## 5. Estructura

```
index.html            App principal (PWA)
manifest.webmanifest  Instalable
sw.js                 Service worker (offline)
css/styles.css        Diseño nocturno
js/config.js          ← tus claves aquí
js/i18n.js            Castellà / valencià
js/fireworks.js       Motor de palmeres (canvas)
js/map.js             Mapa de Elche (Leaflet)
js/ar.js              Modo AR (cámara)
js/data.js            Supabase + fallback local
js/payments.js        Stripe + pago simulado
js/app.js             Orquestación
supabase/schema.sql   Tablas + RLS + ejemplos
supabase/functions/   Edge Functions de Stripe
PLAN-Y-ARQUITECTURA.md Documento de diseño
```

---

## 6. Notas

- Experiencia **simbólica y digital**: no gestiona pirotecnia real.
- Antes de producción: política de privacidad/cookies (RGPD), moderación de comentarios y modo *live* de Stripe.
- *Visca Elx i la Nit de l'Albà.* 🌴
