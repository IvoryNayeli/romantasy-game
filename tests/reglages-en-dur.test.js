'use strict';

// Phase 2 : contrôle des réglages écrits en dur.
// Le nombre de tours et le nombre maximal de joueur(se)s viennent UNIQUEMENT de public/data/config.json.
// Ce test échoue si 4 ou 5 (ou « quatre », « cinq ») apparaissent en dur dans le code livré (public/, hors data/ et fonts/).
// Lancer : node --test tests/

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const RACINE = path.join(__dirname, '..');
const PUBLIC = path.join(RACINE, 'public');

// Retire les commentaires (la documentation peut citer les valeurs, pas le code).
function sansCommentaires(source, fichier) {
  let s = source.replace(/\/\*[\s\S]*?\*\//g, '');
  if (/\.html?$/.test(fichier)) s = s.replace(/<!--[\s\S]*?-->/g, '');
  if (/\.(js|mjs)$/.test(fichier)) s = s.replace(/(^|[^:\\'"`])\/\/.*$/gm, '$1');
  return s;
}

const MOTS_NOMBRE = '(?:tours?|manches?|joueurs?|joueursMax|maxJoueurs|nbJoueurs|nbTours|nombreDeTours|MAX_JOUEURS|NB_TOURS|TOURS|JOUEURS)';

// Motifs révélateurs d'un réglage écrit en dur. Chaque motif est nommé pour que l'échec soit lisible.
const MOTIFS = [
  ['affectation ou comparaison d\'un réglage', new RegExp(`\\b${MOTS_NOMBRE}\\w*\\s*(?::|=|===?|!==?|[<>]=?)\\s*[45]\\b(?![.\\w%])`, 'i')],
  ['comparaison ou calcul avec 4 ou 5', /(?:===?|!==?|[<>]=?|%|\*|\/)\s*[45]\b(?![.\w%])/],
  ['longueur fixée à 4 ou 5', /\blength\s*(?:===?|!==?|[<>]=?)\s*[45]\b/],
  ['découpe ou tableau de 4 ou 5', /\b(?:slice|splice|Array|repeat|from)\s*\(\s*(?:\d+\s*,\s*)?[45]\b/],
  ['« Tour N / 4 » écrit en dur', /\btour\s+[\w${}.()]+\s*\/\s*[45]\b/i],
  ['nombre écrit en chiffres devant un mot de réglage', /\b[45]\s+(?:tours?|fois|manches?|joueurs?(?:\(se\)s?)?|places?|personnes)\b/i],
  ['nombre écrit en lettres devant un mot de réglage', /\b(?:quatre|cinq)\s+(?:tours?|fois|manches?|joueurs?(?:\(se\)s?)?|places?|personnes)\b/i],
  ['colonnes ou rang CSS fixés', /(?:repeat\(\s*[45]\s*,|:nth-(?:child|of-type)\(\s*(?:n\s*\+\s*)?[45]\s*\))/],
  ['réglage JSON recopié', /["']?(?:tours|joueursMax)["']?\s*:\s*[45]\b/],
];

function trouverReglagesEnDur(source, fichier) {
  const code = sansCommentaires(source, fichier);
  const trouves = [];
  code.split('\n').forEach((ligne, i) => {
    for (const [nom, motif] of MOTIFS) {
      if (motif.test(ligne)) trouves.push(`${fichier}:${i + 1} (${nom}) ${ligne.trim()}`);
    }
  });
  return trouves;
}

function fichiersLivres() {
  const liste = [];
  const parcourir = (dossier) => {
    for (const e of fs.readdirSync(dossier, { withFileTypes: true })) {
      const chemin = path.join(dossier, e.name);
      if (e.isDirectory()) {
        if (e.name !== 'data' && e.name !== 'fonts') parcourir(chemin);
      } else if (/\.(js|mjs|html|css)$/.test(e.name)) {
        liste.push(chemin);
      }
    }
  };
  parcourir(PUBLIC);
  return liste;
}

test('réglages : le détecteur repère bien 4 et 5 écrits en dur (garde-fou du test lui-même)', () => {
  const fautifs = [
    ['a.js', 'const tours = 4;'],
    ['a.js', 'const joueursMax = 5;'],
    ['a.js', 'if (joueurs.length >= 5) return;'],
    ['a.js', 'if (n === 4) fin();'],
    ['a.js', 'if (x > 4) {'],
    ['a.js', 'return `Tour ${n} / 4`;'],
    ['a.js', 'const joueurs = lignes.slice(0, 5);'],
    ['a.js', 'const texte = "Lorsque chaque joueur(se) a joué 4 fois";'],
    ['a.js', 'const texte = "cinq joueur(se)s";'],
    ['a.html', '<p>Tour 1 / 4</p>'],
    ['a.css', '.grille { grid-template-columns: repeat(5, 1fr); }'],
    ['a.css', '.item:nth-child(4) { color: red; }'],
    ['a.js', 'const reglages = { "tours": 4 };'],
  ];
  for (const [fichier, source] of fautifs) {
    assert.ok(trouverReglagesEnDur(source, fichier).length > 0, `non détecté : ${source}`);
  }
});

test('réglages : le détecteur ne signale pas les usages normaux (cas licites)', () => {
  const licites = [
    ['a.js', 'const tours = donnees.config.tours;'],
    ['a.js', 'return `Tour ${n} / ${total}`;'],
    ['a.js', 'const max = donnees.config.joueursMax;'],
    ['a.css', '.bouton { min-height: 3.5rem; padding: 0.5rem 1.25rem; }'],
    ['a.css', '.x { margin: 4px 5px; width: calc(100% - 4rem); }'],
    ['a.js', '// 4 tours et 5 joueur(se)s : voir config.json'],
    ['a.js', 'const a = liste.length;'],
  ];
  for (const [fichier, source] of licites) {
    assert.deepEqual(trouverReglagesEnDur(source, fichier), [], `faux positif : ${source}`);
  }
});

test('réglages : aucun 4 ni 5 (tours, joueur(se)s) écrit en dur dans public/ hors config.json', () => {
  const fichiers = fichiersLivres();
  assert.ok(fichiers.length >= 8, 'les fichiers de l\'interface sont introuvables');
  const trouves = fichiers.flatMap((f) => trouverReglagesEnDur(fs.readFileSync(f, 'utf8'), path.relative(RACINE, f)));
  assert.deepEqual(trouves, []);
});

test('réglages : le code lit le nombre de tours et de joueur(se)s dans config.json', () => {
  const ecrans = fs.readFileSync(path.join(PUBLIC, 'js', 'ecrans.js'), 'utf8');
  const donnees = fs.readFileSync(path.join(PUBLIC, 'js', 'donnees.js'), 'utf8');
  assert.match(donnees, /config\.json/);
  assert.match(ecrans, /config\.tours/);
  assert.match(ecrans, /config\.joueursMax/);
});

test('réglages : les textes suivent config.json (changer le nombre de tours change l\'affichage)', async () => {
  const source = fs.readFileSync(path.join(PUBLIC, 'js', 'textes.js'), 'utf8');
  const textes = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
  assert.equal(textes.tour.compteur(2, 7), 'Tour 2 / 7');
  assert.match(textes.regles.fin(7), /joué 7 fois/);
  assert.doesNotMatch(textes.regles.fin(7), /\b[45]\b/);
});

test('réglages : les joueur(se)s fictif(ve)s suivent config.joueursMax (même au-delà, sans emblème inconnu)', async () => {
  const source = fs.readFileSync(path.join(PUBLIC, 'js', 'fictif.js'), 'utf8');
  const fictif = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
  const emblemes = JSON.parse(fs.readFileSync(path.join(PUBLIC, 'data', 'emblemes.json'), 'utf8'));
  const config = JSON.parse(fs.readFileSync(path.join(PUBLIC, 'data', 'config.json'), 'utf8'));
  const donnees = { emblemes, cartes: JSON.parse(fs.readFileSync(path.join(PUBLIC, 'data', 'cartes.json'), 'utf8')), config };
  for (const nombre of [config.joueursMax, config.joueursMax + 3]) {
    const joueurs = fictif.joueursFictifs(donnees, nombre);
    assert.equal(joueurs.length, nombre);
    for (const j of joueurs) assert.ok(emblemes.some((e) => e.id === j.embleme), `emblème inconnu : ${j.embleme}`);
  }
  const params = new URLSearchParams('tour=99');
  assert.equal(fictif.tourDepuisParametres(donnees, params), config.tours);
});
