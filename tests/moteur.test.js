'use strict';

// Phase 3 : moteur de jeu en logique pure (public/js/game.js), sans navigateur ni réseau.
// Simulations de parties complètes (scripts/simulation.js), effets durables, bouclier, fin, actions refusées.
// Lancer : node --test tests/

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sim = require('../scripts/simulation.js');

const RACINE = path.join(__dirname, '..');
const cartes = sim.lireJson('cartes.json');
const config = sim.lireJson('config.json');
const chargement = sim.chargerMoteur();
const rapport = chargement.then(() => sim.produireRapport());

// Hasard qui laisse les piles dans l'ordre de cartes.json (Fisher-Yates : r proche de 1 => aucun échange).
const sansMelange = () => 0.9999999;
const carte = (id) => cartes.find((c) => c.id === id);

// Cartes réordonnées pour que les tirages « epreuve » sortent dans l'ordre voulu.
function cartesDansLOrdre(...premieres) {
  return premieres.map(carte).concat(cartes.filter((c) => !premieres.includes(c.id)));
}

function partie(M, joueurs, { liste = cartes, reglages = config } = {}) {
  return M.creerPartie({ joueurs, cartes: liste, config: reglages, aleatoire: sansMelange });
}

// Joue le tour de la personne courante : type choisi, puis « Le sort est jeté » ou bouclier.
function jouer(M, etat, type = 'revelation', bouclier = false) {
  const j = M.joueurCourant(etat);
  const tiree = M.choisirType(etat, j, type);
  return bouclier ? M.invoquerBouclier(tiree, j) : M.jeterSort(tiree, j);
}

function codeRefus(action) {
  try {
    action();
  } catch (e) {
    return e.code;
  }
  return null;
}

test('moteur : module pur (aucun DOM, réseau, Firebase, Math.random ni import)', () => {
  const source = fs.readFileSync(path.join(RACINE, 'public', 'js', 'game.js'), 'utf8').replace(/\/\/.*$/gm, '');
  assert.doesNotMatch(source, /\b(document|window|fetch|firebase|localStorage|setTimeout|Math\.random)\b/);
  assert.doesNotMatch(source, /^\s*import\b/m);
});

test('moteur : création de partie (ordre d\'arrivée, compteur, piles complètes, état sérialisable)', async () => {
  const M = await chargement;
  const joueurs = ['ana', 'bo', 'cy'];
  const etat = M.creerPartie({ joueurs, cartes, config, aleatoire: M.aleatoireDepuisGraine(42) });
  assert.deepEqual(etat.joueurs, joueurs);
  assert.equal(M.joueurCourant(etat), 'ana');
  assert.deepEqual(M.compteur(etat), { tour: 1, total: config.tours });
  assert.equal(etat.etape, M.ETAPES.CHOIX);
  for (const type of ['epreuve', 'revelation']) {
    assert.deepEqual([...etat.piles[type]].sort(), cartes.filter((c) => c.type === type).map((c) => c.id).sort());
  }
  assert.deepEqual(JSON.parse(JSON.stringify(etat)), etat);
  assert.deepEqual(M.effetsEnCours(etat), []);
});

test('moteur : hasard injecté et reproductible (même graine, mêmes piles ; autre graine, autres piles)', async () => {
  const M = await chargement;
  const creer = (graine) => M.creerPartie({ joueurs: ['a', 'b'], cartes, config, aleatoire: M.aleatoireDepuisGraine(graine) });
  assert.deepEqual(creer(7).piles, creer(7).piles);
  assert.notDeepEqual(creer(7).piles, creer(8).piles);
  assert.equal(codeRefus(() => M.creerPartie({ joueurs: ['a', 'b'], cartes, config, aleatoire: () => 1 })), 'hasard-invalide');
});

test('moteur : une action ne modifie jamais l\'état reçu', async () => {
  const M = await chargement;
  const etat = partie(M, ['a', 'b']);
  const copie = structuredClone(etat);
  const tiree = M.choisirType(etat, 'a', 'epreuve');
  const tireeCopie = structuredClone(tiree);
  M.jeterSort(tiree, 'a');
  M.invoquerBouclier(tiree, 'a');
  assert.deepEqual(etat, copie);
  assert.deepEqual(tiree, tireeCopie);
});

