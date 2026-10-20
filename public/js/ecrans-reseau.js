// Écrans en réseau, alimentés par l'écoute de la partie en cours (parties/<CODE>) et non par des données fictives :
// - salle d'attente (phase 4) : même écran que la salle fictive de ecrans.js (mêmes blocs, mêmes classes) ;
// - partie (phase 5) : les écrans de tour et de fin de ecrans.js (mêmes vues), selon l'état du jeu dans la base.
// L'écoute ne fait qu'afficher : seules les actions de la personne (emblème, « Je suis là », « Commencer la quête »,
// choix de carte, « Le sort est jeté », « Invoquer un bouclier », fin d'un effet, tour passé) écrivent dans la base,
// une transaction chacune.
// Phase 6 : sur ces deux écrans, l'écran reste allumé (wakelock.js) et la présence de la personne est signalée
// (reseau.signalerPresence) ; une personne sans connexion est affichée « hors ligne », et si c'est son tour,
// les autres peuvent le passer après le délai de config.json (delaiAbsenceSecondes).

import { h, icone, coins } from './dom.js';
import { trouverCode } from './codes.js';
import * as T from './textes.js';
import {
  ligneJoueur, barreBas, vueChoix, vueCarte, vueAttente, vueTransition, vueFin, panneauEffets, blocAbsence, DUREE_TRANSITION_MS,
} from './ecrans.js';
import { garderEcranAllume } from './wakelock.js';
import { emblemeParId } from './fictif.js';
import { ETAPES, ISSUES as ISSUES_TOUR } from './game.js';

// Une personne joue si elle figure dans l'ordre des tours (présence confirmée au départ).
function joue(partie, id) {
  return Boolean(id) && (partie?.ordre || []).includes(id);
}

