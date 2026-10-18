#!/usr/bin/env node
// Simulations de parties complètes avec le moteur de jeu (public/js/game.js) et rapport de simulation.
// Usage : node scripts/simulation.js  (écrit docs/rapports/phase-3-simulation.md)
// Aucune dépendance. Les graines sont fixes : le rapport est reproductible et ne doit pas être modifié à la main.
// Les tests (tests/moteur.test.js) réutilisent ces fonctions.

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { isDeepStrictEqual } = require('node:util');

const RACINE = path.join(__dirname, '..');
const FICHIER_MOTEUR = path.join(RACINE, 'public', 'js', 'game.js');
const FICHIER_SORTIE = path.join(RACINE, 'docs', 'rapports', 'phase-3-simulation.md');

// Nombre de parties simulées par taille de groupe et par façon de choisir le type de carte.
const STRATEGIES = [
  { nom: 'hasard', libelle: 'type choisi au hasard', parties: 100 },
  { nom: 'epreuve', libelle: 'toujours Épreuve (pire cas)', parties: 30 },
  { nom: 'revelation', libelle: 'toujours Révélation (pire cas)', parties: 30 },
];
const PROBA_BOUCLIER = 0.2;
const PROBA_ECHANGE = 0.15;

function lireJson(nom) {
  return JSON.parse(fs.readFileSync(path.join(RACINE, 'public', 'data', nom), 'utf8'));
}

// Le moteur est un module ES du navigateur : on le charge tel quel.
async function chargerMoteur() {
  const source = fs.readFileSync(FICHIER_MOTEUR, 'utf8');
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
}

function refuse(fonction) {
  try {
    fonction();
    return null;
  } catch (e) {
    return e && e.name === 'ErreurJeu' ? e.code : `exception inattendue : ${e && e.message}`;
  }
}

