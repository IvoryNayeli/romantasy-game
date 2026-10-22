'use strict';

// Aide commune des tests de navigateur de la phase 2 (écrite par le testeur).
// Ce fichier ne contient aucun test : il fournit le serveur local, le pilotage de Chrome (playwright-core)
// et les mesures exécutées dans la page. Il est utilisé par navigateur.test.js, navigateur-parcours.test.js
// et navigateur-charte.test.js.
//
// Prérequis : `npm install` (playwright-core) et Google Chrome. Variables facultatives : CHROME_PATH,
// CAPTURES_DIR (dossier des captures, par défaut un dossier temporaire hors du dépôt).
// Sans playwright-core ou sans Chrome, les tests de navigateur sont SAUTÉS avec un message clair.
// Sécurité : le serveur écoute uniquement sur 127.0.0.1 et toute requête vers une autre adresse est bloquée
// et signalée comme défaut. Aucun accès réseau externe.
// Phase 4 : les pages s'ouvrent par défaut en démonstration (?demo=1 : données fictives, aucun accès à la base).
// Avec l'option { reseau: true }, la page utilise l'émulateur Firebase local (127.0.0.1) ; le SDK, normalement chargé
// depuis le CDN gstatic, est alors servi depuis node_modules/firebase (même version), sans sortir de la machine.

const { before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');

const RACINE = path.join(__dirname, '..');
const PUBLIC = path.join(RACINE, 'public');
const CAPTURES = process.env.CAPTURES_DIR || path.join(os.tmpdir(), 'romantasy-captures');

let chromium = null;
let raisonSaut = null;
try {
  ({ chromium } = require('playwright-core'));
} catch {
  raisonSaut = 'playwright-core absent : lancer « npm install » à la racine du dépôt pour activer les tests de navigateur';
}
const CHEMINS_CHROME = [process.env.CHROME_PATH, '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium', '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean);
const CHROME = CHEMINS_CHROME.find((p) => fs.existsSync(p));
if (!raisonSaut && !CHROME) {
  raisonSaut = 'Google Chrome introuvable : installer Chrome ou définir CHROME_PATH pour activer les tests de navigateur';
}
if (raisonSaut) console.warn(`# SAUT des tests de navigateur : ${raisonSaut}`);

const lireJson = (nom) => JSON.parse(fs.readFileSync(path.join(PUBLIC, 'data', nom), 'utf8'));
// SDK Firebase servi localement (paquet de développement « firebase », version figée dans package.json).
const VERSION_FIREBASE = JSON.parse(fs.readFileSync(path.join(RACINE, 'package.json'), 'utf8')).devDependencies.firebase;
const SDK_LOCAL = path.join(RACINE, 'node_modules', 'firebase');
const config = lireJson('config.json');
const cartes = lireJson('cartes.json');
const codes = lireJson('codes.json');
const emblemes = lireJson('emblemes.json');
const LARGEURS = [360, 412];

/* ---------- Serveur statique local (127.0.0.1 seulement) ---------- */
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
};
function demarrerServeur() {
  const serveur = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    let chemin = path.normalize(decodeURIComponent(url.pathname));
    if (chemin.endsWith(path.sep)) chemin += 'index.html';
    const fichier = path.join(PUBLIC, chemin);
    if (!fichier.startsWith(PUBLIC) || !fs.existsSync(fichier) || fs.statSync(fichier).isDirectory()) {
      res.writeHead(404); res.end('introuvable'); return;
    }
    res.writeHead(200, { 'content-type': TYPES[path.extname(fichier)] || 'application/octet-stream' });
    fs.createReadStream(fichier).pipe(res);
  });
  return new Promise((ok) => serveur.listen(0, '127.0.0.1', () => ok(serveur)));
}

/* ====================================================================================
   Mesures exécutées DANS la page (page.evaluate) : chaque fonction est autonome.
   ==================================================================================== */

