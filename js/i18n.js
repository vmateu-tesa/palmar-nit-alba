/* PalmAR — i18n castellano / valencià */
(function () {
  const DICT = {
    va: {
      'nav.login': "Entrar", 'nav.map': "Mapa", 'nav.ar': "AR", 'nav.sim': "Cel", 'nav.info': "Info",
      'nav.account': "Compte",
      'hero.kicker': "Nit de l'Albà · Elx",
      'hero.title': "El cel d'Elx, a les teues mans",
      'hero.sub': "Apadrina la teua palmera i reconeix-la la nit més màgica de l'any.",
      'hero.cta_add': "Apadrina la teua palmera",
      'hero.cta_ar': "Mode AR",
      'cd.days': "dies", 'cd.hours': "hores", 'cd.min': "min", 'cd.sec': "seg",
      'detail.simulate': "Simular al cel", 'detail.comments': "Comentaris",
      'detail.comment_ph': "Escriu un comentari…", 'detail.send': "Enviar",
      'detail.no_comments': "Encara no hi ha comentaris. Sigues el primer!",
      'add.title': "Apadrina la teua palmera", 'add.choose_type': "1 · Tria la teua palmera",
      'add.next': "Següent", 'add.place': "2 · Situa-la i personalitza",
      'add.pick_hint': "Toca el mapa per fixar on s'encendrà.",
      'add.name': "Nom de la palmera", 'add.time': "Hora d'encesa", 'add.note': "Nota familiar",
      'add.note_ph': "En memòria de l'iaio Vicent…", 'add.back': "Enrere",
      'add.checkout': "3 · Publica la teua palmera", 'add.price_label': "Apadrinament de palmera",
      'add.pay': "Pagar i publicar",
      'add.legal': "Pagament segur amb Stripe. Experiència simbòlica i digital.",
      'auth.title': "Entra a PalmAR", 'auth.sub': "Per apadrinar i comentar palmeres.",
      'auth.name': "Nom visible", 'auth.email': "Correu", 'auth.pass': "Contrasenya",
      'auth.signin': "Entrar", 'auth.signup': "Registra'm",
      'auth.to_signup': "No tens compte? Registra't", 'auth.to_signin': "Ja tens compte? Entra",
      'auth.title_signup': "Crea el teu compte",
      'auth.forgot': "Has oblidat la contrasenya?",
      'auth.title_reset': "Recupera la contrasenya",
      'auth.reset_sub': "Introdueix el teu correu i t'enviarem un enllaç per a restablir-la.",
      'auth.reset_btn': "Enviar enllaç",
      'auth.title_newpass': "Nova contrasenya", 'auth.newpass': "Nova contrasenya",
      'auth.newpass_btn': "Guardar contrasenya", 'auth.back_signin': "Tornar a entrar",
      'msg.reset_sent': "Correu enviat! Revisa la teua safata d'entrada per a restablir la contrasenya.",
      'msg.reset_done': "Contrasenya actualitzada! Ja pots entrar.",
      'msg.reset_nouser': "No hi ha cap compte amb eixe correu.",
      'msg.reset_local': "Mode demo (sense servidor de correu): defineix ací mateix la teua nova contrasenya.",
      'ar.hint': "Apunta al cel i toca per llançar palmeres",
      'info.p1': "PalmAR porta la Nit de l'Albà al teu mòbil. La nit del 13 al 14 d'agost, Elx omple el cel de palmeres de foc en honor al Palmeral.",
      'info.p2': "Mira totes les palmeres gratis. Si vols, apadrina la teua: tria l'animació, posa-li una nota i reconeix-la al cel amb realitat augmentada.",
      'msg.welcome': "Benvingut/da, {name}!", 'msg.bye': "Has eixit del compte.",
      'msg.need_login': "Entra per a fer això.", 'msg.comment_added': "Comentari publicat!",
      'msg.palmera_published': "La teua palmera ja brilla al cel d'Elx! ✦",
      'msg.pick_location': "Toca el mapa per situar la palmera.",
      'msg.name_required': "Posa-li un nom a la palmera.",
      'msg.paying': "Connectant amb el pagament…", 'msg.pay_ok': "Pagament confirmat!",
      'msg.pay_cancel': "Pagament cancel·lat.",
      'msg.ar_no_cam': "Sense càmera: et mostrem un cel estrelat.",
      'msg.loading': "Carregant palmeres…", 'msg.your_palmera': "(la teua)",
      'sim.caption': "{name} — {type}", 'common.at': "a les", 'common.you': "Tu",
      'my.title': "Les meues palmeres", 'my.empty': "Encara no tens cap palmera. Apadrina la primera!",
      'my.edit': "Editar", 'my.save': "Guardar", 'my.delete': "Eliminar",
      'my.delete_confirm': "Segur que vols eliminar esta palmera?",
      'my.deleted': "Palmera eliminada.", 'my.edit_title': "Editar palmera",
      'my.saved': "Canvis guardats!",
      'profile.title': "El meu perfil", 'profile.add': "Apadrina una palmera",
      'profile.logout': "Tancar sessió", 'profile.name_label': "Nom visible",
      'profile.save': "Guardar", 'profile.count': "{n} palmeres teues",
      'profile.count_one': "1 palmera teua", 'profile.count_zero': "Encara cap palmera",
      'msg.profile_saved': "Perfil actualitzat!",
      'add.desc': "Descripció", 'add.desc_ph': "Conta la història de la teua palmera…",
      'add.dedication': "Dedicatòria", 'add.dedication_ph': "Dedicada a…",
      'add.media': "Fotos i vídeos", 'add.media_add': "Afegir foto o vídeo",
      'add.media_hint': "Comparteix records de la teua palmera (màx. 5).",
      'add.use_location': "Usar la meua ubicació",
      'msg.locating': "Buscant la teua ubicació…", 'msg.geo_error': "No s'ha pogut obtindre la ubicació. Activa el GPS i els permisos.",
      'msg.geo_ok': "Ubicació fixada al mapa!",
      'add.free_price': "Gratis", 'add.publish_free': "Publicar gratis",
      'add.free_note': "Esta palmera és gratuïta ({n} de 2 gratis).",
      'detail.share': "Compartir", 'detail.description': "Descripció",
      'detail.dedication': "Dedicatòria", 'detail.official': "Oficial · Ajuntament d'Elx",
      'detail.gallery': "Galeria",
      'share.title': "Mira la meua palmera a PalmAR",
      'share.text': "{name} s'encén a les {time} a la Nit de l'Albà d'Elx. Mira-la en directe online! ✦",
      'share.copied': "Enllaç copiat al porta-retalls!",
      'share.copy_link': "Copiar enllaç", 'share.whatsapp': "WhatsApp",
      'share.instagram': "Instagram", 'share.facebook': "Facebook", 'share.x': "X (Twitter)",
      'share.ig_copied': "Enllaç copiat! Enganxa'l a la teua història d'Instagram.",
      'share.sheet_title': "Compartir palmera", 'share.your_link': "Enllaç de la teua palmera",
      'media.too_big': "L'arxiu és massa gran (màx. 3 MB).",
      'media.max_reached': "Màxim 5 arxius per palmera.",
      'ar.locating': "Localitzant-te…", 'ar.no_gps': "Sense GPS: mostrem el cel lliure.",
      'ar.look_here': "Gira cap ací ↑", 'ar.found': "La tens davant! ✦",
      'ar.distance': "a {d}", 'ar.no_palmeras': "No hi ha palmeres a prop. Toca per llançar-ne.",
      'ar.compass_help': "Segueix la fletxa cap a la palmera"
    },
    cas: {
      'nav.login': "Entrar", 'nav.map': "Mapa", 'nav.ar': "AR", 'nav.sim': "Cielo", 'nav.info': "Info",
      'nav.account': "Cuenta",
      'hero.kicker': "Nit de l'Albà · Elche",
      'hero.title': "El cielo de Elche, en tus manos",
      'hero.sub': "Apadrina tu palmera y reconócela la noche más mágica del año.",
      'hero.cta_add': "Apadrina tu palmera",
      'hero.cta_ar': "Modo AR",
      'cd.days': "días", 'cd.hours': "horas", 'cd.min': "min", 'cd.sec': "seg",
      'detail.simulate': "Simular en el cielo", 'detail.comments': "Comentarios",
      'detail.comment_ph': "Escribe un comentario…", 'detail.send': "Enviar",
      'detail.no_comments': "Aún no hay comentarios. ¡Sé el primero!",
      'add.title': "Apadrina tu palmera", 'add.choose_type': "1 · Elige tu palmera",
      'add.next': "Siguiente", 'add.place': "2 · Sitúala y personaliza",
      'add.pick_hint': "Toca el mapa para fijar dónde se encenderá.",
      'add.name': "Nombre de la palmera", 'add.time': "Hora de encendido", 'add.note': "Nota familiar",
      'add.note_ph': "En memoria del abuelo Vicente…", 'add.back': "Atrás",
      'add.checkout': "3 · Publica tu palmera", 'add.price_label': "Apadrinamiento de palmera",
      'add.pay': "Pagar y publicar",
      'add.legal': "Pago seguro con Stripe. Experiencia simbólica y digital.",
      'auth.title': "Entra en PalmAR", 'auth.sub': "Para apadrinar y comentar palmeras.",
      'auth.name': "Nombre visible", 'auth.email': "Correo", 'auth.pass': "Contraseña",
      'auth.signin': "Entrar", 'auth.signup': "Registrarme",
      'auth.to_signup': "¿No tienes cuenta? Regístrate", 'auth.to_signin': "¿Ya tienes cuenta? Entra",
      'auth.title_signup': "Crea tu cuenta",
      'auth.forgot': "¿Olvidaste la contraseña?",
      'auth.title_reset': "Recupera la contraseña",
      'auth.reset_sub': "Introduce tu correo y te enviaremos un enlace para restablecerla.",
      'auth.reset_btn': "Enviar enlace",
      'auth.title_newpass': "Nueva contraseña", 'auth.newpass': "Nueva contraseña",
      'auth.newpass_btn': "Guardar contraseña", 'auth.back_signin': "Volver a entrar",
      'msg.reset_sent': "¡Correo enviado! Revisa tu bandeja de entrada para restablecer la contraseña.",
      'msg.reset_done': "¡Contraseña actualizada! Ya puedes entrar.",
      'msg.reset_nouser': "No hay ninguna cuenta con ese correo.",
      'msg.reset_local': "Modo demo (sin servidor de correo): define aquí mismo tu nueva contraseña.",
      'ar.hint': "Apunta al cielo y toca para lanzar palmeras",
      'info.p1': "PalmAR trae la Nit de l'Albà a tu móvil. La noche del 13 al 14 de agosto, Elche llena el cielo de palmeras de fuego en honor al Palmeral.",
      'info.p2': "Mira todas las palmeras gratis. Si quieres, apadrina la tuya: elige la animación, ponle una nota y reconócela en el cielo con realidad aumentada.",
      'msg.welcome': "¡Bienvenido/a, {name}!", 'msg.bye': "Has cerrado sesión.",
      'msg.need_login': "Entra para hacer esto.", 'msg.comment_added': "¡Comentario publicado!",
      'msg.palmera_published': "¡Tu palmera ya brilla en el cielo de Elche! ✦",
      'msg.pick_location': "Toca el mapa para situar la palmera.",
      'msg.name_required': "Ponle un nombre a la palmera.",
      'msg.paying': "Conectando con el pago…", 'msg.pay_ok': "¡Pago confirmado!",
      'msg.pay_cancel': "Pago cancelado.",
      'msg.ar_no_cam': "Sin cámara: te mostramos un cielo estrellado.",
      'msg.loading': "Cargando palmeras…", 'msg.your_palmera': "(la tuya)",
      'sim.caption': "{name} — {type}", 'common.at': "a las", 'common.you': "Tú",
      'my.title': "Mis palmeras", 'my.empty': "Aún no tienes palmeras. ¡Apadrina la primera!",
      'my.edit': "Editar", 'my.save': "Guardar", 'my.delete': "Eliminar",
      'my.delete_confirm': "¿Seguro que quieres eliminar esta palmera?",
      'my.deleted': "Palmera eliminada.", 'my.edit_title': "Editar palmera",
      'my.saved': "¡Cambios guardados!",
      'profile.title': "Mi perfil", 'profile.add': "Apadrina una palmera",
      'profile.logout': "Cerrar sesión", 'profile.name_label': "Nombre visible",
      'profile.save': "Guardar", 'profile.count': "{n} palmeras tuyas",
      'profile.count_one': "1 palmera tuya", 'profile.count_zero': "Aún ninguna palmera",
      'msg.profile_saved': "¡Perfil actualizado!",
      'add.desc': "Descripción", 'add.desc_ph': "Cuenta la historia de tu palmera…",
      'add.dedication': "Dedicatoria", 'add.dedication_ph': "Dedicada a…",
      'add.media': "Fotos y vídeos", 'add.media_add': "Añadir foto o vídeo",
      'add.media_hint': "Comparte recuerdos de tu palmera (máx. 5).",
      'add.use_location': "Usar mi ubicación",
      'msg.locating': "Buscando tu ubicación…", 'msg.geo_error': "No se pudo obtener la ubicación. Activa el GPS y los permisos.",
      'msg.geo_ok': "¡Ubicación fijada en el mapa!",
      'add.free_price': "Gratis", 'add.publish_free': "Publicar gratis",
      'add.free_note': "Esta palmera es gratuita ({n} de 2 gratis).",
      'detail.share': "Compartir", 'detail.description': "Descripción",
      'detail.dedication': "Dedicatoria", 'detail.official': "Oficial · Ayuntamiento de Elche",
      'detail.gallery': "Galería",
      'share.title': "Mira mi palmera en PalmAR",
      'share.text': "{name} se enciende a las {time} en la Nit de l'Albà de Elche. ¡Mírala en directo online! ✦",
      'share.copied': "¡Enlace copiado al portapapeles!",
      'share.copy_link': "Copiar enlace", 'share.whatsapp': "WhatsApp",
      'share.instagram': "Instagram", 'share.facebook': "Facebook", 'share.x': "X (Twitter)",
      'share.ig_copied': "¡Enlace copiado! Pégalo en tu historia de Instagram.",
      'share.sheet_title': "Compartir palmera", 'share.your_link': "Enlace de tu palmera",
      'media.too_big': "El archivo es demasiado grande (máx. 3 MB).",
      'media.max_reached': "Máximo 5 archivos por palmera.",
      'ar.locating': "Localizándote…", 'ar.no_gps': "Sin GPS: mostramos el cielo libre.",
      'ar.look_here': "Gira hacia aquí ↑", 'ar.found': "¡La tienes delante! ✦",
      'ar.distance': "a {d}", 'ar.no_palmeras': "No hay palmeras cerca. Toca para lanzar.",
      'ar.compass_help': "Sigue la flecha hacia la palmera"
    }
  };

  const LABEL = { va: 'VAL', cas: 'CAS' };
  let lang = localStorage.getItem('palmar_lang') || 'va';
  if (!DICT[lang]) lang = 'va';

  function t(key, params) {
    let s = (DICT[lang] && DICT[lang][key]) || (DICT.cas[key]) || key;
    if (params) for (const k in params) s = s.replace('{' + k + '}', params[k]);
    return s;
  }

  function apply(root) {
    root = root || document;
    root.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      el.getAttribute('data-i18n-attr').split(';').forEach((pair) => {
        const [attr, key] = pair.split(':');
        if (attr && key) el.setAttribute(attr.trim(), t(key.trim()));
      });
    });
    const cur = document.getElementById('lang-current');
    if (cur) cur.textContent = LABEL[lang];
    document.documentElement.lang = (lang === 'va') ? 'ca-ES-valencia' : 'es';
  }

  function setLang(l) {
    if (!DICT[l]) return;
    lang = l;
    localStorage.setItem('palmar_lang', l);
    apply(document);
    window.dispatchEvent(new CustomEvent('langchange', { detail: { lang: l } }));
  }

  function toggle() { setLang(lang === 'va' ? 'cas' : 'va'); }

  window.I18N = { t, apply, setLang, toggle, get: () => lang };
})();
