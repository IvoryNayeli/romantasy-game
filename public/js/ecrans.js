// Les écrans du jeu. Chaque fonction reçoit un contexte { donnees, params, naviguer }
// et renvoie { noeud, retour?, nettoyer? }. Phase 2 : données fictives, aucune logique de jeu.

import { h, icone, lienBouton, coins, filigrane, logo, etoile } from './dom.js';
import { constellation } from './ciel.js';
import { trouverCode } from './codes.js';
import * as T from './textes.js';
import {
  joueursFictifs, effetsEnCours, emblemeParId, carteDepuisParametres,
  tourDepuisParametres, entierDepuisParametres, PRETS_MINIMUM,
} from './fictif.js';

const DUREE_TRANSITION_MS = 2000; // « Transition de 2 secondes » (docs/regles.md)

// Étoiles qui scintillent sur l'accueil : marge de gauche (g) ou de droite (d), position verticale en pourcentage.
const ETOILES_ACCUEIL = [['g', 8], ['d', 14], ['g', 31], ['d', 42], ['g', 58], ['d', 66], ['g', 80], ['d', 90]];

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

// Carte révélée (charte, section 6) : cadre 2:3 qui s'allonge si le texte l'exige, quatre étincelles aux coins,
// type en légende (symbole + texte, couleur de type), séparateur filigrane, texte avec lettrine, bandeau d'effet durable.
// Les cartes du jeu n'ont ni coût, ni nom, ni illustration : ces éléments de la charte ne sont pas affichés.
// Le retournement 3D est une animation CSS jouée à l'affichage.
function carteEl(carte, perspective) {
  const type = T.types[carte.type];
  return h('article', { classe: `carte carte-${carte.type}`, 'data-carte': carte.id },
    h('div', { classe: 'carte-3d' },
      h('div', { classe: 'carte-face' },
        coins(),
        h('header', { classe: 'carte-entete' }, icone(type.symbole), h('span', null, type.nom)),
        filigrane('carte-filigrane'),
        h('p', { classe: 'carte-texte' }, carte.texte),
        carte.effet ? bandeauEffet(carte.effet, carte.duree, perspective) : null),
      h('div', { classe: `dos carte-dos dos-${carte.type}`, 'aria-hidden': 'true' }, contenuDos(carte.type))));
}

// Dos de carte (charte, section 6) : étincelles, logo, symbole et nom du type.
function contenuDos(type) {
  return h('span', { classe: 'dos-corps' },
    coins(),
    logo('dos-logo'),
    icone(T.types[type].symbole, 'dos-symbole'),
    h('span', { classe: 'dos-nom' }, T.types[type].nom));
}

// Espace libre au-dessus ou au-dessous du contenu (accueil, transition, fin) : une grande constellation y est posée.
// Le bloc prend la place restante ; s'il est trop petit (petit écran), la constellation est masquée (voir style.css).
function cielLibre(motif, echelle = 2) {
  return h('div', { classe: 'ciel-libre', 'aria-hidden': 'true' }, constellation(motif, { echelle, fluide: true }));
}

function barreBas(...boutons) {
  return h('div', { classe: 'barre-bas' }, ...boutons);
}

// Titre de section de la page des règles : titre en Cormorant Garamond, filigrane ambre pleine largeur dessous
// (le motif du symbole n'est pas étiré : deux filets de part et d'autre).
function titreSection(texte) {
  return h('div', { classe: 'titre-section' }, h('h2', null, texte),
    h('div', { classe: 'titre-section-ornement', 'aria-hidden': 'true' },
      h('span', { classe: 'filet' }), filigrane(), h('span', { classe: 'filet' })));
}

// Flèche de retour de l'en-tête (lien interne, intercepté par app.js).
function flecheRetour(ecran, libelle) {
  return h('a', { classe: 'bouton-retour', href: `?ecran=${ecran}`, 'data-nav': '', 'aria-label': libelle },
    icone('retour'));
}

/* ---------- Écrans ---------- */

export function accueil() {
  const noeud = h('section', { classe: 'ecran ecran-accueil' },
    h('div', { classe: 'ciel-accueil', 'aria-hidden': 'true' }, ETOILES_ACCUEIL.map(([x, y]) => etoile(x, y))),
    cielLibre('dragon'),
    h('div', { classe: 'accueil-corps' },
      h('div', { classe: 'logo-complet', role: 'img', 'aria-label': T.logoNom },
        logo('logo-grand')),
      h('p', { classe: 'accueil-salut' }, T.accueil.salut),
      h('div', { classe: 'ornement', 'aria-hidden': 'true' }, filigrane()),
      h('p', { classe: 'texte' }, T.accueil.texte1),
      h('p', { classe: 'texte' }, T.accueil.texte2)),
    cielLibre('couronne', 2.4),
    barreBas(lienBouton(T.accueil.bouton, { ecran: 'regles' })));
  return { noeud };
}