// Débordements : défilement horizontal, texte hors de l'écran, texte coupé par un parent, boîtes qui dépassent.
function mesurerDebordements() {
  const problemes = [];
  const L = window.innerWidth;
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
  };
  const nom = (el) => `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? `.${el.className.trim().replace(/\s+/g, '.')}` : ''}`;
  if (document.documentElement.scrollWidth > L) {
    problemes.push(`défilement horizontal : scrollWidth ${document.documentElement.scrollWidth} > ${L}`);
  }
  if (document.body.scrollWidth > L) problemes.push(`body.scrollWidth ${document.body.scrollWidth} > ${L}`);
  const marcheur = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let noeud;
  while ((noeud = marcheur.nextNode())) {
    if (!noeud.textContent.trim()) continue;
    const parent = noeud.parentElement;
    if (!parent || parent.closest('noscript, script, style') || !visible(parent)) continue;
    const plage = document.createRange();
    plage.selectNodeContents(noeud);
    for (const r of plage.getClientRects()) {
      if (r.width === 0) continue;
      if (r.left < -0.5 || r.right > L + 0.5) {
        problemes.push(`texte hors de l'écran : « ${noeud.textContent.trim().slice(0, 40)} » (${nom(parent)}) x=${r.left.toFixed(0)}..${r.right.toFixed(0)} pour largeur ${L}`);
      }
      for (let a = parent; a && a !== document.documentElement; a = a.parentElement) {
        const s = getComputedStyle(a);
        const coupe = (axe) => s[axe] !== 'visible';
        const ra = a.getBoundingClientRect();
        if ((coupe('overflowX') && (r.left < ra.left - 1 || r.right > ra.right + 1))
          || (coupe('overflowY') && a !== document.body && (r.top < ra.top - 1 || r.bottom > ra.bottom + 1))) {
          if (a === document.body && !coupe('overflowY')) continue;
          problemes.push(`texte coupé par ${nom(a)} : « ${noeud.textContent.trim().slice(0, 40)} »`);
        }
      }
    }
  }
  for (const el of document.querySelectorAll('body *')) {
    if (!visible(el) || el.closest('svg, noscript, .ciel-accueil') || el.tagName === 'INPUT') continue;
    const s = getComputedStyle(el);
    if (['hidden', 'clip'].includes(s.overflowX) && el.scrollWidth > el.clientWidth + 1) {
      problemes.push(`${nom(el)} : scrollWidth ${el.scrollWidth} > clientWidth ${el.clientWidth}`);
    }
    if (['hidden', 'clip'].includes(s.overflowY) && el.scrollHeight > el.clientHeight + 1 && el !== document.body) {
      problemes.push(`${nom(el)} : scrollHeight ${el.scrollHeight} > clientHeight ${el.clientHeight}`);
    }
    const r = el.getBoundingClientRect();
    if (el.closest('main, header') && (r.right > L + 0.5 || r.left < -0.5)) {
      problemes.push(`${nom(el)} dépasse de l'écran : x=${r.left.toFixed(0)}..${r.right.toFixed(0)}`);
    }
  }
  return problemes;
}

