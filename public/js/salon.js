// Salle d'attente en réseau (phase 4) : création et jonction d'une partie par code, emblème, présence
// (« Je suis là »), signal de départ (« Commencer la quête ») et nettoyage des parties.
//
// Ce module ne touche ni au DOM ni au SDK Firebase : les fonctions du SDK lui sont fournies dans un objet `fb`
// ({ db, ref, get, remove, runTransaction, onValue, serverTimestamp }, voir firebase.js). Le même code tourne
// donc dans le navigateur et dans les tests Node, contre l'émulateur local.
//
// Une partie vit sous `parties/<CODE>` (chemin unique : aucune lecture ni écoute de la racine) :
//   cree, actif   horodatages du serveur (création, dernière écriture) ;
//   hote          identifiant de la personne qui a créé la partie ;
//   max           nombre de places, recopié de config.json à la création ;
//   nb            nombre d'arrivées (le rang de chaque personne est son ordre d'arrivée, donc l'ordre des tours) ;
//   statut        « salle » puis « partie » quand l'hôte donne le signal ;
//   joueurs/<id>  { rang, pret, prenom?, embleme? } ;
//   emblemes/<emblème>  identifiant de la personne qui l'a choisi (un emblème = une seule personne) ;
//   ordre         (phase 4) identifiants des personnes présentes au départ, dans l'ordre des tours ;
//   jeu           (phase 5) état du moteur de game.js (piles, personne dont c'est le tour, carte, effets…),
//                 créé au départ et modifié ensuite seulement par les actions de tour, via le moteur.
// Toute modification passe par une transaction sur `parties/<CODE>` : deux personnes qui valident en même temps
// sont départagées par le serveur (places et emblèmes garantis). Les règles de database.rules.json vérifient
// en plus la forme, la taille et les mêmes invariants côté serveur.

import {
  JOUEURS_MINIMUM, ErreurJeu, creerPartie as creerJeu, choisirType, jeterSort, invoquerBouclier, terminerEffetParEchange,
} from './game.js';

export const RACINE = 'parties';

// Longueur maximale d'un prénom (même borne dans database.rules.json et dans le champ de saisie).
export const PRENOM_MAX = 24;

// Délai au-delà duquel une opération réseau est considérée comme impossible (le SDK attendrait indéfiniment).
export const DELAI_RESEAU_MS = 10000;

export const STATUTS = Object.freeze({ SALLE: 'salle', PARTIE: 'partie' });

// Une partie sans aucune écriture depuis ce délai est considérée comme abandonnée : son code redevient libre
// et le premier client qui la croise la supprime. Salle d'attente (pas encore démarrée) : 30 minutes ;
// partie démarrée : 3 heures. Mêmes durées dans database.rules.json, vérifiées par les tests.
export const EXPIRATION_SALLE_MS = 30 * 60 * 1000;
export const EXPIRATION_PARTIE_MS = 3 * 60 * 60 * 1000;

// Délai d'expiration selon le statut : tout ce qui n'est pas une partie démarrée suit le délai de la salle.
export function delaiExpiration(statut) {
  return statut === STATUTS.PARTIE ? EXPIRATION_PARTIE_MS : EXPIRATION_SALLE_MS;
}

// Issues possibles des opérations (champ `issue` du résultat).
export const ISSUES = Object.freeze({
  OK: 'ok',
  PRIS: 'pris', // code déjà utilisé par une partie en cours, ou emblème déjà choisi par quelqu'un d'autre
  INTROUVABLE: 'introuvable',
  COMPLETE: 'complete',
  COMMENCEE: 'commencee',
  REFUSE: 'refuse', // action hors de son moment (pas l'hôte, présence déjà confirmée, pas assez de monde…)
});

export class ErreurReseau extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'ErreurReseau';
    this.cause = cause;
  }
}

const CODE_VALIDE = /^[A-Z]{3,12}$/;
const EXPIREE = 'expiree'; // issue interne de creerPartie

export function cheminPartie(code) {
  if (typeof code !== 'string' || !CODE_VALIDE.test(code)) throw new Error(`Code de partie invalide : ${code}`);
  return `${RACINE}/${code}`;
}

function refPartie(fb, code, sousChemin = '') {
  return fb.ref(fb.db, sousChemin ? `${cheminPartie(code)}/${sousChemin}` : cheminPartie(code));
}

