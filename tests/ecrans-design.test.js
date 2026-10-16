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

const ECRANS = ['accueil', 'regles', 'salle', 'choix', 'carte', 'attente', 'transition', 'fin'];
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

test('écrans : les huit écrans existent (routes, fonctions, liens de la page de démonstration)', () => {
  const app = lirePublic('js', 'app.js');
  const ecrans = lirePublic('js', 'ecrans.js');
  const demo = lirePublic('js', 'demo.js');
  for (const nom of ECRANS) {
    assert.match(app, new RegExp(`\\b${nom}:\\s*ecrans\\.${nom}\\b`), `route « ${nom} » absente de app.js`);
    assert.match(ecrans, new RegExp(`export function ${nom}\\(`), `fonction d'écran « ${nom} » absente`);
    assert.match(demo, new RegExp(`ecran: '${nom}'`), `aucun lien de démonstration vers l'écran « ${nom} »`);
  }
});

test('design : polices Cinzel et Cormorant Garamond hébergées (woff2 présents, valides, licence OFL)', () => {
  const faces = [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((m) => m[1]);
  assert.ok(faces.length >= 3, 'au moins trois @font-face attendus');
  const familles = new Set(faces.map((f) => f.match(/font-family:\s*'([^']+)'/)[1]));
  assert.ok(familles.has('Cinzel'), 'Cinzel non déclarée');
  assert.ok(familles.has('Cormorant Garamond'), 'Cormorant Garamond non déclarée');
  for (const face of faces) {
    const src = face.match(/url\('([^']+)'\)\s*format\('woff2'\)/);
    assert.ok(src, 'chaque @font-face doit pointer vers un fichier woff2 local');
    const fichier = path.resolve(PUBLIC, 'css', src[1]);
    assert.ok(fs.existsSync(fichier), `police manquante : ${src[1]}`);
    assert.equal(fs.readFileSync(fichier).subarray(0, 4).toString('latin1'), 'wOF2', `${src[1]} n'est pas un woff2`);
  }
  for (const licence of ['LICENSE-Cinzel-OFL.txt', 'LICENSE-CormorantGaramond-OFL.txt']) {
    assert.ok(existe('fonts', licence), `${licence} manquante`);
    assert.match(lirePublic('fonts', licence), /SIL Open Font License/);
  }
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

test('design : palette exacte du projet (docs/PROJET.md)', () => {
  const vars = variables();
  const attendu = {
    '--fond': '#14101F', '--fond-haut': '#2A1B3D', '--surface': '#221A33', '--or': '#D4AF6A',
    '--texte': '#F3ECE0', '--epreuve': '#B3263E', '--revelation': '#6C4FD1', '--secondaire': '#A79BBE',
  };
  for (const [nom, couleur] of Object.entries(attendu)) {
    assert.equal((vars[nom] || '').toUpperCase(), couleur, `${nom}`);
  }
  assert.match(lire('docs', 'PROJET.md'), /#14101F/);
  assert.match(css, /linear-gradient\(180deg,\s*var\(--fond\)[^,)]*,\s*var\(--fond-haut\)[^)]*\)/, 'dégradé du fond');
});

test('design : contrastes de la palette (texte >= 4,5:1, texte principal >= 7:1)', () => {
  const v = variables();
  const paires = [
    ['--texte', '--fond', 7], ['--texte', '--surface', 7], ['--texte', '--fond-haut', 7],
    ['--or', '--surface', 4.5], ['--or', '--fond', 4.5], ['--fond', '--or', 4.5],
    ['--secondaire', '--surface', 4.5], ['--secondaire', '--fond', 4.5], ['--secondaire', '--fond-haut', 4.5],
    ['--texte', '--epreuve', 4.5], ['--texte', '--revelation', 4.5],
  ];
  for (const [avant, arriere, minimum] of paires) {
    const c = contraste(v[avant], v[arriere]);
    assert.ok(c >= minimum, `${avant} sur ${arriere} : ${c.toFixed(2)} < ${minimum}`);
  }
});

test('design : boutons et zones tactiles d\'au moins 48 px de haut', () => {
  const v = variables();
  assert.ok(enPixels('var(--hauteur-bouton)', v) >= 48);
  assert.ok(enPixels('var(--hauteur-tactile-min)', v) >= 48);
  const cibles = {
    '.bouton': 'min-height', '.bouton-retour': 'height',
    '.champ': 'min-height', '.embleme-choix': 'min-height', '.demo-lien': 'min-height',
  };
  for (const [selecteur, prop] of Object.entries(cibles)) {
    const valeurs = propriete(selecteur, prop);
    assert.ok(valeurs.length > 0, `${selecteur} : ${prop} non défini`);
    for (const valeur of valeurs) assert.ok(enPixels(valeur, v) >= 48, `${selecteur} : ${prop} ${valeur} < 48 px`);
  }
});

test('design : texte des cartes et des règles d\'au moins 20 px, jamais réduit', () => {
  const v = variables();
  assert.ok(enPixels('var(--taille-texte-carte)', v) >= 20, 'taille du texte des cartes');
  assert.ok(enPixels('var(--taille-texte)', v) >= 20, 'taille du texte courant');
  for (const selecteur of ['.carte-texte', '.texte']) {
    const tailles = propriete(selecteur, 'font-size');
    assert.ok(tailles.length > 0, `${selecteur} : font-size non défini`);
    for (const t of tailles) assert.ok(enPixels(t, v) >= 20, `${selecteur} : ${t} < 20 px`);
  }
  // Aucune règle d'adaptation (@media) ne doit toucher à la taille du texte des cartes.
  for (const m of css.matchAll(/@media[^{]*\{/g)) {
    let profondeur = 1;
    let i = m.index + m[0].length;
    while (profondeur > 0 && i < css.length) {
      if (css[i] === '{') profondeur += 1;
      if (css[i] === '}') profondeur -= 1;
      i += 1;
    }
    const bloc = css.slice(m.index, i);
    assert.doesNotMatch(bloc, /\.carte-texte|\.texte\b|--taille-texte/, `${m[0].trim()} modifie la taille du texte`);
  }
  assert.match(lirePublic('index.html'), /width=device-width, initial-scale=1/);
  assert.doesNotMatch(lirePublic('index.html'), /maximum-scale|user-scalable\s*=\s*no/, 'zoom bloqué');
});

test('design : chaque type de carte a une couleur ET un symbole (épée pour Épreuve, étoile pour Révélation)', async () => {
  const textes = await chargerModule('textes.js');
  assert.equal(textes.types.epreuve.symbole, 'epee');
  assert.equal(textes.types.revelation.symbole, 'etoile');
  assert.equal(textes.types.epreuve.nom, 'Épreuve');
  assert.equal(textes.types.revelation.nom, 'Révélation');
  const html = lirePublic('index.html');
  for (const symbole of ['epee', 'etoile', 'bouclier']) assert.match(html, new RegExp(`<symbol id="i-${symbole}"`), `symbole ${symbole}`);
  assert.match(css, /\.carte-revelation\s*\{[^}]*--couleur-type:\s*var\(--revelation\)/);
  assert.match(css, /\.carte\s*\{[^}]*--couleur-type:\s*var\(--epreuve\)/);
  assert.match(css, /\.carte-entete\s*\{[^}]*background:\s*var\(--couleur-type\)/);
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

test('animations : retournement 3D, fondu, lueur, étincelles ; désactivées par le réglage système, sans option dans le jeu', () => {
  for (const nom of ['retournement', 'fondu', 'lueur', 'scintille']) assert.match(css, new RegExp(`@keyframes ${nom}\\b`), `animation ${nom}`);
  assert.match(css, /perspective:/);
  assert.match(css, /backface-visibility:\s*hidden/);
  assert.match(css, /rotateY\(180deg\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/, 'demande du système');
  const reduit = css.match(/@media \(prefers-reduced-motion: reduce\)\s*\{\s*:root\s*\{([^}]*)\}/)[1];
  for (const anim of ['--anim-fondu', '--anim-flip', '--anim-lueur', '--anim-scintille']) {
    assert.match(reduit, new RegExp(`${anim}:\\s*none`), `${anim} non désactivée`);
  }
  // Remarque de la propriétaire : plus d'option « Réduire les animations » (bouton, réglage mémorisé, code, textes).
  assert.ok(!existe('js', 'reglages.js'), 'js/reglages.js doit être supprimé');
  for (const f of listerFichiers(PUBLIC, /\.(html|css|js)$/)) {
    const source = fs.readFileSync(f, 'utf8');
    assert.doesNotMatch(source, /réduire les animations|reglage-animations|bouton-reglage|data-animations|localStorage|romantasy\.animations/i,
      `${path.relative(RACINE, f)} : reste de l'option d'animations`);
  }
  assert.doesNotMatch(lire('README.md'), /Réduire les animations/i);
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

test('textes : écriture inclusive et vocabulaire (« butin », jamais « poche » ni « sac ») dans tout le code de l\'interface', () => {
  const interdits = {
    poche: /\bpoches?\b/i, sac: /\bsacs?\b/i, joueuse: /\bjoueuses?\b/i, elle: /\belles?\b/i, celle: /\bcelles?\b/i,
    voisine: /\bvoisines?\b/i, chacune: /\bchacunes?\b/i, prete: /\bprêtes?\b/i, premiereQui: /la première qui\b/i,
    'la joueur(se)': /(?<!\/)\bla joueur\(se\)/i, 'une joueur': /\bune joueur\b/i,
  };
  const fichiers = listerFichiers(PUBLIC, /\.(html|js|css)$/).filter((f) => !f.includes(`${path.sep}data${path.sep}`));
  assert.ok(fichiers.length >= 10);
  for (const f of fichiers) {
    const code = sansCommentaires(fs.readFileSync(f, 'utf8'), f);
    for (const [nom, motif] of Object.entries(interdits)) {
      assert.doesNotMatch(code, motif, `${path.relative(RACINE, f)} : forme interdite « ${nom} »`);
    }
  }
  const textes = lirePublic('js', 'textes.js');
  for (const forme of ['voyageur(euse)', 'joueur(se)', 'chacun(e)', 'prêt(e)']) assert.ok(textes.includes(forme), `forme inclusive « ${forme} » absente`);
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
  assert.match(readme, /Node\.js/);
});
