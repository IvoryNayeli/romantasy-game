// Page de démonstration : liste de liens vers chaque écran avec des données fictives
// (paramètre demo=1 : aucun accès à la base, même pour « Créer », « Rejoindre » et la salle d'attente).
// Le nombre de tours et de personnes vient de config.json (voir donnees.js).

import { chargerDonnees } from './donnees.js';
import { h, adresse } from './dom.js';

const PAGE = 'index.html';

const lien = (texte, params) => h('a', { classe: 'demo-lien', href: PAGE + adresse({ demo: 1, ...params }) }, texte);

function groupe(titre, liens) {
  return h('section', { classe: 'demo-groupe' },
    h('h2', null, titre),
    h('ul', { classe: 'demo-liste' }, liens.map((l) => h('li', null, l))));
}

function ecrans(donnees) {
  const { tours, joueursMax } = donnees.config;
  const premiere = (type) => donnees.cartes.find((c) => c.type === type).id;
  const plusLongue = donnees.cartes.reduce((a, b) => (b.texte.length > a.texte.length ? b : a)).id;
  const durable = donnees.cartes.find((c) => c.duree).id;
  return [
    groupe('Accueil et règles', [
      lien('Accueil', { ecran: 'accueil' }),
      lien('Comment ça marche ?', { ecran: 'regles' }),
    ]),
    groupe('Créer ou rejoindre une partie', [
      lien('Créer : choix du code, rien de choisi', { ecran: 'creer' }),
      lien('Créer : code choisi (ONYX)', { ecran: 'creer', code: 'ONYX' }),
      lien('Rejoindre : saisie du code', { ecran: 'rejoindre' }),
      lien('Rejoindre : code saisi avec accent et minuscules (élixir)', { ecran: 'rejoindre', code: 'élixir' }),
      lien('Rejoindre : message « code inconnu »', { ecran: 'rejoindre', code: 'DRAGON', erreur: 'inconnu' }),
      lien('Rejoindre : message « code vide »', { ecran: 'rejoindre', erreur: 'vide' }),
    ]),
    groupe('Salle d\'attente', [
      lien('Hôte, une personne déjà là : saisie du prénom', { ecran: 'salle', hote: 1, autres: 1 }),
      lien('Inscription : choix de l\'emblème', { ecran: 'salle', hote: 1, autres: 1, prenom: 'Noa', etape: 'embleme' }),
      lien('Hôte et une autre personne, présence confirmée : salle d\'attente, commencer actif', { ecran: 'salle', hote: 1, autres: 1, prenom: 'Noa', embleme: 'sirene', pret: 1 }),
      lien('Une personne qui rejoint', { ecran: 'salle', autres: 2 }),
      lien('Hôte sans personne d\'autre dans la salle', { ecran: 'salle', hote: 1, autres: 0 }),
      lien('Dernière place de la salle', { ecran: 'salle', autres: joueursMax - 1 }),
      lien('Partie complète', { ecran: 'salle', complete: 1 }),
      lien('Code le plus long', { ecran: 'salle', code: 'OBSIDIENNE', autres: 2 }),
      lien('Une personne hors ligne', { ecran: 'salle', hote: 1, autres: 2, absent: 1 }),
    ]),
    groupe('Tour de jeu', [
      lien('Choix de la carte, tour 1', { ecran: 'choix', tour: 1 }),
      lien('Choix de la carte, avec effets en cours', { ecran: 'choix', tour: 2, effets: 1 }),
      lien(`Choix de la carte, dernier tour (${tours})`, { ecran: 'choix', tour: tours }),
      lien('Carte Épreuve révélée', { ecran: 'carte', type: 'epreuve', tour: 1 }),
      lien('Carte Révélation révélée', { ecran: 'carte', type: 'revelation', tour: 1 }),
      lien('Carte à effet durable révélée', { ecran: 'carte', carte: durable, tour: 2 }),
      lien('Carte la plus longue révélée', { ecran: 'carte', carte: plusLongue }),
      lien('Carte révélée, avec effets en cours', { ecran: 'carte', type: 'epreuve', tour: 2, effets: 1 }),
      lien('Attente, carte pas encore choisie', { ecran: 'attente', etape: 'choix', tour: 2 }),
      lien('Attente, carte Épreuve', { ecran: 'attente', carte: premiere('epreuve'), tour: 2 }),
      lien('Attente, carte Révélation', { ecran: 'attente', carte: premiere('revelation'), tour: 2 }),
      lien('Attente, carte à effet durable', { ecran: 'attente', carte: durable, tour: 2 }),
      lien('Attente, sans effets en cours', { ecran: 'attente', carte: premiere('revelation'), effets: 0 }),
      lien('Attente, « Échange de butins fait » (éclat d\'étoiles)', { ecran: 'attente', carte: premiere('epreuve'), tour: 2, echange: 1 }),
      lien('Transition : le sort est jeté', { ecran: 'transition' }),
      lien('Attente, personne hors ligne, tour à passer', { ecran: 'attente', carte: premiere('epreuve'), tour: 2, absent: 1 }),
      lien('Transition : bouclier', { ecran: 'transition', bouclier: 1 }),
      lien('Transition : tour passé', { ecran: 'transition', passe: 1 }),
    ]),
    groupe('Fin de partie', [lien('La quête s\'achève', { ecran: 'fin' })]),
  ];
}

function cartes(donnees) {
  const nom = { epreuve: 'Épreuves', revelation: 'Révélations' };
  return ['epreuve', 'revelation'].map((type) => groupe(
    `${nom[type]} (${donnees.cartes.filter((c) => c.type === type).length})`,
    donnees.cartes.filter((c) => c.type === type).map((c) => h('span', { classe: 'demo-carte' },
      h('span', { classe: 'demo-carte-id' }, c.id, c.effet ? ' (effet durable)' : ''),
      lien('Carte', { ecran: 'carte', carte: c.id }),
      lien('Attente', { ecran: 'attente', carte: c.id })))));
}

chargerDonnees().then((donnees) => {
  document.getElementById('demo-liste').replaceChildren(
    ...ecrans(donnees),
    h('h2', { classe: 'demo-separateur' }, 'Les 40 cartes'),
    ...cartes(donnees));
});
