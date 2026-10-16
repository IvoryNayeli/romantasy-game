// Textes de l'interface. Source unique : docs/regles.md (ne pas reformuler ici).
// Le nombre de tours vient de config.json : il est passé en paramètre, jamais écrit dans un texte.

export const marque = 'Romantasy';

export const accueil = {
  salut: 'Bienvenue en ces terres.',
  texte1: 'Les Cours s\'agitent, les dragons s\'éveillent et le destin s\'apprête à battre ses cartes.',
  texte2: 'Récupérez votre butin, choisissez votre emblème et laissez le sort décider du trésor qui sera le vôtre.',
  bouton: 'Comment ça marche ?',
};

export const regles = {
  butTitre: 'But du jeu',
  but: 'Chaque personne commence la partie avec un butin mystère. Au fil de la partie, ce butin pourra passer de main en main… jusqu\'à la grande révélation finale !',
  deroulementTitre: 'Déroulement',
  deroulement: 'À tour de rôle, chaque personne tire une carte de son choix : Épreuve ou Révélation. Tout ce qui doit être accompli est inscrit dessus.',
  carteRevelationNom: 'Carte Révélation (question)',
  carteRevelation: ' : la personne qui joue désigne quelqu\'un (soi-même ou une autre personne) selon la consigne de la carte. Il est aussi possible de ne désigner personne : dans ce cas, aucun butin ne change de main.',
  carteEpreuveNom: 'Carte Épreuve (action)',
  carteEpreuve: ' : la personne qui joue accomplit l\'action que le destin réclame.',
  effetsDurables: 'Certaines cartes Épreuve produisent un effet qui dure. Il prend fin dès qu\'il a provoqué un échange de butins.',
  bouclierTitre: 'Invoquer un bouclier',
  bouclier: 'Une fois la carte révélée, la personne qui joue peut toujours invoquer un bouclier pour refuser l\'épreuve ou la révélation. Mais prenez garde : son tour est alors tout de même consumé.',
  finTitre: 'Fin de la partie',
  fin: (tours) => `Lorsque chaque personne a joué ${tours} fois, la quête s'achève. Vient alors, pour tout le monde, l'heure d'ouvrir son butin et de découvrir ce que le sort lui a réservé !`,
  creer: 'Créer une partie',
  rejoindre: 'Rejoindre une partie',
  retour: 'Retour à l\'accueil',
};

export const types = {
  epreuve: { nom: 'Épreuve', symbole: 'epee' },
  revelation: { nom: 'Révélation', symbole: 'etoile' },
};

export const tour = {
  aToi: 'À toi de jouer !',
  compteur: (n, total) => `Tour ${n} / ${total}`,
  auTourDe: 'Au tour de',
  enAttente: (prenom) => `En attente de ${prenom}…`,
  sortJete: 'Le sort est jeté',
  bouclier: 'Invoquer un bouclier',
  confirmation: 'Invoquer un bouclier ? Ton tour sera tout de même compté.',
  confirmer: 'Invoquer',
  annuler: 'Annuler',
  transitionJete: (prenom) => `Le sort est jeté pour ${prenom}.`,
  transitionBouclier: (prenom) => `${prenom} a invoqué un bouclier.`,
};

export const effets = {
  carte: 'Effet durable',
  enCours: 'Effets en cours',
  prochainTourSoi: 'Jusqu\'à ton prochain tour',
  prochainTourAutre: 'Jusqu\'à son prochain tour',
  finPartie: 'Jusqu\'à la fin de la partie',
};

export const fin = {
  titre: 'La quête s\'achève.',
  texte: 'Le destin a rendu son verdict. Chaque personne tient désormais entre ses mains le butin que le sort lui a réservé. Le moment est venu de le découvrir !',
  bouton: 'Nouvelle quête',
};

export const erreurs = {
  chargement: 'Impossible de charger les données du jeu.',
};

export const salle = {
  codeLibelle: 'Code de la partie',
  accompagnement: 'Rassemblez votre troupe. La quête commencera quand l\'hôte donnera le signal.',
  hote: 'hôte',
  vous: 'toi',
  prenomLibelle: 'Ton prénom',
  embleme: 'Ton emblème',
  pret: 'C\'est bon',
  pretBouton: 'Je suis là',
  commencer: 'Commencer la quête',
  complete: 'La partie est complète',
  groupe: 'Le groupe',
};

// Écran « Créer une partie » : choix du code dans la liste.
export const creer = {
  titre: 'Choisis le code de la partie',
  aide: 'Les autres le saisiront pour te rejoindre.',
  liste: 'Codes de partie',
  valider: 'Valider',
  retour: 'Retour aux règles',
};

// Écran « Rejoindre une partie » : saisie du code.
export const rejoindre = {
  titre: 'Saisis le code de la partie',
  libelle: 'Code de la partie',
  aide: 'Majuscules, minuscules et accents n\'ont pas d\'importance.',
  valider: 'Valider',
  erreurVide: 'Saisis le code de la partie.',
  erreurInconnu: 'Ce code ne correspond à aucune partie. Vérifie-le et réessaie.',
  retour: 'Retour aux règles',
};