// Contrôle de la carte : tout le texte reste DANS la carte (le cadre n'a pas d'overflow caché, donc un texte
// qui sortirait ne serait pas vu par mesurerDebordements), le bandeau ne chevauche pas le texte, ratio 2:3 au moins.
function mesurerCarte() {
  const problemes = [];
  const face = document.querySelector('.carte-face');
  if (!face) return ['aucune .carte-face'];
  const f = face.getBoundingClientRect();
  const w = document.querySelector('.carte').getBoundingClientRect().width;
  const marge = 0.022 * w + 1; // le double filet est à 2,2cqw du bord
  if (f.height < f.width * 1.5 - 1) problemes.push(`carte plus courte que 2:3 : ${f.width.toFixed(0)}x${f.height.toFixed(0)}`);
  const marcheur = document.createTreeWalker(face, NodeFilter.SHOW_TEXT);
  let noeud;
  while ((noeud = marcheur.nextNode())) {
    if (!noeud.textContent.trim()) continue;
    const plage = document.createRange();
    plage.selectNodeContents(noeud);
    for (const r of plage.getClientRects()) {
      if (r.width < 1) continue;
      if (r.left < f.left + marge || r.right > f.right - marge || r.top < f.top + marge || r.bottom > f.bottom - marge) {
        problemes.push(`texte hors du filet de la carte : « ${noeud.textContent.trim().slice(0, 30)} » (${r.left.toFixed(0)}..${r.right.toFixed(0)} x ${r.top.toFixed(0)}..${r.bottom.toFixed(0)} pour ${f.left.toFixed(0)}..${f.right.toFixed(0)} x ${f.top.toFixed(0)}..${f.bottom.toFixed(0)})`);
      }
    }
  }
  const texte = face.querySelector('.carte-texte').getBoundingClientRect();
  const bandeau = face.querySelector('.bandeau-effet');
  if (bandeau) {
    const b = bandeau.getBoundingClientRect();
    if (b.top < texte.bottom - 1) problemes.push(`bandeau d'effet qui chevauche le texte (${b.top.toFixed(0)} < ${texte.bottom.toFixed(0)})`);
  }
  return problemes;
}

// Éléments interactifs visibles et leurs dimensions.
function mesurerCibles() {
  const sel = 'button, a[href], input, select, textarea, [role="button"], [role="radio"]';
  return [...document.querySelectorAll(sel)].filter((el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && !el.closest('dialog:not([open])');
  }).map((el) => {
    const r = el.getBoundingClientRect();
    return {
      nom: `${el.tagName.toLowerCase()}.${String(el.className).trim().replace(/\s+/g, '.')}`,
      texte: (el.textContent || el.getAttribute('aria-label') || el.value || '').trim().slice(0, 30),
      h: r.height, l: r.width, desactive: el.disabled === true,
      g: r.left, d: r.right, t: r.top, b: r.bottom,
    };
  });
}

// Tailles de police : texte des cartes, texte de lecture, et tout texte visible plus petit que la charte ne le permet.
function mesurerPolices() {
  const taille = (sel) => [...document.querySelectorAll(sel)].map((e) => parseFloat(getComputedStyle(e).fontSize));
  const petits = [];
  for (const e of document.querySelectorAll('body *')) {
    if (e.closest('noscript, svg')) continue;
    const direct = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    const s = getComputedStyle(e);
    if (!direct || s.display === 'none' || s.visibility === 'hidden' || e.getBoundingClientRect().width === 0) continue;
    const px = parseFloat(s.fontSize);
    const brut = e.textContent.trim();
    // « Capitales » : transformées par le CSS, ou déjà écrites en capitales (les codes de partie).
    const capitales = s.textTransform === 'uppercase' || (brut === brut.toUpperCase() && /[A-Z]/.test(brut));
    petits.push({
      px, capitales, extrait: `${e.className || e.tagName} ${px}px « ${e.textContent.trim().slice(0, 25)} »`,
    });
  }
  return {
    carte: taille('.carte-texte'),
    // Texte de lecture (règles, cartes, bandeaux, attente) : au moins 20 px (décision du projet).
    // Le texte des cartes est mesuré à part (carte) : depuis la phase 7, il peut descendre à 15 px pour que la carte tienne à l'écran.
    corps: taille('.texte, .accueil-salut, .bandeau-texte, .effets-texte, .attente-message, .transition-texte, .joueur-prenom'),
    petits,
  };
}

