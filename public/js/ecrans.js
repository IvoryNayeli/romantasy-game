// Les écrans du jeu. Chaque fonction reçoit un contexte { donnees, params, naviguer }
// et renvoie { noeud, retour?, nettoyer? }. Phase 2 : données fictives, aucune logique de jeu.

import { h, icone, lienBouton } from './dom.js';
import * as T from './textes.js';
import {
  joueursFictifs, effetsEnCours, emblemeParId, carteDepuisParametres,
  tourDepuisParametres, entierDepuisParametres, PRETS_MINIMUM,
} from './fictif.js';

const DUREE_TRANSITION_MS = 2000; // « Transition de 2 secondes » (docs/regles.md)

/* ---------- Éléments réutilisables ---------- */

function emblemeEl(emb, classe = '') {
  return h('span', { classe: `embleme ${classe}`.trim(), role: 'img', 'aria-label': emb.nom }, emb.emoji);
}

function compteurEl(donnees, n) {
  return h('p', { classe: 'compteur' }, T.tour.compteur(n, donnees.config.tours));
}

function dureeTexte(duree, perspective) {
  if (duree === 'fin_partie') return T.effets.finPartie;
  return perspective === 'soi' ? T.effets.prochainTourSoi : T.effets.prochainTourAutre;
}

// Bandeau d'un effet durable (champ `effet` de la carte, libellé court).
function bandeauEffet(effet, duree, perspective) {
  return h('div', { classe: 'bandeau-effet', role: 'note' },
    icone('lueur', 'bandeau-icone'),
    h('div', { classe: 'bandeau-corps' },
      h('span', { classe: 'bandeau-legende' }, T.effets.carte),
      h('strong', { classe: 'bandeau-texte' }, effet),
      h('span', { classe: 'bandeau-duree' }, dureeTexte(duree, perspective))));
}

// Carte révélée : en-tête (couleur + symbole + nom du type), texte, bandeau si effet durable.
// Le retournement 3D est une animation CSS jouée à l'affichage (supprimée si animations réduites).
function carteEl(carte, perspective) {
  const type = T.types[carte.type];
  return h('article', { classe: `carte carte-${carte.type}`, 'data-carte': carte.id },
    h('div', { classe: 'carte-3d' },
      h('div', { classe: 'carte-face' },
        h('header', { classe: 'carte-entete' }, icone(type.symbole, 'carte-symbole'), h('span', null, type.nom)),
        h('p', { classe: 'carte-texte' }, carte.texte),
        carte.effet ? bandeauEffet(carte.effet, carte.duree, perspective) : null),
      h('div', { classe: 'carte-dos', 'aria-hidden': 'true' }, icone(type.symbole, 'carte-dos-symbole'))));
}

function barreBas(...boutons) {
  return h('div', { classe: 'barre-bas' }, ...boutons);
}

/* ---------- Écrans ---------- */

export function accueil() {
  const noeud = h('section', { classe: 'ecran ecran-accueil' },
    h('div', { classe: 'accueil-corps' },
      h('p', { classe: 'accueil-salut' }, T.accueil.salut),
      h('div', { classe: 'ornement', 'aria-hidden': 'true' }, icone('etoile')),
      h('p', { classe: 'texte' }, T.accueil.texte1),
      h('p', { classe: 'texte' }, T.accueil.texte2)),
    barreBas(lienBouton(T.accueil.bouton, { ecran: 'regles' })));
  return { noeud };
}