export function salle({ donnees, params, naviguer, reseau }) {
  const S = T.salle;
  const code = trouverCode(params.get('code'), donnees.codes);
  let actif = true;
  let arreter = null;
  let partie = null;
  let enCours = false;
  let prenomSaisi = '';
  let libererPresence = null;
  const moi = code ? reseau.identiteConnue(code) : null;

  // Navigation différée : jamais pendant la construction de l'écran.
  function aller(cible) {
    setTimeout(() => { if (actif) naviguer(cible); }, 0);
  }

  if (!code) {
    aller({ ecran: 'rejoindre' });
    return { noeud: h('section', { classe: 'ecran ecran-salle' }) };
  }

  const liste = h('ul', { classe: 'liste-joueurs', 'aria-labelledby': 'titre-groupe' });
  const grille = h('div', { classe: 'grille-emblemes', role: 'radiogroup', 'aria-label': S.embleme });
  const boutonsEmbleme = new Map();
  const champ = h('input', {
    classe: 'champ', id: 'champ-prenom', type: 'text', value: '', autocomplete: 'off',
    autocapitalize: 'words', spellcheck: 'false', enterkeyhint: 'done', maxlength: String(reseau.PRENOM_MAX),
  });
  const messageErreur = h('p', { classe: 'erreur-champ', id: 'erreur-salle', role: 'alert' });
  const boutonPret = h('button', { classe: 'bouton bouton-principal', type: 'button' });
  const boutonCommencer = h('button', { classe: 'bouton bouton-principal', type: 'button' }, h('span', null, S.commencer));
  const avis = h('p', { classe: 'panneau avis-complete', role: 'status' });
  const formulaire = h('div', { classe: 'formulaire' },
    h('label', { classe: 'etiquette-champ', for: 'champ-prenom' }, S.prenomLibelle),
    champ,
    h('p', { classe: 'etiquette-champ' }, S.embleme),
    grille,
    messageErreur);
  const barre = barreBas(boutonPret, boutonCommencer);

  // Action réseau de la personne : une seule à la fois, erreur affichée sous le formulaire.
  function agir(action) {
    if (enCours) return;
    enCours = true;
    messageErreur.textContent = '';
    maj();
    action()
      .then((issue) => { if (issue === reseau.ISSUES.INTROUVABLE) aller({ ecran: 'rejoindre', code, erreur: 'inconnu' }); })
      .catch(() => { if (actif) messageErreur.textContent = T.reseau.indisponible; })
      .finally(() => { enCours = false; if (actif) maj(); });
  }

  for (const emb of donnees.emblemes) {
    const bouton = h('button', {
      classe: 'embleme-choix', type: 'button', role: 'radio', 'aria-checked': 'false',
      onclick: () => agir(() => reseau.choisirEmbleme(code, emb.id)),
    }, h('span', { classe: 'embleme-emoji', 'aria-hidden': 'true' }, emb.emoji), h('span', { classe: 'embleme-nom' }, emb.nom));
    boutonsEmbleme.set(emb.id, bouton);
    grille.append(bouton);
  }
  champ.addEventListener('input', () => { prenomSaisi = champ.value; maj(); });
  boutonPret.addEventListener('click', () => agir(() => reseau.confirmerPresence(code, prenomSaisi)));
  boutonCommencer.addEventListener('click', () => agir(() => reseau.commencer(code, donnees)));

  function maj() {
    const max = partie?.max || donnees.config.joueursMax;
    const joueurs = reseau.joueursOrdonnes(partie);
    const fiche = joueurs.find((j) => j.id === moi) || null;
    const estHote = Boolean(fiche) && partie.hote === moi;
    const pret = fiche?.pret === true;

    // Liste « La compagnie », dans l'ordre d'arrivée. Ma ligne montre le prénom en cours de saisie.
    // Ma propre ligne n'est jamais « hors ligne » : sans connexion, cet écran ne serait de toute façon plus à jour.
    const lignes = joueurs.map((j) => ligneJoueur(donnees, {
      prenom: j.id === moi && !pret ? prenomSaisi : j.prenom || '', embleme: j.embleme || null, pret: j.pret === true,
    }, { hote: j.id === partie.hote, soi: j.id === moi, absent: j.id !== moi && reseau.estAbsent(partie, j.id) }));
    for (let i = joueurs.length; i < max; i += 1) lignes.push(h('li', { classe: 'joueur-ligne joueur-libre', 'aria-hidden': 'true' }));
    liste.replaceChildren(...lignes);

    // Personne absente de la liste (partie complète ou déjà commencée), ou inscrite sans « Je suis là » quand la
    // quête commence : formulaire remplacé par l'avis.
    const exclu = Boolean(partie) && (!fiche || (partie.statut === reseau.STATUTS.PARTIE && !joue(partie, moi)));
    formulaire.hidden = exclu;
    barre.hidden = exclu;
    avis.hidden = !exclu;
    if (exclu) avis.replaceChildren(...coins(), partie.statut === reseau.STATUTS.SALLE ? S.complete : T.reseau.commencee);

    const valide = Boolean(prenomSaisi.trim() && fiche?.embleme);
    boutonPret.disabled = !fiche || pret || !valide || enCours;
    boutonPret.setAttribute('aria-pressed', String(pret));
    boutonPret.className = `bouton ${pret ? 'bouton-secondaire bouton-valide' : 'bouton-principal'}`;
    boutonPret.replaceChildren(...(pret ? [icone('coche')] : []), h('span', null, pret ? S.pret : S.pretBouton));
    boutonCommencer.hidden = !estHote;
    boutonCommencer.disabled = !reseau.peutCommencer(partie) || enCours;
    champ.disabled = !fiche || pret;
    if (pret && champ.value !== fiche.prenom) champ.value = fiche.prenom;
    for (const [id, bouton] of boutonsEmbleme) {
      const titulaire = partie?.emblemes?.[id];
      const prisParAutre = Boolean(titulaire) && titulaire !== moi;
      bouton.classList.toggle('embleme-pris', prisParAutre);
      bouton.setAttribute('aria-checked', String(fiche?.embleme === id));
      bouton.disabled = !fiche || pret || prisParAutre || enCours;
    }
  }

  function recevoir(valeur) {
    if (!actif) return;
    partie = valeur;
    if (!partie) { aller({ ecran: 'rejoindre', code, erreur: 'inconnu' }); return; }
    const fiche = partie.joueurs?.[moi];
    // Présence signalée dès que la personne figure dans la partie (jamais avant : la base refuserait l'écriture).
    if (fiche && !libererPresence) libererPresence = reseau.signalerPresence(code);
    if (partie.statut === reseau.STATUTS.PARTIE && joue(partie, moi)) { aller({ ecran: 'jeu', code }); return; }
    const places = Object.keys(partie.joueurs || {}).length < partie.max;
    if (!fiche && partie.statut === reseau.STATUTS.SALLE && places) { aller({ ecran: 'rejoindre', code }); return; }
    maj();
  }

  arreter = reseau.ecouter(code, recevoir, () => { if (actif) messageErreur.textContent = T.reseau.indisponible; });
  const libererEcran = garderEcranAllume();

  avis.hidden = true;
  const noeud = h('section', { classe: 'ecran ecran-salle' },
    h('div', { classe: 'salle-corps' },
      h('p', { classe: 'code-partie' },
        h('span', { classe: 'code-libelle' }, S.codeLibelle), ' ',
        h('span', { classe: 'code-valeur' }, code)),
      formulaire,
      avis,
      h('h2', { classe: 'titre-liste', id: 'titre-groupe' }, S.groupe),
      liste,
      h('p', { classe: 'texte texte-centre' }, S.accompagnement)),
    barre);
  maj();
  return {
    noeud,
    nettoyer: () => {
      actif = false;
      if (arreter) arreter();
      if (libererPresence) libererPresence();
      libererEcran();
    },
  };
}

