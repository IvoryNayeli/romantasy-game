// Les écrans du jeu. Chaque fonction reçoit un contexte { donnees, params, naviguer, reseau }
// et renvoie { noeud, retour?, nettoyer? }. Données fictives (phase 2), sauf « Créer » et « Rejoindre » qui,
// hors démonstration, passent par la base (`reseau`, voir reseau.js). La salle d'attente et la partie en réseau
// sont dans ecrans-reseau.js, qui réutilise les vues des écrans de tour (vueChoix, vueCarte, vueAttente,
// vueTransition, vueFin) : même rendu, alimenté par la partie réelle.

import { h, icone, imageEmbleme, lienBouton, coins, filigrane, logo, etoile } from './dom.js';
import { constellation } from './ciel.js';
import { trouverCode } from './codes.js';
import * as T from './textes.js';
import {
  joueursFictifs, effetsEnCours, emblemeParId, carteDepuisParametres,
  tourDepuisParametres, entierDepuisParametres,
} from './fictif.js';
// Nombre minimal de présences confirmées pour commencer (règle de docs/regles.md) : constante unique du moteur.
import { JOUEURS_MINIMUM } from './game.js';

export const DUREE_TRANSITION_MS = 2000; // « Transition de 2 secondes » (docs/regles.md)

// Étoiles qui scintillent sur l'accueil : marge de gauche (g) ou de droite (d), position verticale en pourcentage.
const ETOILES_ACCUEIL = [['g', 8], ['d', 14], ['g', 31], ['d', 42], ['g', 58], ['d', 66], ['g', 80], ['d', 90]];

/* ---------- Éléments réutilisables ---------- */