export function regles({ donnees }) {
  const R = T.regles;
  const noeud = h('section', { classe: 'ecran ecran-regles' },
    h('div', { classe: 'regles-corps' },
      titreSection(R.butTitre),
      h('p', { classe: 'texte' }, R.but),
      titreSection(R.deroulementTitre),
      h('p', { classe: 'texte' }, R.deroulement),
      h('ul', { classe: 'liste-types' },
        h('li', { classe: 'type-revelation' }, icone('etoile', 'type-puce'),
          h('p', { classe: 'texte' }, h('strong', null, R.carteRevelationNom), R.carteRevelation)),
        h('li', { classe: 'type-epreuve' }, icone('epee', 'type-puce'),
          h('p', { classe: 'texte' }, h('strong', null, R.carteEpreuveNom), R.carteEpreuve))),
      h('p', { classe: 'texte' }, R.effetsDurables),
      titreSection(R.bouclierTitre),
      h('p', { classe: 'texte' }, R.bouclier),
      titreSection(R.finTitre),
      h('p', { classe: 'texte' }, R.fin(donnees.config.tours))),
    barreBas(
      lienBouton(R.creer, { ecran: 'creer' }),
      lienBouton(R.rejoindre, { ecran: 'rejoindre' }, { variante: 'secondaire' })));
  return { noeud, retour: flecheRetour('accueil', R.retour) };
}

// « Créer une partie » : on choisit le code dans la liste (les mots de codes.json), puis on valide.
// Phase 2 : aucune vérification d'unicité (phase 4).
export function creer({ donnees, params, naviguer }) {
  const C = T.creer;
  let choisi = trouverCode(params.get('code'), donnees.codes);
  const boutonValider = h('button', { classe: 'bouton bouton-principal', type: 'submit' }, h('span', null, C.valider));
  const options = donnees.codes.map((code) => {
    const entree = h('input', {
      classe: 'code-radio', type: 'radio', name: 'code', value: code, checked: code === choisi,
      onchange: () => { choisi = code; boutonValider.disabled = false; },
    });
    return h('label', { classe: 'code-option' }, entree,
      h('span', { classe: 'code-option-nom' }, icone('coche'), code));
  });
  boutonValider.disabled = !choisi;
  const formulaire = h('form', {
    classe: 'formulaire-code',
    onsubmit: (evenement) => {
      evenement.preventDefault();
      if (choisi) naviguer({ ecran: 'salle', code: choisi, hote: 1, autres: 1 });
    },
  },
  h('div', { classe: 'formulaire-code-corps' },
    h('h2', { classe: 'titre-ecran', id: 'titre-creer' }, C.titre),
    h('p', { classe: 'texte' }, C.aide),
    h('div', { classe: 'liste-codes', role: 'radiogroup', 'aria-labelledby': 'titre-creer' }, options)),
  barreBas(boutonValider));
  return { noeud: h('section', { classe: 'ecran ecran-creer' }, formulaire), retour: flecheRetour('regles', C.retour) };
}

// « Rejoindre une partie » : on saisit le code ; phase 2 : seulement vérifier qu'il figure dans codes.json.
export function rejoindre({ donnees, params, naviguer }) {
  const R = T.rejoindre;
  const messageErreur = h('p', { classe: 'erreur-champ', id: 'erreur-code', role: 'alert' });
  const champ = h('input', {
    classe: 'champ champ-code', id: 'champ-code', type: 'text', value: params.get('code') || '', autocomplete: 'off',
    autocapitalize: 'characters', autocorrect: 'off', spellcheck: 'false', enterkeyhint: 'go',
    'aria-describedby': 'aide-code',
  });
  function erreur(texte) {
    messageErreur.textContent = texte || '';
    if (texte) {
      champ.setAttribute('aria-invalid', 'true');
      champ.setAttribute('aria-describedby', 'aide-code erreur-code');
    } else {
      champ.removeAttribute('aria-invalid');
      champ.setAttribute('aria-describedby', 'aide-code');
    }
  }
  const demande = params.get('erreur');
  if (demande === 'vide') erreur(R.erreurVide);
  else if (demande === 'inconnu') erreur(R.erreurInconnu);
  champ.addEventListener('input', () => erreur(''));
  const formulaire = h('form', {
    classe: 'formulaire-code',
    novalidate: true,
    onsubmit: (evenement) => {
      evenement.preventDefault();
      if (!champ.value.trim()) { erreur(R.erreurVide); champ.focus(); return; }
      const code = trouverCode(champ.value, donnees.codes);
      if (!code) { erreur(R.erreurInconnu); champ.focus(); return; }
      naviguer({ ecran: 'salle', code, autres: 2 });
    },
  },
  h('div', { classe: 'formulaire-code-corps' },
    h('h2', { classe: 'titre-ecran' }, R.titre),
    h('label', { classe: 'etiquette-champ', for: 'champ-code' }, R.libelle),
    champ,
    h('p', { classe: 'aide-champ', id: 'aide-code' }, R.aide),
    messageErreur),
  barreBas(h('button', { classe: 'bouton bouton-principal', type: 'submit' }, h('span', null, R.valider))));
  return { noeud: h('section', { classe: 'ecran ecran-rejoindre' }, formulaire), retour: flecheRetour('regles', R.retour) };
}

