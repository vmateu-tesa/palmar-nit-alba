# Changelog

## v15 — El cielo lleno: 110 palmeras de ejemplo por barrios (julio 2026)

- El folleto oficial 2025 ya no está disponible (fiestasenelche.es renovada para 2026, programa "próximamente"). Mientras llega el listado 2026: recreación de ejemplo a escala realista con 110 palmeras distribuidas por los barrios reales de disparo (Centro 30, Carrús 20, Altabix 20, El Pla 15, Raval/Sector V 15, Parque/Estación 10), con familias, peñas y dedicatorias verosímiles y horas del programa real. Etiquetadas como recreación en cada ficha.
- Nits de Festa ELX: cartel 2026 REAL verificado en la web oficial (Siloé, Sidecars, Lia Kali, Celtas Cortos, Rigoberta Bandini, OBK la nit de l Albà, Chimo Bayo...), recinto confirmado.
- El mapa pasa a 140 puntos.

## v14 — Mi palmera de foc + compartir en redes (julio 2026)

- Botón dorado "Mi palmera" en el mapa: crea una palmera simbólica con dedicatoria, hora y ubicación (GPS o centro del mapa). Se guarda en el dispositivo (sin backend, coherente con la arquitectura static-first) y aparece en el mapa con icono animado.
- Compartir en RRSS: genera una tarjeta-imagen 1080x1080 en canvas (palmera dorada sobre cielo nocturno, dedicatoria y marca Elx al Cel) y la comparte por Web Share API con imagen; fallbacks a texto y portapapeles.
- Puente al patrocinio real: el formulario enlaza el patrocinio oficial del Ayuntamiento (desde 150 EUR, patrociniopalmera@elche.es) — la dedicatoria digital como embudo hacia la palmera real.
- Ficha de la palmera con botones Compartir y Eliminar.

## v12 — Brújula corregida, patrocinio oficial y apartado de Fiestas (julio 2026)

- Brújula: corregido el rumbo erróneo en Android (el sensor relativo, con norte arbitrario, pisaba las lecturas absolutas); compensación del ángulo de pantalla y suavizado circular anti-temblor.
- Guía: enlace oficial de patrocinio de palmeras del Ayuntamiento (elche.es/fiestas/patrocinio-de-palmeras-de-la-nit-de-lalba) + correo patrociniopalmera@elche.es; precios reales 150–300 EUR, seis docenas de cohetes y dedicatoria por palmera.
- Nueva tarjeta "Las Fiestas de Elche (7–15 de agosto)": Moros y Cristianos, charangas, ofrenda, mascletàs diarias, Racó FestiElx, conciertos, Nit de la Roà, procesión y castillo final; enlace a fiestasenelche.es (web oficial donde se publica el programa con la relación completa de palmeras y puntos de lanzamiento).

## v11 — Puntos de lanzamiento oficiales + contador rediseñado (julio 2026)

- 12 puntos de lanzamiento según la nota oficial del Ayuntamiento (elche.es): torre de la Basílica, terraza del Ayuntamiento, Paseo de la Estación (Palmera Imperial 23:30), puentes del Ferrocarril y de Altamira (cohetà), Plaza del 1 de Mayo, Jardín de Andalucía y Colegio Mariano Benlliure (carcasas), y puntos de barrio en Altabix, El Pla, Sector V y Carrús.
- Cronograma corregido con el programa municipal: 23:15 palmeras de terrazas, 23:30 Palmera Imperial + cohetà, 23:40 carcasas, 23:55 apagada de luces + Gloria Patri, 00:00 Palmera de la Mare de Déu (mas de 1.000 cohetones, 300 m de altura, 500 m de diámetro), 00:05 Alborada.
- Contador rediseñado: segmentos de días / horas / minutos / segundos en cajas doradas, actualizado cada segundo.
- El mapa pasa a 38 puntos de interés.

## v10 — Mapa vivo: actos de las fiestas y palmeras ciudadanas (julio 2026)

- Nueva capa "Actos de las fiestas" con 9 lugares del programa publicado: Racó FestiElx (Paseo de la Estación), concurso de mascletàs (Av. Alcalde Vicente Quiles), Ágora Heliketana (rotonda Parque Municipal), conciertos del Hort de Baix, Gran Carretillà (Hort del Monjo, 01:00 tras la Nit de l Albà), castillo de fuegos del 15 (puente del Ferrocarril), Nit de la Roà (Basílica), Plaça de Baix y Nits de Festa (parking UMH).
- Nueva capa "Palmeras ciudadanas": 8 palmeras de familias y peñas (datos de ejemplo, recuperando el espíritu de la versión original) enlazadas con el patrocinio real del Ayuntamiento (fiestas@elche.es).
- Guía actualizada: mas de 8.000 palmeras y cohetes en la Nit de l Albà, y cómo patrocinar la tuya.
- El mapa pasa de 12 a 29 puntos de interés.