// Emblème d'une personne : image de emblemes.json, avec le nom de l'emblème en texte alternatif.
export function emblemeEl(emb, classe = '') {
  return imageEmbleme(emb, `embleme ${classe}`.trim());
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

export function barreBas(...boutons) {
  return h('div', { classe: 'barre-bas' }, ...boutons);
}

// Pied des écrans de tour (phase 7) : collé en bas de l'écran, il porte le bandeau « Effets en cours » (replié par
// défaut) au-dessus des boutons d'action ou du bloc d'absence. Rien quand il n'y a ni effet ni bouton.
function piedTour(...enfants) {
  const presents = enfants.filter(Boolean);
  return presents.length ? h('div', { classe: 'pied-tour' }, ...presents) : null;
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

// Ligne d'une personne dans la liste « La compagnie » de la salle d'attente (fictive ou en réseau).
// `absent` (phase 6) : plus aucune connexion ouverte, étiquette « hors ligne ».
export function ligneJoueur(donnees, joueur, { hote, soi, absent = false }) {
  const S = T.salle;
  const prenom = String(joueur.prenom || '').trim();
  const emb = joueur.embleme ? emblemeParId(donnees, joueur.embleme) : null;
  return h('li', { classe: `joueur-ligne${soi ? ' joueur-soi' : ''}` },
    h('span', { classe: `joueur-prenom${prenom ? '' : ' joueur-prenom-vide'}` }, prenom || '…'),
    emb ? emblemeEl(emb) : h('span', { classe: 'embleme embleme-vide', 'aria-hidden': 'true' }),
    h('span', { classe: 'joueur-etiquettes' },
      hote ? h('span', { classe: 'etiquette' }, S.hote) : null,
      soi ? h('span', { classe: 'etiquette' }, S.vous) : null,
      joueur.pret ? h('span', { classe: 'etiquette etiquette-pret' }, icone('coche'), S.pret) : null,
      absent ? h('span', { classe: 'etiquette etiquette-absent' }, T.absence.etiquette) : null));
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
// En réseau : les codes déjà pris par une partie en cours sont grisés, et la validation crée la partie dans la base
// (refusée si le code vient d'être pris). En démonstration : aucune vérification, salle fictive.
export function creer({ donnees, params, naviguer, reseau = null }) {
  const C = T.creer;
  let choisi = trouverCode(params.get('code'), donnees.codes);
  let actif = true;
  let enCours = false;
  const boutonValider = h('button', { classe: 'bouton bouton-principal', type: 'submit' }, h('span', null, C.valider));
  const messageErreur = reseau ? h('p', { classe: 'erreur-champ', id: 'erreur-creer', role: 'alert' }) : null;
  const entrees = new Map();
  const options = donnees.codes.map((code) => {
    const entree = h('input', {
      classe: 'code-radio', type: 'radio', name: 'code', value: code, checked: code === choisi,
      onchange: () => { choisi = code; boutonValider.disabled = enCours; if (messageErreur) messageErreur.textContent = ''; },
    });
    entrees.set(code, entree);
    return h('label', { classe: 'code-option' }, entree,
      h('span', { classe: 'code-option-nom' }, icone('coche'), code));
  });
  boutonValider.disabled = !choisi;

  // Code pris : option grisée et inactive ; s'il était choisi, le choix est annulé.
  function marquerPris(code) {
    const entree = entrees.get(code);
    if (!entree) return;
    entree.disabled = true;
    entree.checked = false;
    entree.closest('.code-option').classList.add('code-pris');
    if (choisi === code) choisi = null;
    boutonValider.disabled = !choisi || enCours;
  }
  if (reseau) {
    reseau.codesPris(donnees.codes)
      .then((pris) => { if (actif) pris.forEach(marquerPris); })
      .catch(() => { /* réseau indisponible : signalé seulement à la validation */ });
  }

  async function creerEnReseau(code) {
    enCours = true;
    boutonValider.disabled = true;
    messageErreur.textContent = '';
    try {
      const issue = await reseau.creer(code, donnees.config);
      if (!actif) return;
      if (issue === reseau.ISSUES.OK) { naviguer({ ecran: 'salle', code }); return; }
      marquerPris(code);
      messageErreur.textContent = T.reseau.codePris;
    } catch {
      if (actif) messageErreur.textContent = T.reseau.indisponible;
    } finally {
      enCours = false;
      if (actif) boutonValider.disabled = !choisi;
    }
  }

  const formulaire = h('form', {
    classe: 'formulaire-code',
    onsubmit: (evenement) => {
      evenement.preventDefault();
      if (!choisi || enCours) return;
      if (reseau) creerEnReseau(choisi);
      else naviguer({ ecran: 'salle', code: choisi, hote: 1, autres: 1 });
    },
  },
  h('div', { classe: 'formulaire-code-corps' },
    h('h2', { classe: 'titre-ecran', id: 'titre-creer' }, C.titre),
    h('p', { classe: 'texte' }, C.aide),
    h('div', { classe: 'liste-codes', role: 'radiogroup', 'aria-labelledby': 'titre-creer' }, options),
    messageErreur),
  barreBas(boutonValider));
  return {
    noeud: h('section', { classe: 'ecran ecran-creer' }, formulaire),
    retour: flecheRetour('regles', C.retour),
    nettoyer: () => { actif = false; },
  };
}

// « Rejoindre une partie » : on saisit le code. Il doit figurer dans codes.json ; en réseau, il doit en plus
// correspondre à une partie en cours (sinon même message « code inconnu »). Partie complète ou déjà commencée :
// la salle d'attente l'affiche.
export function rejoindre({ donnees, params, naviguer, reseau = null }) {
  const R = T.rejoindre;
  let actif = true;
  let enCours = false;
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
  const boutonValider = h('button', { classe: 'bouton bouton-principal', type: 'submit' }, h('span', null, R.valider));
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
      if (!reseau) { naviguer({ ecran: 'salle', code, autres: 2 }); return; }
      if (enCours) return;
      enCours = true;
      boutonValider.disabled = true;
      reseau.rejoindre(code)
        .then((issue) => {
          if (!actif) return;
          if (issue === reseau.ISSUES.INTROUVABLE) { erreur(R.erreurInconnu); champ.focus(); return; }
          naviguer({ ecran: 'salle', code });
        })
        .catch(() => { if (actif) erreur(T.reseau.indisponible); })
        .finally(() => { enCours = false; boutonValider.disabled = false; });
    },
  },
  h('div', { classe: 'formulaire-code-corps' },
    h('h2', { classe: 'titre-ecran' }, R.titre),
    h('label', { classe: 'etiquette-champ', for: 'champ-code' }, R.libelle),
    champ,
    h('p', { classe: 'aide-champ', id: 'aide-code' }, R.aide),
    messageErreur),
  barreBas(boutonValider));
  return {
    noeud: h('section', { classe: 'ecran ecran-rejoindre' }, formulaire),
    retour: flecheRetour('regles', R.retour),
    nettoyer: () => { actif = false; },
  };
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

  function majListe() {
    const lignes = autres.map((j) => ({ j, soi: false }));
    if (!complete) lignes.splice(estHote ? 0 : lignes.length, 0, { j: moi, soi: true });
    // ?absent=1 (phase 6) : la première des autres personnes est hors ligne.
    const horsLigne = params.get('absent') === '1' ? autres[0] : null;
    const elements = lignes.map(({ j, soi }, i) => ligneJoueur(donnees, j, { hote: i === 0, soi, absent: Boolean(horsLigne) && j === horsLigne }));
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
    boutonCommencer.disabled = autres.length + (moi.pret ? 1 : 0) < JOUEURS_MINIMUM;
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
    }, imageEmbleme(emb, 'embleme-image'));
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
  return { noeud: vueChoix(donnees, { tour: tourDepuisParametres(donnees, params) }) };
}