// Identifiant aléatoire d'une personne (crypto.getRandomValues existe aussi hors HTTPS, sur le réseau local).
export function nouvelIdentifiant() {
  const octets = new Uint8Array(16);
  globalThis.crypto.getRandomValues(octets);
  return Array.from(octets, (o) => o.toString(16).padStart(2, '0')).join('');
}

export function estExpiree(partie, maintenant = Date.now()) {
  if (!partie || typeof partie !== 'object') return true;
  return typeof partie.actif !== 'number' || maintenant - partie.actif > delaiExpiration(partie.statut);
}

// Personnes de la partie, dans l'ordre d'arrivée (rang), chacune avec son identifiant.
export function joueursOrdonnes(partie) {
  return Object.entries(partie?.joueurs || {})
    .map(([id, j]) => ({ id, ...j }))
    .sort((a, b) => a.rang - b.rang);
}

export function nombrePrets(partie) {
  return joueursOrdonnes(partie).filter((j) => j.pret === true).length;
}

export function peutCommencer(partie) {
  return Boolean(partie) && partie.statut === STATUTS.SALLE && nombrePrets(partie) >= JOUEURS_MINIMUM;
}

function avecDelai(promesse, delai) {
  let minuteur;
  const limite = new Promise((_, rejeter) => {
    minuteur = setTimeout(() => rejeter(new ErreurReseau('Délai réseau dépassé')), delai);
  });
  return Promise.race([promesse, limite]).finally(() => clearTimeout(minuteur));
}

async function reseau(promesse, delai = DELAI_RESEAU_MS) {
  try {
    return await avecDelai(promesse, delai);
  } catch (erreur) {
    if (erreur instanceof ErreurReseau) throw erreur;
    throw new ErreurReseau(erreur?.message || 'Erreur réseau', erreur);
  }
}

// Transaction sur la partie. `modifier(partie)` renvoie la nouvelle partie, ou { refus: issue } pour abandonner.
// Si la partie n'est pas encore connue localement, le SDK appelle d'abord `modifier(null)` : on renvoie alors null
// (aucune écriture) et le serveur rappelle la fonction avec la vraie valeur si elle existe.
async function transaction(fb, code, modifier, delai) {
  let refus = null;
  const resultat = await reseau(fb.runTransaction(refPartie(fb, code), (partie) => {
    refus = null;
    const r = modifier(partie);
    if (r && r.refus) { refus = r.refus; return undefined; }
    return r;
  }, { applyLocally: false }), delai);
  if (refus) return { issue: refus, partie: resultat.snapshot.val() };
  if (!resultat.committed) return { issue: ISSUES.REFUSE, partie: resultat.snapshot.val() };
  const partie = resultat.snapshot.val();
  return { issue: partie ? ISSUES.OK : ISSUES.INTROUVABLE, partie };
}

function copie(partie) {
  return structuredClone(partie);
}

// Création : prend le code s'il est libre (aucune partie, ou partie expirée), sinon « pris ».
// Si la partie en cours a déjà cette personne pour hôte (nouvel essai après un délai dépassé), c'est un succès.
export async function creerPartie(fb, { code, id, config, maintenant = () => Date.now() }) {
  if (!config || !Number.isInteger(config.joueursMax) || config.joueursMax < 1) throw new Error('config.joueursMax manquant');
  const essai = () => transaction(fb, code, (partie) => {
    if (partie && estExpiree(partie, maintenant())) return { refus: EXPIREE };
    if (partie) return partie.hote === id ? partie : { refus: ISSUES.PRIS };
    return {
      cree: fb.serverTimestamp(),
      actif: fb.serverTimestamp(),
      hote: id,
      max: config.joueursMax,
      nb: 1,
      statut: STATUTS.SALLE,
      joueurs: { [id]: { rang: 0, pret: false } },
    };
  });
  // Une partie expirée n'est jamais modifiée ni remplacée sur place (les règles le refusent) : on la supprime,
  // puis on crée la nouvelle sur un emplacement vide. Si quelqu'un d'autre a créé entre-temps : « pris ».
  const r = await essai();
  if (r.issue !== EXPIREE) return r;
  await supprimerPartie(fb, code);
  const suite = await essai();
  return suite.issue === EXPIREE ? { issue: ISSUES.PRIS, partie: suite.partie } : suite;
}

