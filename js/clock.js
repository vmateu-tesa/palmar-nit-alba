/* =====================================================================
   Elx al Cel — Rellotge centralitzat
   Tota l'app pregunta l'hora ací. En mode normal és l'hora real; en mode
   demostració (?demo=1) s'aplica un desplaçament perquè el programa
   semble estar passant "ara mateix" (útil per a presentacions).
   ===================================================================== */
(function () {
  let offset = 0;
  window.Clock = {
    setOffset: (ms) => { offset = ms || 0; },
    now: () => Date.now() + offset,
    isShifted: () => offset !== 0
  };
})();
