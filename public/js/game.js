// Moteur de jeu (phase 3) : logique pure, sans DOM, sans réseau, sans Firebase, sans dépendance.
//
// L'état d'une partie est un objet simple, sérialisable en JSON (il sera stocké dans Firebase en phases 4-5)
// et de taille bornée : deux piles d'identifiants de cartes, la liste des personnes, les cartes jouées
// (au plus « nombre de personnes × nombre de tours » entrées) et les effets durables en cours.
// Chaque action prend un état et renvoie un NOUVEL état, sans modifier celui reçu.
// Une action faite hors de son moment est refusée par une ErreurJeu (champ `code`).
//
// Réglages : le nombre de tours et le nombre maximal de personnes viennent UNIQUEMENT de config.json,
// passé en paramètre. Le hasard est injecté (fonction qui renvoie un nombre dans [0, 1[) : voir
// `aleatoireDepuisGraine` pour un tirage reproductible.

// Nombre minimal de personnes pour commencer (docs/regles.md : « actif dès que 2 personnes ont confirmé
// leur présence »). Règle du jeu, pas un réglage : constante unique, reprise par fictif.js et salon.js.
export const JOUEURS_MINIMUM = 2;

// Étapes d'une partie.
export const ETAPES = Object.freeze({ CHOIX: 'choix', CARTE: 'carte', FIN: 'fin' });

// Issues d'un tour : « Le sort est jeté », « Invoquer un bouclier », ou tour passé par une autre personne
// pendant l'absence de la personne qui devait jouer (phase 6).
export const ISSUES = Object.freeze({ SORT: 'sort', BOUCLIER: 'bouclier', PASSE: 'passe' });

// Durées des effets durables (champ `duree` de cartes.json).
export const DUREES = Object.freeze({ PROCHAIN_TOUR: 'prochain_tour', FIN_PARTIE: 'fin_partie' });

export class ErreurJeu extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ErreurJeu';
    this.code = code;
  }
}

function refuser(code, message) {
  throw new ErreurJeu(code, message);
}