// Jonction : refusée si le code ne correspond à aucune partie en cours, si la partie est complète
// ou déjà commencée. Une personne déjà inscrite (même identifiant) est simplement acceptée.
export async function rejoindrePartie(fb, { code, id, maintenant = () => Date.now() }) {
  let expiree = false;
  const r = await transaction(fb, code, (partie) => {
    expiree = false;
    if (!partie) return null;
    if (estExpiree(partie, maintenant())) { expiree = true; return { refus: ISSUES.INTROUVABLE }; }
    if (partie.joueurs?.[id]) return partie;
    if (partie.statut !== STATUTS.SALLE) return { refus: ISSUES.COMMENCEE };
    if (Object.keys(partie.joueurs || {}).length >= partie.max || partie.nb >= partie.max) return { refus: ISSUES.COMPLETE };
    const suite = copie(partie);
    suite.joueurs[id] = { rang: partie.nb, pret: false };
    suite.nb = partie.nb + 1;
    suite.actif = fb.serverTimestamp();
    return suite;
  });
  if (expiree) await supprimerPartie(fb, code).catch(() => {});
  return r;
}

// Choix (ou changement) d'emblème, tant que la présence n'est pas confirmée.
export function choisirEmbleme(fb, { code, id, embleme }) {
  return transaction(fb, code, (partie) => {
    if (!partie) return null;
    if (estExpiree(partie)) return { refus: ISSUES.INTROUVABLE };
    const moi = partie.joueurs?.[id];
    if (!moi || moi.pret || partie.statut !== STATUTS.SALLE) return { refus: ISSUES.REFUSE };
    const titulaire = partie.emblemes?.[embleme];
    if (titulaire && titulaire !== id) return { refus: ISSUES.PRIS };
    if (moi.embleme === embleme) return { refus: ISSUES.OK };
    const suite = copie(partie);
    suite.emblemes = suite.emblemes || {};
    if (moi.embleme) delete suite.emblemes[moi.embleme];
    suite.emblemes[embleme] = id;
    suite.joueurs[id].embleme = embleme;
    suite.actif = fb.serverTimestamp();
    return suite;
  });
}

// « Je suis là » : prénom (non vide, borné) et emblème obligatoires ; définitif ensuite.
export function confirmerPresence(fb, { code, id, prenom }) {
  const propre = String(prenom ?? '').trim();
  if (!propre || propre.length > PRENOM_MAX) return Promise.resolve({ issue: ISSUES.REFUSE, partie: null });
  return transaction(fb, code, (partie) => {
    if (!partie) return null;
    if (estExpiree(partie)) return { refus: ISSUES.INTROUVABLE };
    const moi = partie.joueurs?.[id];
    if (!moi || moi.pret || !moi.embleme || partie.statut !== STATUTS.SALLE) return { refus: ISSUES.REFUSE };
    const suite = copie(partie);
    suite.joueurs[id].prenom = propre;
    suite.joueurs[id].pret = true;
    suite.actif = fb.serverTimestamp();
    return suite;
  });
}

// « Commencer la quête » : réservé à l'hôte, dès que le minimum de présences confirmées est atteint.
// Le départ crée aussi l'état du jeu (moteur de game.js), dans la même écriture : piles mélangées, tour 1,
// première personne de l'ordre. `cartes` et `config` viennent de public/data/ ; `aleatoire` : hasard injecté.
export function commencerPartie(fb, { code, id, cartes, config, aleatoire = aleatoireCrypto }) {
  return transaction(fb, code, (partie) => {
    if (!partie) return null;
    if (estExpiree(partie)) return { refus: ISSUES.INTROUVABLE };
    if (partie.hote !== id || !peutCommencer(partie)) return { refus: ISSUES.REFUSE };
    const suite = copie(partie);
    suite.statut = STATUTS.PARTIE;
    // Ordre des tours : les personnes qui ont confirmé leur présence, dans l'ordre d'arrivée. Les règles exigent
    // cette liste (au moins deux personnes présentes et distinctes) pour accepter le départ. Les personnes inscrites
    // sans « Je suis là » n'y figurent pas : elles ne jouent pas (la salle leur affiche « La quête a déjà commencé »).
    suite.ordre = joueursOrdonnes(partie).filter((j) => j.pret === true).map((j) => j.id);
    try {
      suite.jeu = creerJeu({ joueurs: suite.ordre, cartes, config, aleatoire });
    } catch (erreur) {
      if (erreur instanceof ErreurJeu) return { refus: ISSUES.REFUSE };
      throw erreur;
    }
    suite.actif = fb.serverTimestamp();
    return suite;
  });
}