// Partie en réseau (phase 5). Selon l'état du jeu (parties/<CODE>/jeu, moteur de game.js) :
// - la personne dont c'est le tour voit « À toi de jouer ! » puis la carte révélée et ses deux boutons ;
// - les autres voient « Au tour de… », la même carte, sans boutons, et « En attente de… » ;
// - après chaque tour, tout le monde voit la transition de 2 secondes, puis le tour suivant ou l'écran de fin ;
// - les effets durables en cours sont affichés à tout le monde.
// L'écran affiché est remplacé par `vue(nom, noeud)` (app.js) ; il n'est reconstruit que s'il change.
export function jeu({ donnees, params, naviguer, reseau, vue }) {
  const code = trouverCode(params.get('code'), donnees.codes);
  const moi = code ? reseau.identiteConnue(code) : null;
  let actif = true;
  let arreter = null;
  let partie = null;
  let vus = null; // nombre de cartes jouées déjà vues (une de plus : transition)
  let enTransition = false;
  let minuteur = null;
  let cleVue = '';
  let cleEffets = '';
  let enCours = false;
  let finie = false;
  let ecranCourant = null;
  let libererPresence = null;
  let libererEcran = null;
  let bloc = null; // bloc d'absence de l'écran d'attente affiché (blocAbsence)
  let minuteurAbsence = null;
  const absentDepuis = new Map(); // personne -> heure (de ce téléphone) où son absence a été vue pour la première fois
  const delaiAbsence = Number(donnees.config.delaiAbsenceSecondes) * 1000;

  function aller(cible) {
    setTimeout(() => { if (actif) naviguer(cible); }, 0);
  }

  function arreterEcoute() {
    if (arreter) arreter();
    arreter = null;
  }

  if (!code || !moi) {
    aller(code ? { ecran: 'salle', code } : { ecran: 'rejoindre' });
    return { noeud: h('section', { classe: 'ecran' }) };
  }
  libererEcran = garderEcranAllume();

  const personne = (id) => {
    const fiche = partie.joueurs?.[id] || {};
    return { prenom: fiche.prenom || '', embleme: emblemeParId(donnees, fiche.embleme) };
  };
  const carteParId = (id) => donnees.cartes.find((c) => c.id === id) || null;

  // Effets en cours, au format du panneau de ecrans.js.
  function effets(jeuEnCours) {
    return (jeuEnCours.effets || []).map((e) => {
      const p = personne(e.joueur);
      return {
        joueur: { prenom: p.prenom, embleme: p.embleme.id }, effet: e.effet, duree: e.duree, carte: e.carte, soi: e.joueur === moi,
      };
    });
  }

  // Action de tour : une seule à la fois ; en cas d'erreur réseau, message sous l'écran.
  function agir(action, extra) {
    if (enCours || !actif) return;
    enCours = true;
    reseau.jouer(code, action, extra)
      .then((issue) => { if (issue === reseau.ISSUES.INTROUVABLE) aller({ ecran: 'rejoindre', code, erreur: 'inconnu' }); })
      .catch(() => {
        if (!actif || !ecranCourant) return;
        let message = ecranCourant.querySelector('.erreur-champ');
        if (!message) {
          message = h('p', { classe: 'erreur-champ', role: 'alert' });
          ecranCourant.append(message);
        }
        message.textContent = T.reseau.indisponible;
      })
      .finally(() => { enCours = false; });
  }
  const signaler = (carte) => agir(reseau.ACTIONS.ECHANGE, { carte });

  function afficher(nom, noeud, blocAffiche = null) {
    ecranCourant = noeud;
    bloc = blocAffiche;
    vue(nom, noeud);
  }

  // Écran d'attente : « … est hors ligne. » dès que la personne dont c'est le tour n'a plus de connexion, puis
  // « Passer son tour » quand son absence dure depuis le délai de config.json (compté depuis que ce téléphone l'a vue).
  // Retour de la personne entre-temps : le bloc disparaît ; retour pendant qu'on passe son tour : la base refuse.
  function majAbsence() {
    clearTimeout(minuteurAbsence);
    for (const id of absentDepuis.keys()) if (!reseau.estAbsent(partie, id)) absentDepuis.delete(id);
    if (!bloc) return;
    const etat = partie.jeu;
    const courant = etat.joueurs[etat.indexJoueur];
    if (!reseau.estAbsent(partie, courant)) { bloc.majAbsence(null); return; }
    if (!absentDepuis.has(courant)) absentDepuis.set(courant, Date.now());
    const reste = absentDepuis.get(courant) + delaiAbsence - Date.now();
    const passer = reste <= 0 ? () => agir(reseau.ACTIONS.PASSER, { cible: courant }) : null;
    bloc.majAbsence({ prenom: personne(courant).prenom, passer });
    if (!passer) minuteurAbsence = setTimeout(() => { if (actif && !finie && partie) majAbsence(); }, reste);
  }

  function rendre() {
    const etat = partie.jeu;
    const listeEffets = effets(etat);
    const nouvelleCleEffets = JSON.stringify(listeEffets.map((e) => e.carte));
    const jouees = etat.jouees || [];
    let cle;
    if (enTransition) cle = `transition:${jouees.length}`;
    else if (etat.etape === ETAPES.FIN) cle = 'fin';
    else cle = `${etat.etape}:${etat.tour}:${etat.indexJoueur}`;

    if (cle === cleVue) {
      // Même écran : seul le panneau des effets peut avoir changé (fin d'un effet par échange). Il est remplacé
      // sur place, sans reconstruire l'écran (la carte ne se retourne pas une seconde fois).
      if (nouvelleCleEffets !== cleEffets && ecranCourant && cle !== 'fin' && !enTransition) {
        cleEffets = nouvelleCleEffets;
        const ancien = ecranCourant.querySelector('.effets-en-cours');
        const nouveau = panneauEffets(donnees, listeEffets, signaler);
        if (ancien && nouveau) ancien.replaceWith(nouveau);
        else if (ancien) ancien.remove();
        else rendreEcran(etat, listeEffets, etat.joueurs[etat.indexJoueur]);
      }
      return;
    }
    cleVue = cle;
    cleEffets = nouvelleCleEffets;

    if (enTransition) {
      const derniere = etat.derniere || {};
      const tour = jouees.length ? jouees[jouees.length - 1].tour : etat.tour;
      const p = personne(derniere.joueur);
      afficher('transition', vueTransition(donnees, {
        tour, bouclier: derniere.issue === ISSUES_TOUR.BOUCLIER, passe: derniere.issue === ISSUES_TOUR.PASSE,
        prenom: p.prenom, embleme: p.embleme,
      }));
      return;
    }
    if (etat.etape === ETAPES.FIN) {
      // Écran de fin : plus rien ne change, on cesse d'écouter. « Nouvelle quête » supprime la partie terminée.
      // La présence et l'écran allumé s'arrêtent aussi : il n'y a plus de tour à passer.
      finie = true;
      arreterEcoute();
      clearTimeout(minuteurAbsence);
      reseau.arreterPresence();
      libererPresence = null;
      libererEcran();
      afficher('fin', vueFin({ nouvelleQuete: () => { reseau.supprimer(code).catch(() => {}); } }));
      return;
    }
    rendreEcran(etat, listeEffets, etat.joueurs[etat.indexJoueur]);
  }

  function rendreEcran(etat, listeEffets, courant) {
    const aMoi = courant === moi;
    const c = etat.carte ? carteParId(etat.carte) : null;
    if (aMoi && etat.etape === ETAPES.CHOIX) {
      afficher('choix', vueChoix(donnees, {
        tour: etat.tour, effets: listeEffets, signaler,
        choisir: (type) => agir(reseau.ACTIONS.CHOISIR, { type }),
      }));
    } else if (aMoi && etat.etape === ETAPES.CARTE && c) {
      const sortJete = h('button', {
        classe: 'bouton bouton-principal', type: 'button', onclick: () => agir(reseau.ACTIONS.SORT),
      }, h('span', null, T.tour.sortJete));
      afficher('carte', vueCarte(donnees, {
        tour: etat.tour, carte: c, effets: listeEffets, signaler, sortJete,
        bouclier: () => agir(reseau.ACTIONS.BOUCLIER),
      }));
    } else {
      // Les autres n'ont aucun bouton de tour ; ils peuvent seulement signaler un échange depuis le panneau des effets,
      // et passer le tour d'une personne absente (bloc d'absence, voir majAbsence).
      const absence = blocAbsence();
      afficher('attente', vueAttente(donnees, {
        tour: etat.tour, carte: c, actif: personne(courant), effets: listeEffets, signaler, pied: absence.noeud,
      }), absence);
    }
  }

  function recevoir(valeur) {
    if (!actif || finie) return;
    if (!valeur) { aller({ ecran: 'rejoindre', code, erreur: 'inconnu' }); return; }
    partie = valeur;
    const etat = partie.jeu;
    if (partie.statut !== reseau.STATUTS.PARTIE || !etat || !(etat.joueurs || []).includes(moi)) {
      aller({ ecran: 'salle', code });
      return;
    }
    // Présence signalée dès que la partie confirme que la personne y joue (jamais avant : la base refuserait).
    if (!libererPresence) libererPresence = reseau.signalerPresence(code);
    const nombre = (etat.jouees || []).length;
    if (vus === null) vus = nombre;
    if (nombre > vus) {
      // Un tour vient de se terminer : transition de 2 secondes pour tout le monde, puis l'état courant.
      vus = nombre;
      enTransition = true;
      clearTimeout(minuteur);
      minuteur = setTimeout(() => {
        enTransition = false;
        if (actif && partie) { rendre(); majAbsence(); }
      }, DUREE_TRANSITION_MS);
    }
    rendre();
    if (!finie) majAbsence();
  }

  arreter = reseau.ecouter(code, recevoir, () => {
    if (actif && ecranCourant && !ecranCourant.querySelector('.erreur-champ')) {
      ecranCourant.append(h('p', { classe: 'erreur-champ', role: 'alert' }, T.reseau.indisponible));
    }
  });

  return {
    noeud: h('section', { classe: 'ecran' }),
    nettoyer: () => {
      actif = false;
      clearTimeout(minuteur);
      clearTimeout(minuteurAbsence);
      arreterEcoute();
      if (libererPresence) libererPresence();
      if (libererEcran) libererEcran();
    },
  };
}
