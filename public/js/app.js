// Point d'entrée : charge les données, choisit l'écran d'après l'adresse (?ecran=...) et l'affiche.
// Écrans : accueil, regles, creer, rejoindre, salle, choix, carte, attente, transition, fin (voir README et demo.html).
// Phase 4 : « Créer », « Rejoindre » et la salle d'attente passent par la base (reseau.js), sauf en démonstration :
// ?demo=1 (liens de demo.html), ou salle ouverte avec des paramètres fictifs (hote, autres, complete…).
// Phase 5 : la partie en réseau est l'écran ?ecran=jeu&code=… (ecrans-reseau.js), qui affiche tour à tour les vues
// choix, carte, attente, transition et fin d'après la base. Les adresses ?ecran=choix, carte, attente, transition
// et fin restent les écrans de démonstration, avec des données fictives.
// Phase 8 : ces outils de démonstration ne fonctionnent qu'en local (navigation.js) ; en ligne, ils sont ignorés.

import { chargerDonnees } from './donnees.js';
import { adresse, h } from './dom.js';
import * as ecrans from './ecrans.js';
import * as ecransReseau from './ecrans-reseau.js';
import * as reseau from './reseau.js';
import { erreurs } from './textes.js';
import { constellation } from './ciel.js';
import { ecranAffiche } from './navigation.js';

// Constellations de la bande d'en-tête, de part et d'autre du logo : [petit motif à gauche, motif large à droite].
// Pas d'en-tête étoilé sur l'accueil, la transition et la fin : ces écrans ont déjà de grandes constellations dans
// leur espace libre (ne pas surcharger).
const CIEL_ENTETE = {
  accueil: null,
  regles: ['lyre', 'cassiopee'],
  creer: ['croix', 'ourse'],
  rejoindre: ['fleche', 'orion'],
  salle: ['couronne', 'cassiopee'],
  choix: ['lyre', 'dragon'],
  carte: ['croix', 'orion'],
  attente: ['fleche', 'ourse'],
  transition: null,
  fin: null,
  jeu: null,
};

const ECRANS = {
  accueil: ecrans.accueil,
  regles: ecrans.regles,
  creer: ecrans.creer,
  rejoindre: ecrans.rejoindre,
  salle: ecrans.salle,
  choix: ecrans.choix,
  carte: ecrans.carte,
  attente: ecrans.attente,
  transition: ecrans.transition,
  fin: ecrans.fin,
};

// Paramètres gardés d'un écran à l'autre : mode démonstration et base choisie (?base=dev).
const PARAMETRES_PERSISTANTS = ['demo', 'base'];

// Page servie depuis l'ordinateur ou le réseau local : seuls ces cas ouvrent les outils de démonstration.
const LOCAL = reseau.pageLocale();

const zone = document.getElementById('ecran');
const enteteGauche = document.getElementById('entete-gauche');
const cielEntete = document.getElementById('ciel-entete');
let donnees = null;
let nettoyer = null;

// Pose un écran (ou une vue de la partie en réseau) : contenu, nom sur le body, constellations de l'en-tête.
function montrer(nom, noeud) {
  document.body.dataset.ecran = nom;
  const paire = CIEL_ENTETE[nom];
  cielEntete.replaceChildren(...(paire ? [constellation(paire[0], { classe: 'c-gauche' }), constellation(paire[1], { classe: 'c-droite' })] : []));
  zone.replaceChildren(noeud);
  ecrans.ajusterCartes(zone);
}

// Phase 7 (remarque 44) : la carte révélée tient à l'écran ; on la réajuste si la fenêtre change de taille (barre
// d'adresse du téléphone, rotation) et une fois les polices chargées.
window.addEventListener('resize', () => ecrans.ajusterCartes(zone));
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ecrans.ajusterCartes(zone));

function afficher(premiere = false) {
  if (nettoyer) nettoyer();
  const params = new URLSearchParams(window.location.search);
  const { nom, demo } = ecranAffiche(params, LOCAL);
  let fonction = ECRANS[nom];
  if (nom === 'salle' && !demo) fonction = ecransReseau.salle;
  if (nom === 'jeu') fonction = ecransReseau.jeu;
  let actuel = true;
  // Changement de vue demandé par la partie en réseau, tant que l'écran est affiché.
  const vue = (nomVue, noeud) => {
    if (!actuel) return;
    montrer(nomVue, noeud);
    window.scrollTo(0, 0);
  };
  const resultat = fonction({ donnees, params, naviguer, reseau: demo ? null : reseau, vue });
  nettoyer = () => { actuel = false; if (resultat.nettoyer) resultat.nettoyer(); };
  enteteGauche.replaceChildren(...(resultat.retour ? [resultat.retour] : []));
  montrer(nom, resultat.noeud);
  window.scrollTo(0, 0);
  if (!premiere) zone.focus({ preventScroll: true });
}

function naviguer(cible) {
  const actuels = new URLSearchParams(window.location.search);
  const suite = new URLSearchParams(typeof cible === 'string' ? cible.replace(/^[^?]*\?/, '') : adresse(cible).slice(1));
  for (const p of PARAMETRES_PERSISTANTS) {
    if (actuels.has(p) && !suite.has(p)) suite.set(p, actuels.get(p));
  }
  const url = `?${suite.toString()}`;
  window.history.pushState(null, '', url);
  afficher();
}

function erreurChargement() {
  zone.replaceChildren(h('section', { classe: 'ecran' },
    h('p', { classe: 'texte' }, erreurs.chargement)));
}

document.addEventListener('click', (evenement) => {
  const lien = evenement.target.closest('a[data-nav]');
  if (!lien || evenement.defaultPrevented || evenement.button !== 0
    || evenement.metaKey || evenement.ctrlKey || evenement.shiftKey || evenement.altKey) return;
  evenement.preventDefault();
  naviguer(lien.getAttribute('href'));
});

window.addEventListener('popstate', () => afficher());

chargerDonnees()
  .then((d) => { donnees = d; afficher(true); })
  .catch(erreurChargement);
