// Lien entre les écrans et la base (phase 4) : chargement à la demande du SDK Firebase, choix de la base
// (émulateur local, romantasy-dev), identité de la personne sur ce téléphone.
// Les écrans de démonstration (?demo=1, demo.html) n'utilisent jamais ce module.

import { choisirBase } from './firebase-config.js';
import * as salon from './salon.js';

export { ISSUES } from './salon.js';

let connexion = null;

// Base ouverte une seule fois par page. Si le SDK ne se charge pas (pas de réseau), on réessaiera plus tard.
function base() {
  if (!connexion) {
    const choix = choisirBase(window.location.hostname, new URLSearchParams(window.location.search));
    connexion = import('./firebase.js')
      .then((m) => m.connecter(choix))
      .catch((erreur) => {
        connexion = null;
        throw new salon.ErreurReseau('SDK Firebase indisponible', erreur);
      });
  }
  return connexion;
}

// Identité de la personne pour une partie : tirée au hasard et gardée dans l'onglet (sessionStorage),
// pour qu'un rechargement de la page ou un nouvel essai après un délai dépassé la retrouve.
// Un onglet = une personne : on peut donc essayer à plusieurs sur un même ordinateur.
const memoire = new Map();
const cle = (code) => `romantasy-joueur-${code}`;

export function identiteConnue(code) {
  try {
    return window.sessionStorage.getItem(cle(code)) || memoire.get(code) || null;
  } catch {
    return memoire.get(code) || null;
  }
}

function identite(code) {
  let id = identiteConnue(code);
  if (!id) {
    id = salon.nouvelIdentifiant();
    memoire.set(code, id);
    try { window.sessionStorage.setItem(cle(code), id); } catch { /* stockage indisponible : mémoire de la page */ }
  }
  return id;
}

export async function codesPris(codes) {
  return salon.codesPris(await base(), codes);
}

export async function creer(code, config) {
  return (await salon.creerPartie(await base(), { code, id: identite(code), config })).issue;
}

export async function rejoindre(code) {
  return (await salon.rejoindrePartie(await base(), { code, id: identite(code) })).issue;
}

export async function choisirEmbleme(code, embleme) {
  return (await salon.choisirEmbleme(await base(), { code, id: identite(code), embleme })).issue;
}

export async function confirmerPresence(code, prenom) {
  return (await salon.confirmerPresence(await base(), { code, id: identite(code), prenom })).issue;
}

// Le départ crée l'état du jeu : il faut les cartes et les réglages (public/data/).
export async function commencer(code, donnees) {
  return (await salon.commencerPartie(await base(), {
    code, id: identite(code), cartes: donnees.cartes, config: donnees.config,
  })).issue;
}

// Action de tour (salon.ACTIONS) : « type » pour le choix de carte, « carte » pour la fin d'un effet par échange.
export async function jouer(code, action, { type = null, carte = null } = {}) {
  return (await salon.jouer(await base(), { code, id: identite(code), action, type, carte })).issue;
}

// Partie terminée : supprimée quand une personne quitte l'écran de fin (« Nouvelle quête »).
export async function supprimer(code) {
  return salon.supprimerPartie(await base(), code);
}

// Écoute de la partie en cours ; renvoie la fonction qui l'arrête (appelée en quittant l'écran).
export function ecouter(code, rappel, enErreur) {
  let arreter = null;
  let arrete = false;
  base()
    .then((fb) => { if (!arrete) arreter = salon.ecouterPartie(fb, code, rappel, enErreur); })
    .catch(enErreur);
  return () => { arrete = true; if (arreter) arreter(); };
}

export const { joueursOrdonnes, peutCommencer, PRENOM_MAX, STATUTS, ACTIONS } = salon;
