'use strict';

// Tests de la phase 1 : contenu (cartes, emblèmes, codes, config) et tableau à relire.
// Lancer : node --test tests/

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { genererTableau, FICHIER_SORTIE } = require('../scripts/generer-cartes-a-relire.js');

const RACINE = path.join(__dirname, '..');
const lire = (...parties) => fs.readFileSync(path.join(RACINE, ...parties), 'utf8');
const lireJson = (nom) => JSON.parse(lire('public', 'data', nom));

const cartes = lireJson('cartes.json');
const emblemes = lireJson('emblemes.json');
const codes = lireJson('codes.json');
const config = lireJson('config.json');

const TYPES = ['revelation', 'epreuve'];
const DUREES = ['prochain_tour', 'fin_partie'];

// Exceptions justifiées aux contrôles de vocabulaire et d'écriture inclusive.
// Chaque entrée est une question ouverte pour la propriétaire (voir le rapport).
// Le contrôle d'écriture inclusive ne vise que les personnes qui jouent : les personnages des cartes
// (le héros, le roi, la reine, un personnage masculin) ne sont pas concernés.
const EXCEPTIONS = {
  // « un seul sac » : le sac est un objet du décor de la carte, pas un butin.
  'rev-16': ['sac'],
  // « Comme elle » : désigne la rose enchantée, pas une personne qui joue.
  'epr-03': ['elle'],
};

function motsInterdits(texte, id, motifs) {
  const exceptions = EXCEPTIONS[id] || [];
  return Object.entries(motifs)
    .filter(([nom, regex]) => !exceptions.includes(nom) && regex.test(texte))
    .map(([nom]) => nom);
}

test('cartes : format de chaque carte', () => {
  assert.ok(Array.isArray(cartes));
  assert.equal(cartes.length, 40);
  for (const c of cartes) {
    assert.equal(typeof c, 'object', `carte invalide : ${JSON.stringify(c)}`);
    const champs = Object.keys(c).sort();
    const attendus = c.duree !== undefined || c.effet !== undefined
      ? ['duree', 'effet', 'id', 'texte', 'type']
      : ['id', 'texte', 'type'];
    assert.deepEqual(champs, attendus, `champs inattendus pour ${c.id}`);
    assert.match(c.id, /^(rev|epr)-\d{2}$/, `identifiant invalide : ${c.id}`);
    assert.equal(typeof c.texte, 'string');
    assert.equal(c.texte, c.texte.trim(), `espaces superflus : ${c.id}`);
    assert.ok(c.texte.length > 0, `texte vide : ${c.id}`);
  }
});

test('cartes : identifiants uniques et cohérents avec le type', () => {
  const ids = cartes.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length, 'identifiants en double');
  for (const c of cartes) {
    const prefixe = c.type === 'revelation' ? 'rev' : 'epr';
    assert.ok(c.id.startsWith(prefixe + '-'), `${c.id} ne correspond pas au type ${c.type}`);
  }
  for (const [prefixe, n] of [['rev', 20], ['epr', 20]]) {
    for (let i = 1; i <= n; i++) {
      const id = `${prefixe}-${String(i).padStart(2, '0')}`;
      assert.ok(ids.includes(id), `identifiant manquant : ${id}`);
    }
  }
});

test('cartes : types valides, au moins 20 cartes de chaque type', () => {
  for (const c of cartes) {
    assert.ok(TYPES.includes(c.type), `type invalide pour ${c.id} : ${c.type}`);
  }
  for (const type of TYPES) {
    const n = cartes.filter((c) => c.type === type).length;
    assert.ok(n >= 20, `moins de 20 cartes de type ${type} : ${n}`);
  }
});

test('cartes : exactement 9 cartes à effet durable, durées valides', () => {
  const durables = cartes.filter((c) => c.duree !== undefined || c.effet !== undefined);
  assert.equal(durables.length, 9);
  for (const c of durables) {
    assert.ok(DUREES.includes(c.duree), `durée invalide pour ${c.id} : ${c.duree}`);
    assert.equal(typeof c.effet, 'string', `effet manquant pour ${c.id}`);
    assert.ok(c.effet.trim().length > 0, `effet vide pour ${c.id}`);
    assert.equal(c.type, 'epreuve', `${c.id} : un effet durable n'existe que sur une Épreuve`);
  }
});

test('cartes : aucun doublon de texte', () => {
  const normaliser = (t) => t.toLowerCase().replace(/\s+/g, ' ').trim();
  const textes = cartes.map((c) => normaliser(c.texte));
  assert.equal(new Set(textes).size, textes.length, 'textes en double');
});

test('cartes : textes identiques à docs/cartes-source.md', () => {
  const source = lire('docs', 'cartes-source.md');
  const attendus = { revelation: [], epreuve: [] };
  let type = null;
  for (const ligne of source.split('\n')) {
    if (ligne.startsWith('## Révélations')) type = 'revelation';
    else if (ligne.startsWith('## Épreuves')) type = 'epreuve';
    else if (ligne.startsWith('## ')) type = null;
    const m = ligne.match(/^\d+\. (.*)$/);
    if (type && m) {
      const durable = m[1].match(/^🔁 \[[a-z_]+, « (.*?) »\] (.*)$/);
      attendus[type].push(durable ? { texte: durable[2], effet: durable[1] } : { texte: m[1] });
    }
  }
  for (const t of TYPES) {
    const reels = cartes.filter((c) => c.type === t);
    assert.equal(reels.length, attendus[t].length, `nombre de cartes ${t}`);
    reels.forEach((c, i) => {
      assert.equal(c.texte, attendus[t][i].texte, `texte différent pour ${c.id}`);
      assert.equal(c.effet, attendus[t][i].effet, `effet différent pour ${c.id}`);
    });
  }
});

