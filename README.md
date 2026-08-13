# Elx al Cel — Nit de l'Albà

**Eina ciutadana / Herramienta ciudadana** para orientarse durante la Nit de l'Albà de Elche.
Prueba de concepto (PoC) Smart City para el Ajuntament d'Elx.

## Qué hace

- **Mapa de orientación**: abre siempre centrado en Elche con una vista nocturna 3D que encuadra las palmeras municipales, ubicación en vivo, puntos de lanzamiento oficiales, cortes de calle, perímetros de seguridad, puntos de asistencia y miradores recomendados. Punto de encuentro compartible (mantener pulsado el mapa).
- **Palmeras oficiales 2026**: capa propia con las 312 palmeras del listado oficial de Fiestas en Elche, etiquetadas por patrocinio municipal, asociación/colectivo o patrocinio publicado; cada ficha permite verla en 3D y abrir la cámara en modo AR.
- **Palmeras ciudadanas compartidas**: cualquier persona puede crear tantas como quiera; se publican en Supabase y aparecen para el resto de usuarios en pocos segundos.
- **Programa en tiempo real**: qué palmera de foc está activa, cuenta atrás, progreso de la noche y avisos "faltan 5 min" — todo calculado en el dispositivo.
- **Brújula orientativa**: indica hacia dónde mirar para el hito activo; modo brújula cardinal cuando no hay hito.
- **Guía cultural**: Nit de l'Albà, Misteri d'Elx, Palmeral, con enlaces oficiales (VisitElche, Ajuntament, entradas del Misteri).
- **Bilingüe** valencià / castellano.

## Arquitectura (static-first)

Pensada para el pico de las 00:00 con la red móvil saturada:

- **Contenido oficial estático**: programa, listado oficial y avisos viven en `data/*.json`; solo las palmeras ciudadanas y sus votos usan Supabase como base compartida.
- **PWA offline**: Service Worker con 3 políticas (app-shell cache-first, datos stale-while-revalidate, tiles con caché LRU acotada) + precarga en segundo plano de los mapas del área del evento (~73 tiles).
- **Cómputo en el dispositivo**: cronograma, rumbo de brújula y distancias se calculan localmente; a medianoche la app no llama a ningún servidor de datos.
- **Mapa 3D**: Mapbox GL JS y el estilo nocturno de Mapbox se cargan desde su CDN; los datos oficiales, la lógica de la app y el resto de recursos son propios y quedan cubiertos por la PWA.

## Operación durante el evento

- **Retraso del programa**: editar `delay_minutes` en `data/status.json` y desplegar. Todos los clientes ajustan el cronograma en <30 s.
- **Aviso de seguridad**: escribir el texto en `notice_va` / `notice_cas` del mismo fichero.
- **Actualizar el programa**: editar `data/schedule.json`, subir `version` y las referencias `?v=N`.
- **Actualizar palmeras oficiales**: regenerar `data/official-palmeras.json` desde el PDF oficial y subir las referencias `?v=N`; las notificaciones se agrupan por minuto para no lanzar 312 avisos independientes.
- **Base ciudadana**: ejecutar `supabase/05_shared_multiple_palmeras.sql` en el proyecto Supabase de producción; la migración es idempotente y mantiene el email fuera de la lectura pública.

## Puesta en producción

1. Crear o reactivar un proyecto Supabase y ejecutar `supabase/05_shared_multiple_palmeras.sql` antes de publicar el frontend.
2. Actualizar `SUPABASE_URL` y `SUPABASE_KEY` en `js/config.js` con la URL y la clave pública (`anon`/publishable) del proyecto activo.
3. Verificar que `GET /rest/v1/palmeras?select=id&limit=1` responde `200` con esa clave.
4. Publicar en GitHub; Vercel desplegará la rama configurada. No promover a producción si la comprobación del punto 3 falla.

Las altas nuevas llevan un `client_id` estable: si la red se corta después de enviar una palmera, el reintento recupera la misma fila y evita duplicados. Las pendientes se reintentan al volver la conexión o al recuperar el foco de la app.

## Pruebas

```powershell
node tests/production-smoke.cjs
```

La prueba cubre la migración del almacenamiento local, altas múltiples, sincronización visible desde un segundo cliente, privacidad del email e idempotencia de reintentos.

## Datos provisionales

Las coordenadas de puntos de lanzamiento, cortes, perímetros y miradores son **aproximadas** y deben confirmarse con el programa oficial del Ajuntament antes de un uso real. Las horas siguen el programa oficial publicado (23:15 inicio · 23:57 fin del disparo · 00:00 Palmera de la Mare de Déu).

## Terminología cultural (obligatoria)

"Nit de l'Albà" · "palmeres de foc" · **"Palmera de la Mare de Déu"** (nunca "de la Virgen") · "La Alborada" · "Palmeral" = el bosque físico, Patrimonio de la Humanidad.
