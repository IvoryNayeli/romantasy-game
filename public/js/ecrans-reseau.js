// Salle d'attente en réseau (phase 4) : même écran que la salle fictive de ecrans.js (mêmes blocs, mêmes classes),
// alimenté par l'écoute de la partie en cours (parties/<CODE>) et non par des données fictives.
// L'écoute ne fait qu'afficher : seules les actions de la personne (emblème, « Je suis là », « Commencer la quête »)
// écrivent dans la base, une transaction chacune.

import { h, icone, coins } from './dom.js';
import { trouverCode } from './codes.js';
import * as T from './textes.js';
import { ligneJoueur, barreBas } from './ecrans.js';

export function salle({ donnees, params, naviguer, reseau }) {
  const S = T.salle;
  const code = trouverCode(params.get('code'), donnees.codes);
  let actif = true;
  let arreter = null;
  let partie = null;
  let enCours = false;
  let prenomSaisi = '';
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
  boutonCommencer.addEventListener('click', () => agir(() => reseau.commencer(code)));

  function maj() {
    const max = partie?.max || donnees.config.joueursMax;
    const joueurs = reseau.joueursOrdonnes(partie);
    const fiche = joueurs.find((j) => j.id === moi) || null;
    const estHote = Boolean(fiche) && partie.hote === moi;
    const pret = fiche?.pret === true;

    // Liste « La compagnie », dans l'ordre d'arrivée. Ma ligne montre le prénom en cours de saisie.
    const lignes = joueurs.map((j) => ligneJoueur(donnees, {
      prenom: j.id === moi && !pret ? prenomSaisi : j.prenom || '', embleme: j.embleme || null, pret: j.pret === true,
    }, { hote: j.id === partie.hote, soi: j.id === moi }));
    for (let i = joueurs.length; i < max; i += 1) lignes.push(h('li', { classe: 'joueur-ligne joueur-libre', 'aria-hidden': 'true' }));
    liste.replaceChildren(...lignes);

    // Personne absente de la liste : partie complète ou déjà commencée (formulaire remplacé par l'avis).
    const exclu = Boolean(partie) && !fiche;
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
    if (fiche && partie.statut === reseau.STATUTS.PARTIE) { aller({ ecran: 'choix', tour: 1 }); return; }
    const places = Object.keys(partie.joueurs || {}).length < partie.max;
    if (!fiche && partie.statut === reseau.STATUTS.SALLE && places) { aller({ ecran: 'rejoindre', code }); return; }
    maj();
  }

  arreter = reseau.ecouter(code, recevoir, () => { if (actif) messageErreur.textContent = T.reseau.indisponible; });

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
  return { noeud, nettoyer: () => { actif = false; if (arreter) arreter(); } };
}
