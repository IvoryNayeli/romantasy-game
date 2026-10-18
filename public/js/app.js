// Point d'entrée : charge les données, choisit l'écran d'après l'adresse (?ecran=...) et l'affiche.
// Phase 2 : écrans alimentés par des données fictives, sans réseau ni logique de jeu.
// Écrans : accueil, regles, creer, rejoindre, salle, choix, carte, attente, transition, fin (voir README et demo.html).

import { chargerDonnees } from './donnees.js';
import { adresse, h } from './dom.js';
import * as ecrans from './ecrans.js';
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

const zone = document.getElementById('ecran');
const enteteGauche = document.getElementById('entete-gauche');
const cielEntete = document.getElementById('ciel-entete');
let donnees = null;
let nettoyer = null;

function afficher(premiere = false) {
  if (nettoyer) nettoyer();
  const params = new URLSearchParams(window.location.search);
  const nom = Object.hasOwn(ECRANS, params.get('ecran')) ? params.get('ecran') : 'accueil';
  const resultat = ECRANS[nom]({ donnees, params, naviguer });
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
  const url = typeof cible === 'string' ? cible : adresse(cible);
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