test('moteur : les réglages viennent de config.json passé en paramètre (autres valeurs acceptées)', async () => {
  const M = await chargement;
  const reglages = { tours: 2, joueursMax: 3 };
  let etat = partie(M, ['a', 'b', 'c'], { reglages });
  assert.deepEqual(M.compteur(etat), { tour: 1, total: 2 });
  for (let i = 0; i < 6; i += 1) etat = jouer(M, etat);
  assert.ok(M.estFinie(etat));
  assert.equal(etat.jouees.length, 6);
  assert.equal(codeRefus(() => partie(M, ['a', 'b', 'c', 'd'], { reglages })), 'partie-complete');
  assert.equal(codeRefus(() => partie(M, ['a', 'b'], { reglages: { tours: 0, joueursMax: 3 } })), 'config-invalide');
  assert.equal(codeRefus(() => partie(M, ['a', 'b'], { reglages: {} })), 'config-invalide');
});

test('moteur : ordre des tours et compteur « Tour N / tours », arrêt exactement après le dernier tour', async () => {
  const M = await chargement;
  const joueurs = ['a', 'b', 'c'];
  let etat = partie(M, joueurs);
  for (let tour = 1; tour <= config.tours; tour += 1) {
    for (const j of joueurs) {
      assert.equal(M.estFinie(etat), false);
      assert.equal(M.joueurCourant(etat), j);
      assert.equal(M.compteur(etat).tour, tour);
      etat = jouer(M, etat, tour % 2 ? 'epreuve' : 'revelation');
    }
  }
  assert.ok(M.estFinie(etat));
  assert.equal(M.joueurCourant(etat), null);
  assert.deepEqual(M.compteur(etat), { tour: config.tours, total: config.tours });
  assert.equal(etat.jouees.length, joueurs.length * config.tours);
  assert.equal(new Set(etat.jouees.map((x) => x.carte)).size, etat.jouees.length);
});

test('moteur : « Le sort est jeté » et « Invoquer un bouclier » consomment le tour ; le bouclier annule l\'effet', async () => {
  const M = await chargement;
  let etat = partie(M, ['a', 'b'], { liste: cartesDansLOrdre('epr-06', 'epr-07') });
  etat = jouer(M, etat, 'epreuve', true);
  assert.equal(M.joueurCourant(etat), 'b');
  assert.deepEqual(etat.derniere, { carte: 'epr-06', joueur: 'a', issue: M.ISSUES.BOUCLIER });
  assert.deepEqual(M.effetsEnCours(etat), []);
  etat = jouer(M, etat, 'epreuve');
  assert.deepEqual(etat.derniere, { carte: 'epr-07', joueur: 'b', issue: M.ISSUES.SORT });
  assert.deepEqual(M.effetsEnCours(etat).map((e) => [e.carte, e.joueur, e.duree, e.effet]),
    [['epr-07', 'b', 'fin_partie', carte('epr-07').effet]]);
  // La carte refusée par le bouclier ne ressort pas.
  assert.ok(!Object.values(etat.piles).flat().includes('epr-06'));
});

test('moteur : effet « jusqu\'à son prochain tour » : actif pendant les tours des autres, fini au début du sien', async () => {
  const M = await chargement;
  let etat = partie(M, ['a', 'b', 'c'], { liste: cartesDansLOrdre('epr-08') });
  etat = jouer(M, etat, 'epreuve');
  assert.deepEqual(M.effetsDe(etat, 'a').map((e) => e.carte), ['epr-08']);
  etat = jouer(M, etat);
  assert.deepEqual(M.effetsDe(etat, 'a').map((e) => e.carte), ['epr-08'], 'encore actif au tour de c');
  etat = jouer(M, etat);
  assert.equal(M.joueurCourant(etat), 'a');
  assert.deepEqual(M.effetsEnCours(etat), [], 'fini au début du tour suivant de a');
});

test('moteur : effet « fin de partie » : actif jusqu\'au dernier tour, retiré à la fin', async () => {
  const M = await chargement;
  let etat = partie(M, ['a', 'b'], { liste: cartesDansLOrdre('epr-06') });
  etat = jouer(M, etat, 'epreuve');
  while (!M.estFinie(etat)) {
    assert.deepEqual(M.effetsDe(etat, 'a').map((e) => e.carte), ['epr-06']);
    etat = jouer(M, etat);
  }
  assert.deepEqual(M.effetsEnCours(etat), []);
});