// Textes visibles avec leur couleur effective et leurs rectangles, pour mesurer le contraste sur les pixels.
// La lettrine (::first-letter) est mesurée à part avec sa propre couleur.
function collecterTextes() {
  const sorties = [];
  const marcheur = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let noeud;
  const lire = (couleur, opacite) => {
    const m = couleur.match(/[\d.]+/g).map(Number);
    return [m[0], m[1], m[2], (m.length > 3 ? m[3] : 1) * opacite];
  };
  while ((noeud = marcheur.nextNode())) {
    const t = noeud.textContent.trim();
    const parent = noeud.parentElement;
    if (!t || !parent || parent.closest('noscript, script, style, svg, .embleme, .embleme-image')) continue;
    // Bandeau replié (details fermé, phase 7) : son détail n'est pas affiché.
    if (parent.closest('details:not([open]) > :not(summary)')) continue;
    // Verso d'une carte révélée (face cachée, backface-visibility: hidden) : il n'est pas affiché.
    if (parent.closest('.carte .carte-dos')) continue;
    const s = getComputedStyle(parent);
    const r0 = parent.getBoundingClientRect();
    if (s.visibility === 'hidden' || s.display === 'none' || r0.width === 0) continue;
    let opacite = 1;
    for (let a = parent; a; a = a.parentElement) opacite *= parseFloat(getComputedStyle(a).opacity);
    const plage = document.createRange();
    plage.selectNodeContents(noeud);
    const rects = [...plage.getClientRects()].filter((r) => r.width > 1 && r.height > 1)
      .map((r) => ({ x: r.left, y: r.top + window.scrollY, w: r.width, h: r.height }));
    sorties.push({
      texte: t.slice(0, 40), couleur: lire(s.color, opacite),
      taille: parseFloat(s.fontSize), gras: parseInt(s.fontWeight, 10) >= 700, rects,
      desactive: Boolean(parent.closest('button:disabled')),
      classe: String(parent.className),
    });
    // Lettrine de la carte : couleur propre, mesurée sur la première lettre seulement.
    const premier = parent.matches('.carte-texte') && noeud === parent.firstChild;
    if (premier) {
      const sl = getComputedStyle(parent, '::first-letter');
      const un = document.createRange();
      un.setStart(noeud, 0); un.setEnd(noeud, 1);
      const rr = [...un.getClientRects()].filter((r) => r.width > 1 && r.height > 1)
        .map((r) => ({ x: r.left, y: r.top + window.scrollY, w: r.width, h: r.height }));
      sorties.push({
        texte: `lettrine « ${t[0]} »`, couleur: lire(sl.color, opacite), taille: parseFloat(sl.fontSize),
        gras: parseInt(sl.fontWeight, 10) >= 700, rects: rr, desactive: false, classe: 'lettrine',
      });
    }
  }
  return sorties;
}

// Exécuté dans une page vierge : calcule, sur la capture sans texte, le pire contraste pour chaque texte.
async function calculerContrastes({ base64, textes }) {
  const img = new Image();
  img.src = `data:image/png;base64,${base64}`;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const lin = (v) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; };
  const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return textes.map((t) => {
    let pire = Infinity;
    for (const r of t.rects) {
      const x = Math.max(0, Math.floor(r.x)); const y = Math.max(0, Math.floor(r.y));
      const w = Math.min(img.width - x, Math.ceil(r.w)); const h = Math.min(img.height - y, Math.ceil(r.h));
      if (w <= 0 || h <= 0) continue;
      const d = ctx.getImageData(x, y, w, h).data;
      for (let i = 0; i < d.length; i += 4 * 3) {
        const a = t.couleur[3];
        const fr = t.couleur[0] * a + d[i] * (1 - a);
        const fg = t.couleur[1] * a + d[i + 1] * (1 - a);
        const fb = t.couleur[2] * a + d[i + 2] * (1 - a);
        const l1 = lum(fr, fg, fb); const l2 = lum(d[i], d[i + 1], d[i + 2]);
        const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        if (ratio < pire) pire = ratio;
      }
    }
    return { texte: t.texte, taille: t.taille, gras: t.gras, desactive: t.desactive, classe: t.classe, ratio: pire };
  });
}