// Générateur pseudo-aléatoire reproductible (mulberry32) : même graine, même suite de nombres dans [0, 1[.
export function aleatoireDepuisGraine(graine) {
  let a = Number(graine) >>> 0;
  return function aleatoire() {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
}

// Mélange de Fisher-Yates, avec la fonction de hasard fournie.
function melanger(liste, aleatoire) {
  const copie = liste.slice();
  for (let i = copie.length - 1; i > 0; i -= 1) {
    const r = aleatoire();
    if (typeof r !== 'number' || !(r >= 0 && r < 1)) refuser('hasard-invalide', 'La fonction de hasard doit renvoyer un nombre entre 0 (inclus) et 1 (exclu).');
    const j = Math.floor(r * (i + 1));
    [copie[i], copie[j]] = [copie[j], copie[i]];
  }
  return copie;
}

function entierPositif(n) {
  return Number.isInteger(n) && n >= 1;
}

// Firebase ne stocke pas les tableaux vides : un état relu peut en être privé. On les rétablit ici.
function copier(etat) {
  if (!etat || typeof etat !== 'object') refuser('etat-invalide', 'État de partie absent ou invalide.');
  const copie = structuredClone(etat);
  copie.joueurs = copie.joueurs || [];
  copie.piles = copie.piles || {};
  for (const type of copie.types || []) copie.piles[type] = copie.piles[type] || [];
  copie.jouees = copie.jouees || [];
  copie.effets = copie.effets || [];
  copie.durables = copie.durables || {};
  if (copie.carte === undefined) copie.carte = null;
  if (copie.derniere === undefined) copie.derniere = null;
  return copie;
}

// Crée une partie. `joueurs` : identifiants des personnes, dans l'ordre d'arrivée dans le salon,
// qui est l'ordre des tours (docs/regles.md, « Salle d'attente »).
export function creerPartie({ joueurs, cartes, config, aleatoire } = {}) {
  if (!config || !entierPositif(config.tours) || !entierPositif(config.joueursMax)) {
    refuser('config-invalide', 'config.json doit fournir « tours » et « joueursMax » (entiers positifs).');
  }
  if (typeof aleatoire !== 'function') refuser('hasard-absent', 'Une fonction de hasard doit être fournie.');
  if (!Array.isArray(joueurs) || joueurs.some((j) => typeof j !== 'string' || j === '')) {
    refuser('joueurs-invalides', 'La liste des personnes doit contenir des identifiants non vides.');
  }
  if (new Set(joueurs).size !== joueurs.length) refuser('joueurs-en-double', 'Une même personne figure deux fois dans la partie.');
  if (joueurs.length < JOUEURS_MINIMUM) refuser('pas-assez-de-joueurs', `Il faut au moins ${JOUEURS_MINIMUM} personnes pour commencer.`);
  if (joueurs.length > config.joueursMax) refuser('partie-complete', 'La partie est complète.');
  if (!Array.isArray(cartes) || cartes.length === 0) refuser('cartes-absentes', 'Aucune carte fournie.');

  const types = [];
  const durables = {};
  const ids = new Set();
  for (const c of cartes) {
    if (!c || typeof c.id !== 'string' || typeof c.type !== 'string') refuser('carte-invalide', 'Carte sans identifiant ou sans type.');
    if (ids.has(c.id)) refuser('carte-en-double', `Carte en double : ${c.id}.`);
    ids.add(c.id);
    if (!types.includes(c.type)) types.push(c.type);
    if (c.duree) {
      if (c.duree !== DUREES.PROCHAIN_TOUR && c.duree !== DUREES.FIN_PARTIE) refuser('duree-inconnue', `Durée inconnue pour ${c.id} : ${c.duree}.`);
      durables[c.id] = { duree: c.duree, effet: String(c.effet || '') };
    }
  }

  // Pire cas : tout le monde choisit le même type à chaque tour. Chaque pile doit donc suffire à toute la partie.
  const besoin = joueurs.length * config.tours;
  const piles = {};
  for (const type of types) {
    const pile = cartes.filter((c) => c.type === type).map((c) => c.id);
    if (pile.length < besoin) {
      refuser('pile-insuffisante', `La pile « ${type} » n'a que ${pile.length} cartes pour ${besoin} tours possibles.`);
    }
    piles[type] = melanger(pile, aleatoire);
  }

  return {
    tours: config.tours,
    joueurs: joueurs.slice(),
    types,
    piles,
    durables,
    indexJoueur: 0,
    tour: 1,
    etape: ETAPES.CHOIX,
    carte: null,
    jouees: [],
    effets: [],
    derniere: null,
  };
}

// --- Lecture de l'état -------------------------------------------------------------------------

export function joueurCourant(etat) {
  return etat.etape === ETAPES.FIN ? null : etat.joueurs[etat.indexJoueur];
}

// Compteur « Tour N / total » : tour de la partie (toutes les personnes jouent une fois par tour).
export function compteur(etat) {
  return { tour: etat.tour, total: etat.tours };
}

export function estFinie(etat) {
  return etat.etape === ETAPES.FIN;
}

export function effetsEnCours(etat) {
  return (etat.effets || []).map((e) => ({ ...e }));
}

export function effetsDe(etat, joueur) {
  return effetsEnCours(etat).filter((e) => e.joueur === joueur);
}

export function cartesRestantes(etat, type) {
  return ((etat.piles || {})[type] || []).length;
}

// --- Actions -----------------------------------------------------------------------------------

function verifierTour(etat, joueur, etapeAttendue) {
  if (etat.etape === ETAPES.FIN) refuser('partie-finie', 'La partie est terminée.');
  if (!etat.joueurs.includes(joueur)) refuser('joueur-inconnu', 'Cette personne ne fait pas partie de la partie.');
  if (joueur !== joueurCourant(etat)) refuser('pas-son-tour', 'Ce n\'est pas le tour de cette personne.');
  if (etat.etape !== etapeAttendue) {
    if (etapeAttendue === ETAPES.CHOIX) refuser('carte-deja-tiree', 'Une carte est déjà tirée pour ce tour.');
    refuser('aucune-carte', 'Aucune carte n\'a encore été tirée pour ce tour.');
  }
}

// « À toi de jouer ! » : la personne dont c'est le tour choisit un type ; la carte du dessus de la pile est tirée.
// Une carte tirée quitte la pile : elle ne peut plus ressortir de la partie.
export function choisirType(etatInitial, joueur, type) {
  const etat = copier(etatInitial);
  verifierTour(etat, joueur, ETAPES.CHOIX);
  if (!etat.types.includes(type)) refuser('type-inconnu', `Type de carte inconnu : ${type}.`);
  const pile = etat.piles[type];
  if (pile.length === 0) refuser('pile-vide', `Plus aucune carte dans la pile « ${type} ».`);
  etat.carte = pile.shift();
  etat.etape = ETAPES.CARTE;
  return etat;
}

// Passe à la personne suivante, ou au tour suivant, ou à la fin de la partie.
function terminerTour(etat, joueur, issue) {
  etat.jouees.push({ carte: etat.carte, joueur, tour: etat.tour, issue });
  etat.derniere = { carte: etat.carte, joueur, issue };
  etat.carte = null;
  etat.indexJoueur += 1;
  if (etat.indexJoueur >= etat.joueurs.length) {
    etat.indexJoueur = 0;
    etat.tour += 1;
  }
  if (etat.tour > etat.tours) {
    // Fin : chaque personne a joué « tours » fois. Le compteur reste sur le dernier tour ; tous les effets prennent fin.
    etat.tour = etat.tours;
    etat.indexJoueur = 0;
    etat.etape = ETAPES.FIN;
    etat.effets = [];
    return etat;
  }
  // Début du tour de la personne suivante : ses effets « jusqu'à son prochain tour » prennent fin.
  const suivant = etat.joueurs[etat.indexJoueur];
  etat.effets = etat.effets.filter((e) => !(e.joueur === suivant && e.duree === DUREES.PROCHAIN_TOUR));
  etat.etape = ETAPES.CHOIX;
  return etat;
}

// « Le sort est jeté » : la carte est accomplie. Si elle est durable, son effet commence pour la personne qui l'a jouée.
export function jeterSort(etatInitial, joueur) {
  const etat = copier(etatInitial);
  verifierTour(etat, joueur, ETAPES.CARTE);
  const durable = etat.durables[etat.carte];
  if (durable) etat.effets.push({ carte: etat.carte, joueur, duree: durable.duree, effet: durable.effet, depuisTour: etat.tour });
  return terminerTour(etat, joueur, ISSUES.SORT);
}

// « Invoquer un bouclier » : la carte est refusée, son effet est annulé, mais le tour est tout de même compté.
export function invoquerBouclier(etatInitial, joueur) {
  const etat = copier(etatInitial);
  verifierTour(etat, joueur, ETAPES.CARTE);
  return terminerTour(etat, joueur, ISSUES.BOUCLIER);
}

// Un effet durable a provoqué un échange de butins : il prend fin. N'importe quelle personne de la partie peut
// le signaler, à tout moment de la partie (pas seulement pendant son tour). `carte` : identifiant de la carte de l'effet.
export function terminerEffetParEchange(etatInitial, joueur, carte) {
  const etat = copier(etatInitial);
  if (etat.etape === ETAPES.FIN) refuser('partie-finie', 'La partie est terminée.');
  if (!etat.joueurs.includes(joueur)) refuser('joueur-inconnu', 'Cette personne ne fait pas partie de la partie.');
  const avant = etat.effets.length;
  etat.effets = etat.effets.filter((e) => e.carte !== carte);
  if (etat.effets.length === avant) refuser('effet-inconnu', 'Aucun effet en cours pour cette carte.');
  return etat;
}

// Phase 6 : tour d'une personne absente passé par une autre personne de la partie (`joueur`). `cible` : la personne
// dont le tour est passé ; si ce n'est plus son tour (déjà passé par quelqu'un d'autre), l'action est refusée, pour
// ne jamais passer deux tours d'un coup. Le tour est compté, comme un bouclier : une carte déjà tirée est consumée
// (elle ne ressortira pas) et son effet durable ne commence pas ; si aucune carte n'était tirée, le tour est noté
// sans carte. L'absence elle-même est jugée par la couche réseau (salon.js), pas par le moteur.
export function passerTour(etatInitial, joueur, cible) {
  const etat = copier(etatInitial);
  if (etat.etape === ETAPES.FIN) refuser('partie-finie', 'La partie est terminée.');
  if (!etat.joueurs.includes(joueur)) refuser('joueur-inconnu', 'Cette personne ne fait pas partie de la partie.');
  const courant = joueurCourant(etat);
  if (cible !== courant) refuser('pas-son-tour', 'Ce n\'est pas le tour de cette personne.');
  if (joueur === courant) refuser('son-propre-tour', 'Pas question de passer son propre tour : le bouclier est fait pour ça.');
  return terminerTour(etat, courant, ISSUES.PASSE);
}