export function regles({ donnees }) {
  const R = T.regles;
  const noeud = h('section', { classe: 'ecran ecran-regles' },
    h('div', { classe: 'regles-corps' },
      h('h2', null, R.butTitre),
      h('p', { classe: 'texte' }, R.but),
      h('h2', null, R.deroulementTitre),
      h('p', { classe: 'texte' }, R.deroulement),
      h('ul', { classe: 'liste-types' },
        h('li', { classe: 'type-revelation' }, icone('etoile', 'type-puce'),
          h('p', { classe: 'texte' }, h('strong', null, R.carteRevelationNom), R.carteRevelation)),
        h('li', { classe: 'type-epreuve' }, icone('epee', 'type-puce'),
          h('p', { classe: 'texte' }, h('strong', null, R.carteEpreuveNom), R.carteEpreuve))),
      h('p', { classe: 'texte' }, R.effetsDurables),
      h('h2', null, R.bouclierTitre),
      h('p', { classe: 'texte' }, R.bouclier),
      h('h2', null, R.finTitre),
      h('p', { classe: 'texte' }, R.fin(donnees.config.tours))),
    barreBas(
      lienBouton(R.creer, { ecran: 'salle', hote: 1, autres: 1 }),
      lienBouton(R.rejoindre, { ecran: 'salle', autres: 2 }, { variante: 'secondaire' })));
  const retour = h('a', { classe: 'bouton-retour', href: '?ecran=accueil', 'data-nav': '', 'aria-label': R.retour },
    icone('retour'));
  return { noeud, retour };
}

export function salle({ donnees, params, naviguer }) {
  const S = T.salle;
  const max = donnees.config.joueursMax;
  const complete = params.get('complete') === '1';
  const nbAutres = complete ? max : entierDepuisParametres(params, 'autres', 2, 0, max - 1);
  const autres = joueursFictifs(donnees, nbAutres);
  const estHote = !complete && (params.get('hote') === '1' || nbAutres === 0);
  const code = donnees.codes.includes(params.get('code')) ? params.get('code') : donnees.codes[0];
  const pris = new Set(autres.map((j) => j.embleme));

  // Ma propre fiche : saisie locale (aucun envoi).
  const moi = { prenom: params.get('prenom') || '', embleme: null, pret: false };
  const embleParam = params.get('embleme');
  if (embleParam && !pris.has(embleParam) && donnees.emblemes.some((e) => e.id === embleParam)) moi.embleme = embleParam;
  moi.pret = params.get('pret') === '1' && Boolean(moi.prenom.trim() && moi.embleme);

  const liste = h('ul', { classe: 'liste-joueurs', 'aria-label': S.joueursLibelle });
  const grille = h('div', { classe: 'grille-emblemes', role: 'radiogroup', 'aria-label': S.embleme });
  const boutonsEmbleme = new Map();
  const champ = h('input', {
    classe: 'champ', id: 'champ-prenom', type: 'text', value: moi.prenom, autocomplete: 'off',
    autocapitalize: 'words', spellcheck: 'false', enterkeyhint: 'done',
  });
  const boutonPret = h('button', { classe: 'bouton bouton-principal', type: 'button' });
  const boutonCommencer = h('button', {
    classe: 'bouton bouton-principal', type: 'button',
    onclick: () => naviguer({ ecran: 'choix', tour: 1 }),
  }, h('span', null, S.commencer));

  function ligne(joueur, { hote, soi }) {
    const emb = joueur.embleme ? emblemeParId(donnees, joueur.embleme) : null;
    return h('li', { classe: `joueur-ligne${soi ? ' joueur-soi' : ''}` },
      emb ? emblemeEl(emb) : h('span', { classe: 'embleme embleme-vide', 'aria-hidden': 'true' }),
      h('span', { classe: `joueur-prenom${joueur.prenom.trim() ? '' : ' joueur-prenom-vide'}` }, joueur.prenom.trim() || '…'),
      h('span', { classe: 'joueur-etiquettes' },
        hote ? h('span', { classe: 'etiquette' }, S.hote) : null,
        soi ? h('span', { classe: 'etiquette' }, S.vous) : null,
        joueur.pret ? h('span', { classe: 'etiquette etiquette-pret' }, icone('coche'), S.pret) : null));
  }

  function majListe() {
    const lignes = autres.map((j) => ({ j, soi: false }));
    if (!complete) lignes.splice(estHote ? 0 : lignes.length, 0, { j: moi, soi: true });
    const elements = lignes.map(({ j, soi }, i) => ligne(j, { hote: i === 0, soi }));
    for (let i = lignes.length; i < max; i += 1) {
      elements.push(h('li', { classe: 'joueur-ligne joueur-libre', 'aria-hidden': 'true' }));
    }
    liste.replaceChildren(...elements);
  }

  function majBoutons() {
    const valide = Boolean(moi.prenom.trim() && moi.embleme);
    if (!valide) moi.pret = false;
    boutonPret.disabled = !valide;
    boutonPret.setAttribute('aria-pressed', String(moi.pret));
    boutonPret.className = `bouton ${moi.pret ? 'bouton-secondaire' : 'bouton-principal'}`;
    boutonPret.replaceChildren(...(moi.pret ? [icone('coche')] : []), h('span', null, moi.pret ? S.pret : S.pretBouton));
    boutonCommencer.disabled = autres.length + (moi.pret ? 1 : 0) < PRETS_MINIMUM;
    for (const [id, bouton] of boutonsEmbleme) {
      bouton.setAttribute('aria-checked', String(moi.embleme === id));
    }
  }

  function maj() {
    majListe();
    majBoutons();
  }

  for (const emb of donnees.emblemes) {
    const prisParAutre = pris.has(emb.id);
    const bouton = h('button', {
      classe: `embleme-choix${prisParAutre ? ' embleme-pris' : ''}`, type: 'button', role: 'radio',
      'aria-checked': 'false', disabled: prisParAutre,
      onclick: () => { moi.embleme = emb.id; moi.pret = false; maj(); },
    }, h('span', { classe: 'embleme-emoji', 'aria-hidden': 'true' }, emb.emoji), h('span', { classe: 'embleme-nom' }, emb.nom));
    boutonsEmbleme.set(emb.id, bouton);
    grille.append(bouton);
  }
  champ.addEventListener('input', () => { moi.prenom = champ.value; moi.pret = false; maj(); });
  boutonPret.addEventListener('click', () => { moi.pret = !moi.pret; maj(); });

  const formulaire = complete
    ? h('p', { classe: 'avis-complete', role: 'status' }, S.complete)
    : h('div', { classe: 'formulaire' },
      h('label', { classe: 'etiquette-champ', for: 'champ-prenom' }, S.prenomLibelle),
      champ,
      h('p', { classe: 'etiquette-champ' }, S.embleme),
      grille);

  const noeud = h('section', { classe: 'ecran ecran-salle' },
    h('div', { classe: 'salle-corps' },
      h('p', { classe: 'code-libelle' }, S.codeLibelle),
      h('p', { classe: 'code-partie' }, code),
      h('p', { classe: 'texte texte-centre' }, S.accompagnement),
      liste,
      formulaire),
    complete ? null : barreBas(boutonPret, estHote ? boutonCommencer : null));
  maj();
  return { noeud };
}