// Feuille de style injectée avant la capture « sans texte » : masque le texte et neutralise ce qui fausse la mesure
// du fond (étoiles du ciel et de l'accueil, grain, lettrine) tout en gardant les vrais halos (bleu en haut, braise en bas).
const STYLE_FOND_SANS_TEXTE = `
  * { color: transparent !important; text-shadow: none !important; caret-color: transparent !important; }
  .carte-texte::first-letter { color: transparent !important; }
  input::placeholder { color: transparent !important; }
  .erreur-champ::before { border-color: transparent !important; }
  .grain, .etoile, .ciel-accueil { display: none !important; }
  /* Phase 7 (remarques 17 et 24) : la propriétaire veut aussi des étoiles au milieu de l'écran ; ces calques de décor
     (très petites étoiles, pâles vers le centre) sont neutralisés comme les autres étoiles pour mesurer le texte. */
  .page::after, .ecran-zone::before { display: none !important; }
  body.ciel { background: radial-gradient(ellipse at 85% 0%, #3C5A8C55, transparent 50%), radial-gradient(ellipse at 50% 110%, #D9693A33, transparent 55%), #060B1E !important; }
`;

/* ====================================================================================
   Contexte partagé : serveur, Chrome, ouverture de pages avec relevé des problèmes.
   À appeler dans un describe() : enregistre before/after et renvoie l'objet de contexte.
   ==================================================================================== */
