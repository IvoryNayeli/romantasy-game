// Écran allumé pendant la salle d'attente et la partie (phase 6), par l'API Wake Lock.
// Dégradation silencieuse : si l'API n'existe pas (navigateur ancien, page hors HTTPS comme sur le réseau local)
// ou si le navigateur refuse (économie d'énergie), rien ne se passe et le jeu fonctionne normalement.
// Le navigateur relâche le verrou dès que la page est cachée (autre application, écran éteint) : il est redemandé
// au retour de la page au premier plan, tant qu'un écran du jeu le veut.
// Comme la présence (reseau.js), la libération est différée au tour suivant de la boucle d'événements : un
// changement d'écran qui le redemande aussitôt ne le relâche pas.

let voulu = false;
let verrou = null;
let demande = null;
let minuteur = null;

function disponible() {
  return typeof navigator !== 'undefined' && Boolean(navigator.wakeLock) && typeof navigator.wakeLock.request === 'function';
}

function prendre() {
  if (!voulu || verrou || demande || !disponible() || document.visibilityState !== 'visible') return;
  demande = navigator.wakeLock.request('screen')
    .then((v) => {
      verrou = v;
      v.addEventListener('release', () => { if (verrou === v) verrou = null; });
      if (!voulu) relacherMaintenant();
    })
    .catch(() => { /* refusé ou indisponible : aucun message */ })
    .finally(() => { demande = null; });
}

function relacherMaintenant() {
  const v = verrou;
  verrou = null;
  if (v) v.release().catch(() => {});
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') prendre(); });
}

// Demande l'écran allumé ; renvoie la fonction qui y renonce (à appeler en quittant l'écran).
export function garderEcranAllume() {
  clearTimeout(minuteur);
  minuteur = null;
  voulu = true;
  prendre();
  return () => {
    clearTimeout(minuteur);
    minuteur = setTimeout(() => { voulu = false; relacherMaintenant(); }, 0);
  };
}
