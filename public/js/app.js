// Point d'entrée : charge les données, choisit l'écran d'après l'adresse (?ecran=...) et l'affiche.
// Phase 2 : écrans alimentés par des données fictives, sans réseau ni logique de jeu.
// Écrans : accueil, regles, salle, choix, carte, attente, transition, fin (voir README et demo.html).

import { chargerDonnees } from './donnees.js';
import { adresse, h } from './dom.js';
import * as ecrans from './ecrans.js';
import { erreurs } from './textes.js';

const ECRANS = {
  accueil: ecrans.accueil,
  regles: ecrans.regles,
  salle: ecrans.salle,
  choix: ecrans.choix,
  carte: ecrans.carte,
  attente: ecrans.attente,
  transition: ecrans.transition,
  fin: ecrans.fin,
};

const zone = document.getElementById('ecran');
const enteteGauche = document.getElementById('entete-gauche');
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
