# Elx al Cel — Nit de l'Albà

**Eina ciutadana / Herramienta ciudadana** para orientarse durante la Nit de l'Albà de Elche.
Prueba de concepto (PoC) Smart City para el Ajuntament d'Elx.

## Qué hace

- **Mapa de orientación**: ubicación en vivo, puntos de lanzamiento oficiales, cortes de calle, perímetros de seguridad, puntos de asistencia y miradores recomendados. Punto de encuentro compartible (mantener pulsado el mapa).
- **Programa en tiempo real**: qué palmera de foc está activa, cuenta atrás, progreso de la noche y avisos "faltan 5 min" — todo calculado en el dispositivo.
- **Brújula orientativa**: indica hacia dónde mirar para el hito activo; modo brújula cardinal cuando no hay hito.
- **Guía cultural**: Nit de l'Albà, Misteri d'Elx, Palmeral, con enlaces oficiales (VisitElche, Ajuntament, entradas del Misteri).
- **Bilingüe** valencià / castellano.

## Arquitectura (static-first)

Pensada para el pico de las 00:00 con la red móvil saturada:

- **Cero backend transaccional**: los datos viven en `data/schedule.json` (inmutable, versionado) y `data/status.json` (avisos en vivo: retrasos e incidencias).
- **PWA offline**: Service Worker con 3 políticas (app-shell cache-first, datos stale-while-revalidate, tiles con caché LRU acotada) + precarga en segundo plano de los mapas del área del evento (~73 tiles).
- **Cómputo en el dispositivo**: cronograma, rumbo de brújula y distancias se calculan localmente; a medianoche la app no llama a ningún servidor de datos.
- **Un solo origen**: Leaflet autohospedado, sin CDNs de terceros ni fuentes externas.

## Operación durante el evento

- **Retraso del programa**: editar `delay_minutes` en `data/status.json` y desplegar. Todos los clientes ajustan el cronograma en <30 s.
- **Aviso de seguridad**: escribir el texto en `notice_va` / `notice_cas` del mismo fichero.
- **Actualizar el programa**: editar `data/schedule.json`, subir `version` y las referencias `?v=N`.

## Datos provisionales

Las coordenadas de puntos de lanzamiento, cortes, perímetros y miradores son **aproximadas** y deben confirmarse con el programa oficial del Ajuntament antes de un uso real. Las horas siguen el programa oficial publicado (23:15 inicio · 23:57 fin del disparo · 00:00 Palmera de la Mare de Déu).

## Terminología cultural (obligatoria)

"Nit de l'Albà" · "palmeres de foc" · **"Palmera de la Mare de Déu"** (nunca "de la Virgen") · "La Alborada" · "Palmeral" = el bosque físico, Patrimonio de la Humanidad.
