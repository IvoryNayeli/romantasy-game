// Données fictives pour les écrans de la phase 2 (aucun réseau, aucune logique de jeu).
// Tout ce qui dépend d'un nombre (joueur(se)s, tours) est calculé à partir de config.json.

const PRENOMS = [
  ['Léa', 'fee'], ['Tom', 'dragon'], ['Inès', 'licorne'], ['Noa', 'loup-garou'], ['Sacha', 'sirene'],
  ['Camille', 'elfe'], ['Louis', 'vampire'], ['Maëlle', 'sorciere'], ['Yanis', 'phenix'], ['Alix', 'chevalier'],
];

// Joueur(se)s fictif(ve)s déjà présent(e)s dans le salon (l'ordre est l'ordre d'arrivée).
export function joueursFictifs(donnees, nombre) {
  const resultat = [];
  for (let i = 0; i < nombre; i += 1) {
    const [prenom, id] = PRENOMS[i % PRENOMS.length];
    const emblemeExiste = donnees.emblemes.some((e) => e.id === id);
    const embleme = emblemeExiste ? id : donnees.emblemes[i % donnees.emblemes.length].id;
    resultat.push({ prenom: i < PRENOMS.length ? prenom : `${prenom} ${i + 1}`, embleme, pret: true });
  }
  return resultat;
}

// Effets durables fictifs « en cours » pour le bandeau de l'écran d'attente.
export function effetsEnCours(donnees) {
  const durables = donnees.cartes.filter((c) => c.duree);
  const choisis = ['epr-17', 'epr-06']
    .map((id) => durables.find((c) => c.id === id))
    .filter(Boolean);
  const [premier, second] = joueursFictifs(donnees, 2);
  const sources = choisis.length === 2 ? choisis : durables.slice(0, 2);
  return [
    { joueur: premier, effet: sources[0].effet, duree: sources[0].duree },
    { joueur: second, effet: sources[1].effet, duree: sources[1].duree },
  ];
}

export function emblemeParId(donnees, id) {
  return donnees.emblemes.find((e) => e.id === id) || donnees.emblemes[0];
}

// Carte à afficher d'après les paramètres d'URL : ?carte=epr-06 ou ?type=epreuve (première carte du type).
export function carteDepuisParametres(donnees, params) {
  const parId = donnees.cartes.find((c) => c.id === params.get('carte'));
  if (parId) return parId;
  const type = params.get('type') === 'revelation' ? 'revelation' : 'epreuve';
  return donnees.cartes.find((c) => c.type === type);
}

// Le numéro de tour demandé est ramené entre 1 et le nombre de tours de config.json.
export function tourDepuisParametres(donnees, params) {
  const n = parseInt(params.get('tour'), 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, donnees.config.tours);
}

export function entierDepuisParametres(params, nom, defaut, min, max) {
  const n = parseInt(params.get(nom), 10);
  if (!Number.isFinite(n)) return defaut;
  return Math.max(min, Math.min(max, n));
}

// Nombre minimal de joueur(se)s prêt(e)s pour que l'hôte puisse commencer (règle de docs/regles.md,
// absente de config.json : choix à confirmer, voir le rapport de la phase 2).
export const PRETS_MINIMUM = 2;