test('cartes : « butin » seul terme (jamais « poche » ni « sac »)', () => {
  const motifs = {
    poche: /\bpoches?\b/i,
    sac: /\bsacs?\b/i,
  };
  for (const c of cartes) {
    for (const champ of ['texte', 'effet']) {
      if (c[champ] === undefined) continue;
      const trouves = motsInterdits(c[champ], c.id, motifs);
      assert.deepEqual(trouves, [], `${c.id} (${champ}) contient : ${trouves.join(', ')}`);
    }
  }
  assert.ok(cartes.some((c) => /\bbutins?\b/.test(c.texte)), 'aucune carte ne parle de butin');
});

// Écriture inclusive allégée (itération 3 de la phase 2) : formulation neutre d'abord, les parenthèses ne sont plus
// exigées. Restent interdites les formes exclusivement féminines ou exclusivement masculines pour désigner un(e) joueur(se).
test('cartes : écriture inclusive (aucune forme exclusivement féminine ni masculine pour un(e) joueur(se))', () => {
  const motifs = {
    elle: /\b(elle|elles|elle-même)\b/i,
    celle: /\b(celle|celles)\b/i,
    joueuse: /\bjoueuses?\b/i,
    voisine: /\bvoisines?\b/i,
    chacune: /\bchacunes?\b/i,
    'la première qui': /\bla (première|dernière) qui\b/i,
    joueur: /\bjoueurs?\b/i,
    voisin: /\bvoisins?\b/i,
    chacun: /\bchacun\b(?!\()/i,
    celui: /\b(celui|ceux)\b(?!-ci|-là)/i,
    'le premier qui': /\ble (premier|dernier) qui\b/i,
  };
  for (const c of cartes) {
    for (const champ of ['texte', 'effet']) {
      if (c[champ] === undefined) continue;
      const trouves = motsInterdits(c[champ], c.id, motifs);
      assert.deepEqual(trouves, [], `${c.id} (${champ}) contient : ${trouves.join(', ')}`);
    }
  }
});

test('cartes : les exceptions déclarées sont encore utiles', () => {
  for (const [id, mots] of Object.entries(EXCEPTIONS)) {
    const carte = cartes.find((c) => c.id === id);
    assert.ok(carte, `exception sur une carte inexistante : ${id}`);
    for (const mot of mots) {
      assert.match(carte.texte, new RegExp(`\\b${mot}\\b`, 'i'), `exception inutile : ${id} / ${mot}`);
    }
  }
});

test('config : 4 tours, 5 personnes au maximum, délai avant de pouvoir passer le tour d\'une personne absente', () => {
  assert.deepEqual(Object.keys(config).sort(), ['delaiAbsenceSecondes', 'joueursMax', 'tours']);
  assert.equal(config.tours, 4);
  assert.equal(config.joueursMax, 5);
  // Phase 6 : « quelques secondes » (docs/PROJET.md), entier positif.
  assert.ok(Number.isInteger(config.delaiAbsenceSecondes) && config.delaiAbsenceSecondes >= 1 && config.delaiAbsenceSecondes <= 60);
});

test('config : une pile peut fournir tous les tours (joueurs × tours <= cartes par type)', () => {
  assert.ok(config.tours * config.joueursMax <= 20);
});

test('codes : mots du thème, sans accent, majuscules, uniques', () => {
  assert.ok(Array.isArray(codes));
  assert.equal(codes.length, 10);
  for (const code of codes) {
    assert.equal(typeof code, 'string');
    assert.match(code, /^[A-Z]+$/, `code invalide (accent, minuscule ou symbole) : ${code}`);
    assert.equal(code, code.normalize('NFD').replace(/[\u0300-\u036f]/g, ''), `accent dans ${code}`);
  }
  assert.equal(new Set(codes).size, codes.length, 'codes en double');
});

test('emblèmes : 8 emblèmes uniques, identifiants sans accent, une image chacun', () => {
  assert.ok(Array.isArray(emblemes));
  assert.equal(emblemes.length, 8);
  for (const e of emblemes) {
    assert.deepEqual(Object.keys(e).sort(), ['id', 'image', 'nom']);
    assert.match(e.id, /^[a-z]+(-[a-z]+)*$/, `identifiant invalide : ${e.id}`);
    assert.ok(e.nom.length > 0);
    assert.equal(e.image, `img/emblemes/${e.id}.webp`, `image nommée d'après l'identifiant : ${e.id}`);
  }
  for (const champ of ['id', 'nom', 'image']) {
    const valeurs = emblemes.map((e) => e[champ]);
    assert.equal(new Set(valeurs).size, valeurs.length, `${champ} en double`);
  }
});

test('docs/cartes-a-relire.md : à jour par rapport à cartes.json', () => {
  assert.equal(
    fs.readFileSync(FICHIER_SORTIE, 'utf8'),
    genererTableau(cartes),
    'relancer : node scripts/generer-cartes-a-relire.js'
  );
});
