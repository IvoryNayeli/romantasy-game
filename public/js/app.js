// Point d'entrée : charge les données, choisit l'écran d'après l'adresse (?ecran=...) et l'affiche.
// Écrans : accueil, regles, creer, rejoindre, salle, choix, carte, attente, transition, fin (voir README et demo.html).
// Phase 4 : « Créer », « Rejoindre » et la salle d'attente passent par la base (reseau.js), sauf en démonstration :
// ?demo=1 (liens de demo.html), ou salle ouverte avec des paramètres fictifs (hote, autres, complete…).
// Les écrans de tour et de fin restent fictifs jusqu'à la phase 5.

import { chargerDonnees } from './donnees.js';
import { adresse, h } from './dom.js';
import * as ecrans from './ecrans.js';
import * as ecransReseau from './ecrans-reseau.js';
import * as reseau from './reseau.js';
import { erreurs } from './textes.js';
import { constellation } from './ciel.js';

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

// Paramètres de la salle fictive (voir ecrans.salle) : leur présence ouvre la salle de démonstration.
const PARAMETRES_SALLE_FICTIVE = ['hote', 'autres', 'complete', 'prenom', 'embleme', 'pret'];

// Paramètres gardés d'un écran à l'autre : mode démonstration et base choisie (?base=dev).
const PARAMETRES_PERSISTANTS = ['demo', 'base'];

function modeDemo(nom, params) {
  return params.get('demo') === '1' || (nom === 'salle' && PARAMETRES_SALLE_FICTIVE.some((p) => params.has(p)));
}

const zone = document.getElementById('ecran');
const enteteGauche = document.getElementById('entete-gauche');
const cielEntete = document.getElementById('ciel-entete');
let donnees = null;
let nettoyer = null;

function afficher(premiere = false) {
  if (nettoyer) nettoyer();
  const params = new URLSearchParams(window.location.search);
  const nom = Object.hasOwn(ECRANS, params.get('ecran')) ? params.get('ecran') : 'accueil';
  const demo = modeDemo(nom, params);
  const fonction = nom === 'salle' && !demo ? ecransReseau.salle : ECRANS[nom];
  const resultat = fonction({ donnees, params, naviguer, reseau: demo ? null : reseau });
  nettoyer = resultat.nettoyer || null;
  document.body.dataset.ecran = nom;
  enteteGauche.replaceChildren(...(resultat.retour ? [resultat.retour] : []));
  const paire = CIEL_ENTETE[nom];
  cielEntete.replaceChildren(...(paire ? [constellation(paire[0], { classe: 'c-gauche' }), constellation(paire[1], { classe: 'c-droite' })] : []));
  zone.replaceChildren(resultat.noeud);
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