function contexte() {
  const ctx = {
    base: null,
    problemes: [], // erreurs de console, requêtes externes, 404 : relevés sur toutes les pages visitées
    requetesExternes: [],
    polices: new Set(),
    pageCalcul: null,
  };
  let serveur; let navigateur;

  before(async () => {
    fs.mkdirSync(CAPTURES, { recursive: true });
    serveur = await demarrerServeur();
    ctx.base = `http://127.0.0.1:${serveur.address().port}`;
    navigateur = await chromium.launch({
      executablePath: CHROME, headless: true, args: ['--no-sandbox', '--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1'],
    });
    const ctxCalcul = await navigateur.newContext();
    ctx.pageCalcul = await ctxCalcul.newPage();
    await ctx.pageCalcul.goto('about:blank');
  });
  after(async () => {
    if (navigateur) await navigateur.close();
    if (serveur) serveur.close();
  });

  // Adresse d'une page du jeu : démonstration par défaut (demo=1 ajouté en tête, encodage d'origine conservé).
  ctx.url = (chemin, { reseau = false } = {}) => {
    const url = new URL(chemin, `${ctx.base}/`);
    const pageJeu = url.pathname === '/' || url.pathname.endsWith('/index.html');
    if (!reseau && pageJeu && !url.searchParams.has('demo')) url.search = `?demo=1${url.search ? `&${url.search.slice(1)}` : ''}`;
    return url;
  };
  // Ouvre une page avec relevé des problèmes. Refuse toute adresse non locale.
  ctx.ouvrir = async function ouvrir(chemin, { largeur = 360, hauteur = 800, reduit = null, config: cfg = null, init = null, couleur = 'dark', dpr = 1, reseau = false, mobile = false } = {}) {
    const url = ctx.url(chemin, { reseau });
    assert.equal(url.hostname, '127.0.0.1', `adresse non locale refusée : ${url}`);
    const c = await navigateur.newContext({
      viewport: { width: largeur, height: hauteur }, deviceScaleFactor: dpr, hasTouch: true, isMobile: mobile,
      reducedMotion: reduit === true ? 'reduce' : 'no-preference', locale: 'fr-FR', colorScheme: couleur,
    });
    await c.route('**/*', (route) => {
      const u = new URL(route.request().url());
      if (u.hostname === '127.0.0.1' || u.protocol === 'data:') return route.continue();
      const sdk = u.hostname === 'www.gstatic.com' && u.pathname.match(/^\/firebasejs\/([\d.]+)\/(firebase-[a-z]+\.js)$/);
      if (sdk && sdk[1] === VERSION_FIREBASE && fs.existsSync(path.join(SDK_LOCAL, sdk[2]))) {
        return route.fulfill({ contentType: 'text/javascript; charset=utf-8', body: fs.readFileSync(path.join(SDK_LOCAL, sdk[2])) });
      }
      ctx.requetesExternes.push(route.request().url());
      return route.abort();
    });
    if (cfg) {
      await c.route('**/data/config.json', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify(cfg) }));
    }
    // Espion de stockage : toute écriture dans localStorage / sessionStorage est notée (remarque 1 : plus aucun réglage mémorisé).
    await c.addInitScript(() => {
      window.__ecritures = [];
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function setItem(cle, valeur) { window.__ecritures.push(String(cle)); return original.call(this, cle, valeur); };
    });
    if (init) await c.addInitScript(init);
    const page = await c.newPage();
    page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) ctx.problemes.push(`console ${m.type()} sur ${chemin} : ${m.text()}`); });
    page.on('pageerror', (e) => ctx.problemes.push(`exception sur ${chemin} : ${e.message}`));
    // Une requête locale annulée (ERR_ABORTED) est une connexion longue de l'émulateur coupée à la fermeture de la page
    // (écoute Firebase en cours) : sans gravité, et sinon le test est instable. Toute autre requête échouée est relevée.
    page.on('requestfailed', (r) => {
      const local = new URL(r.url()).hostname === '127.0.0.1';
      if (local && r.failure()?.errorText === 'net::ERR_ABORTED') return;
      ctx.problemes.push(`requête échouée sur ${chemin} : ${r.url()} ${r.failure()?.errorText}`);
    });
    page.on('response', (r) => { if (r.status() >= 400) ctx.problemes.push(`HTTP ${r.status()} sur ${chemin} : ${r.url()}`); });
    page.on('request', (r) => { if (/\.woff2?($|\?)/.test(r.url())) ctx.polices.add(path.basename(new URL(r.url()).pathname)); });
    await page.goto(url.toString());
    await page.waitForSelector('#ecran > *, #demo-liste > *', { timeout: 5000 });
    return page;
  };
  // Une page quittée ou fermée avant la fin de ses polices annule ces requêtes (ERR_ABORTED).
  ctx.attendreChargement = (page) => page.evaluate(async () => {
    document.body.getBoundingClientRect(); // force la mise en page, qui lance le chargement des polices
    await document.fonts.ready;
  });
  ctx.fermer = async (page) => { await ctx.attendreChargement(page); await page.context().close(); };
  ctx.finAnimations = async (page) => {
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(document.getAnimations().filter((a) => a.effect.getComputedTiming().iterations !== Infinity).map((a) => a.finished));
    });
  };
  // Texte réellement affiché, SANS la transformation en capitales (textContent des nœuds visibles).
  ctx.texteVisible = (page) => page.evaluate(() => {
    const sorties = [];
    const marcheur = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = marcheur.nextNode())) {
      const p = n.parentElement;
      if (!n.textContent.trim() || !p || p.closest('script, style, noscript, svg')) continue;
      if (p.getClientRects().length === 0 || getComputedStyle(p).visibility === 'hidden') continue;
      sorties.push(n.textContent.trim());
    }
    return sorties.join('\n');
  });
  ctx.capture = (page, nom, options = {}) => page.screenshot({ path: path.join(CAPTURES, `${nom.replace(/[^\w-]+/g, '_')}.png`), ...options });
  // Contraste mesuré sur les pixels : renvoie la liste { texte, ratio, taille, gras, desactive, classe }.
  ctx.contrastes = async (page) => {
    const largeur = page.viewportSize().width;
    const hauteurPage = await page.evaluate(() => document.documentElement.scrollHeight);
    await page.setViewportSize({ width: largeur, height: Math.max(hauteurPage, 400) });
    await page.waitForTimeout(100);
    const textes = await page.evaluate(collecterTextes);
    await page.addStyleTag({ content: STYLE_FOND_SANS_TEXTE });
    const png = await page.screenshot({ fullPage: true });
    return ctx.pageCalcul.evaluate(calculerContrastes, { base64: png.toString('base64'), textes });
  };
  return ctx;
}