// Hasard du mélange des piles (crypto.getRandomValues, disponible aussi hors HTTPS) : nombre dans [0, 1[.
export function aleatoireCrypto() {
  return globalThis.crypto.getRandomValues(new Uint32Array(1))[0] / 0x100000000;
}

// Actions de tour (phase 5) : chacune est appliquée par le moteur de game.js à l'état `jeu` de la partie, dans une
// transaction. Le moteur refuse toute action hors de son moment, en particulier celle d'une personne dont ce n'est
// pas le tour (issue « refuse », rien n'est écrit) ; les règles de database.rules.json vérifient en plus que l'état
// écrit suit un enchaînement possible.
export const ACTIONS = Object.freeze({
  CHOISIR: 'choisir', // « À toi de jouer ! » : choix du type (paramètre `type`), la carte du dessus est tirée
  SORT: 'sort', // « Le sort est jeté »
  BOUCLIER: 'bouclier', // « Invoquer un bouclier »
  ECHANGE: 'echange', // un effet durable a provoqué un échange de butins (paramètre `carte`) : n'importe qui, à tout moment
});

function appliquer(jeu, { id, action, type, carte }) {
  if (action === ACTIONS.CHOISIR) return choisirType(jeu, id, type);
  if (action === ACTIONS.SORT) return jeterSort(jeu, id);
  if (action === ACTIONS.BOUCLIER) return invoquerBouclier(jeu, id);
  if (action === ACTIONS.ECHANGE) return terminerEffetParEchange(jeu, id, carte);
  return null;
}

export function jouer(fb, { code, id, action, type = null, carte = null }) {
  return transaction(fb, code, (partie) => {
    if (!partie) return null;
    if (estExpiree(partie)) return { refus: ISSUES.INTROUVABLE };
    if (partie.statut !== STATUTS.PARTIE || !partie.jeu) return { refus: ISSUES.REFUSE };
    let jeu;
    try {
      jeu = appliquer(partie.jeu, { id, action, type, carte });
    } catch (erreur) {
      if (erreur instanceof ErreurJeu) return { refus: ISSUES.REFUSE };
      throw erreur;
    }
    if (!jeu) return { refus: ISSUES.REFUSE };
    const suite = copie(partie);
    suite.jeu = jeu;
    suite.actif = fb.serverTimestamp();
    return suite;
  });
}

// Écoute de la partie en cours, et d'elle seule. Le rappel ne fait qu'afficher : il n'écrit jamais
// (pas de boucle d'écriture). Renvoie la fonction qui arrête l'écoute.
export function ecouterPartie(fb, code, rappel, enErreur = () => {}) {
  return fb.onValue(refPartie(fb, code), (instantane) => rappel(instantane.val()), enErreur);
}

// Suppression d'une partie : partie expirée (nettoyage), ou partie terminée quand une personne quitte l'écran de fin
// par « Nouvelle quête » (les autres n'écoutent plus la partie une fois l'écran de fin affiché).
export function supprimerPartie(fb, code) {
  return reseau(fb.remove(refPartie(fb, code)));
}

// Codes déjà pris par une partie en cours (lecture ponctuelle de `parties/<CODE>/actif` et `statut` pour
// chaque code, sans écoute). Les parties expirées croisées au passage sont supprimées : c'est le nettoyage opportuniste.
export async function codesPris(fb, codes, { maintenant = () => Date.now() } = {}) {
  const lus = await Promise.all(codes.map(async (code) => {
    const [actif, statut] = await Promise.all(['actif', 'statut'].map(async (champ) => (await reseau(fb.get(refPartie(fb, code, champ)))).val()));
    return { code, actif, statut };
  }));
  const pris = new Set();
  const purges = [];
  for (const { code, actif, statut } of lus) {
    if (actif === null) continue;
    if (estExpiree({ actif, statut }, maintenant())) purges.push(supprimerPartie(fb, code).catch(() => {}));
    else pris.add(code);
  }
  await Promise.all(purges);
  return pris;
}