// Vue « À toi de jouer ! » (aussi utilisée par la partie en réseau, ecrans-reseau.js). Sans `choisir`, les dos de
// cartes sont des liens de démonstration ; avec `choisir(type)`, un toucher tire la carte du type choisi.
export function vueChoix(donnees, { tour, choisir = null, effets = [], signaler = null }) {
  const dos = (type) => h('a', choisir
    ? {
      classe: `dos dos-${type}`, href: '#', role: 'button',
      onclick: (evenement) => { evenement.preventDefault(); choisir(type); },
    }
    : { classe: `dos dos-${type}`, href: `?ecran=carte&type=${type}&tour=${tour}`, 'data-nav': '' }, contenuDos(type));
  return h('section', { classe: 'ecran ecran-choix' },
    compteurEl(donnees, tour),
    h('h2', { classe: 'titre-tour' }, T.tour.aToi),
    h('div', { classe: 'dos-cartes' }, dos('epreuve'), dos('revelation')),
    piedTour(panneauEffets(donnees, effets, signaler)));
}

export function carte({ donnees, params, naviguer }) {
  const n = tourDepuisParametres(donnees, params);
  return {
    noeud: vueCarte(donnees, {
      tour: n,
      carte: carteDepuisParametres(donnees, params),
      sortJete: lienBouton(T.tour.sortJete, { ecran: 'transition', tour: n, auto: 1 }),
      bouclier: () => naviguer({ ecran: 'transition', bouclier: 1, tour: n, auto: 1 }),
    }),
  };
}

// Vue de la carte révélée, pour la personne dont c'est le tour. `sortJete` : bouton (ou lien de démonstration)
// « Le sort est jeté » ; `bouclier()` : appelé après la confirmation légère.
export function vueCarte(donnees, { tour, carte: c, sortJete, bouclier, effets = [], signaler = null }) {
  const dialogue = h('dialog', { classe: 'dialogue', 'aria-labelledby': 'dialogue-texte' },
    coins(),
    h('p', { id: 'dialogue-texte', classe: 'dialogue-texte' }, T.tour.confirmation),
    h('div', { classe: 'dialogue-boutons' },
      h('button', {
        classe: 'bouton bouton-principal', type: 'button',
        onclick: () => { if (dialogue.open) dialogue.close(); bouclier(); },
      }, icone('bouclier'), h('span', null, T.tour.confirmer)),
      h('button', {
        classe: 'bouton bouton-secondaire', type: 'button', onclick: () => dialogue.close(),
      }, h('span', null, T.tour.annuler))));
  return h('section', { classe: 'ecran ecran-carte' },
    compteurEl(donnees, tour),
    carteEl(c, 'soi'),
    dialogue,
    piedTour(panneauEffets(donnees, effets, signaler), barreBas(
      sortJete,
      h('button', {
        classe: 'bouton bouton-secondaire', type: 'button',
        onclick: () => (dialogue.showModal ? dialogue.showModal() : dialogue.setAttribute('open', '')),
      }, icone('bouclier'), h('span', null, T.tour.bouclier)))));
}