// Joue une partie complète en vérifiant à chaque action les invariants du moteur.
// Renvoie les statistiques de la partie et la liste des anomalies (vide si tout est conforme).
function simulerPartie(M, { cartes, config, nbJoueurs, graine, strategie, probaBouclier = PROBA_BOUCLIER, probaEchange = PROBA_ECHANGE }) {
  const anomalies = [];
  const signaler = (texte) => { if (anomalies.length < 20) anomalies.push(texte); };
  const parId = new Map(cartes.map((c) => [c.id, c]));
  const decider = M.aleatoireDepuisGraine((graine * 7919 + 17) >>> 0);
  const joueurs = Array.from({ length: nbJoueurs }, (_, i) => `j${i + 1}`);
  let etat = M.creerPartie({ joueurs, cartes, config, aleatoire: M.aleatoireDepuisGraine(graine) });

  const stats = {
    cartesJouees: 0, sorts: 0, boucliers: 0, effetsCrees: 0,
    expirations: { prochainTour: 0, echange: 0, finPartie: 0 },
    tailleMax: JSON.stringify(etat).length, pileMin: Infinity,
  };
  const vues = new Set();
  const parJoueur = Object.fromEntries(joueurs.map((j) => [j, 0]));
  const limite = nbJoueurs * config.tours * 3 + 10;
  let actions = 0;
  let tourAttendu = 1;
  let indexAttendu = 0;

  const verifierEtat = (e) => {
    if (!isDeepStrictEqual(JSON.parse(JSON.stringify(e)), e)) signaler('état non sérialisable en JSON');
    stats.tailleMax = Math.max(stats.tailleMax, JSON.stringify(e).length);
    const restantes = e.types.reduce((s, t) => s + e.piles[t].length, 0);
    if (restantes + e.jouees.length + (e.carte ? 1 : 0) !== cartes.length) signaler('cartes perdues ou dupliquées entre piles et cartes jouées');
  };

  while (!M.estFinie(etat)) {
    actions += 1;
    if (actions > limite) { signaler('la partie ne s\'arrête pas'); break; }
    const courant = M.joueurCourant(etat);
    if (courant !== joueurs[indexAttendu]) signaler(`ordre des tours : ${courant} au lieu de ${joueurs[indexAttendu]}`);
    const { tour, total } = M.compteur(etat);
    if (tour !== tourAttendu || total !== config.tours) signaler(`compteur ${tour} / ${total} au lieu de ${tourAttendu} / ${config.tours}`);
    if (etat.effets.some((e) => e.joueur === courant && e.duree === 'prochain_tour')) signaler('effet « prochain tour » encore actif au tour de la personne concernée');

    // Parfois, un effet en cours provoque un échange de butins, signalé par n'importe quelle personne.
    if (etat.effets.length > 0 && decider() < probaEchange) {
      const effet = etat.effets[Math.floor(decider() * etat.effets.length)];
      const qui = joueurs[Math.floor(decider() * joueurs.length)];
      etat = M.terminerEffetParEchange(etat, qui, effet.carte);
      if (etat.effets.some((e) => e.carte === effet.carte)) signaler('effet toujours présent après un échange');
      stats.expirations.echange += 1;
    }

    const type = strategie === 'hasard' ? (decider() < 0.5 ? 'epreuve' : 'revelation') : strategie;
    stats.pileMin = Math.min(stats.pileMin, M.cartesRestantes(etat, type));
    etat = M.choisirType(etat, courant, type);
    const carte = parId.get(etat.carte);
    if (!carte || carte.type !== type) signaler(`carte tirée ${etat.carte} hors de la pile ${type}`);
    if (vues.has(etat.carte)) signaler(`carte jouée deux fois : ${etat.carte}`);
    vues.add(etat.carte);
    verifierEtat(etat);

    const avant = etat.effets;
    const bouclier = decider() < probaBouclier;
    const apres = bouclier ? M.invoquerBouclier(etat, courant) : M.jeterSort(etat, courant);
    const crees = apres.effets.filter((e) => !avant.some((a) => a.carte === e.carte));
    const disparus = avant.filter((a) => !apres.effets.some((e) => e.carte === a.carte));
    if (bouclier) stats.boucliers += 1; else stats.sorts += 1;
    if (bouclier && crees.length > 0) signaler('effet créé malgré le bouclier');
    if (!bouclier && carte && carte.duree && !M.estFinie(apres)) {
      if (crees.length !== 1 || crees[0].carte !== carte.id || crees[0].joueur !== courant) signaler(`effet de ${carte.id} absent après « Le sort est jeté »`);
    }
    stats.effetsCrees += (!bouclier && carte && carte.duree) ? 1 : 0;
    for (const d of disparus) {
      if (M.estFinie(apres)) stats.expirations.finPartie += 1;
      else if (d.duree === 'prochain_tour' && d.joueur === M.joueurCourant(apres)) stats.expirations.prochainTour += 1;
      else signaler(`effet ${d.carte} disparu sans raison`);
    }
    parJoueur[courant] += 1;
    stats.cartesJouees += 1;
    etat = apres;
    verifierEtat(etat);
    indexAttendu += 1;
    if (indexAttendu === nbJoueurs) { indexAttendu = 0; tourAttendu += 1; }
  }

  // Arrêt exactement au bon moment : chaque personne a joué « tours » fois, pas une de plus.
  if (stats.cartesJouees !== nbJoueurs * config.tours) signaler(`${stats.cartesJouees} cartes jouées au lieu de ${nbJoueurs * config.tours}`);
  for (const j of joueurs) if (parJoueur[j] !== config.tours) signaler(`${j} a joué ${parJoueur[j]} fois`);
  if (etat.effets.length !== 0) signaler('effets encore actifs après la fin');
  if (M.joueurCourant(etat) !== null) signaler('une personne a encore la main après la fin');
  if (M.compteur(etat).tour !== config.tours) signaler('compteur final incorrect');
  if (!refuse(() => M.choisirType(etat, joueurs[0], 'epreuve'))) signaler('tirage accepté après la fin');
  if (!refuse(() => M.jeterSort(etat, joueurs[0]))) signaler('« Le sort est jeté » accepté après la fin');
  return { ...stats, anomalies };
}

// Toutes les simulations : chaque taille de groupe de JOUEURS_MINIMUM à config.joueursMax, chaque stratégie.
function campagne(M, cartes, config) {
  const resultats = [];
  for (let n = M.JOUEURS_MINIMUM; n <= config.joueursMax; n += 1) {
    STRATEGIES.forEach((s, k) => {
      const ligne = {
        nbJoueurs: n, strategie: s.nom, libelle: s.libelle, parties: 0, cartesJouees: 0, sorts: 0, boucliers: 0,
        effetsCrees: 0, expirations: { prochainTour: 0, echange: 0, finPartie: 0 }, tailleMax: 0, pileMin: Infinity, anomalies: [],
      };
      for (let i = 0; i < s.parties; i += 1) {
        const r = simulerPartie(M, { cartes, config, nbJoueurs: n, graine: n * 100000 + k * 10000 + i, strategie: s.nom });
        ligne.parties += 1;
        for (const cle of ['cartesJouees', 'sorts', 'boucliers', 'effetsCrees']) ligne[cle] += r[cle];
        for (const cle of Object.keys(ligne.expirations)) ligne.expirations[cle] += r.expirations[cle];
        ligne.tailleMax = Math.max(ligne.tailleMax, r.tailleMax);
        ligne.pileMin = Math.min(ligne.pileMin, r.pileMin);
        ligne.anomalies.push(...r.anomalies.map((a) => `graine ${n * 100000 + k * 10000 + i} : ${a}`));
      }
      resultats.push(ligne);
    });
  }
  return resultats;
}

