# Changelog

## v4 — Pivote institucional "Elx al Cel" (julio 2026)

Reescritura completa: de app social B2C (PalmAR) a herramienta ciudadana de movilidad y seguridad para el Ajuntament d'Elx. La versión anterior se conserva íntegra en el historial de git.

- Arquitectura static-first: eliminados Supabase, Stripe, cuentas, pagos y motor de partículas.
- Mapa Leaflet autohospedado: ubicación en vivo, puntos de lanzamiento, cortes, perímetros, POIs, miradores recomendados y punto de encuentro compartible.
- Programa oficial real (23:15 / 23:57 / 00:00) con cuenta atrás, progreso y avisos locales de proximidad.
- Brújula orientativa con modo cardinal (sin librerías 3D).
- Guía cultural bilingüe con enlaces oficiales verificados.
- PWA offline: SW v4 (3 políticas de caché), precarga de tiles del área del evento, corrección del cacheo de respuestas opacas.
- Canal en vivo sin backend: data/status.json (retrasos e incidencias).