export function attente({ donnees, params }) {
  const premier = joueursFictifs(donnees, 1)[0];
  const prenom = params.get('prenom') || premier.prenom;
  // ?absent=1 (phase 6) : la personne dont c'est le tour est hors ligne et son tour peut être passé (sans effet ici).
  const absence = params.get('absent') === '1' ? blocAbsence() : null;
  if (absence) absence.majAbsence({ prenom, passer: () => {} });
  return {
    noeud: vueAttente(donnees, {
      pied: absence ? absence.noeud : null,
      tour: tourDepuisParametres(donnees, params),
      carte: carteDepuisParametres(donnees, params),
      actif: {
        prenom,
        embleme: emblemeParId(donnees, params.get('embleme') || premier.embleme),
      },
      effets: params.get('effets') === '0' ? [] : effetsEnCours(donnees),
    }),
  };
}

// Bandeau « Effets en cours », visible par tout le monde, en bas de l'écran (pied de tour). Phase 7 : petit bandeau
// replié par défaut (titre et nombre d'effets), qu'on déroule d'un toucher pour voir le détail (élément details).
// Chaque effet : { joueur: { prenom, embleme }, effet, duree, carte?, soi? }. Avec `signaler(carte)` (partie en
// réseau), chaque effet a un bouton pour dire qu'il a provoqué un échange de butins, ce qui y met fin.
export function panneauEffets(donnees, effets, signaler = null) {
  if (!effets || effets.length === 0) return null;
  return h('details', { classe: 'panneau effets-en-cours' },
    coins(),
    h('summary', { classe: 'effets-titre' }, icone('lueur'), h('span', null, T.effets.enCours),
      h('span', { classe: 'effets-nombre' }, String(effets.length))),
    h('ul', { classe: 'effets-liste' }, effets.map((e) => h('li', { classe: 'effets-item' },
      h('span', { classe: 'effets-joueur' }, e.joueur.prenom, emblemeEl(emblemeParId(donnees, e.joueur.embleme))),
      h('strong', { classe: 'effets-texte' }, e.effet),
      h('span', { classe: 'bandeau-duree' }, dureeTexte(e.duree, e.soi ? 'soi' : 'autre')),
      signaler ? h('button', {
        classe: 'bouton-echange', type: 'button', onclick: () => signaler(e.carte),
      }, T.effets.echange) : null))));
}

// Vue des autres personnes pendant un tour (écran un peu terni : ce n'est pas leur tour). Phase 7 : « Au tour de
// [prénom] » ; tant que la carte n'est pas choisie, l'emblème en grand dessous ; ensuite, l'emblème après le prénom
// et la carte tirée, sans boutons. En bas : effets en cours, puis `pied` (phase 6, bloc d'absence de blocAbsence()).
export function vueAttente(donnees, { tour, carte: c = null, actif, effets = [], signaler = null, pied = null }) {
  return h('section', { classe: `ecran ecran-attente${c ? '' : ' attente-sans-carte'}` },
    compteurEl(donnees, tour),
    h('h2', { classe: 'titre-tour' }, `${T.tour.auTourDe} `,
      h('span', { classe: 'nom-actif' }, actif.prenom, c ? emblemeEl(actif.embleme) : null)),
    c ? carteEl(c, 'autre') : emblemeEl(actif.embleme, 'embleme-grand embleme-attente'),
    piedTour(panneauEffets(donnees, effets, signaler), pied));
}