// Cas limites : chaque action faite hors de son moment doit être refusée avec le bon motif.
function casLimites(M, cartes, config) {
  const joueurs = Array.from({ length: M.JOUEURS_MINIMUM }, (_, i) => `j${i + 1}`);
  const [a, b] = joueurs;
  const nouvelle = () => M.creerPartie({ joueurs, cartes, config, aleatoire: M.aleatoireDepuisGraine(1) });
  const durable = cartes.find((c) => c.duree);
  let finie = nouvelle();
  while (!M.estFinie(finie)) {
    const j = M.joueurCourant(finie);
    finie = M.invoquerBouclier(M.choisirType(finie, j, 'revelation'), j);
  }
  const avecEffet = { ...nouvelle(), etape: 'carte', carte: durable.id };
  const cas = [
    ['Partie à une seule personne', 'pas-assez-de-joueurs', () => M.creerPartie({ joueurs: [a], cartes, config, aleatoire: Math.abs })],
    ['Une personne de plus que le maximum de config.json', 'partie-complete', () => M.creerPartie({
      joueurs: Array.from({ length: config.joueursMax + 1 }, (_, i) => `p${i}`), cartes, config, aleatoire: M.aleatoireDepuisGraine(1) })],
    ['Même personne inscrite deux fois', 'joueurs-en-double', () => M.creerPartie({ joueurs: [a, a], cartes, config, aleatoire: M.aleatoireDepuisGraine(1) })],
    ['Partie sans fonction de hasard', 'hasard-absent', () => M.creerPartie({ joueurs, cartes, config })],
    ['Pile trop petite pour le pire cas (tout le monde choisit le même type)', 'pile-insuffisante', () => M.creerPartie({
      joueurs, cartes: cartes.filter((c) => c.type === 'revelation').concat(cartes.filter((c) => c.type === 'epreuve').slice(0, 1)),
      config, aleatoire: M.aleatoireDepuisGraine(1) })],
    ['Tirer une carte hors de son tour', 'pas-son-tour', () => M.choisirType(nouvelle(), b, 'epreuve')],
    ['Tirer une carte pour une personne inconnue', 'joueur-inconnu', () => M.choisirType(nouvelle(), 'inconnu', 'epreuve')],
    ['Tirer un type de carte inconnu', 'type-inconnu', () => M.choisirType(nouvelle(), a, 'joker')],
    ['Tirer une deuxième carte dans le même tour', 'carte-deja-tiree', () => M.choisirType(M.choisirType(nouvelle(), a, 'epreuve'), a, 'epreuve')],
    ['« Le sort est jeté » avant d\'avoir tiré une carte', 'aucune-carte', () => M.jeterSort(nouvelle(), a)],
    ['« Invoquer un bouclier » avant d\'avoir tiré une carte', 'aucune-carte', () => M.invoquerBouclier(nouvelle(), a)],
    ['« Le sort est jeté » par quelqu\'un d\'autre que la personne qui joue', 'pas-son-tour', () => M.jeterSort(M.choisirType(nouvelle(), a, 'epreuve'), b)],
    ['Signaler un échange pour un effet qui n\'existe pas', 'effet-inconnu', () => M.terminerEffetParEchange(nouvelle(), a, durable.id)],
    ['Signaler un échange par une personne inconnue', 'joueur-inconnu', () => M.terminerEffetParEchange(M.jeterSort(avecEffet, a), 'inconnu', durable.id)],
    ['Tirer une carte après la fin', 'partie-finie', () => M.choisirType(finie, a, 'epreuve')],
    ['« Le sort est jeté » après la fin', 'partie-finie', () => M.jeterSort(finie, a)],
    ['« Invoquer un bouclier » après la fin', 'partie-finie', () => M.invoquerBouclier(finie, a)],
    ['Signaler un échange après la fin', 'partie-finie', () => M.terminerEffetParEchange(finie, a, durable.id)],
  ];
  return cas.map(([description, attendu, action]) => {
    const obtenu = refuse(action);
    return { description, attendu, obtenu, conforme: obtenu === attendu };
  });
}

