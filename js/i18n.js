/* =====================================================================
   Elx al Cel — Textos bilingües (valencià / castellano)
   Terminologia cultural (OBLIGATORI):
   · "Nit de l'Albà" (mai traduir el nom de l'esdeveniment)
   · "Palmera de foc" (mai "fuego artificial" / "palmera digital")
   · "Palmera de la Mare de Déu" (mai "de la Virgen", tampoc en castellà)
   · "La Alborada" (moment posterior a la gran palmera)
   · "Palmeral" = el bosc de palmeres físic, Patrimoni de la Humanitat
   ===================================================================== */
(function () {
  const DICT = {
    va: {
      'app.name': "Elx al Cel",
      'app.tagline': "Nit de l'Albà · Guia ciutadana",

      'nav.map': "Mapa", 'nav.timeline': "Programa", 'nav.ar': "Brúixola", 'nav.guide': "Guia",

      'status.delay': "Avís: el programa porta un retard aproximat de {min} min.",

      'map.you_are_here': "Ets ací",
      'welcome.title': "Benvingut a Elx al Cel",
      'welcome.sub': "La teua guia per a la Nit de l'Albà",
      'welcome.map': "Mapa: on són els llançaments, talls de carrer i punts d'ajuda",
      'welcome.timeline': "Programa: què està passant ara i què ve després",
      'welcome.ar': "Brúixola: cap a on mirar en cada moment",
      'welcome.cta': "Començar",
      'hint.map': "Toca qualsevol icona del mapa per a saber què és. Mantín premut per a marcar un punt de trobada.",
      'hint.timeline': "El programa s'actualitza sol. Activa els avisos per a no perdre't res.",
      'hint.guide': "Tota la informació oficial de la festa, en un lloc.",
      'hint.close': "Entesos",
      'ar.intro_title': "Brúixola de la Nit de l'Albà",
      'ar.intro_text': "T'indica cap a on mirar per a cada palmera de foc. Necessita permís per a usar la ubicació i el sensor d'orientació del mòbil.",
      'ar.enable': "Activar la brúixola",
      'ar.target_auto': "Automàtic (segons el programa)",
      'ar.turn_left': "Gira a l'esquerra",
      'ar.turn_right': "Gira a la dreta",
      'ar.text_mode': "Sense brúixola al dispositiu. El punt està cap al {card} de la teua posició.",
      'map.locate': "La meua ubicació",

      'map.locating': "Localitzant-te…",
      'map.no_gps': "Sense ubicació. Pots moure el mapa manualment.",
      'map.gps_denied': "Ubicació desactivada. Activa-la als permisos del navegador.",
      'map.meeting_point': "Punt de trobada",
      'map.meeting_hint': "Consell: mantín premut el mapa per a marcar un punt de trobada i compartir-lo.",
      'map.meeting_set': "Punt de trobada marcat. Toca la bandera per a compartir-lo.",
      'map.meeting_text': "Ens veiem ací esta Nit de l'Albà:",
      'map.shared_copied': "Enllaç copiat. Envia'l per missatge.",
      'map.share_no_point': "Mantín premut el mapa per a marcar un punt, o espera la teua ubicació.",
      'alert.soon': "En {min} min: {name}",
      'alert.now': "Ara: {name}",
      'notify.enable': "Activar avisos",
      'notify.enabled': "Avisos activats",
      'notify.denied': "Avisos no disponibles o bloquejats al navegador.",

      'map.legend.viewpoint': "Mirador recomanat",
      'map.next_here': "Pròxim des d'ací",
      'map.legend.launch': "Punt de llançament oficial",
      'map.legend.closure': "Carrer tallat",
      'map.legend.perimeter': "Perímetre de seguretat",
      'poi.first_aid': "Assistència sanitària",
      'poi.info': "Informació",
      'poi.water': "Aigua potable",
      'poi.accessible': "Accés adaptat",
      'poi.exit': "Sortida recomanada",

      'timeline.title': "Programa de la nit",
      'timeline.now': "Ara mateix",
      'timeline.next': "A continuació",
      'timeline.countdown_to_next': "Falten",
      'timeline.all_done': "El programa d'esta nit ha acabat. Fins l'any que ve!",
      'timeline.not_started': "Encara no ha començat",
      'timeline.progress': "Progrés de la nit",
      'timeline.declaration': "Festa d'Interés Turístic Nacional",

      'ar.hint': "Gira sobre tu mateix fins que la fletxa quede recta cap amunt",
      'ar.locating': "Localitzant-te…",
      'ar.no_gps': "Sense GPS: no es pot calcular el rumb.",
      'ar.no_compass': "Este dispositiu no té brúixola disponible.",
      'ar.aligned': "Ho tens davant",
      'ar.no_target': "No hi ha cap punt actiu ara mateix.",
      'ar.permission_needed': "Cal el teu permís per a usar el sensor d'orientació.",

      'guide.title': "Guia d'Elx en festes",
      'guide.intro': "Informació oficial per a viure la Nit de l'Albà i les Festes d'Agost amb tot el context.",

      'guide.alba.title': "La Nit de l'Albà",
      'guide.alba.desc': "La nit del 13 d'agost, tota la ciutat llança palmeres de foc en honor a la Mare de Déu de l'Assumpció. L'origen es remunta a l'Edat Mitjana, quan cada família oferia un coet per cada fill. A les 23:15 comença el programa oficial amb més de 300 palmeres de color; a les 23:57 s'apaguen les llums, sona el Gloria Patri del Misteri i, a mitjanit, es dispara la Palmera de la Mare de Déu des de la torre de la Basílica. És Festa d'Interés Turístic Nacional.",
      'guide.alba.link': "Informació oficial (VisitElche)",

      'guide.misteri.title': "El Misteri d'Elx",
      'guide.misteri.desc': "Drama cantat d'origen medieval que representa la Dormició, Assumpció i Coronació de la Mare de Déu, declarat per la UNESCO Obra Mestra del Patrimoni Oral i Immaterial de la Humanitat. Es representa a la Basílica de Santa María: la Vespra el 14 d'agost i la Festa el 15, amb entrada lliure; els assajos generals de l'11 al 13 requereixen entrada.",
      'guide.misteri.link': "Web oficial del Misteri",
      'guide.misteri.tickets': "Comprar entrades",
      'guide.misteri.more': "El Misteri a VisitElche",

      'guide.palmeral.title': "El Palmeral",
      'guide.palmeral.desc': "Més de 200.000 palmeres formen el palmeral més gran d'Europa, Patrimoni de la Humanitat (UNESCO, 2000) com a paisatge cultural d'origen andalusí. El Museu del Palmeral, a l'Hort de Sant Plàcid, explica la seua història i l'artesania de la palma blanca. Les \"palmeres de foc\" de la Nit de l'Albà reben este nom precisament per la seua semblança amb l'arbre símbol de la ciutat.",
      'guide.palmeral.link': "El Palmeral (Ajuntament d'Elx)",
      'guide.palmeral.museum': "Museu del Palmeral",

      'guide.participate.title': "Participar amb les teues palmeres de foc",
      'guide.participate.desc': "La Nit de l'Albà no és un espectacle passiu: milers de famílies llancen les seues pròpies palmeres de foc des de terrats i balcons. Compra-les només en punts de venda de pirotècnia autoritzats, respecta els horaris (el disparo acaba a les 23:57) i les indicacions de seguretat del programa oficial.",

      'guide.official.title': "Enllaços oficials",
      'guide.official.ajuntament': "Ajuntament d'Elx",
      'guide.official.visitelche': "VisitElche · Turisme oficial",

      'about.title': "Sobre esta eina",
      'about.p1': "Elx al Cel és una eina ciutadana per a orientar-te durant la Nit de l'Albà: mapa, programa i brúixola, pensada per a funcionar encara que la xarxa mòbil estiga saturada.",
      'about.p2': "Prova de concepte per a l'Ajuntament d'Elx. Les dades del programa (llocs, talls de carrer i perímetres) són provisionals i han de confirmar-se amb la informació oficial abans de l'esdeveniment.",
      'about.heritage': "El Palmeral d'Elx i el Misteri d'Elx són Patrimoni de la Humanitat (UNESCO).",

      'common.offline_bad': "No s'han pogut descarregar totes les dades encara.",
      'demo.on': "Mode demostració: hora simulada. Lleva ?demo de l'adreça per a eixir.",
      'lang.switch': "CAS"
    },
    cas: {
      'app.name': "Elx al Cel",
      'app.tagline': "Nit de l'Albà · Guía ciudadana",

      'nav.map': "Mapa", 'nav.timeline': "Programa", 'nav.ar': "Brújula", 'nav.guide': "Guía",

      'status.delay': "Aviso: el programa lleva un retraso aproximado de {min} min.",

      'map.you_are_here': "Estás aquí",
      'welcome.title': "Bienvenido a Elx al Cel",
      'welcome.sub': "Tu guía para la Nit de l'Albà",
      'welcome.map': "Mapa: dónde son los lanzamientos, cortes de calle y puntos de ayuda",
      'welcome.timeline': "Programa: qué está pasando ahora y qué viene después",
      'welcome.ar': "Brújula: hacia dónde mirar en cada momento",
      'welcome.cta': "Empezar",
      'hint.map': "Toca cualquier icono del mapa para saber qué es. Mantén pulsado para marcar un punto de encuentro.",
      'hint.timeline': "El programa se actualiza solo. Activa los avisos para no perderte nada.",
      'hint.guide': "Toda la información oficial de la fiesta, en un lugar.",
      'hint.close': "Entendido",
      'ar.intro_title': "Brújula de la Nit de l'Albà",
      'ar.intro_text': "Te indica hacia dónde mirar para cada palmera de foc. Necesita permiso para usar la ubicación y el sensor de orientación del móvil.",
      'ar.enable': "Activar la brújula",
      'ar.target_auto': "Automático (según el programa)",
      'ar.turn_left': "Gira a la izquierda",
      'ar.turn_right': "Gira a la derecha",
      'ar.text_mode': "Sin brújula en el dispositivo. El punto está hacia el {card} de tu posición.",
      'map.locate': "Mi ubicación",

      'map.locating': "Localizándote…",
      'map.no_gps': "Sin ubicación. Puedes mover el mapa manualmente.",
      'map.gps_denied': "Ubicación desactivada. Actívala en los permisos del navegador.",
      'map.meeting_point': "Punto de encuentro",
      'map.meeting_hint': "Consejo: mantén pulsado el mapa para marcar un punto de encuentro y compartirlo.",
      'map.meeting_set': "Punto de encuentro marcado. Toca la bandera para compartirlo.",
      'map.meeting_text': "Nos vemos aquí esta Nit de l'Albà:",
      'map.shared_copied': "Enlace copiado. Envíalo por mensaje.",
      'map.share_no_point': "Mantén pulsado el mapa para marcar un punto, o espera tu ubicación.",
      'alert.soon': "En {min} min: {name}",
      'alert.now': "Ahora: {name}",
      'notify.enable': "Activar avisos",
      'notify.enabled': "Avisos activados",
      'notify.denied': "Avisos no disponibles o bloqueados en el navegador.",

      'map.legend.viewpoint': "Mirador recomendado",
      'map.next_here': "Próximo desde aquí",
      'map.legend.launch': "Punto de lanzamiento oficial",
      'map.legend.closure': "Calle cortada",
      'map.legend.perimeter': "Perímetro de seguridad",
      'poi.first_aid': "Asistencia sanitaria",
      'poi.info': "Información",
      'poi.water': "Agua potable",
      'poi.accessible': "Acceso adaptado",
      'poi.exit': "Salida recomendada",

      'timeline.title': "Programa de la noche",
      'timeline.now': "Ahora mismo",
      'timeline.next': "A continuación",
      'timeline.countdown_to_next': "Faltan",
      'timeline.all_done': "El programa de esta noche ha terminado. ¡Hasta el año que viene!",
      'timeline.not_started': "Todavía no ha empezado",
      'timeline.progress': "Progreso de la noche",
      'timeline.declaration': "Fiesta de Interés Turístico Nacional",

      'ar.hint': "Gira sobre ti mismo hasta que la flecha quede recta hacia arriba",
      'ar.locating': "Localizándote…",
      'ar.no_gps': "Sin GPS: no se puede calcular el rumbo.",
      'ar.no_compass': "Este dispositivo no tiene brújula disponible.",
      'ar.aligned': "Lo tienes delante",
      'ar.no_target': "No hay ningún punto activo ahora mismo.",
      'ar.permission_needed': "Se necesita tu permiso para usar el sensor de orientación.",

      'guide.title': "Guía de Elche en fiestas",
      'guide.intro': "Información oficial para vivir la Nit de l'Albà y las Fiestas de Agosto con todo el contexto.",

      'guide.alba.title': "La Nit de l'Albà",
      'guide.alba.desc': "La noche del 13 de agosto, toda la ciudad lanza palmeres de foc en honor a la Mare de Déu de l'Assumpció. Su origen se remonta a la Edad Media, cuando cada familia ofrendaba un cohete por cada hijo. A las 23:15 empieza el programa oficial con más de 300 palmeras de color; a las 23:57 se apagan las luces, suena el Gloria Patri del Misteri y, a medianoche, se dispara la Palmera de la Mare de Déu desde la torre de la Basílica. Es Fiesta de Interés Turístico Nacional.",
      'guide.alba.link': "Información oficial (VisitElche)",

      'guide.misteri.title': "El Misteri d'Elx",
      'guide.misteri.desc': "Drama cantado de origen medieval que representa la Dormición, Asunción y Coronación de la Mare de Déu, declarado por la UNESCO Obra Maestra del Patrimonio Oral e Inmaterial de la Humanidad. Se representa en la Basílica de Santa María: la Vespra el 14 de agosto y la Festa el 15, con entrada libre; los ensayos generales del 11 al 13 requieren entrada.",
      'guide.misteri.link': "Web oficial del Misteri",
      'guide.misteri.tickets': "Comprar entradas",
      'guide.misteri.more': "El Misteri en VisitElche",

      'guide.palmeral.title': "El Palmeral",
      'guide.palmeral.desc': "Más de 200.000 palmeras forman el palmeral más grande de Europa, Patrimonio de la Humanidad (UNESCO, 2000) como paisaje cultural de origen andalusí. El Museo del Palmeral, en el Huerto de San Plácido, explica su historia y la artesanía de la palma blanca. Las \"palmeres de foc\" de la Nit de l'Albà reciben este nombre precisamente por su parecido con el árbol símbolo de la ciudad.",
      'guide.palmeral.link': "El Palmeral (Ayuntamiento de Elche)",
      'guide.palmeral.museum': "Museo del Palmeral",

      'guide.participate.title': "Participar con tus palmeres de foc",
      'guide.participate.desc': "La Nit de l'Albà no es un espectáculo pasivo: miles de familias lanzan sus propias palmeres de foc desde terrazas y balcones. Cómpralas solo en puntos de venta de pirotecnia autorizados, respeta los horarios (el disparo termina a las 23:57) y las indicaciones de seguridad del programa oficial.",

      'guide.official.title': "Enlaces oficiales",
      'guide.official.ajuntament': "Ayuntamiento de Elche",
      'guide.official.visitelche': "VisitElche · Turismo oficial",

      'about.title': "Sobre esta herramienta",
      'about.p1': "Elx al Cel es una herramienta ciudadana para orientarte durante la Nit de l'Albà: mapa, programa y brújula, pensada para funcionar aunque la red móvil esté saturada.",
      'about.p2': "Prueba de concepto para el Ajuntament d'Elx. Los datos del programa (lugares, cortes de calle y perímetros) son provisionales y deben confirmarse con la información oficial antes del evento.",
      'about.heritage': "El Palmeral de Elche y el Misteri d'Elx son Patrimonio de la Humanidad (UNESCO).",

      'common.offline_bad': "Todavía no se han podido descargar todos los datos.",
      'demo.on': "Modo demostración: hora simulada. Quita ?demo de la dirección para salir.",
      'lang.switch': "VAL"
    }
  };

  let current = null;

  function detect() {
    const saved = localStorage.getItem('elx_lang');
    if (saved && DICT[saved]) return saved;
    return 'cas'; // castellano por defecto (el usuario puede cambiar a valencià)
  }

  function t(key, vars) {
    const d = DICT[current] || DICT.va;
    let s = d[key] != null ? d[key] : key;
    if (vars) Object.keys(vars).forEach((k) => { s = s.replace('{' + k + '}', vars[k]); });
    return s;
  }

  function applyToDom() {
    document.documentElement.lang = current;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
  }

  function set(lang) {
    if (!DICT[lang]) return;
    current = lang;
    localStorage.setItem('elx_lang', lang);
    applyToDom();
    window.dispatchEvent(new CustomEvent('elx-lang-changed', { detail: { lang } }));
  }

  function toggle() { set(current === 'va' ? 'cas' : 'va'); }
  function get() { return current; }

  current = detect();

  window.I18N = { t, set, get, toggle, applyToDom };
})();
