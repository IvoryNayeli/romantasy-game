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
// « cible » pour le passage du tour d'une personne absente (phase 6).
export async function jouer(code, action, { type = null, carte = null, cible = null } = {}) {
  return (await salon.jouer(await base(), { code, id: identite(code), action, type, carte, cible })).issue;
}

// Présence de la personne dans la partie (phase 6), une seule à la fois par page. Les écrans de la salle et de la
// partie la demandent à leur construction ; la fonction renvoyée la libère au tour suivant de la boucle d'événements,
// sauf si l'écran suivant la redemande pour la même partie (passage de la salle à la partie, nouvelle vue) : les
// autres ne voient donc jamais la personne absente le temps d'un changement d'écran.
let presence = null; // { code, arreter, minuteur }

function demarrerPresence(code) {
  let arreter = null;
  let arrete = false;
  base()
    .then((fb) => { if (!arrete) arreter = salon.signalerPresence(fb, code, identite(code)); })
    .catch(() => { /* hors ligne : le SDK n'a pas pu se charger, rien à signaler */ });
  return () => { arrete = true; if (arreter) arreter(); };
}

export function arreterPresence() {
  if (!presence) return;
  clearTimeout(presence.minuteur);
  presence.arreter();
  presence = null;
}

export function signalerPresence(code) {
  if (presence && presence.code === code) {
    clearTimeout(presence.minuteur);
    presence.minuteur = null;
  } else {
    arreterPresence();
    presence = { code, arreter: demarrerPresence(code), minuteur: null };
  }
  const courante = presence;
  return () => {
    if (presence !== courante) return;
    clearTimeout(courante.minuteur);
    courante.minuteur = setTimeout(() => { if (presence === courante) arreterPresence(); }, 0);
  };
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

export const {
  joueursOrdonnes, peutCommencer, estAbsent, PRENOM_MAX, STATUTS, ACTIONS,
} = salon;