function genererRapport(resultats, cas, config) {
  const L = [];
  const total = resultats.reduce((s, r) => s + r.parties, 0);
  const anomalies = resultats.flatMap((r) => r.anomalies);
  L.push('# Phase 3 : rapport de simulation du moteur de jeu');
  L.push('');
  L.push('> Fichier généré par `node scripts/simulation.js` à partir de simulations réelles du moteur (`public/js/game.js`). Ne pas le modifier à la main.');
  L.push('> Les graines du hasard sont fixes : relancer la commande redonne exactement les mêmes chiffres. `npm run test:rapide` vérifie que ce fichier est à jour.');
  L.push('');
  L.push(`Réglages lus dans \`public/data/config.json\` : ${config.tours} tours, ${config.joueursMax} personnes au maximum.`);
  L.push('');
  L.push('## En bref');
  L.push('');
  L.push(`- ${total} parties complètes simulées, de 2 à ${config.joueursMax} personnes.`);
  L.push(`- Anomalies relevées : ${anomalies.length}.`);
  L.push(`- Cas limites (actions hors de leur moment) refusés comme prévu : ${cas.filter((c) => c.conforme).length} sur ${cas.length}.`);
  L.push('');
  L.push('## Ce qui est vérifié à chaque action de chaque partie');
  L.push('');
  L.push('- Ordre des tours : ordre d\'arrivée, la main passe à la personne suivante puis revient à la première.');
  L.push(`- Compteur « Tour N / ${config.tours} » : il avance quand tout le monde a joué une fois.`);
  L.push('- Chaque carte tirée vient de la pile choisie et n\'a jamais été jouée avant ; aucune carte n\'est perdue ni dupliquée.');
  L.push('- « Invoquer un bouclier » compte le tour mais ne crée aucun effet ; « Le sort est jeté » sur une carte durable crée son effet pour la personne qui l\'a jouée.');
  L.push('- Un effet « jusqu\'à son prochain tour » disparaît au début du tour suivant de la personne concernée, pas avant ; un effet « jusqu\'à la fin de la partie » ne disparaît qu\'à la fin ou après un échange de butins ; après un échange signalé, l\'effet a disparu.');
  L.push('- L\'état reste un objet simple, identique après un aller-retour en JSON (comme dans Firebase).');
  L.push(`- Fin : la partie s'arrête exactement quand chaque personne a joué ${config.tours} fois, plus aucun effet ni personne n'a la main, et toute action est ensuite refusée.`);
  L.push('');
  L.push(`Hasard des simulations : bouclier invoqué dans ${Math.round(PROBA_BOUCLIER * 100)} % des tours ; avant chaque tour, si un effet est en cours, un échange de butins est signalé dans ${Math.round(PROBA_ECHANGE * 100)} % des cas.`);
  L.push('');
  L.push('## Résultats par taille de groupe');
  L.push('');
  L.push('| Personnes | Choix du type | Parties | Cartes jouées | Sorts jetés | Boucliers | Effets créés | Fin au prochain tour | Fin par échange | Fin de partie | Cartes restantes au minimum dans la pile choisie | Taille max de l\'état (caractères JSON) | Anomalies |');
  L.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|');
  for (const r of resultats) {
    L.push(`| ${r.nbJoueurs} | ${r.libelle} | ${r.parties} | ${r.cartesJouees} | ${r.sorts} | ${r.boucliers} | ${r.effetsCrees} | ${r.expirations.prochainTour} | ${r.expirations.echange} | ${r.expirations.finPartie} | ${r.pileMin} | ${r.tailleMax} | ${r.anomalies.length} |`);
  }
  L.push('');
  L.push('« Cartes restantes au minimum » : le plus petit nombre de cartes qui restait dans la pile au moment d\'y tirer. Dans le pire cas (tout le monde choisit toujours le même type), la dernière carte tirée laisse la pile à ce nombre moins une.');
  L.push('');
  L.push('## Cas limites');
  L.push('');
  L.push('| Action | Refus attendu | Refus obtenu | Conforme |');
  L.push('|---|---|---|---|');
  for (const c of cas) L.push(`| ${c.description} | \`${c.attendu}\` | \`${c.obtenu}\` | ${c.conforme ? 'oui' : 'NON'} |`);
  L.push('');
  if (anomalies.length > 0) {
    L.push('## Anomalies');
    L.push('');
    for (const a of anomalies.slice(0, 50)) L.push(`- ${a}`);
    L.push('');
  }
  return L.join('\n');
}

async function produireRapport() {
  const M = await chargerMoteur();
  const cartes = lireJson('cartes.json');
  const config = lireJson('config.json');
  const resultats = campagne(M, cartes, config);
  const cas = casLimites(M, cartes, config);
  return { texte: genererRapport(resultats, cas, config), resultats, cas };
}

async function main() {
  const { texte, resultats } = await produireRapport();
  fs.writeFileSync(FICHIER_SORTIE, texte);
  const total = resultats.reduce((s, r) => s + r.parties, 0);
  const anomalies = resultats.reduce((s, r) => s + r.anomalies.length, 0);
  console.log(`Écrit : ${path.relative(RACINE, FICHIER_SORTIE)} (${total} parties, ${anomalies} anomalies)`);
}

if (require.main === module) {
  main().catch((e) => { console.error(e); process.exitCode = 1; });
}

module.exports = { chargerMoteur, simulerPartie, campagne, casLimites, genererRapport, produireRapport, lireJson, FICHIER_SORTIE, STRATEGIES };
