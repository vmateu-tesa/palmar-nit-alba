/* =====================================================================
   Elx al Cel — Configuración
   Herramienta institucional (Ajuntament d'Elx). Sin cuentas, sin pagos,
   sin backend transaccional: todo se sirve como ficheros estáticos.
   ===================================================================== */
window.ElxConfig = {
  // Ficheros de datos (servidos por el propio hosting / CDN).
  // Sube el numero al publicar cambios de contenido para evitar cache antigua.
  SCHEDULE_URL: 'data/schedule.json?v=11',
  STATUS_URL: 'data/status.json',   // se consulta con poca frecuencia, sin cache persistente
  STATUS_POLL_MS: 30000,            // cada cuanto se revisa si hay avisos en vivo

  // Idioma por defecto si el navegador no da pista clara.
  DEFAULT_LANG: 'va'   // 'va' = valencià, 'cas' = castellano
};