export function choix({ donnees, params }) {
  const n = tourDepuisParametres(donnees, params);
  const dos = (type) => h('a', {
    classe: `dos dos-${type}`, href: `?ecran=carte&type=${type}&tour=${n}`, 'data-nav': '',
  },
  h('span', { classe: 'dos-cadre' }, icone(T.types[type].symbole, 'dos-symbole')),
  h('span', { classe: 'dos-nom' }, T.types[type].nom));
  const noeud = h('section', { classe: 'ecran ecran-choix' },
    compteurEl(donnees, n),
    h('h2', { classe: 'titre-tour' }, T.tour.aToi),
    h('div', { classe: 'dos-cartes' }, dos('epreuve'), dos('revelation')));
  return { noeud };
}

export function carte({ donnees, params, naviguer }) {
  const n = tourDepuisParametres(donnees, params);
  const c = carteDepuisParametres(donnees, params);
  const dialogue = h('dialog', { classe: 'dialogue', 'aria-labelledby': 'dialogue-texte' },
    h('p', { id: 'dialogue-texte', classe: 'dialogue-texte' }, T.tour.confirmation),
    h('div', { classe: 'dialogue-boutons' },
      h('button', {
        classe: 'bouton bouton-principal', type: 'button',
        onclick: () => naviguer({ ecran: 'transition', bouclier: 1, tour: n, auto: 1 }),
      }, icone('bouclier'), h('span', null, T.tour.confirmer)),
      h('button', {
        classe: 'bouton bouton-secondaire', type: 'button', onclick: () => dialogue.close(),
      }, h('span', null, T.tour.annuler))));
  const noeud = h('section', { classe: 'ecran ecran-carte' },
    compteurEl(donnees, n),
    carteEl(c, 'soi'),
    dialogue,
    barreBas(
      lienBouton(T.tour.sortJete, { ecran: 'transition', tour: n, auto: 1 }),
      h('button', {
        classe: 'bouton bouton-secondaire', type: 'button',
        onclick: () => (dialogue.showModal ? dialogue.showModal() : dialogue.setAttribute('open', '')),
      }, icone('bouclier'), h('span', null, T.tour.bouclier))));
  return { noeud };
}