// Écrans de l'application (chemins relatifs à index.html), avec les nouveaux parcours « Créer » et « Rejoindre ».
const plusLongue = cartes.reduce((a, b) => (b.texte.length > a.texte.length ? b : a));
const durable = cartes.find((c) => c.duree);
const ECRANS = [
  ['accueil', '?ecran=accueil'],
  ['regles', '?ecran=regles'],
  ['creer', '?ecran=creer'],
  ['creer-code-choisi', '?ecran=creer&code=ONYX'],
  ['rejoindre', '?ecran=rejoindre'],
  ['rejoindre-code-saisi', '?ecran=rejoindre&code=%C3%A9lixir'],
  ['rejoindre-erreur-vide', '?ecran=rejoindre&erreur=vide'],
  ['rejoindre-erreur-inconnu', '?ecran=rejoindre&code=DRAGON&erreur=inconnu'],
  ['salle-hote-1-autre', '?ecran=salle&hote=1&autres=1'],
  ['salle-hote-pret', '?ecran=salle&hote=1&autres=1&prenom=Noa&embleme=sirene&pret=1'],
  ['salle-rejoint', '?ecran=salle&autres=2'],
  ['salle-hote-seul', '?ecran=salle&hote=1&autres=0'],
  ['salle-derniere-place', `?ecran=salle&autres=${config.joueursMax - 1}`],
  ['salle-complete', '?ecran=salle&complete=1'],
  ['salle-hors-ligne', '?ecran=salle&hote=1&autres=2&absent=1'],
  ['salle-code-long-prenom-long', `?ecran=salle&code=OBSIDIENNE&autres=2&prenom=${'W'.repeat(40)}&embleme=loup-garou`],
  ['choix-tour-1', '?ecran=choix&tour=1'],
  ['choix-dernier-tour', `?ecran=choix&tour=${config.tours}`],
  ['carte-epreuve', '?ecran=carte&type=epreuve'],
  ['carte-revelation', '?ecran=carte&type=revelation'],
  ['carte-durable', `?ecran=carte&carte=${durable.id}&tour=2`],
  ['carte-la-plus-longue', `?ecran=carte&carte=${plusLongue.id}`],
  ['attente-epreuve', '?ecran=attente&type=epreuve&tour=2'],
  ['attente-revelation', '?ecran=attente&type=revelation&tour=2'],
  ['attente-durable', `?ecran=attente&carte=${durable.id}&tour=2`],
  ['attente-sans-effets', '?ecran=attente&type=revelation&effets=0'],
  ['attente-prenom-long', `?ecran=attente&type=epreuve&prenom=${'M'.repeat(45)}`],
  ['attente-sans-carte', '?ecran=attente&etape=choix&tour=2'],
  ['choix-effets', '?ecran=choix&tour=2&effets=1'],
  ['carte-effets', '?ecran=carte&type=epreuve&tour=2&effets=1'],
  ['transition-jete', '?ecran=transition'],
  ['attente-hors-ligne', `?ecran=attente&carte=${durable.id}&tour=2&absent=1`],
  ['attente-hors-ligne-prenom-long', `?ecran=attente&type=epreuve&absent=1&prenom=${'M'.repeat(45)}`],
  ['transition-bouclier', '?ecran=transition&bouclier=1'],
  ['transition-passe', '?ecran=transition&passe=1'],
  ['fin', '?ecran=fin'],
];

module.exports = {
  RACINE, PUBLIC, CAPTURES, raisonSaut, config, cartes, codes, emblemes, LARGEURS, plusLongue, durable, ECRANS,
  contexte, STYLE_FOND_SANS_TEXTE,
  mesurerDebordements, mesurerCarte, mesurerCibles, mesurerPolices, collecterTextes, calculerContrastes,
};