export function salle({ donnees, params, naviguer }) {
  const S = T.salle;
  const max = donnees.config.joueursMax;
  const complete = params.get('complete') === '1';
  const nbAutres = complete ? max : entierDepuisParametres(params, 'autres', 2, 0, max - 1);
  const autres = joueursFictifs(donnees, nbAutres);
  const estHote = !complete && (params.get('hote') === '1' || nbAutres === 0);
  const code = trouverCode(params.get('code'), donnees.codes) || donnees.codes[0];
  const pris = new Set(autres.map((j) => j.embleme));

  // Ma propre fiche : saisie locale (aucun envoi).
  const moi = { prenom: params.get('prenom') || '', embleme: null, pret: false };
  const embleParam = params.get('embleme');
  if (embleParam && !pris.has(embleParam) && donnees.emblemes.some((e) => e.id === embleParam)) moi.embleme = embleParam;
  moi.pret = params.get('pret') === '1' && Boolean(moi.prenom.trim() && moi.embleme);

  const liste = h('ul', { classe: 'liste-joueurs', 'aria-labelledby': 'titre-groupe' });
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
    // Une fois « C'est bon » validé, plus de retour en arrière : bouton, prénom et emblème sont verrouillés.
    boutonPret.disabled = !valide || moi.pret;
    boutonPret.setAttribute('aria-pressed', String(moi.pret));
    boutonPret.className = `bouton ${moi.pret ? 'bouton-secondaire bouton-valide' : 'bouton-principal'}`;
    boutonPret.replaceChildren(...(moi.pret ? [icone('coche')] : []), h('span', null, moi.pret ? S.pret : S.pretBouton));
    boutonCommencer.disabled = autres.length + (moi.pret ? 1 : 0) < PRETS_MINIMUM;
    champ.disabled = moi.pret;
    for (const [id, bouton] of boutonsEmbleme) {
      bouton.setAttribute('aria-checked', String(moi.embleme === id));
      bouton.disabled = moi.pret || pris.has(id);
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
  boutonPret.addEventListener('click', () => { if (!moi.pret) { moi.pret = true; maj(); } });

  const formulaire = complete
    ? h('p', { classe: 'panneau avis-complete', role: 'status' }, coins(), S.complete)
    : h('div', { classe: 'formulaire' },
      h('label', { classe: 'etiquette-champ', for: 'champ-prenom' }, S.prenomLibelle),
      champ,
      h('p', { classe: 'etiquette-champ' }, S.embleme),
      grille);

  // Ordre voulu par la propriétaire : code (discret), menu emblème + prénom, puis liste du groupe.
  const noeud = h('section', { classe: 'ecran ecran-salle' },
    h('div', { classe: 'salle-corps' },
      h('p', { classe: 'code-partie' },
        h('span', { classe: 'code-libelle' }, S.codeLibelle), ' ',
        h('span', { classe: 'code-valeur' }, code)),
      formulaire,
      h('h2', { classe: 'titre-liste', id: 'titre-groupe' }, S.groupe),
      liste,
      h('p', { classe: 'texte texte-centre' }, S.accompagnement)),
    complete ? null : barreBas(boutonPret, estHote ? boutonCommencer : null));
  maj();
  return { noeud };
}

export function choix({ donnees, params }) {
  const n = tourDepuisParametres(donnees, params);
  const dos = (type) => h('a', {
    classe: `dos dos-${type}`, href: `?ecran=carte&type=${type}&tour=${n}`, 'data-nav': '',
  }, contenuDos(type));
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
    coins(),
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
  const bandeauGlobal = enCours.length === 0 ? null : h('section', { classe: 'panneau effets-en-cours', 'aria-label': T.effets.enCours },
    coins(),
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
    cielLibre('orion'),
    h('div', { classe: 'transition-corps', role: 'status' },
      h('div', { classe: 'transition-icone' }, icone(bouclier ? 'bouclier-grand' : 'sort-jete', 'icone-presence')),
      emblemeEl(emb, 'embleme-grand'),
      h('p', { classe: 'transition-texte' }, bouclier ? T.tour.transitionBouclier(prenom) : T.tour.transitionJete(prenom))),
    cielLibre('croix', 2.4));
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
    cielLibre('lyre', 2.4),
    h('div', { classe: 'fin-corps' },
      h('p', { classe: 'accueil-salut' }, T.fin.titre),
      h('div', { classe: 'ornement', 'aria-hidden': 'true' }, filigrane()),
      h('p', { classe: 'texte' }, T.fin.texte)),
    cielLibre('cassiopee'),
    barreBas(lienBouton(T.fin.bouton, { ecran: 'accueil' })));
  return { noeud };
}