test('moteur : « prochain tour » obtenu au dernier tour : dure jusqu\'à la fin de la partie', async () => {
  const M = await chargement;
  let etat = partie(M, ['a', 'b'], { liste: cartesDansLOrdre('epr-08') });
  for (let i = 0; i < 2 * (config.tours - 1); i += 1) etat = jouer(M, etat, 'revelation');
  assert.equal(M.compteur(etat).tour, config.tours);
  etat = jouer(M, etat, 'epreuve');
  assert.deepEqual(M.effetsDe(etat, 'a').map((e) => e.carte), ['epr-08']);
  etat = jouer(M, etat);
  assert.ok(M.estFinie(etat));
  assert.deepEqual(M.effetsEnCours(etat), []);
});

test('moteur : effets cumulés sur une même personne, et fin d\'un seul effet par échange de butins', async () => {
  const M = await chargement;
  let etat = partie(M, ['a', 'b'], { liste: cartesDansLOrdre('epr-06', 'epr-01', 'epr-07', 'epr-02', 'epr-08') });
  etat = jouer(M, etat, 'epreuve'); // a : epr-06 (fin de partie)
  etat = jouer(M, etat, 'epreuve'); // b : epr-01 (immédiate)
  etat = jouer(M, etat, 'epreuve'); // a : epr-07 (fin de partie)
  etat = jouer(M, etat, 'epreuve'); // b : epr-02
  etat = jouer(M, etat, 'epreuve'); // a : epr-08 (prochain tour)
  assert.deepEqual(M.effetsDe(etat, 'a').map((e) => e.carte), ['epr-06', 'epr-07', 'epr-08']);
  assert.deepEqual(M.effetsDe(etat, 'b'), []);
  // N'importe quelle personne de la partie signale l'échange, même hors de son tour.
  etat = M.terminerEffetParEchange(etat, 'a', 'epr-07');
  assert.deepEqual(M.effetsDe(etat, 'a').map((e) => e.carte), ['epr-06', 'epr-08']);
  assert.equal(codeRefus(() => M.terminerEffetParEchange(etat, 'b', 'epr-07')), 'effet-inconnu');
  // L'échange est possible pendant qu'une carte est tirée.
  etat = M.choisirType(etat, 'b', 'revelation');
  etat = M.terminerEffetParEchange(etat, 'b', 'epr-06');
  assert.deepEqual(M.effetsDe(etat, 'a').map((e) => e.carte), ['epr-08']);
  etat = M.jeterSort(etat, 'b');
  assert.deepEqual(M.effetsEnCours(etat), [], '« prochain tour » fini au tour suivant de a');
});

test('moteur : état relu sans tableaux vides (comme Firebase, qui ne les stocke pas)', async () => {
  const M = await chargement;
  const etat = JSON.parse(JSON.stringify(partie(M, ['a', 'b'])));
  delete etat.jouees;
  delete etat.effets;
  delete etat.carte;
  delete etat.derniere;
  const suite = jouer(M, etat, 'epreuve');
  assert.equal(suite.jouees.length, 1);
  assert.equal(M.joueurCourant(suite), 'b');
});

