// Page de démonstration : liste de liens vers chaque écran avec des données fictives.
// Le nombre de tours et de joueur(se)s vient de config.json (voir donnees.js).

import { chargerDonnees } from './donnees.js';
import { h, adresse } from './dom.js';

const PAGE = 'index.html';

const lien = (texte, params) => h('a', { classe: 'demo-lien', href: PAGE + adresse(params) }, texte);

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
    groupe('Salle d\'attente', [
      lien('Hôte, une personne déjà là', { ecran: 'salle', hote: 1, autres: 1 }),
      lien('Hôte, prêt(e), prêt à commencer', { ecran: 'salle', hote: 1, autres: 1, prenom: 'Noa', embleme: 'sirene', pret: 1 }),
      lien('Joueur(se) qui rejoint', { ecran: 'salle', autres: 2 }),
      lien('Hôte seul(e) dans la salle', { ecran: 'salle', hote: 1, autres: 0 }),
      lien('Dernière place de la salle', { ecran: 'salle', autres: joueursMax - 1 }),
      lien('Partie complète', { ecran: 'salle', complete: 1 }),
      lien('Code le plus long', { ecran: 'salle', code: 'OBSIDIENNE', autres: 2 }),
    ]),
    groupe('Tour de jeu', [
      lien('Choix de la carte, tour 1', { ecran: 'choix', tour: 1 }),
      lien(`Choix de la carte, dernier tour (${tours})`, { ecran: 'choix', tour: tours }),
      lien('Carte Épreuve révélée', { ecran: 'carte', type: 'epreuve', tour: 1 }),
      lien('Carte Révélation révélée', { ecran: 'carte', type: 'revelation', tour: 1 }),
      lien('Carte à effet durable révélée', { ecran: 'carte', carte: durable, tour: 2 }),
      lien('Carte la plus longue révélée', { ecran: 'carte', carte: plusLongue }),
      lien('Attente, carte Épreuve', { ecran: 'attente', carte: premiere('epreuve'), tour: 2 }),
      lien('Attente, carte Révélation', { ecran: 'attente', carte: premiere('revelation'), tour: 2 }),
      lien('Attente, carte à effet durable', { ecran: 'attente', carte: durable, tour: 2 }),
      lien('Attente, sans effets en cours', { ecran: 'attente', carte: premiere('revelation'), effets: 0 }),
      lien('Transition : le sort est jeté', { ecran: 'transition' }),
      lien('Transition : bouclier', { ecran: 'transition', bouclier: 1 }),
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
