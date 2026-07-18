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
      'mypalm.fab': "La meua palmera",
      'mypalm.title': "La meua palmera de foc",
      'mypalm.sub': "Dedica una palmera simbòlica i compartix-la en xarxes",
      'mypalm.name': "El teu nom",
      'mypalm.name_ph': "Maria…",
      'mypalm.dedication': "Dedicatòria",
      'mypalm.ph': "Per a la iaia Carmen…",
      'mypalm.time': "Hora de llançament",
      'mypalm.where': "On la situem?",
      'mypalm.use_gps': "En la meua ubicació",
      'mypalm.use_center': "Al centre del mapa",
      'mypalm.locating': "Localitzant-te…",
      'mypalm.located': "Ubicació detectada ✓",
      'mypalm.style': "Estil de la teua palmera de foc",
      'mypalm.publish_error': "S'ha guardat al teu dispositiu, però no s'ha pogut publicar per a tots (revisa la connexió).",

      'vote.cta': "M'agrada",
      'vote.voted': "Votada",
      'vote.thanks': "Gràcies pel teu vot! 🎆",
      'vote.error': "No s'ha pogut registrar el vot. Torna-ho a provar.",
      'mypalm.real_note': "Vols que siga de veritat? Patrocina una palmera oficial des de 150 \u20AC \u00B7 patrociniopalmera@elche.es",
      'mypalm.cancel': "Cancel\u00B7lar",
      'mypalm.save': "Crear i compartir",
      'mypalm.need_ded': "Escriu una dedicat\u00F2ria primer.",
      'mypalm.created': "Palmera creada! Es revisarà abans de fer-se visible per a tots.",
      'mypalm.pending_note': "Es publicarà per a tots els usuaris després d'una revisió ràpida (per a evitar bromes i spam).",
      'mypalm.share_btn': "Compartir",
      'mypalm.delete': "Eliminar",
      'mypalm.card_kicker': "Nit de l'Alb\u00E0 \u00B7 Elx",
      'mypalm.card_title': "La meua palmera de foc",
      'mypalm.share_text': "He dedicat la meua palmera de foc: \u201C{ded}\u201D \uD83C\uDF34\u2728 Nit de l'Alb\u00E0 d'Elx, 13/08 a les {time}. Crea i compartix la teua a {url} #NitDeLAlba #Elx #ElxAlCel",


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
      'map.legend.pois': "Punts d'assistència",
      'map.legend.festa': "Actes de les festes",
      'map.legend.palmeres': "Palmeres ciutadanes",
      'map.pending': "Ubicació exacta per confirmar amb l'Ajuntament",
      'timeline.see_map': "Veure al mapa",
      'map.layers': "Capes del mapa",
      'map.directions': "Com arribar",
      'common.offline': "Sense connexió",
      'install.title': "Porta Elx al Cel a la teua pantalla d'inici",
      'install.text': "Instal·lada funciona a pantalla completa i sense connexió, ideal per a la nit de l'esdeveniment.",
      'install.btn': "Instal·lar l'app",
      'install.ios': "En iPhone: toca el botó Compartir del navegador i tria \"Afegir a pantalla d'inici\".",

      'map.legend.launch': "Punt de llançament oficial",
      'map.legend.closure': "Carrer tallat (estimat)",
      'map.legend.perimeter': "Perímetre de seguretat (estimat)",
      'map.unofficial_note': "Traçat estimat, no oficial. L'Ajuntament encara no ha publicat el pla de talls i seguretat 2026.",

      'fw.cta': "Veure en 3D",
      'fw.kicker': "🎆 Palmera de foc",
      'fw.safety': "Mantín-te darrere del perímetre de seguretat",
      'fw.close': "Tancar",
      'fw.camera_cta': "Apuntar amb la càmera",

      'arcam.camera_denied': "No s'ha pogut accedir a la càmera. Comprova els permisos del navegador.",
      'arcam.retry': "Repetir",
      'arcam.save': "Guardar",
      'arcam.share': "Compartir",
      'arcam.saved': "Guardat al dispositiu",
      'arcam.record_unsupported': "Este navegador no permet gravar vídeo. Prova amb la foto.",
      'arcam.share_text': "🎆 {name} · Nit de l'Albà, Elx\n{url}\n#NitDeLAlba #Elx #ElxAlCel",

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
      'cd.d': "dies", 'cd.h': "hores", 'cd.m': "min", 'cd.s': "seg",
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
      'guide.alba.desc': "La nit del 13 d'agost, tota la ciutat llança palmeres de foc en honor a la Mare de Déu de l'Assumpció. L'origen es remunta a l'Edat Mitjana, quan cada família oferia un coet per cada fill. A les 23:15 comença el programa oficial amb més de 300 palmeres de color; a les 23:55 s'apaguen les llums, sona el Gloria Patri del Misteri i, a mitjanit, es dispara la Palmera de la Mare de Déu des de la torre de la Basílica. És Festa d'Interés Turístic Nacional.",
      'guide.alba.link': "Informació oficial (VisitElche)",

      'guide.history.title': "Història i Tradició",
      'guide.history.p1': "La Nit de l'Albà té el seu origen a l'Edat Mitjana. Antigament, les famílies il·licitanes disparaven un coet per cada fill que havien tingut durant l'any com a agraïment a la Mare de Déu de l'Assumpció.",
      'guide.history.p2': "Actualment, és una ofrena de llum i pólvora on els ciutadans, empreses i l'Ajuntament participen llançant milers de palmeres. Està declarada Festa d'Interés Turístic Nacional des de 2021.",
      'guide.history.palmera_title': "La Palmera de la Mare de Déu",
      'guide.history.step3_title': "300m: Espectacle Blanc",
      'guide.history.step3_desc': "Il·lumina tota la ciutat uns segons, seguit pel cant d'\"Aromas Ilicitanos\" i la silueta de foc.",
      'guide.history.step2_title': "00:00: Foscor i Silenci",
      'guide.history.step2_desc': "S'apaguen les llums, sona el Gloria Patri del Misteri.",
      'guide.history.step1_title': "Basílica de Santa Maria",
      'guide.history.step1_desc': "Lloc històric del llançament des del campanar.",

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
      'guide.participate.desc': "Pots patrocinar la teua pròpia palmera de foc a través de l'Ajuntament: cada palmera porta sis dotzenes de coets i una dedicatòria (a una persona estimada, a qui ja no hi és, o d'una empresa als seus clients), amb preus entre 150 i 300 euros. El programa oficial amb la relació completa de palmeres i els punts de llançament es publica a fiestasenelche.es uns dies abans del 13 d'agost.",
      'guide.participate.link': "Patrocini de palmeres (Ajuntament)",
      'guide.participate.mail': "patrociniopalmera@elche.es",
      'guide.festes.title': "Les Festes d'Elx (7–15 d'agost)",
      'guide.festes.desc': "La Nit de l'Albà s'emmarca en les Festes Majors en honor a la Mare de Déu de l'Assumpció, declarades d'Interés Turístic Nacional: Entrades de Moros i Cristians i ambaixades, la Gran Xaranga, l'ofrena de flors, mascletàs diàries a les 14:00 al concurs de l'avinguda Alcalde Vicente Quiles, el Racó FestiElx al Passeig de l'Estació, concerts a l'Hort de Baix i al festival Nits de Festa, la Nit de la Roà (la vetla amb espelmes de la matinada del 14 al 15), i el 15 d'agost la Gran Mascletà, la Processó-Soterrar de la Mare de Déu i el castell de focs de fi de festes des del Pont del Ferrocarril.",
      'guide.festes.link': "Web oficial de les festes (fiestasenelche.es)",

      'guide.official.title': "Enllaços oficials",
      'guide.official.ajuntament': "Ajuntament d'Elx",
      'guide.official.visitelche': "VisitElche · Turisme oficial",

      'about.title': "Sobre esta eina",
      'about.p1': "Elx al Cel és una eina ciutadana per a orientar-te durant la Nit de l'Albà: mapa, programa i brúixola, pensada per a funcionar encara que la xarxa mòbil estiga saturada.",
      'about.p2': "Prova de concepte per a l'Ajuntament d'Elx. Les dades del programa (llocs, talls de carrer i perímetres) són provisionals i han de confirmar-se amb la informació oficial abans de l'esdeveniment.",
      'about.heritage': "El Palmeral d'Elx i el Misteri d'Elx són Patrimoni de la Humanitat (UNESCO).",
      'about.credit': "App desenvolupada per Greenbox, empresa il·licitana d'Smart Cities i sostenibilitat.",

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
      'mypalm.fab': "Mi palmera",
      'mypalm.title': "Mi palmera de foc",
      'mypalm.sub': "Dedica una palmera simbólica y compártela en redes",
      'mypalm.name': "Tu nombre",
      'mypalm.name_ph': "María…",
      'mypalm.dedication': "Dedicatoria",
      'mypalm.ph': "Para la abuela Carmen…",
      'mypalm.time': "Hora de lanzamiento",
      'mypalm.where': "¿Dónde la situamos?",
      'mypalm.locating': "Localizándote…",
      'mypalm.located': "Ubicación detectada ✓",
      'mypalm.style': "Estilo de tu palmera de foc",
      'mypalm.publish_error': "Se guardó en tu dispositivo, pero no se pudo publicar para todos (revisa la conexión).",

      'vote.cta': "Me gusta",
      'vote.voted': "Votada",
      'vote.thanks': "¡Gracias por tu voto! 🎆",
      'vote.error': "No se pudo registrar el voto. Inténtalo de nuevo.",
      'mypalm.use_gps': "En mi ubicación",
      'mypalm.use_center': "En el centro del mapa",
      'mypalm.real_note': "¿Quieres que sea de verdad? Patrocina una palmera oficial desde 150 \u20AC \u00B7 patrociniopalmera@elche.es",
      'mypalm.cancel': "Cancelar",
      'mypalm.save': "Crear y compartir",
      'mypalm.need_ded': "Escribe una dedicatoria primero.",
      'mypalm.created': "¡Palmera creada! Se revisará antes de hacerse visible para todos.",
      'mypalm.pending_note': "Se publicará para todos los usuarios tras una revisión rápida (para evitar bromas y spam).",
      'mypalm.share_btn': "Compartir",
      'mypalm.delete': "Eliminar",
      'mypalm.card_kicker': "Nit de l'Alb\u00E0 \u00B7 Elx",
      'mypalm.card_title': "Mi palmera de foc",
      'mypalm.share_text': "He dedicado mi palmera de foc: \u201C{ded}\u201D \uD83C\uDF34\u2728 Nit de l'Alb\u00E0 de Elche, 13/08 a las {time}. Crea y comparte la tuya en {url} #NitDeLAlba #Elche #ElxAlCel",


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
      'map.legend.pois': "Puntos de asistencia",
      'map.legend.festa': "Actos de las fiestas",
      'map.legend.palmeres': "Palmeras ciudadanas",
      'map.pending': "Ubicación exacta por confirmar con el Ayuntamiento",
      'timeline.see_map': "Ver en el mapa",
      'map.layers': "Capas del mapa",
      'map.directions': "Cómo llegar",
      'common.offline': "Sin conexión",
      'install.title': "Lleva Elx al Cel a tu pantalla de inicio",
      'install.text': "Instalada funciona a pantalla completa y sin conexión, ideal para la noche del evento.",
      'install.btn': "Instalar la app",
      'install.ios': "En iPhone: toca el botón Compartir del navegador y elige \"Añadir a pantalla de inicio\".",

      'map.legend.launch': "Punto de lanzamiento oficial",
      'map.legend.closure': "Calle cortada (estimado)",
      'map.legend.perimeter': "Perímetro de seguridad (estimado)",
      'map.unofficial_note': "Trazado estimado, no oficial. El Ayuntamiento aún no ha publicado el plano de cortes y seguridad 2026.",

      'fw.cta': "Ver en 3D",
      'fw.kicker': "🎆 Palmera de foc",
      'fw.safety': "Mantente detrás del perímetro de seguridad",
      'fw.close': "Cerrar",
      'fw.camera_cta': "Apuntar con la cámara",

      'arcam.camera_denied': "No se ha podido acceder a la cámara. Comprueba los permisos del navegador.",
      'arcam.retry': "Repetir",
      'arcam.save': "Guardar",
      'arcam.share': "Compartir",
      'arcam.saved': "Guardado en el dispositivo",
      'arcam.record_unsupported': "Este navegador no permite grabar vídeo. Prueba con la foto.",
      'arcam.share_text': "🎆 {name} · Nit de l'Albà, Elx\n{url}\n#NitDeLAlba #Elche #ElxAlCel",

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
      'cd.d': "días", 'cd.h': "horas", 'cd.m': "min", 'cd.s': "seg",
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
      'guide.alba.desc': "La noche del 13 de agosto, toda la ciudad lanza palmeres de foc en honor a la Mare de Déu de l'Assumpció. Su origen se remonta a la Edad Media, cuando cada familia ofrendaba un cohete por cada hijo. A las 23:15 empieza el programa oficial con más de 300 palmeras de color; a las 23:55 se apagan las luces, suena el Gloria Patri del Misteri y, a medianoche, se dispara la Palmera de la Mare de Déu desde la torre de la Basílica. Es Fiesta de Interés Turístico Nacional.",
      'guide.alba.link': "Información oficial (VisitElche)",

      'guide.history.title': "Historia y Tradición",
      'guide.history.p1': "La Nit de l'Albà tiene su origen en la Edad Media. Antiguamente, las familias ilicitanas disparaban un cohete por cada hijo que habían tenido durante el año como agradecimiento a la Mare de Déu de l'Assumpció.",
      'guide.history.p2': "Actualmente, es una ofrenda de luz y pólvora donde los ciudadanos, empresas y el Ayuntamiento participan lanzando miles de palmeras. Está declarada Fiesta de Interés Turístico Nacional desde 2021.",
      'guide.history.palmera_title': "La Palmera de la Mare de Déu",
      'guide.history.step3_title': "300m: Espectáculo Blanco",
      'guide.history.step3_desc': "Ilumina toda la ciudad unos segundos, seguido por el canto de \"Aromas Ilicitanos\" y la silueta de fuego.",
      'guide.history.step2_title': "00:00: Oscuridad y Silencio",
      'guide.history.step2_desc': "Se apagan las luces, suena el Gloria Patri del Misteri.",
      'guide.history.step1_title': "Basílica de Santa María",
      'guide.history.step1_desc': "Lugar histórico del lanzamiento desde el campanario.",

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
      'guide.participate.desc': "Puedes patrocinar tu propia palmera de foc a través del Ayuntamiento: cada palmera lleva seis docenas de cohetes y una dedicatoria (a un ser querido, a quien ya no está, o de una empresa a sus clientes), con precios entre 150 y 300 euros. El programa oficial con la relación completa de palmeras y los puntos de lanzamiento se publica en fiestasenelche.es unos días antes del 13 de agosto.",
      'guide.participate.link': "Patrocinio de palmeras (Ayuntamiento)",
      'guide.participate.mail': "patrociniopalmera@elche.es",
      'guide.festes.title': "Las Fiestas de Elche (7–15 de agosto)",
      'guide.festes.desc': "La Nit de l'Albà se enmarca en las Fiestas Mayores en honor a la Mare de Déu de l'Assumpció, declaradas de Interés Turístico Nacional: Entradas de Moros y Cristianos y embajadas, la Gran Charanga, la ofrenda de flores, mascletàs diarias a las 14:00 en el concurso de la avenida Alcalde Vicente Quiles, el Racó FestiElx en el Paseo de la Estación, conciertos en el Hort de Baix y en el festival Nits de Festa, la Nit de la Roà (la vela con velas de la madrugada del 14 al 15), y el 15 de agosto la Gran Mascletà, la Procesión-Entierro de la Virgen y el castillo de fuegos de fin de fiestas desde el Puente del Ferrocarril.",
      'guide.festes.link': "Web oficial de las fiestas (fiestasenelche.es)",

      'guide.official.title': "Enlaces oficiales",
      'guide.official.ajuntament': "Ayuntamiento de Elche",
      'guide.official.visitelche': "VisitElche · Turismo oficial",

      'about.title': "Sobre esta herramienta",
      'about.p1': "Elx al Cel es una herramienta ciudadana para orientarte durante la Nit de l'Albà: mapa, programa y brújula, pensada para funcionar aunque la red móvil esté saturada.",
      'about.p2': "Prueba de concepto para el Ajuntament d'Elx. Los datos del programa (lugares, cortes de calle y perímetros) son provisionales y deben confirmarse con la información oficial antes del evento.",
      'about.heritage': "El Palmeral de Elche y el Misteri d'Elx son Patrimonio de la Humanidad (UNESCO).",
      'about.credit': "App desarrollada por Greenbox, empresa ilicitana de Smart Cities y sostenibilidad.",

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