test('moteur (phase 6) : tour d\'une personne absente passé par une autre, compté comme un bouclier', async () => {
  const M = await chargement;
  const durable = cartes.find((c) => c.type === 'epreuve' && c.duree);
  let etat = partie(M, ['a', 'b', 'c'], { liste: cartesDansLOrdre(durable.id) });
  // Sans carte tirée : le tour de « a » est noté sans carte, « b » joue ensuite.
  assert.equal(codeRefus(() => M.passerTour(etat, 'a', 'a')), 'son-propre-tour');
  assert.equal(codeRefus(() => M.passerTour(etat, 'b', 'b')), 'pas-son-tour', 'la cible doit être la personne dont c\'est le tour');
  assert.equal(codeRefus(() => M.passerTour(etat, 'z', 'a')), 'joueur-inconnu');
  etat = M.passerTour(etat, 'b', 'a');
  assert.equal(M.joueurCourant(etat), 'b');
  assert.deepEqual(etat.derniere, { carte: null, joueur: 'a', issue: M.ISSUES.PASSE });
  assert.equal(etat.jouees.length, 1);
  // Carte durable déjà tirée : elle est consumée, sans effet ; la cible déjà passée ne peut pas l'être deux fois.
  etat = M.choisirType(etat, 'b', 'epreuve');
  assert.equal(etat.carte, durable.id);
  const avant = etat;
  etat = M.passerTour(etat, 'c', 'b');
  assert.equal(codeRefus(() => M.passerTour(etat, 'a', 'b')), 'pas-son-tour');
  assert.deepEqual(etat.derniere, { carte: durable.id, joueur: 'b', issue: M.ISSUES.PASSE });
  assert.deepEqual(M.effetsEnCours(etat), []);
  assert.equal(M.cartesRestantes(etat, 'epreuve'), M.cartesRestantes(avant, 'epreuve'), 'la carte ne retourne pas dans la pile');
  assert.equal(M.joueurCourant(etat), 'c');
  // Jusqu'à la fin : tous les tours passés comptent ; la partie se termine normalement.
  while (!M.estFinie(etat)) {
    const j = M.joueurCourant(etat);
    etat = M.passerTour(etat, j === 'a' ? 'b' : 'a', j);
  }
  assert.equal(etat.jouees.length, 3 * config.tours);
  assert.equal(codeRefus(() => M.passerTour(etat, 'a', 'b')), 'partie-finie');
});

test('moteur : actions refusées hors de leur moment (cas limites du rapport)', async () => {
  const M = await chargement;
  const cas = sim.casLimites(M, cartes, config);
  assert.ok(cas.length >= 15);
  for (const c of cas) assert.equal(c.obtenu, c.attendu, c.description);
});

test('simulations : parties complètes de 2 à joueursMax personnes, dont le pire cas (toujours le même type), sans anomalie', async () => {
  const M = await chargement;
  const { resultats } = await rapport;
  const tailles = [...new Set(resultats.map((r) => r.nbJoueurs))];
  assert.deepEqual(tailles, Array.from({ length: config.joueursMax - M.JOUEURS_MINIMUM + 1 }, (_, i) => i + M.JOUEURS_MINIMUM));
  for (const r of resultats) {
    assert.deepEqual(r.anomalies, [], `${r.nbJoueurs} personnes, ${r.libelle}`);
    assert.equal(r.cartesJouees, r.parties * r.nbJoueurs * config.tours, 'arrêt au bon moment');
    if (r.strategie !== 'hasard') {
      const taillePile = cartes.filter((c) => c.type === r.strategie).length;
      assert.equal(r.pileMin, taillePile - r.nbJoueurs * config.tours + 1, 'pire cas : la pile fournit toutes les cartes');
    }
  }
  // Les simulations font bien vivre les effets : création, fin au prochain tour, par échange et en fin de partie.
  const somme = (cle) => resultats.reduce((s, r) => s + r.expirations[cle], 0);
  for (const cle of ['prochainTour', 'echange', 'finPartie']) assert.ok(somme(cle) > 0, cle);
  assert.ok(resultats.reduce((s, r) => s + r.boucliers, 0) > 0);
});

test('simulations : taille de l\'état bornée (au plus quelques kilo-octets en JSON)', async () => {
  const { resultats } = await rapport;
  for (const r of resultats) assert.ok(r.tailleMax < 8000, `${r.nbJoueurs} personnes : ${r.tailleMax} caractères`);
});

test('rapport de simulation : docs/rapports/phase-3-simulation.md est à jour (node scripts/simulation.js)', async () => {
  const { texte } = await rapport;
  assert.ok(fs.existsSync(sim.FICHIER_SORTIE), 'rapport absent : lancer node scripts/simulation.js');
  assert.equal(fs.readFileSync(sim.FICHIER_SORTIE, 'utf8'), texte, 'rapport périmé : relancer node scripts/simulation.js');
  assert.doesNotMatch(texte, /(?<!\p{L})(joueuses?|elles?|celles?|celui|ceux|chacun|poches?|sacs?)(?!\p{L})/iu, 'écriture inclusive et vocabulaire');
});