## v9 — Mapa: ubicación real, fondo detallado, puntos provisionales (julio 2026)

- Corregido: "Mi ubicación" quedaba atrapada por los límites del área del evento; eliminados los límites de paneo — el mapa sigue al usuario esté donde esté.
- "Mi ubicación" ahora pide la posición si aún no la tiene y avisa del estado (permiso denegado / sin señal).
- Selector de fondo del mapa: Detallado (OpenStreetMap estándar, con todos los nombres) por defecto, y Nocturno como opción. La preferencia se recuerda; la precarga offline usa el fondo por defecto.
- Los puntos de lanzamiento no verificados muestran "ubicación exacta por confirmar con el Ayuntamiento" en su ficha.

## v8 — Hotfix crítico de visibilidad (julio 2026)

- Corregido: los elementos con display explícito en CSS ignoraban el atributo hidden. Afectaba a la pantalla de bienvenida (no se podía cerrar), panel de capas, consejos contextuales, brújula, insignia DEMO y botón de instalación. Regla global [hidden]{display:none !important}.

## v7 — Fase B: herramienta avanzada (julio 2026)

- Programa interactivo: cada hito se despliega con su descripción y botón "Ver en el mapa" que vuela al punto y abre su ficha.
- Panel de capas del mapa (lanzamientos, cortes, perímetros, miradores, asistencia) con preferencias recordadas.
- "Cómo llegar" en todas las fichas del mapa (enlace a navegación).
- Instalación en pantalla de inicio: aviso nativo en Android/Chrome e instrucciones para iPhone.
- Indicador "Sin conexión" en la cabecera.
- Mapa protegido ante fallos de inicialización.

## v6 — Revisión UX completa + coordenadas verificadas (julio 2026)

- COORDENADAS CORREGIDAS con fuentes verificadas (OSM): Basílica 38.26719,-0.69799; Pont del Bimil·lenari 38.27932,-0.70214 (antes desviado >1 km); Glorieta, Parque Municipal, Pont de la Generalitat, cauce del Vinalopó y POIs triangulados (~50 m).
- Castellano por defecto (valencià a un toque).
- Pantalla de bienvenida en la primera visita + consejos contextuales por pestaña (descartables).
- Brújula rediseñada: pantalla explicativa con botón de activación (permiso iOS correcto), selector de objetivo (automático o punto concreto), indicaciones "gira a la izquierda/derecha", grados + cardinal, y modo texto sin sensor ("el punto está hacia el NE").
- Popups del mapa con "Próximo desde aquí" (siguiente lanzamiento y hora en cada punto).
- Estado del GPS por aviso no intrusivo; botón "Mi ubicación" estable.

## v5 — Robustez final + modo demo (julio 2026)

- Modo demostración (?demo=1): hora simulada anclada 7 min antes de la Palmera de la Mare de Déu, con distintivo DEMO visible. Para presentaciones al Ajuntament.
- Reloj centralizado (Clock) usado por cronograma y avisos.
- Saneamiento HTML de todo contenido dinámico (plantillas y popups del mapa).
- Carga de datos con 3 reintentos y recuperación automática al volver la red.
- Repintado inmediato al desbloquear el móvil (visibilitychange).

## v4 — Pivote institucional "Elx al Cel" (julio 2026)

Reescritura completa: de app social B2C (PalmAR) a herramienta ciudadana de movilidad y seguridad para el Ajuntament d'Elx. La versión anterior se conserva íntegra en el historial de git.

- Arquitectura static-first: eliminados Supabase, Stripe, cuentas, pagos y motor de partículas.
- Mapa Leaflet autohospedado: ubicación en vivo, puntos de lanzamiento, cortes, perímetros, POIs, miradores recomendados y punto de encuentro compartible.
- Programa oficial real (23:15 / 23:57 / 00:00) con cuenta atrás, progreso y avisos locales de proximidad.
- Brújula orientativa con modo cardinal (sin librerías 3D).
- Guía cultural bilingüe con enlaces oficiales verificados.
- PWA offline: SW v4 (3 políticas de caché), precarga de tiles del área del evento, corrección del cacheo de respuestas opacas.
- Canal en vivo sin backend: data/status.json (retrasos e incidencias).