// Bloc d'absence de l'écran d'attente (phase 6), mis à jour sur place (la carte affichée ne se retourne pas une
// seconde fois) : majAbsence(null) le cache ; { prenom } affiche « … est hors ligne. » ; avec `passer`, le bouton
// « Passer son tour » apparaît aussi (une fois le délai de config.json écoulé, voir ecrans-reseau.js).
export function blocAbsence() {
  const message = h('p', { classe: 'absence-message', role: 'status' });
  const bouton = h('button', { classe: 'bouton bouton-secondaire', type: 'button' }, h('span', null, T.absence.passer));
  const barre = barreBas(bouton);
  const noeud = h('div', { classe: 'absence' }, message, barre);
  let action = null;
  bouton.addEventListener('click', () => { if (action) action(); });
  function majAbsence(etat) {
    noeud.hidden = !etat;
    message.textContent = etat ? T.absence.message(etat.prenom) : '';
    action = etat?.passer || null;
    barre.hidden = !action;
  }
  majAbsence(null);
  return { noeud, majAbsence };
}

export function transition({ donnees, params, naviguer }) {
  const n = tourDepuisParametres(donnees, params);
  const acteur = joueursFictifs(donnees, 1)[0];
  const noeud = vueTransition(donnees, {
    tour: n,
    bouclier: params.get('bouclier') === '1',
    passe: params.get('passe') === '1',
    prenom: params.get('prenom') || acteur.prenom,
    embleme: emblemeParId(donnees, params.get('embleme') || acteur.embleme),
  });
  let minuteur = null;
  if (params.get('auto') === '1') {
    // Parcours de démonstration : après 2 secondes, tour suivant ou fin (le nombre de tours vient de config.json).
    minuteur = setTimeout(() => {
      naviguer(n < donnees.config.tours ? { ecran: 'choix', tour: n + 1 } : { ecran: 'fin' });
    }, DUREE_TRANSITION_MS);
  }
  return { noeud, nettoyer: () => clearTimeout(minuteur) };
}

// Vue de la transition de 2 secondes, visible par tout le monde (la durée est gérée par l'appelant).
// `passe` (phase 6) : tour d'une personne absente passé par une autre ; même apparence que le bouclier.
function texteTransition({ bouclierInvoque, passe, prenom }) {
  if (passe) return T.absence.transitionPasse(prenom);
  return bouclierInvoque ? T.tour.transitionBouclier(prenom) : T.tour.transitionJete(prenom);
}

export function vueTransition(donnees, { tour, bouclier: bouclierInvoque, passe = false, prenom, embleme: emb }) {
  const bouclier = bouclierInvoque || passe;
  return h('section', { classe: `ecran ecran-transition${bouclier ? ' transition-bouclier' : ''}` },
    compteurEl(donnees, tour),
    cielLibre('orion'),
    h('div', { classe: 'transition-corps', role: 'status' },
      h('div', { classe: 'transition-icone' }, icone(bouclier ? 'bouclier' : 'etoile', 'icone-presence')),
      h('p', { classe: 'transition-texte' }, texteTransition({ bouclierInvoque, passe, prenom })),
      emblemeEl(emb, 'embleme-grand')),
    cielLibre('croix', 2.4));
}

export function fin() {
  return { noeud: vueFin() };
}

// Vue de fin. `nouvelleQuete()` (partie en réseau) : appelé au toucher de « Nouvelle quête », avant le retour à l'accueil.
export function vueFin({ nouvelleQuete = null } = {}) {
  const bouton = lienBouton(T.fin.bouton, { ecran: 'accueil' });
  if (nouvelleQuete) bouton.addEventListener('click', nouvelleQuete);
  return h('section', { classe: 'ecran ecran-fin' },
    cielLibre('lyre', 2.4),
    h('div', { classe: 'fin-corps' },
      h('p', { classe: 'accueil-salut' }, T.fin.titre),
      h('div', { classe: 'ornement', 'aria-hidden': 'true' }, filigrane()),
      h('p', { classe: 'texte' }, T.fin.texte)),
    cielLibre('cassiopee'),
    barreBas(bouton));
}
