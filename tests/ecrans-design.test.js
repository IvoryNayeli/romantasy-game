'use strict';

// Phase 2 : écrans et design, contrôles sans navigateur.
// (Captures d'écran, débordement et contrastes mesurés à l'écran : tests du testeur, avec un navigateur.)
// Lancer : node --test tests/

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const RACINE = path.join(__dirname, '..');
const PUBLIC = path.join(RACINE, 'public');
const lire = (...p) => fs.readFileSync(path.join(RACINE, ...p), 'utf8');
const lirePublic = (...p) => lire('public', ...p);
const existe = (...p) => fs.existsSync(path.join(PUBLIC, ...p));

const ECRANS = ['accueil', 'regles', 'creer', 'rejoindre', 'salle', 'choix', 'carte', 'attente', 'transition', 'fin'];
const PAGES_HTML = ['index.html', 'demo.html'];

async function chargerModule(nom) {
  const source = lirePublic('js', nom);
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
}

function listerFichiers(dossier, extensions) {
  const liste = [];
  const parcourir = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const chemin = path.join(d, e.name);
      if (e.isDirectory()) parcourir(chemin);
      else if (extensions.test(e.name)) liste.push(chemin);
    }
  };
  parcourir(dossier);
  return liste;
}

function sansCommentaires(source, fichier) {
  let s = source.replace(/\/\*[\s\S]*?\*\//g, '');
  if (/\.html?$/.test(fichier)) s = s.replace(/<!--[\s\S]*?-->/g, '');
  if (/\.(js|mjs)$/.test(fichier)) s = s.replace(/(^|[^:\\'"`])\/\/.*$/gm, '$1');
  return s;
}

/* ---------- CSS : lecture simplifiée ---------- */

const css = sansCommentaires(lirePublic('css', 'style.css'), 'style.css');

function regles() {
  const resultat = [];
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    resultat.push({ selecteur: m[1].trim(), corps: m[2] });
  }
  return resultat;
}

function variables() {
  const racine = regles().find((r) => r.selecteur === ':root');
  const vars = {};
  for (const m of racine.corps.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) vars[m[1]] = m[2].trim();
  return vars;
}

// Convertit une longueur CSS (px, rem, em, var(--x)) en pixels (16 px par rem).
function enPixels(valeur, vars) {
  let v = valeur.trim();
  const ref = v.match(/^var\((--[\w-]+)\)$/);
  if (ref) v = vars[ref[1]];
  assert.ok(v, `valeur introuvable : ${valeur}`);
  const m = v.match(/^([\d.]+)(px|rem|em)$/);
  assert.ok(m, `longueur non reconnue : ${v}`);
  return m[2] === 'px' ? parseFloat(m[1]) : parseFloat(m[1]) * 16;
}

function propriete(selecteur, nom) {
  const valeurs = regles()
    .filter((r) => r.selecteur.split(',').map((s) => s.trim()).includes(selecteur))
    .flatMap((r) => [...r.corps.matchAll(new RegExp(`(?:^|[;\\s])${nom}\\s*:\\s*([^;]+)`, 'g'))].map((m) => m[1].trim()));
  return valeurs;
}

function luminance(hex) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function contraste(a, b) {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

// Tailles de police déclarées pour un sélecteur : `font-size: X` ou `font: [style] [graisse] X/ligne famille`.
function taillesDeclarees(selecteur) {
  const tailles = propriete(selecteur, 'font-size');
  for (const f of propriete(selecteur, 'font')) {
    const m = f.match(/(?:^|\s)(max\([^)]*\)|[\d.]+(?:px|rem|em|cqw))(?:\/|\s)/);
    if (m) tailles.push(m[1]);
  }
  return tailles;
}

// Taille plancher en pixels d'une valeur : « 1.25rem » -> 20 ; « max(6.5cqw, 1.25rem) » -> 20 (la partie en cqw s'ajoute au-dessus).
function plancherEnPixels(valeur, vars = {}) {
  const m = valeur.match(/^max\((.*)\)$/);
  if (!m) return enPixels(valeur, vars);
  const absolues = m[1].split(',').map((s) => s.trim()).filter((s) => !/cqw$/.test(s));
  assert.ok(absolues.length > 0, `max() sans plancher absolu : ${valeur}`);
  return Math.max(...absolues.map((s) => enPixels(s, vars)));
}

// Variables du bloc :root de la charte graphique (docs/charte-graphique.md, section 2).
function variablesCharte() {
  const bloc = lire('docs', 'charte-graphique.md').match(/:root\s*\{([\s\S]*?)\n\}/)[1];
  const vars = {};
  for (const m of bloc.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) vars[m[1]] = m[2].trim();
  return vars;
}

// Teinte (0-360) et saturation (0-1) d'une couleur #RRGGBB.
function teinteSaturation(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return { t: 0, s: 0 };
  let t;
  if (max === r) t = ((g - b) / d) % 6;
  else if (max === g) t = (b - r) / d + 2;
  else t = (r - g) / d + 4;
  const l = (max + min) / 2;
  return { t: (t * 60 + 360) % 360, s: d / (1 - Math.abs(2 * l - 1)) };
}

/* ---------- HTML : vérification simplifiée (balises équilibrées, attributs) ---------- */

const VIDES = new Set(['meta', 'link', 'br', 'hr', 'img', 'input', 'source', 'area', 'base', 'col', 'embed', 'wbr', 'param', 'track']);

function analyserHtml(source) {
  const erreurs = [];
  const pile = [];
  const ids = [];
  const refs = [];
  const sansCom = source.replace(/<!--[\s\S]*?-->/g, '');
  for (const m of sansCom.matchAll(/<(\/?)([a-zA-Z][\w:-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g)) {
    const [, fermante, nomBrut, attrs] = m;
    const nom = nomBrut.toLowerCase();
    if (fermante) {
      const haut = pile.pop();
      if (haut !== nom) erreurs.push(`</${nom}> inattendue (attendu : </${haut}>)`);
      continue;
    }
    for (const a of attrs.matchAll(/\bid\s*=\s*"([^"]*)"/g)) ids.push(a[1]);
    for (const a of attrs.matchAll(/\b(?:href|src)\s*=\s*"([^"]*)"/g)) refs.push(a[1]);
    if (VIDES.has(nom) || /\/\s*$/.test(attrs)) continue;
    pile.push(nom);
  }
  if (pile.length) erreurs.push(`balises non fermées : ${pile.join(', ')}`);
  return { erreurs, ids, refs };
}

/* ======================= Tests ======================= */

test('écrans : index.html et demo.html sont bien formés (doctype, langue, encodage, viewport, titre)', () => {
  for (const page of PAGES_HTML) {
    assert.ok(existe(page), `${page} manquant`);
    const html = lirePublic(page);
    assert.match(html, /^<!DOCTYPE html>/i, `${page} : doctype`);
    assert.match(html, /<html lang="fr">/, `${page} : langue française`);
    assert.match(html, /<meta charset="utf-8">/i, `${page} : encodage`);
    assert.match(html, /<meta name="viewport" content="[^"]*width=device-width[^"]*">/, `${page} : viewport mobile`);
    assert.match(html, /<title>[^<]+<\/title>/, `${page} : titre`);
    const { erreurs, ids } = analyserHtml(html);
    assert.deepEqual(erreurs, [], `${page} : balises mal imbriquées`);
    assert.equal(new Set(ids).size, ids.length, `${page} : identifiants (id) en double`);
  }
});

test('écrans : toutes les ressources locales référencées existent (HTML, imports JS, url() du CSS)', () => {
  for (const page of PAGES_HTML) {
    for (const ref of analyserHtml(lirePublic(page)).refs) {
      if (/^(data:|#|\?)/.test(ref)) continue;
      assert.ok(!/^[a-z]+:/i.test(ref) && !ref.startsWith('//'), `${page} : ressource externe ${ref}`);
      assert.ok(existe(ref.split('?')[0].split('#')[0]), `${page} : fichier introuvable ${ref}`);
    }
  }
  for (const f of listerFichiers(path.join(PUBLIC, 'js'), /\.js$/)) {
    for (const m of fs.readFileSync(f, 'utf8').matchAll(/from\s+'(\.[^']+)'/g)) {
      assert.ok(fs.existsSync(path.resolve(path.dirname(f), m[1])), `${path.relative(RACINE, f)} : import introuvable ${m[1]}`);
    }
  }
  for (const m of css.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) {
    assert.ok(fs.existsSync(path.resolve(PUBLIC, 'css', m[1])), `style.css : fichier introuvable ${m[1]}`);
  }
});

test('écrans : les dix écrans existent (routes, fonctions, liens de la page de démonstration)', () => {
  const app = lirePublic('js', 'app.js');
  const ecrans = lirePublic('js', 'ecrans.js');
  const demo = lirePublic('js', 'demo.js');
  for (const nom of ECRANS) {
    assert.match(app, new RegExp(`\\b${nom}:\\s*ecrans\\.${nom}\\b`), `route « ${nom} » absente de app.js`);
    assert.match(ecrans, new RegExp(`export function ${nom}\\(`), `fonction d'écran « ${nom} » absente`);
    assert.match(demo, new RegExp(`ecran: '${nom}'`), `aucun lien de démonstration vers l'écran « ${nom} »`);
  }
});

test('parcours : « Créer » mène au choix du code (liste de codes.json), puis à la salle d\'attente en hôte', () => {
  const ecrans = lirePublic('js', 'ecrans.js');
  const regles = ecrans.slice(ecrans.indexOf('export function regles('), ecrans.indexOf('export function creer('));
  assert.match(regles, /lienBouton\(R\.creer, \{ ecran: 'creer' \}\)/, '« Créer une partie » doit ouvrir le choix du code');
  assert.match(regles, /lienBouton\(R\.rejoindre, \{ ecran: 'rejoindre' \}/, '« Rejoindre une partie » doit ouvrir la saisie du code');
  const creer = ecrans.slice(ecrans.indexOf('export function creer('), ecrans.indexOf('export function rejoindre('));
  assert.match(creer, /donnees\.codes\.map/, 'la liste vient de codes.json');
  assert.match(creer, /type: 'radio'/, 'choix d\'un seul code');
  assert.match(creer, /boutonValider\.disabled = !choisi/, 'valider impossible sans code choisi');
  assert.match(creer, /naviguer\(\{ ecran: 'salle', code: choisi, hote: 1/, 'validation : salle d\'attente en hôte, avec le code choisi');
  assert.doesNotMatch(creer, /fetch|Firebase|unicit/i, 'phase 2 : aucune vérification d\'unicité ni réseau');
  const T = lirePublic('js', 'textes.js');
  assert.match(T, /export const creer = \{/);
});

test('parcours : « Rejoindre » demande le code, le vérifie dans codes.json (message d\'erreur en français), puis ouvre la salle', () => {
  const ecrans = lirePublic('js', 'ecrans.js');
  const rejoindre = ecrans.slice(ecrans.indexOf('export function rejoindre('), ecrans.indexOf('export function salle('));
  assert.match(rejoindre, /type: 'text'/, 'champ texte');
  assert.match(rejoindre, /trouverCode\(champ\.value, donnees\.codes\)/, 'vérification dans la liste de codes.json');
  assert.match(rejoindre, /naviguer\(\{ ecran: 'salle', code, autres: 2 \}\)/, 'salle d\'attente après validation');
  assert.match(rejoindre, /role: 'alert'/, 'erreur annoncée aux lecteurs d\'écran');
  assert.match(rejoindre, /aria-invalid/);
  assert.match(rejoindre, /type: 'submit'|type="submit"/, 'Entrée valide le formulaire');
  const T = lirePublic('js', 'textes.js');
  assert.match(T, /erreurInconnu: 'Ce code ne correspond à aucune partie/);
  assert.match(T, /erreurVide: 'Saisis le code/);
});

test('codes : saisie insensible à la casse et aux accents, seuls les mots de codes.json sont acceptés', async () => {
  const { normaliserCode, trouverCode } = await chargerModule('codes.js');
  const codes = JSON.parse(lirePublic('data', 'codes.json'));
  assert.equal(codes.length, 10);
  assert.equal(normaliserCode(' Élixir '), 'ELIXIR');
  assert.equal(normaliserCode(undefined), '');
  for (const code of codes) {
    assert.equal(trouverCode(code, codes), code, code);
    assert.equal(trouverCode(code.toLowerCase(), codes), code, `${code} en minuscules`);
    assert.equal(trouverCode(`  ${code.toLowerCase()}  `, codes), code, `${code} avec espaces`);
  }
  assert.equal(trouverCode('élixir', codes), 'ELIXIR');
  assert.equal(trouverCode('Sortilège', codes), 'SORTILEGE');
  assert.equal(trouverCode('obsidienne', codes), 'OBSIDIENNE');
  for (const faux of ['', '   ', 'DRAGON', 'ECLIPS', 'ECLIPSEE', 'RUN E', null]) assert.equal(trouverCode(faux, codes), null, `« ${faux} » ne doit pas être accepté`);
});

test('salle d\'attente : ordre code (discret), menu emblème + prénom, liste du groupe', () => {
  const ecrans = lirePublic('js', 'ecrans.js');
  const salle = ecrans.slice(ecrans.indexOf('export function salle('), ecrans.indexOf('export function choix('));
  const construction = salle.slice(salle.indexOf('const noeud = h('));
  const positions = ['code-partie', 'formulaire,', 'titre-groupe', 'liste,'].map((m) => construction.indexOf(m));
  assert.ok(positions.every((p) => p >= 0), 'élément manquant dans la salle d\'attente');
  assert.deepEqual([...positions].sort((a, b) => a - b), positions, 'ordre attendu : code, menu emblème/prénom, liste du groupe');
  assert.match(lirePublic('js', 'textes.js'), /groupe: 'Le groupe'/);
  // Le code est discret : petit et en couleur secondaire (pas un grand encadré).
  for (const sel of ['.code-libelle', '.code-valeur']) {
    const tailles = taillesDeclarees(sel);
    assert.ok(tailles.length > 0 && tailles.every((t) => enPixels(t, variables()) <= 18), `${sel} : code trop grand (${tailles})`);
  }
  assert.ok(propriete('.code-partie', 'color').includes('var(--c-lune-douce)'), 'code en couleur secondaire');
});

test('textes : plus de « participant(e)s » ni de « participantes » (formulation neutre : « Le groupe ») dans le code et la documentation', () => {
  const fichiers = [...listerFichiers(PUBLIC, /\.(html|js|css)$/), path.join(RACINE, 'README.md'), path.join(RACINE, 'docs', 'PROJET.md')];
  for (const f of fichiers) {
    const code = sansCommentaires(fs.readFileSync(f, 'utf8'), f);
    assert.doesNotMatch(code, /\bparticipant(e|\(e\))?s?\b/i, `${path.relative(RACINE, f)} : « participant(e)s » (utiliser une formulation neutre : « le groupe »)`);
  }
});

test('design : polices Cormorant Garamond (500, 600, 500 italique) et Jost (300, 400, 500) hébergées, licences OFL, plus de Cinzel', () => {
  const faces = [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((m) => m[1]);
  const declarees = faces.map((f) => `${f.match(/font-family:\s*'([^']+)'/)[1]}|${f.match(/font-weight:\s*(\d+)/)[1]}|${f.match(/font-style:\s*(\w+)/)[1]}`).sort();
  assert.deepEqual(declarees, [
    'Cormorant Garamond|500|italic', 'Cormorant Garamond|500|normal', 'Cormorant Garamond|600|normal',
    'Jost|300|normal', 'Jost|400|normal', 'Jost|500|normal',
  ]);
  for (const face of faces) {
    const src = face.match(/url\('([^']+)'\)\s*format\('woff2'\)/);
    assert.ok(src, 'chaque @font-face doit pointer vers un fichier woff2 local');
    const fichier = path.resolve(PUBLIC, 'css', src[1]);
    assert.ok(fs.existsSync(fichier), `police manquante : ${src[1]}`);
    assert.equal(fs.readFileSync(fichier).subarray(0, 4).toString('latin1'), 'wOF2', `${src[1]} n'est pas un woff2`);
  }
  for (const licence of ['LICENSE-Jost-OFL.txt', 'LICENSE-CormorantGaramond-OFL.txt']) {
    assert.ok(existe('fonts', licence), `${licence} manquante`);
    assert.match(lirePublic('fonts', licence), /SIL Open Font License/);
  }
  // Cinzel n'est plus utilisée : ni fichier, ni licence, ni référence.
  assert.deepEqual(fs.readdirSync(path.join(PUBLIC, 'fonts')).filter((f) => /cinzel/i.test(f)), []);
  assert.deepEqual(fs.readdirSync(path.join(PUBLIC, 'fonts')).filter((f) => /700/.test(f)), [], 'graisse 700 non prévue par la charte');
  for (const f of listerFichiers(PUBLIC, /\.(html|css|js)$/)) {
    assert.doesNotMatch(fs.readFileSync(f, 'utf8'), /cinzel/i, `${path.relative(RACINE, f)} : référence à Cinzel`);
  }
  // Les familles de la charte sont bien celles des variables, et aucune graisse non chargée n'est demandée.
  const v = variables();
  assert.match(v['--f-titre'], /^'Cormorant Garamond'/);
  assert.match(v['--f-texte'], /^'Jost'/);
  assert.doesNotMatch(css, /font-weight:\s*(?:700|800|900|bold)\b/);
  assert.doesNotMatch(css, /\bfont:\s*(?:italic\s+)?(?:700|800|900|bold)\b/);
});

test('design : aucune ressource externe (pas de Google Fonts, pas de CDN, pas d\'URL distante)', () => {
  const fichiers = listerFichiers(PUBLIC, /\.(html|css|js)$/).filter((f) => !f.includes(`${path.sep}data${path.sep}`));
  for (const f of fichiers) {
    const code = sansCommentaires(fs.readFileSync(f, 'utf8'), f);
    assert.doesNotMatch(code, /googleapis|gstatic|fonts\.google|cdn\.|unpkg|jsdelivr|cdnjs/i, `${path.relative(RACINE, f)} : service externe`);
    const urls = [...code.matchAll(/https?:\/\/[^\s"'`)]+/g)].map((m) => m[0]).filter((u) => u !== 'http://www.w3.org/2000/svg');
    assert.deepEqual(urls, [], `${path.relative(RACINE, f)} : URL externe`);
    assert.doesNotMatch(code, /@import/, `${path.relative(RACINE, f)} : @import`);
  }
});

test('design : variables de la charte (docs/charte-graphique.md, section 2) reprises telles quelles, sans variable inventée', () => {
  const v = variables();
  const charte = variablesCharte();
  assert.ok(Object.keys(charte).length >= 25, 'bloc :root de la charte introuvable');
  assert.deepEqual(v, charte, 'le bloc :root doit être identique à celui de la charte (mêmes variables, mêmes valeurs)');
  const attendu = {
    '--c-nuit': '#060B1E', '--c-minuit': '#0F1E4A', '--c-brume': '#3C5A8C', '--c-lune': '#C9D8EE',
    '--c-lune-douce': '#8FA6C8', '--c-etoile': '#F4F1E8', '--c-ambre': '#F0A35E', '--c-braise': '#D9693A',
  };
  for (const [nom, couleur] of Object.entries(attendu)) assert.equal((v[nom] || '').toUpperCase(), couleur, nom);
  // Toute variable utilisée dans le CSS existe : dans :root, ou propre à un composant (--rarete, --lueur de la charte).
  const utilisees = new Set([...css.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]));
  for (const nom of utilisees) assert.ok(nom in v || ['--rarete', '--lueur'].includes(nom), `variable inventée : ${nom}`);
  assert.doesNotMatch(css, /@import/);
  // docs/PROJET.md, section « Design » : nouvelle palette et nouvelles polices, renvoi à la charte, plus d'ancienne palette.
  const projet = lire('docs', 'PROJET.md');
  for (const couleur of Object.values(attendu)) assert.ok(projet.toUpperCase().includes(couleur), `PROJET.md : ${couleur} absente`);
  assert.match(projet, /charte-graphique\.md/);
  assert.match(projet, /Cormorant Garamond/);
  assert.match(projet, /Jost/);
  for (const ancien of ['#14101F', '#6C4FD1', '#D4AF6A']) assert.ok(!projet.includes(ancien), `PROJET.md : « ${ancien} » ne doit plus y figurer`);
  assert.match(css, /\.ciel\s*\{/, 'fond étoilé .ciel');
  assert.match(lirePublic('index.html'), /<body class="ciel">/);
  assert.match(lirePublic('demo.html'), /<body class="ciel page-demo">/);
  assert.doesNotMatch(css, /background-attachment:\s*fixed/, 'fond fixe interdit (saccades sur mobile)');
});

test('design : interdits de la charte (violets, roses, blanc et noir purs, ombres noires, pilules, survol, texte en brume)', () => {
  const sansRoot = css.replace(/:root\s*\{[^}]*\}/, '');
  // Couleurs écrites en dur : ni violet ni rose, ni #FFF ni #000.
  for (const m of css.matchAll(/#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)) {
    const hex = m[1].length === 3 ? m[1].split('').map((c) => c + c).join('') : m[1].slice(0, 6);
    assert.ok(!/^f{6}$/i.test(hex) && hex !== '000000', `#${m[1]} : blanc ou noir pur`);
    const { t, s } = teinteSaturation(`#${hex}`);
    assert.ok(!(t >= 255 && t <= 345 && s > 0.12), `#${m[1]} : violet ou rose (teinte ${t.toFixed(0)})`);
  }
  assert.doesNotMatch(css, /\b(?:white|black|purple|violet|pink|magenta|rgba?\(\s*(?:0\s*,\s*0\s*,\s*0|255\s*,\s*255\s*,\s*255))/i, 'couleur nommée ou noir/blanc pur');
  assert.doesNotMatch(css, /box-shadow:[^;]*(?:rgba?\(\s*0\s*,\s*0\s*,\s*0|#000)/i, 'ombre portée noire');
  assert.doesNotMatch(css, /:hover/, 'aucun effet au survol');
  assert.doesNotMatch(css, /border-radius:\s*(?:999|9999)/, 'pilule');
  assert.doesNotMatch(css, /border-radius:\s*50%/, 'le cercle est réservé au logo et au badge de coût (absent du jeu)');
  assert.doesNotMatch(sansRoot, /(?:^|[;{\s])color\s*:\s*var\(--c-brume\)/m, 'texte en --c-brume');
  assert.doesNotMatch(css, /\.etincelles\b/, 'ancien fond d\'étincelles');
  // Les violets et roses de l'ancienne palette ont disparu des textes de conception.
  for (const ancien of ['#14101F', '#2A1B3D', '#221A33', '#D4AF6A', '#B3263E', '#6C4FD1', '#A79BBE']) {
    assert.ok(!css.toUpperCase().includes(ancien), `ancienne couleur ${ancien} encore dans le CSS`);
  }
  for (const page of PAGES_HTML) assert.doesNotMatch(lirePublic(page), /#14101F|#fff\b|#000\b/i, `${page} : ancienne couleur ou noir/blanc pur`);
});

test('design : contrastes de la palette (texte >= 4,5:1, texte principal >= 7:1)', () => {
  const v = variables();
  const paires = [
    ['--c-lune', '--c-nuit', 7], ['--c-lune', '--c-minuit', 7], ['--c-etoile', '--c-nuit', 7], ['--c-etoile', '--c-minuit', 7],
    ['--c-lune-douce', '--c-nuit', 4.5], ['--c-lune-douce', '--c-minuit', 4.5],
    ['--c-ambre', '--c-nuit', 4.5], ['--c-ambre', '--c-minuit', 4.5], ['--c-nuit', '--c-ambre', 7],
    ['--c-braise', '--c-nuit', 4.5], ['--c-braise', '--c-minuit', 4.5],
  ];
  for (const [avant, arriere, minimum] of paires) {
    const c = contraste(v[avant], v[arriere]);
    assert.ok(c >= minimum, `${avant} sur ${arriere} : ${c.toFixed(2)} < ${minimum}`);
  }
});

test('design : boutons et zones tactiles d\'au moins 48 px de haut (--cible), états tactiles sans survol', () => {
  const v = variables();
  assert.ok(enPixels('var(--cible)', v) >= 48);
  const cibles = {
    '.bouton': 'min-height', '.bouton-retour': 'height', '.bouton-retour ': 'width',
    '.champ': 'min-height', '.embleme-choix': 'min-height', '.code-option-nom': 'min-height', '.demo-lien': 'min-height',
  };
  for (const [selecteur, prop] of Object.entries(cibles)) {
    const valeurs = propriete(selecteur.trim(), prop);
    assert.ok(valeurs.length > 0, `${selecteur} : ${prop} non défini`);
    for (const valeur of valeurs) assert.ok(enPixels(valeur, v) >= 48, `${selecteur} : ${prop} ${valeur} < 48 px`);
  }
  // Bouton principal ambre / texte nuit, secondaire transparent à bordure lune, appui = enfoncement, focus = contour étoile.
  assert.ok(propriete('.bouton-principal', 'background').includes('var(--c-ambre)'));
  assert.ok(propriete('.bouton-principal', 'color').includes('var(--c-nuit)'));
  assert.ok(propriete('.bouton-secondaire', 'background').includes('transparent'));
  assert.ok(propriete('.bouton-secondaire', 'border').some((b) => /var\(--c-lune\)/.test(b)));
  assert.ok(propriete('.bouton:active', 'transform').includes('scale(.97)'));
  assert.ok(propriete('.bouton:disabled', 'opacity').includes('.4'));
  assert.match(css, /:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--c-etoile\)[^}]*outline-offset:\s*3px/);
  assert.ok(propriete('.bouton', 'font').some((f) => /500 14px/.test(f)), 'bouton : Jost 500, 14 px');
  assert.ok(propriete('.bouton', 'letter-spacing').includes('.2em'));
});

test('design : texte des cartes et des règles d\'au moins 20 px (plancher en rem, la carte 2:3 s\'allonge si besoin)', () => {
  const v = variables();
  for (const selecteur of ['.carte-texte', '.bandeau-texte', '.effets-texte', '.texte', '.joueur-prenom']) {
    const tailles = taillesDeclarees(selecteur);
    assert.ok(tailles.length > 0, `${selecteur} : taille non définie`);
    for (const t of tailles) assert.ok(plancherEnPixels(t, v) >= 20, `${selecteur} : ${t} < 20 px`);
  }
  // Aucune règle d'adaptation (@media) ne doit réduire la taille du texte des cartes.
  for (const m of css.matchAll(/@media[^{]*\{/g)) {
    let profondeur = 1;
    let i = m.index + m[0].length;
    while (profondeur > 0 && i < css.length) {
      if (css[i] === '{') profondeur += 1;
      if (css[i] === '}') profondeur -= 1;
      i += 1;
    }
    const bloc = css.slice(m.index, i);
    assert.doesNotMatch(bloc, /\.carte-texte|\.texte\b|font-size|font:/, `${m[0].trim()} modifie la taille du texte`);
  }
  // Légendes de la charte : 12 px au minimum.
  for (const selecteur of ['.carte-entete', '.dos-nom', '.bandeau-legende', '.code-libelle', '.etiquette', '.compteur']) {
    for (const t of taillesDeclarees(selecteur)) assert.ok(plancherEnPixels(t, v) >= 12, `${selecteur} : ${t} < 12 px`);
  }
  assert.match(lirePublic('index.html'), /width=device-width, initial-scale=1/);
  assert.doesNotMatch(lirePublic('index.html'), /maximum-scale|user-scalable\s*=\s*no/, 'zoom bloqué');
});

test('cartes : proportions 2:3, cqw, bordure et double filet, lettrine, étincelles aux coins, dos de carte (charte, section 6)', () => {
  assert.match(css, /\.carte\s*\{[^}]*container-type:\s*inline-size/);
  assert.ok(propriete('.carte-face', 'aspect-ratio').includes('2 / 3'));
  assert.ok(propriete('.dos-corps', 'aspect-ratio').includes('2 / 3'));
  assert.ok(propriete('.carte-face', 'border').some((b) => /var\(--bordure\) solid var\(--rarete\)/.test(b)));
  assert.ok(propriete('.carte-face', 'border-radius').includes('var(--r-carte)'));
  assert.ok(propriete('.carte-face', 'padding').includes('6cqw'));
  assert.ok(propriete('.carte-face', 'box-shadow').includes('var(--lueur)'));
  assert.ok(propriete('.carte-face::before', 'inset').includes('2.2cqw'), 'double filet');
  assert.ok(propriete('.carte-face::before', 'border').some((b) => /color-mix\(in srgb, var\(--rarete\) 33%, transparent\)/.test(b)));
  assert.ok(propriete('.carte-texte::first-letter', 'float').includes('left'), 'lettrine flottante à gauche');
  assert.ok(propriete('.carte-texte::first-letter', 'color').includes('var(--rarete)'));
  assert.ok(propriete('.carte .coin-hg', 'top').includes('3.5cqw') && propriete('.carte .coin', 'width').includes('4.3cqw'), 'étincelles à 3,5cqw des bords');
  assert.ok(propriete('.dos-corps', 'background').some((b) => /radial-gradient\(circle at 50% 45%, #3C5A8C66, #060B1E 70%\)/.test(b)), 'fond du dos de carte');
  assert.ok(propriete('.dos-corps', 'border').some((b) => /var\(--c-ambre\)/.test(b)), 'bordure ambre du dos');
  assert.ok(propriete('.dos-corps::after', 'inset').includes('6cqw'), 'filet clair de lune à 6cqw');
  assert.ok(propriete('.dos-logo', 'width').includes('52cqw'), 'logo à 52 % de la largeur');
  const ecrans = lirePublic('js', 'ecrans.js');
  assert.match(ecrans, /coins\(\),\s*\n\s*h\('header', \{ classe: 'carte-entete' \}/, 'étincelles dans la carte');
  assert.match(ecrans, /filigrane\('carte-filigrane'\)/, 'séparateur filigrane');
  assert.match(ecrans, /contenuDos\(carte\.type\)/, 'dos de carte pour le retournement');
  // Éléments de la charte absents du jeu : coût, nom, illustration, rareté. Ils ne sont pas inventés.
  assert.doesNotMatch(css, /\.carte\s+\.(?:cout|nom|fenetre)\b|\.carte-(?:cout|nom|fenetre)\b|\.(?:commune|rare|legendaire)\b/);
  assert.doesNotMatch(sansCommentaires(ecrans, 'ecrans.js'), /cout|illustration|fenetre|rarete/i);
});

test('design : chaque type de carte a une couleur ET un symbole ET un mot (Épreuve : braise + épée ; Révélation : lune + étoile)', async () => {
  const textes = await chargerModule('textes.js');
  assert.equal(textes.types.epreuve.symbole, 'epee');
  assert.equal(textes.types.revelation.symbole, 'etoile');
  assert.equal(textes.types.epreuve.nom, 'Épreuve');
  assert.equal(textes.types.revelation.nom, 'Révélation');
  const html = lirePublic('index.html');
  for (const symbole of ['epee', 'etoile', 'bouclier', 'bouclier-grand', 'sort-jete', 'retour', 'coche', 'lueur', 'etincelle', 'filigrane', 'logo']) {
    assert.match(html, new RegExp(`<symbol id="i-${symbole}"`), `symbole ${symbole}`);
  }
  assert.ok(propriete('.carte', '--rarete').includes('var(--c-braise)'), 'Épreuve = braise');
  assert.ok(propriete('.carte-revelation', '--rarete').includes('var(--c-lune)'), 'Révélation = lune');
  assert.ok(propriete('.dos', '--rarete').includes('var(--c-braise)'));
  assert.ok(propriete('.dos-revelation', '--rarete').includes('var(--c-lune)'));
  assert.ok(propriete('.carte-revelation', '--lueur').includes('var(--lueur-lune)'));
  assert.ok(propriete('.carte-entete', 'text-transform').includes('uppercase'), 'type écrit en capitales (ÉPREUVE, RÉVÉLATION)');
  assert.ok(propriete('.carte-entete', 'color').includes('var(--rarete)'));
  // L'ambre ne code jamais un type de carte : il reste pour l'action principale et ce qui compte.
  assert.doesNotMatch(css, /--rarete:\s*var\(--c-ambre\)/);
  const ecrans = lirePublic('js', 'ecrans.js');
  assert.match(ecrans, /icone\(type\.symbole\), h\('span', null, type\.nom\)/, 'symbole et nom du type sur la carte');
  assert.match(ecrans, /icone\(T\.types\[type\]\.symbole, 'dos-symbole'\)/, 'symbole sur les dos de carte');
});

test('logo : SVG fait pour le projet (cercle clair de lune, disque minuit, aile bordée d\'ambre, étoile), version complète et compacte', () => {
  const html = lirePublic('index.html');
  const logo = html.match(/<symbol id="i-logo"[^>]*>([\s\S]*?)<\/symbol>/)[1];
  for (const couleur of ['--c-lune', '--c-minuit', '--c-ambre', '--c-etoile']) assert.match(logo, new RegExp(couleur));
  assert.match(html, /<svg class="logo-compact" role="img" aria-label="Romantasy"[^>]*width="40" height="40"/, 'version compacte de 40 px dans la barre');
  assert.match(lirePublic('js', 'ecrans.js'), /classe: 'logo-complet', role: 'img', 'aria-label': T\.logoNom/, 'version complète sur l\'accueil, nom accessible neutre');
  assert.equal(lirePublic('js', 'textes.js').match(/logoNom = '([^']*)'/)[1], 'Logo du jeu', 'nom accessible neutre (pas de nom écrit)');
  // Remarque de la propriétaire (itération 2) : aucun titre sur l'accueil, donc plus de nom écrit sous le logo.
  assert.doesNotMatch(lirePublic('js', 'ecrans.js'), /logo-nom|T\.marque/, 'plus de nom « Romantasy » écrit sous le logo');
  assert.doesNotMatch(css, /\.logo-nom/, 'plus de style pour un nom écrit sous le logo');
  const accueilSource = lirePublic('js', 'ecrans.js').slice(lirePublic('js', 'ecrans.js').indexOf('export function accueil('), lirePublic('js', 'ecrans.js').indexOf('export function regles('));
  assert.doesNotMatch(accueilSource, /<h[1-6]|h\('h[1-6]'|Romantasy/, 'aucun titre sur l\'accueil');
  assert.doesNotMatch(html, /<image|<img/, 'aucune image bitmap en phase 2');
});

test('ornements et icônes : au trait fin de 1,5 px, jamais pleines (sauf bouclier et sort jeté) ; un seul calque de grain par écran', () => {
  const html = lirePublic('index.html');
  for (const nom of ['epee', 'etoile', 'retour', 'coche', 'lueur']) {
    const symbole = html.match(new RegExp(`<symbol id="i-${nom}"[^>]*>([\\s\\S]*?)</symbol>`))[1];
    assert.match(symbole, /stroke="currentColor"/, `${nom} : trait currentColor`);
    assert.match(symbole, /stroke-width="1\.5"/, `${nom} : trait de 1,5 px`);
    assert.doesNotMatch(symbole, /fill="currentColor"/, `${nom} : icône pleine`);
  }
  // Remarque de la propriétaire (itération 3) : le bouclier et le « sort est jeté » sont trop discrets au trait fin.
  // Écart volontaire à la charte, noté dans docs/PROJET.md : formes pleines, grandes, avec halo ambre ou braise.
  const symbole = (nom) => html.match(new RegExp(`<symbol id="i-${nom}"[^>]*>([\\s\\S]*?)</symbol>`))[1];
  assert.match(symbole('bouclier'), /fill="currentColor"/, 'bouclier des boutons : forme pleine');
  assert.doesNotMatch(symbole('bouclier'), /fill="none"/, 'bouclier des boutons : plus de forme creuse');
  for (const nom of ['bouclier-grand', 'sort-jete']) {
    const s = symbole(nom);
    assert.doesNotMatch(s, /fill="none"|fill:none/, `${nom} : forme creuse`);
    assert.ok((s.match(/fill:var\(--c-(ambre|braise|etoile)\)/g) || []).length >= 3, `${nom} : formes pleines aux couleurs de la charte`);
    assert.match(s, /--c-ambre/);
    assert.match(s, /--c-braise/);
  }
  const transition = lirePublic('js', 'ecrans.js');
  assert.match(transition, /icone\(bouclier \? 'bouclier-grand' : 'sort-jete', 'icone-presence'\)/, 'écran de transition : grandes formes pleines');
  assert.ok(Math.max(...propriete('.transition-icone .icone', 'width').map((t) => enPixels(t, variables()))) >= 128, 'forme de transition : au moins 128 px');
  assert.ok(propriete('.transition-icone::before', 'background').join(' ').includes('#F0A35E'), 'halo ambre');
  assert.ok(propriete('.transition-bouclier .transition-icone::before', 'background').join(' ').includes('#D9693A'), 'halo braise');
  for (const page of PAGES_HTML) {
    const source = lirePublic(page);
    assert.equal((source.match(/<feTurbulence/g) || []).length, 1, `${page} : un seul calque de grain`);
    assert.match(source, /numOctaves="1"/);
    assert.match(source, /class="grain" aria-hidden="true"/);
  }
  assert.doesNotMatch(listerFichiers(path.join(PUBLIC, 'js'), /\.js$/).map((f) => fs.readFileSync(f, 'utf8')).join('\n'), /feTurbulence/);
  assert.ok(propriete('.grain', 'pointer-events').includes('none'));
  assert.ok(propriete('.grain', 'mix-blend-mode').includes('overlay'));
});

test('ciel : constellations (étoiles reliées par des filets très fins, sans texte), placées hors du texte, conformes à la charte', async () => {
  const { MOTIFS, constellation } = await chargerModule('ciel.js');
  const noms = Object.keys(MOTIFS);
  assert.ok(noms.length >= 8, 'au moins huit motifs de constellation');
  for (const nom of noms) {
    const m = MOTIFS[nom];
    assert.ok(m.etoiles.length >= 5 && m.etoiles.length <= 14, `${nom} : peu d'étoiles (légèreté mobile)`);
    for (const [x, y, r] of m.etoiles) {
      assert.ok(x >= 0 && x <= m.l && y >= 0 && y <= m.h && r > 0 && r < 3, `${nom} : étoile hors du cadre`);
    }
    for (const [a, b] of m.liens) assert.ok(m.etoiles[a] && m.etoiles[b] && a !== b, `${nom} : lien invalide`);
  }
  const source = lirePublic('js', 'ciel.js');
  assert.doesNotMatch(source, /createElementNS\([^)]*'text'|<text|textContent|innerHTML|feTurbulence|filter|fixed/, 'ciel.js : ni texte, ni filtre, ni fond fixe');
  assert.doesNotMatch(source, /#[0-9a-fA-F]{3,8}\b|rgb\(/, 'ciel.js : couleurs seulement via les variables du CSS');
  // Filets très fins, étoiles aux couleurs de la charte, on n'anime que l'opacité (scintillement .etoile).
  assert.ok(propriete('.constellation .liens', 'stroke').includes('var(--c-etoile)'));
  assert.ok(parseFloat(propriete('.constellation .liens', 'stroke-width')[0]) <= 1, 'filet de 1 px au plus');
  assert.ok(parseFloat(propriete('.constellation .liens', 'opacity')[0]) <= 0.4, 'filets en faible opacité');
  assert.ok(propriete('.constellation .astre', 'fill').includes('var(--c-etoile)'));
  assert.ok(propriete('.constellation .astre-lune', 'fill').includes('var(--c-lune)'));
  // Zones sans texte : en-tête de part et d'autre du logo, espaces libres de l'accueil, de la transition et de la fin.
  const ecrans = lirePublic('js', 'ecrans.js');
  for (const [fonction, suivante] of [['accueil', 'regles'], ['transition', 'fin'], ['fin', null]]) {
    const debut = ecrans.indexOf(`export function ${fonction}(`);
    const corps = ecrans.slice(debut, suivante ? ecrans.indexOf(`export function ${suivante}(`, debut) : undefined);
    assert.match(corps, /cielLibre\(/, `${fonction} : constellation dans l'espace libre`);
  }
  assert.ok(propriete('.ciel-libre', 'container-type').includes('size'), 'espace libre mesuré (masqué s\'il est trop petit)');
  assert.match(css, /@container \(max-height: \d+px\) \{ \.ciel-libre \.constellation \{ display: none; \} \}/);
  assert.ok(propriete('.ciel-entete', 'pointer-events').includes('none'));
  assert.match(lirePublic('index.html'), /<div id="ciel-entete" class="ciel-entete" aria-hidden="true">/);
  // Étoiles des marges : en pixels, à moins de 12 px du bord (le texte commence à 16 px), derrière le contenu.
  const fond = propriete('.page::before', 'background-image').join(' ');
  const positions = [...fond.matchAll(/circle at (?:calc\(100% - (\d+)px\)|(\d+)px) \d+px/g)];
  assert.ok(positions.length >= 6, 'au moins six étoiles de marge');
  for (const p of positions) assert.ok(Number(p[1] ?? p[2]) <= 12, `étoile de marge à ${p[1] ?? p[2]} px du bord : trop près du texte`);
  assert.ok(propriete('.page::before', 'z-index').includes('-1') && propriete('.page::before', 'pointer-events').includes('none'));
  assert.doesNotMatch(css, /background-attachment/, 'fond fixe interdit (charte, section 8)');
  // La page des règles : titres de section bien plus grands que le texte, filigrane ambre au-dessus.
  assert.match(ecrans, /function titreSection\(texte\)[\s\S]*filigrane\('titre-section-ornement'\)/);
  const titre = plancherEnPixels(propriete('.titre-section h2', 'font')[0].match(/(?:^|\s)([\d.]+rem)(?:\/)/)[1], variables());
  assert.ok(titre >= 28 && titre <= 40, `titre de section de ${titre} px : bien visible mais sous les titres d'écran`);
  assert.ok(propriete('.titre-section h2', 'color').includes('var(--c-etoile)'));
  assert.ok(propriete('.titre-section-ornement', 'color').includes('var(--c-ambre)'));
  assert.ok(enPixels(propriete('.titre-section', 'margin')[0].split(/\s+/)[0], variables()) >= 40, 'grande marge supérieure');
  // Aucune constellation construite sans aria-hidden : le décor n'est pas lu par les lecteurs d'écran.
  assert.match(source, /'aria-hidden': 'true'/);
  assert.equal(typeof constellation, 'function');
});

test('design : bandeau d\'effet durable sur la carte révélée et dans l\'attente, depuis le champ `effet`', () => {
  const ecrans = lirePublic('js', 'ecrans.js');
  assert.match(ecrans, /carte\.effet \? bandeauEffet\(carte\.effet, carte\.duree/);
  assert.match(ecrans, /carteEl\(c, 'soi'\)/, 'carte révélée');
  assert.match(ecrans, /carteEl\(c, 'autre'\)/, 'écran d\'attente');
  assert.match(css, /\.bandeau-effet\s*\{/);
  const durables = JSON.parse(lirePublic('data', 'cartes.json')).filter((c) => c.duree);
  assert.equal(durables.length, 9);
  for (const c of durables) assert.ok(c.effet && c.effet.length > 0, `${c.id} : effet manquant`);
});

test('animations : retournement 3D, fondu de 300 ms, étoiles, opacity et transform seulement ; coupées par le réglage système, sans option dans le jeu', () => {
  for (const nom of ['retournement', 'fondu', 'pulse', 'scintille']) assert.match(css, new RegExp(`@keyframes ${nom}\\b`), `animation ${nom}`);
  assert.doesNotMatch(css, /@keyframes lueur\b/, 'la lueur (box-shadow) n\'est plus animée');
  assert.match(css, /perspective:/);
  assert.match(css, /backface-visibility:\s*hidden/);
  assert.match(css, /rotateY\(180deg\)/);
  // N'animer que opacity et transform (charte, section 9), y compris dans les transitions.
  for (const m of css.matchAll(/@keyframes\s+([\w-]+)\s*\{((?:[^{}]*\{[^{}]*\})*)\s*\}/g)) {
    for (const d of m[2].matchAll(/\{([^{}]*)\}/g)) {
      for (const prop of d[1].split(';').map((p) => p.split(':')[0].trim()).filter(Boolean)) {
        assert.ok(['opacity', 'transform'].includes(prop), `@keyframes ${m[1]} anime « ${prop} »`);
      }
    }
  }
  for (const m of css.matchAll(/(?:^|[;\s{])transition\s*:\s*([^;]+);/g)) {
    assert.match(m[1], /^transform\b/, `transition sur autre chose que transform : ${m[1]}`);
  }
  assert.doesNotMatch(css, /transition-property|will-change/);
  assert.ok(propriete('.ecran', 'animation').some((a) => /^fondu var\(--t-rapide\)/.test(a)), 'fondu de 300 ms entre les écrans');
  assert.equal(variables()['--t-rapide'], '300ms');
  // Règle système de la charte (pas une option du jeu) : tout mouvement coupé si l'appareil le demande.
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)\s*\{\s*\*\s*\{\s*animation:\s*none !important;\s*transition-duration:\s*1ms !important;\s*\}\s*\}/);
  // Étoiles du fond de l'accueil : scintillement lent, opacité seule.
  assert.match(css, /\.etoile\s*\{\s*animation:\s*scintille 5s/);
  assert.match(lirePublic('js', 'ecrans.js'), /ciel-accueil/);
  // Remarque de la propriétaire : plus d'option « Réduire les animations » (bouton, réglage mémorisé, code, textes).
  assert.ok(!existe('js', 'reglages.js'), 'js/reglages.js doit être supprimé');
  for (const f of listerFichiers(PUBLIC, /\.(html|css|js)$/)) {
    const source = fs.readFileSync(f, 'utf8');
    assert.doesNotMatch(source, /réduire les animations|reglage-animations|bouton-reglage|data-animations|localStorage|romantasy\.animations/i,
      `${path.relative(RACINE, f)} : reste de l'option d'animations`);
  }
  assert.doesNotMatch(lire('README.md'), /« Réduire les animations »/);
});

test('textes : l\'interface reprend les textes validés de docs/regles.md', async () => {
  const T = await chargerModule('textes.js');
  const config = JSON.parse(lirePublic('data', 'config.json'));
  const norm = (s) => s.replace(/[’']/g, '\'').replace(/[>*]/g, ' ').replace(/\s+/g, ' ').trim();
  let md = norm(lire('docs', 'regles.md'));
  md = md.replace(/\b\d+ fois/, `${config.tours} fois`);
  const attendus = [
    T.accueil.salut, T.accueil.texte1, T.accueil.texte2, T.accueil.bouton,
    T.regles.butTitre, T.regles.but, T.regles.deroulementTitre, T.regles.deroulement,
    T.regles.carteRevelationNom + T.regles.carteRevelation, T.regles.carteEpreuveNom + T.regles.carteEpreuve,
    T.regles.effetsDurables, T.regles.bouclierTitre, T.regles.bouclier, T.regles.finTitre, T.regles.fin(config.tours),
    T.regles.creer, T.regles.rejoindre,
    T.tour.aToi, T.tour.sortJete, T.tour.bouclier, T.tour.confirmation,
    T.tour.transitionJete('[prénom]').replace('[prénom]', '[prénom]'),
    T.tour.transitionBouclier('[prénom]'),
    T.tour.enAttente('[prénom]'),
    T.fin.titre, T.fin.texte, T.fin.bouton,
    T.salle.accompagnement, T.salle.complete, T.salle.commencer,
  ];
  for (const texte of attendus) assert.ok(md.includes(norm(texte)), `absent de docs/regles.md : « ${texte} »`);
  assert.equal(T.tour.compteur(1, config.tours), `Tour 1 / ${config.tours}`);
});

test('textes : écriture inclusive allégée (formulation neutre d\'abord) et vocabulaire (« butin », jamais « poche » ni « sac ») dans tout le code de l\'interface', () => {
  // Interdits : formes exclusivement féminines ou exclusivement masculines pour désigner une personne qui joue, et « poche/sac ».
  // Les parenthèses ne sont plus exigées : elles ne sont qu'un dernier recours.
  const interdits = {
    poche: /\bpoches?\b/i, sac: /\bsacs?\b/i, joueuse: /\bjoueuses?\b/i, elle: /\belles?\b/i, celle: /\bcelles?\b/i,
    voisine: /\bvoisines?\b/i, chacune: /\bchacunes?\b/i, prete: /\bprêtes?\b/i, premiereQui: /la première qui\b/i,
    'la joueur(se)': /(?<!\/)\bla joueur\(se\)/i, 'une joueur': /\bune joueur\b/i,
    voisin: /\bvoisins?\b/i, chacun: /\bchacun\b(?!\()/i, celui: /\b(celui|ceux)\b(?!-ci|-là)/i,
    'le premier qui': /\ble (premier|dernier) qui\b/i, prets: /\bprêts?\b(?!\(e\))/i,
  };
  // Le mot « joueur(s) » est un identifiant de code (joueurs, joueursMax) : on ne le contrôle que dans les textes affichés.
  const fichiersTextes = ['textes.js', 'demo.js'].map((n) => path.join(PUBLIC, 'js', n)).concat(['index.html', 'demo.html'].map((n) => path.join(PUBLIC, n)));
  for (const f of fichiersTextes) {
    const texte = sansCommentaires(fs.readFileSync(f, 'utf8'), f).replace(/\b(?:joueursMax|joueursFictifs|joueurs)\b/g, '');
    assert.doesNotMatch(texte, /(?<![-\w(])joueurs?\b(?!\(se\))/i, `${path.relative(RACINE, f)} : « joueur » exclusivement masculin dans un texte`);
  }
  const fichiers = listerFichiers(PUBLIC, /\.(html|js|css)$/).filter((f) => !f.includes(`${path.sep}data${path.sep}`));
  assert.ok(fichiers.length >= 10);
  for (const f of fichiers) {
    const code = sansCommentaires(fs.readFileSync(f, 'utf8'), f);
    for (const [nom, motif] of Object.entries(interdits)) {
      assert.doesNotMatch(code, motif, `${path.relative(RACINE, f)} : forme interdite « ${nom} »`);
    }
  }
  // Textes affichés : plus aucune parenthèse d'accord ; formulations neutres retenues.
  const textes = lirePublic('js', 'textes.js');
  assert.doesNotMatch(textes, /\w\((e|se|euse|ne|ve|te|ère)\)|\w\(s\)|\/la\b/, 'parenthèses d\'accord ou « le/la » restantes dans les textes');
  for (const forme of ['Bienvenue en ces terres.', 'Chaque personne', 'tout le monde', 'la personne qui joue', 'Je suis là', 'Le groupe']) {
    assert.ok(textes.includes(forme), `formulation neutre « ${forme} » absente`);
  }
  assert.match(textes, /butin/);
});

test('textes : la page n\'affiche aucun emoji en dehors des emblèmes (les emblèmes viennent de emblemes.json)', () => {
  const emoji = /\p{Extended_Pictographic}/u;
  for (const f of listerFichiers(PUBLIC, /\.(html|js|css)$/)) {
    assert.doesNotMatch(fs.readFileSync(f, 'utf8'), emoji, `${path.relative(RACINE, f)} : emoji en dur`);
  }
});

test('données fictives : aucun réseau, aucun Firebase, aucune logique de jeu dans les écrans', () => {
  for (const f of listerFichiers(path.join(PUBLIC, 'js'), /\.js$/)) {
    const code = sansCommentaires(fs.readFileSync(f, 'utf8'), f);
    assert.doesNotMatch(code, /firebase|WebSocket|XMLHttpRequest|EventSource|sendBeacon/i, `${path.relative(RACINE, f)} : accès réseau`);
    assert.doesNotMatch(code, /Math\.random/, `${path.relative(RACINE, f)} : tirage au sort (logique de jeu)`);
  }
  // Seul fetch autorisé : le chargement des fichiers de public/data/.
  const fetchs = listerFichiers(path.join(PUBLIC, 'js'), /\.js$/)
    .flatMap((f) => [...sansCommentaires(fs.readFileSync(f, 'utf8'), f).matchAll(/fetch\(([^)]*)\)/g)].map((m) => m[1]));
  assert.deepEqual(fetchs, ['`data/${nom}`']);
});

test('README : explique comment servir le jeu, ouvrir les écrans (dont sur téléphone) et lancer les tests', () => {
  const readme = lire('README.md');
  assert.match(readme, /## Lancer le jeu/);
  assert.match(readme, /python3 -m http\.server/);
  assert.match(readme, /demo\.html/);
  assert.match(readme, /\?ecran=/);
  assert.match(readme, /Wi-?Fi/i);
  assert.match(readme, /node --test tests\//);
  assert.match(readme, /Créer une partie/);
  assert.match(readme, /Rejoindre une partie/);
  assert.match(readme, /`creer`/);
  assert.match(readme, /`rejoindre`/);
  assert.match(readme, /`erreur`/);
  assert.match(readme, /Node\.js/);
});