export function attente({ donnees, params }) {
  const n = tourDepuisParametres(donnees, params);
  const c = carteDepuisParametres(donnees, params);
  const premier = joueursFictifs(donnees, 1)[0];
  const actif = {
    prenom: params.get('prenom') || premier.prenom,
    embleme: emblemeParId(donnees, params.get('embleme') || premier.embleme),
  };
  const enCours = params.get('effets') === '0' ? [] : effetsEnCours(donnees);
  const bandeauGlobal = enCours.length === 0 ? null : h('section', { classe: 'effets-en-cours', 'aria-label': T.effets.enCours },
    h('h2', { classe: 'effets-titre' }, icone('lueur'), T.effets.enCours),
    h('ul', { classe: 'effets-liste' }, enCours.map((e) => h('li', { classe: 'effets-item' },
      h('span', { classe: 'effets-joueur' }, emblemeEl(emblemeParId(donnees, e.joueur.embleme)), e.joueur.prenom),
      h('strong', { classe: 'effets-texte' }, e.effet),
      h('span', { classe: 'bandeau-duree' }, dureeTexte(e.duree, 'autre'))))));
  const noeud = h('section', { classe: 'ecran ecran-attente' },
    compteurEl(donnees, n),
    h('h2', { classe: 'titre-tour' }, `${T.tour.auTourDe} `, h('span', { classe: 'nom-actif' }, emblemeEl(actif.embleme), actif.prenom)),
    carteEl(c, 'autre'),
    bandeauGlobal,
    h('p', { classe: 'attente-message', role: 'status' }, T.tour.enAttente(actif.prenom)));
  return { noeud };
}

export function transition({ donnees, params, naviguer }) {
  const n = tourDepuisParametres(donnees, params);
  const bouclier = params.get('bouclier') === '1';
  const acteur = joueursFictifs(donnees, 1)[0];
  const prenom = params.get('prenom') || acteur.prenom;
  const emb = emblemeParId(donnees, params.get('embleme') || acteur.embleme);
  const noeud = h('section', { classe: `ecran ecran-transition${bouclier ? ' transition-bouclier' : ''}` },
    compteurEl(donnees, n),
    h('div', { classe: 'transition-corps', role: 'status' },
      h('div', { classe: 'transition-icone' }, icone(bouclier ? 'bouclier' : 'lueur')),
      emblemeEl(emb, 'embleme-grand'),
      h('p', { classe: 'transition-texte' }, bouclier ? T.tour.transitionBouclier(prenom) : T.tour.transitionJete(prenom))));
  let minuteur = null;
  if (params.get('auto') === '1') {
    // Parcours de démonstration : après 2 secondes, tour suivant ou fin (le nombre de tours vient de config.json).
    minuteur = setTimeout(() => {
      naviguer(n < donnees.config.tours ? { ecran: 'choix', tour: n + 1 } : { ecran: 'fin' });
    }, DUREE_TRANSITION_MS);
  }
  return { noeud, nettoyer: () => clearTimeout(minuteur) };
}

export function fin() {
  const noeud = h('section', { classe: 'ecran ecran-fin' },
    h('div', { classe: 'fin-corps' },
      h('p', { classe: 'accueil-salut' }, T.fin.titre),
      h('div', { classe: 'ornement', 'aria-hidden': 'true' }, icone('etoile')),
      h('p', { classe: 'texte' }, T.fin.texte)),
    barreBas(lienBouton(T.fin.bouton, { ecran: 'accueil' })));
  return { noeud };
}
