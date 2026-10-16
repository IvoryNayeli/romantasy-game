'use strict';

// Phase 2 : tests dans un vrai navigateur (Chrome piloté par playwright-core), écrits par le testeur.
// Ce qui est mesuré à l'écran : débordement de texte, taille des boutons, taille du texte des cartes,
// contrastes réels (pixels), polices réellement utilisées, requêtes externes, animations, parcours.
//
// Prérequis : `npm install` (playwright-core, version compatible Node 18) et Google Chrome.
// Variables facultatives : CHROME_PATH (chemin de Chrome), CAPTURES_DIR (dossier des captures d'écran,
// par défaut un dossier temporaire hors du dépôt).
// Sans playwright-core ou sans Chrome, tous les tests de ce fichier sont SAUTÉS avec un message clair.
// Sécurité : le serveur écoute uniquement sur 127.0.0.1 et toute requête vers une autre adresse est bloquée
// et signalée comme défaut. Aucun accès réseau externe, aucun Firebase.

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');

const RACINE = path.join(__dirname, '..');
const PUBLIC = path.join(RACINE, 'public');
const CAPTURES = process.env.CAPTURES_DIR || path.join(os.tmpdir(), 'romantasy-captures');

/* ---------- Détection des prérequis ---------- */
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

const config = JSON.parse(fs.readFileSync(path.join(PUBLIC, 'data', 'config.json'), 'utf8'));
const cartes = JSON.parse(fs.readFileSync(path.join(PUBLIC, 'data', 'cartes.json'), 'utf8'));
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

/* ---------- Mesures dans la page ---------- */
// Fonction exécutée dans la page : renvoie la liste des débordements et des textes tronqués.
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
  // Éléments qui dépassent de leur propre boîte (texte plus large que le conteneur)
  for (const el of document.querySelectorAll('body *')) {
    if (!visible(el) || el.closest('svg, noscript, .etincelles') || el.tagName === 'INPUT') continue;
    const s = getComputedStyle(el);
    if (['hidden', 'clip'].includes(s.overflowX) && el.scrollWidth > el.clientWidth + 1) {
      problemes.push(`${nom(el)} : scrollWidth ${el.scrollWidth} > clientWidth ${el.clientWidth}`);
    }
    if (['hidden', 'clip'].includes(s.overflowY) && el.scrollHeight > el.clientHeight + 1 && el !== document.body) {
      problemes.push(`${nom(el)} : scrollHeight ${el.scrollHeight} > clientHeight ${el.clientHeight}`);
    }
    const r = el.getBoundingClientRect();
    if (el.closest('main, header') && (r.right > L + 0.5 || r.left < -0.5) && !el.closest('.etincelles')) {
      problemes.push(`${nom(el)} dépasse de l'écran : x=${r.left.toFixed(0)}..${r.right.toFixed(0)}`);
    }
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
      texte: (el.innerText || el.getAttribute('aria-label') || el.value || '').trim().slice(0, 30),
      h: r.height, l: r.width, desactive: el.disabled === true,
    };
  });
}

// Tailles de police du texte des cartes et textes lus.
function mesurerPolices() {
  const taille = (sel) => [...document.querySelectorAll(sel)].map((e) => parseFloat(getComputedStyle(e).fontSize));
  return {
    carte: taille('.carte-texte'),
    corps: taille('.texte, .code-partie, .accueil-salut, .carte-texte, .bandeau-texte, .effets-texte, .attente-message, .transition-texte'),
    petits: [...document.querySelectorAll('body *')].filter((e) => {
      const direct = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      const s = getComputedStyle(e);
      return direct && s.display !== 'none' && e.getBoundingClientRect().width > 0 && parseFloat(s.fontSize) < 16
        && !e.closest('noscript');
    }).map((e) => `${e.className || e.tagName} ${getComputedStyle(e).fontSize} « ${e.textContent.trim().slice(0, 25)} »`),
  };
}

// Textes (nœuds) avec leur couleur effective et leurs rectangles, pour mesurer le contraste sur les pixels.
function collecterTextes() {
  const sorties = [];
  const marcheur = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let noeud;
  while ((noeud = marcheur.nextNode())) {
    const t = noeud.textContent.trim();
    const parent = noeud.parentElement;
    if (!t || !parent || parent.closest('noscript, script, style, svg, .embleme, .embleme-emoji')) continue;
    const s = getComputedStyle(parent);
    const r0 = parent.getBoundingClientRect();
    if (s.visibility === 'hidden' || s.display === 'none' || r0.width === 0) continue;
    let opacite = 1;
    for (let a = parent; a; a = a.parentElement) opacite *= parseFloat(getComputedStyle(a).opacity);
    const plage = document.createRange();
    plage.selectNodeContents(noeud);
    const rects = [...plage.getClientRects()].filter((r) => r.width > 1 && r.height > 1)
      .map((r) => ({ x: r.left, y: r.top + window.scrollY, w: r.width, h: r.height }));
    const m = s.color.match(/[\d.]+/g).map(Number);
    sorties.push({
      texte: t.slice(0, 40), couleur: [m[0], m[1], m[2], (m.length > 3 ? m[3] : 1) * opacite],
      taille: parseFloat(s.fontSize), gras: parseInt(s.fontWeight, 10) >= 700, rects,
      desactive: Boolean(parent.closest('button:disabled')),
      classe: String(parent.className),
    });
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

/* ---------- Contexte partagé ---------- */
describe('navigateur : écrans, design et parcours (Chrome local)', { skip: raisonSaut || false }, () => {
  let serveur; let base; let navigateur; let pageCalcul;
  const problemes = []; // erreurs de console, requêtes externes, 404 : relevés sur toutes les pages visitées
  const requetesExternes = [];
  const polices = new Set();

  before(async () => {
    fs.mkdirSync(CAPTURES, { recursive: true });
    serveur = await demarrerServeur();
    base = `http://127.0.0.1:${serveur.address().port}`;
    navigateur = await chromium.launch({
      executablePath: CHROME, headless: true, args: ['--no-sandbox', '--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1'],
    });
    const ctxCalcul = await navigateur.newContext();
    pageCalcul = await ctxCalcul.newPage();
    await pageCalcul.goto('about:blank');
  });
  after(async () => {
    if (navigateur) await navigateur.close();
    if (serveur) serveur.close();
  });

  // Ouvre une page avec relevé des problèmes. Refuse toute adresse non locale.
  async function ouvrir(chemin, { largeur = 360, hauteur = 800, reduit = null, config: cfg = null, init = null, couleur = 'dark' } = {}) {
    const url = new URL(chemin, `${base}/`);
    assert.equal(url.hostname, '127.0.0.1', `adresse non locale refusée : ${url}`);
    const ctx = await navigateur.newContext({
      viewport: { width: largeur, height: hauteur }, deviceScaleFactor: 1, hasTouch: true, isMobile: false,
      reducedMotion: reduit === true ? 'reduce' : 'no-preference', locale: 'fr-FR', colorScheme: couleur,
    });
    await ctx.route('**/*', (route) => {
      const u = new URL(route.request().url());
      if (u.hostname === '127.0.0.1' || u.protocol === 'data:') return route.continue();
      requetesExternes.push(route.request().url());
      return route.abort();
    });
    if (cfg) {
      await ctx.route('**/data/config.json', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify(cfg) }));
    }
    if (init) await ctx.addInitScript(init);
    const page = await ctx.newPage();
    page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) problemes.push(`console ${m.type()} sur ${chemin} : ${m.text()}`); });
    page.on('pageerror', (e) => problemes.push(`exception sur ${chemin} : ${e.message}`));
    page.on('requestfailed', (r) => problemes.push(`requête échouée sur ${chemin} : ${r.url()} ${r.failure()?.errorText}`));
    page.on('response', (r) => { if (r.status() >= 400) problemes.push(`HTTP ${r.status()} sur ${chemin} : ${r.url()}`); });
    page.on('request', (r) => { if (/\.woff2?($|\?)/.test(r.url())) polices.add(path.basename(new URL(r.url()).pathname)); });
    await page.goto(url.toString());
    await page.waitForSelector('#ecran > *, #demo-liste > *', { timeout: 5000 });
    return page;
  }
  const fermer = (page) => page.context().close();
  async function finAnimations(page) {
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(document.getAnimations().filter((a) => a.effect.getComputedTiming().iterations !== Infinity).map((a) => a.finished));
    });
  }
  const texteVisible = (page) => page.evaluate(() => document.body.innerText);
  const nomFichier = (s) => s.replace(/[^\w-]+/g, '_');

  /* Écrans testés : chemin + libellé */
  const plusLongue = cartes.reduce((a, b) => (b.texte.length > a.texte.length ? b : a));
  const durable = cartes.find((c) => c.duree);
  const ECRANS = [
    ['accueil', '?ecran=accueil'],
    ['regles', '?ecran=regles'],
    ['salle-hote-1-autre', '?ecran=salle&hote=1&autres=1'],
    ['salle-hote-pret', '?ecran=salle&hote=1&autres=1&prenom=Noa&embleme=sirene&pret=1'],
    ['salle-rejoint', '?ecran=salle&autres=2'],
    ['salle-hote-seul', '?ecran=salle&hote=1&autres=0'],
    ['salle-derniere-place', `?ecran=salle&autres=${config.joueursMax - 1}`],
    ['salle-complete', '?ecran=salle&complete=1'],
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
    ['transition-jete', '?ecran=transition'],
    ['transition-bouclier', '?ecran=transition&bouclier=1'],
    ['fin', '?ecran=fin'],
  ];

  /* ============ 1. Captures d'écran, débordement, boutons, tailles ============ */
  for (const largeur of LARGEURS) {
    it(`captures + débordement + cibles tactiles : ${ECRANS.length} écrans à ${largeur} px`, async () => {
      const defauts = [];
      for (const [nom, chemin] of ECRANS) {
        const page = await ouvrir(`index.html${chemin}`, { largeur, hauteur: 800 });
        await finAnimations(page);
        await page.screenshot({ path: path.join(CAPTURES, `${nomFichier(nom)}-${largeur}.png`), fullPage: true });
        for (const p of await page.evaluate(mesurerDebordements)) defauts.push(`[${nom} ${largeur}] ${p}`);
        for (const c of await page.evaluate(mesurerCibles)) {
          if (c.h < 47.5 || c.l < 47.5) defauts.push(`[${nom} ${largeur}] cible trop petite : ${c.nom} « ${c.texte} » ${c.l.toFixed(1)}x${c.h.toFixed(1)}`);
        }
        const pol = await page.evaluate(mesurerPolices);
        for (const t of pol.carte) if (t < 20) defauts.push(`[${nom} ${largeur}] texte de carte ${t}px < 20px`);
        for (const t of pol.corps) if (t < 20) defauts.push(`[${nom} ${largeur}] texte ${t}px < 20px`);
        await fermer(page);
      }
      assert.deepEqual(defauts, []);
    });
  }

  for (const largeur of LARGEURS) {
    it(`les 40 cartes : écran « carte » et écran « attente » sans débordement à ${largeur} px, texte >= 20 px, boutons visibles`, async () => {
      const defauts = [];
      let vues = 0;
      let page = null;
      for (const c of cartes) {
        for (const ecran of ['carte', 'attente']) {
          const adresseCarte = `index.html?ecran=${ecran}&carte=${c.id}&tour=2`;
          if (!page) page = await ouvrir(adresseCarte, { largeur, hauteur: 740, reduit: true });
          else { await page.goto(new URL(adresseCarte, `${base}/`).toString()); await page.waitForSelector('#ecran > *'); }
          await finAnimations(page);
          const texteAffiche = await page.locator('.carte-texte').innerText();
          if (texteAffiche.replace(/\s+/g, ' ').trim() !== c.texte.replace(/\s+/g, ' ').trim()) {
            defauts.push(`[${c.id} ${ecran}] texte affiché différent de cartes.json`);
          }
          for (const p of await page.evaluate(mesurerDebordements)) defauts.push(`[${c.id} ${ecran} ${largeur}] ${p}`);
          const pol = await page.evaluate(mesurerPolices);
          if (!pol.carte.length || pol.carte.some((t) => t < 20)) defauts.push(`[${c.id} ${ecran}] texte de carte < 20px (${pol.carte})`);
          if (c.effet) {
            const bandeau = await page.locator('.bandeau-texte, .effets-texte').allInnerTexts();
            if (!bandeau.some((t) => t.includes(c.effet))) defauts.push(`[${c.id} ${ecran}] effet durable « ${c.effet} » absent`);
          }
          if (ecran === 'carte') {
            // Les deux boutons sont atteignables : en bas de page, ils ne masquent pas le texte de la carte.
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            const geo = await page.evaluate(() => {
              const barre = document.querySelector('.barre-bas').getBoundingClientRect();
              const carte = document.querySelector('.carte-face').getBoundingClientRect();
              const boutons = [...document.querySelectorAll('.barre-bas .bouton')].map((b) => b.getBoundingClientRect());
              return { barreHaut: barre.top, carteBas: carte.bottom, boutons: boutons.map((b) => [b.top, b.bottom]), H: innerHeight };
            });
            if (geo.carteBas > geo.barreHaut + 1) defauts.push(`[${c.id} ${largeur}] bas de carte masqué par la barre de boutons en fin de défilement (${geo.carteBas.toFixed(0)} > ${geo.barreHaut.toFixed(0)})`);
            if (geo.boutons.some(([t, b]) => t < 0 || b > geo.H + 0.5)) defauts.push(`[${c.id} ${largeur}] bouton hors de la fenêtre en fin de défilement`);
          }
          vues += 1;
          if (c.id === plusLongue.id || c.id === 'epr-06') {
            await page.screenshot({ path: path.join(CAPTURES, `carte-${ecran}-${c.id}-${largeur}.png`), fullPage: true });
          }
        }
      }
      await fermer(page);
      assert.equal(vues, cartes.length * 2);
      assert.deepEqual(defauts, []);
    });
  }

  it('petit téléphone (360 x 640) : la carte la plus longue reste lisible et les boutons restent atteignables', async () => {
    const page = await ouvrir(`index.html?ecran=carte&carte=${plusLongue.id}`, { largeur: 360, hauteur: 640 });
    await finAnimations(page);
    await page.screenshot({ path: path.join(CAPTURES, `carte-longue-360x640.png`), fullPage: false });
    const defauts = await page.evaluate(mesurerDebordements);
    await page.locator('.barre-bas .bouton-principal').scrollIntoViewIfNeeded();
    const b = await page.locator('.barre-bas .bouton').first().boundingBox();
    assert.ok(b && b.y >= 0 && b.y + b.height <= 640, 'bouton principal hors fenêtre');
    assert.deepEqual(defauts, []);
    await fermer(page);
  });

  /* ============ 2. Contrastes réels ============ */
  it('contrastes mesurés sur les pixels rendus : texte >= 4,5:1 (3:1 pour le grand texte), 360 et 412 px', async () => {
    const defauts = []; const resume = [];
    for (const largeur of LARGEURS) {
      for (const [nom, chemin] of ECRANS) {
        const page = await ouvrir(`index.html${chemin}`, { largeur, hauteur: 800, reduit: true });
        // Fenêtre assez haute pour tout voir sans défilement, puis texte masqué pour lire le fond.
        const hauteurPage = await page.evaluate(() => document.documentElement.scrollHeight);
        await page.setViewportSize({ width: largeur, height: Math.max(hauteurPage, 400) });
        await page.waitForTimeout(100);
        const textes = await page.evaluate(collecterTextes);
        await page.addStyleTag({ content: '* { color: transparent !important; text-shadow: none !important; caret-color: transparent !important; } input::placeholder { color: transparent !important; } .etincelles { display: none !important; }' });
        const png = await page.screenshot({ fullPage: true });
        const res = await pageCalcul.evaluate(calculerContrastes, { base64: png.toString('base64'), textes });
        for (const r of res) {
          if (r.desactive || !Number.isFinite(r.ratio)) continue;
          const grand = r.taille >= 24 || (r.taille >= 18.66 && r.gras);
          const seuil = grand ? 3 : 4.5;
          resume.push(r.ratio);
          if (r.ratio < seuil) defauts.push(`[${nom} ${largeur}] contraste ${r.ratio.toFixed(2)} < ${seuil} : « ${r.texte} » (${r.classe}, ${r.taille}px)`);
        }
        await fermer(page);
      }
    }
    console.log(`# contraste réel minimal relevé : ${Math.min(...resume).toFixed(2)}:1 sur ${resume.length} textes`);
    assert.deepEqual(defauts, []);
  });

  it('contrastes : textes de la fenêtre de confirmation du bouclier', async () => {
    const page = await ouvrir('index.html?ecran=carte&type=epreuve', { reduit: true });
    await page.getByRole('button', { name: /Invoquer un bouclier/ }).click();
    assert.ok(await page.locator('dialog[open]').count(), 'la fenêtre de confirmation ne s\'ouvre pas');
    const cibles = await page.evaluate(mesurerCibles);
    const dansDialogue = cibles.filter((c) => /Invoquer|Annuler/.test(c.texte));
    assert.ok(dansDialogue.length >= 2);
    for (const c of dansDialogue) assert.ok(c.h >= 47.5, `bouton ${c.texte} ${c.h}px`);
    const textes = await page.evaluate(collecterTextes);
    const dlg = textes.filter((t) => /Invoquer un bouclier \?|Annuler|^Invoquer$/.test(t.texte));
    await page.addStyleTag({ content: '* { color: transparent !important; text-shadow: none !important; }' });
    const png = await page.screenshot();
    await page.evaluate(() => {}); // page inchangée
    const res = await pageCalcul.evaluate(calculerContrastes, { base64: png.toString('base64'), textes: dlg });
    await fermer(page);
    for (const r of res) assert.ok(r.ratio >= 4.5, `contraste ${r.ratio.toFixed(2)} pour « ${r.texte} »`);
  });

  /* ============ 3. Polices, requêtes externes ============ */
  it('polices hébergées réellement chargées et utilisées (Cinzel, Cormorant Garamond), aucune requête externe', async () => {
    const page = await ouvrir('index.html?ecran=carte&type=epreuve', { largeur: 412 });
    await finAnimations(page);
    const etat = await page.evaluate(async () => {
      await document.fonts.ready;
      return [...document.fonts].map((f) => `${f.family}|${f.weight}|${f.style}|${f.status}`);
    });
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
    const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
    const police = async (sel) => {
      const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: sel });
      const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
      return fonts.map((f) => `${f.familyName}${f.isCustomFont ? ' (hébergée)' : ' (système)'}`);
    };
    const rendu = {
      bouton: await police('.barre-bas .bouton'), carteTexte: await police('.carte-texte'),
      entete: await police('.carte-entete span'), compteur: await police('.compteur'),
    };
    for (const sel of ['bouton', 'entete', 'compteur']) {
      assert.ok(rendu[sel].some((f) => /^Cinzel.*\(hébergée\)/.test(f)), `${sel} : Cinzel hébergée attendue, obtenu ${rendu[sel]}`);
    }
    assert.ok(rendu.carteTexte.some((f) => /^Cormorant Garamond.*\(hébergée\)/.test(f)), `texte de carte : ${rendu.carteTexte}`);
    assert.ok(etat.length >= 6 && etat.every((e) => !/\|error$/.test(e)) && etat.some((e) => /loaded$/.test(e)), `FontFace : ${etat}`);
    const demandes = [...polices];
    assert.ok(demandes.every((p) => /^(Cinzel|CormorantGaramond)-/.test(p)), `fichiers de police : ${demandes}`);
    await fermer(page);
    assert.deepEqual(requetesExternes, [], 'requêtes vers des adresses non locales');
    // Chaque graisse utilisée par un écran est bien chargée (italique de l'accueil, gras du bandeau d'effet).
    const accueil = await ouvrir('index.html?ecran=accueil');
    const etatAccueil = await accueil.evaluate(async () => { await document.fonts.ready; return [...document.fonts].map((f) => `${f.family}|${f.weight}|${f.style}|${f.status}`); });
    assert.ok(etatAccueil.includes('Cormorant Garamond|500|italic|loaded'), `italique de l'accueil non chargé : ${etatAccueil}`);
    await fermer(accueil);
    const durableP = await ouvrir(`index.html?ecran=carte&carte=${durable.id}`);
    const etatDurable = await durableP.evaluate(async () => { await document.fonts.ready; return [...document.fonts].map((f) => `${f.family}|${f.weight}|${f.style}|${f.status}`); });
    assert.ok(etatDurable.includes('Cormorant Garamond|700|normal|loaded'), `gras du bandeau non chargé : ${etatDurable}`);
    await fermer(durableP);
  });

  it('aucune requête vers une adresse non locale sur tout le parcours et la page de démonstration', async () => {
    const avant = requetesExternes.length;
    const page = await ouvrir('demo.html');
    await finAnimations(page);
    await fermer(page);
    const page2 = await ouvrir('index.html');
    await page2.getByRole('link', { name: 'Comment ça marche ?' }).click();
    await fermer(page2);
    assert.deepEqual(requetesExternes.slice(avant), []);
    assert.deepEqual(requetesExternes, []);
  });

  /* ============ 4. Animations ============ */
  const ANIMATIONS_PAR_ECRAN = [
    ['accueil', 'index.html?ecran=accueil', ['.etincelles::before']],
    ['choix', 'index.html?ecran=choix', ['.dos-epreuve', '.dos-revelation']],
    ['carte', 'index.html?ecran=carte&type=epreuve', ['.carte-3d', '.carte-face']],
    ['transition', 'index.html?ecran=transition', ['.transition-icone']],
  ];
  const nomsAnimation = (page, sel) => page.evaluate((s) => {
    const [el, pseudo] = s.split('::');
    const e = document.querySelector(el);
    // Animation réellement attachée à l'élément (ou à son pseudo-élément), pas seulement le nom calculé.
    const anims = document.getAnimations().filter((a) => a.effect && a.effect.target === e
      && (a.effect.pseudoElement || null) === (pseudo ? `::${pseudo}` : null));
    return anims.length ? anims.map((a) => a.animationName).join(',') : 'none';
  }, sel);

  it('animations complètes par défaut : retournement, lueur, étincelles, pulsation bien actifs', async () => {
    for (const [nom, url, sels] of ANIMATIONS_PAR_ECRAN) {
      const page = await ouvrir(url);
      for (const s of sels) assert.notEqual(await nomsAnimation(page, s), 'none', `${nom} ${s} : animation attendue`);
      const n = await page.evaluate(() => document.getAnimations().length);
      assert.ok(n > 0, `${nom} : aucune animation en cours alors que les animations sont complètes`);
      assert.equal(await page.evaluate(() => document.documentElement.dataset.animations), 'completes');
      assert.equal(await page.getByRole('button', { name: /Réduire les animations/ }).getAttribute('aria-pressed'), 'false');
      await fermer(page);
    }
  });

  it('« réduire les animations » manuel : le bouton coupe réellement toutes les animations, se mémorise et se désactive', async () => {
    for (const [nom, url, sels] of ANIMATIONS_PAR_ECRAN) {
      const page = await ouvrir(url);
      await page.getByRole('button', { name: /Réduire les animations/ }).click();
      assert.equal(await page.getByRole('button', { name: /Réduire les animations/ }).getAttribute('aria-pressed'), 'true');
      for (const s of sels) assert.equal(await nomsAnimation(page, s), 'none', `${nom} ${s} : animation encore active`);
      await page.waitForTimeout(150);
      const actives = await page.evaluate(() => document.getAnimations().map((a) => `${a.animationName || a.transitionProperty}`));
      assert.deepEqual(actives, [], `${nom} : animations encore actives après le clic`);
      // Changement d'écran puis rechargement : le réglage est conservé.
      await page.reload();
      await page.waitForSelector('#ecran > *');
      assert.equal(await page.evaluate(() => document.documentElement.dataset.animations), 'reduites', `${nom} : réglage perdu au rechargement`);
      assert.deepEqual(await page.evaluate(() => document.getAnimations().length), 0);
      // Désactivation du réglage
      await page.getByRole('button', { name: /Réduire les animations/ }).click();
      for (const s of sels) assert.notEqual(await nomsAnimation(page, s), 'none', `${nom} ${s} : animation non restaurée`);
      await fermer(page);
    }
  });

  it('« réduire les animations » : le réglage tient aussi à travers la navigation interne (parcours)', async () => {
    const page = await ouvrir('index.html?ecran=accueil');
    await page.getByRole('button', { name: /Réduire les animations/ }).click();
    await page.getByRole('link', { name: 'Comment ça marche ?' }).click();
    await page.getByRole('link', { name: 'Créer une partie' }).click();
    assert.equal(await page.evaluate(() => document.documentElement.dataset.animations), 'reduites');
    assert.equal(await page.evaluate(() => document.getAnimations().length), 0);
    await fermer(page);
  });

  it('prefers-reduced-motion du système : animations désactivées sans clic, bouton affiché comme activé, choix manuel prioritaire', async () => {
    for (const [nom, url, sels] of ANIMATIONS_PAR_ECRAN) {
      const page = await ouvrir(url, { reduit: true });
      assert.equal(await page.evaluate(() => document.documentElement.dataset.animations), 'reduites');
      assert.equal(await page.getByRole('button', { name: /Réduire les animations/ }).getAttribute('aria-pressed'), 'true');
      for (const s of sels) assert.equal(await nomsAnimation(page, s), 'none', `${nom} ${s}`);
      await page.waitForTimeout(150);
      assert.equal(await page.evaluate(() => document.getAnimations().length), 0, `${nom} : animations actives malgré prefers-reduced-motion`);
      await fermer(page);
    }
    // Le CSS seul (sans JavaScript) suit aussi prefers-reduced-motion.
    const page = await ouvrir('index.html?ecran=choix', { reduit: true });
    await page.evaluate(() => document.documentElement.removeAttribute('data-animations'));
    assert.equal(await nomsAnimation(page, '.dos-epreuve'), 'none', 'CSS : prefers-reduced-motion ignoré quand data-animations est absent');
    await fermer(page);
  });

  it('transition automatique de 2 secondes conservée même sans animation', async () => {
    const page = await ouvrir('index.html?ecran=transition&auto=1&tour=1', { reduit: true });
    const t0 = Date.now();
    await page.waitForSelector('.ecran-choix', { timeout: 4000 });
    const duree = Date.now() - t0;
    assert.ok(duree >= 1700 && duree <= 2800, `durée de la transition : ${duree} ms`);
    assert.equal(await page.locator('.compteur').innerText(), `Tour 2 / ${config.tours}`);
    await fermer(page);
  });

  /* ============ 5. Parcours complet ============ */
  it('parcours complet : accueil, règles, création, salle, tous les tours, fin, nouvelle quête', async () => {
    const page = await ouvrir('index.html', { largeur: 360 });
    assert.match(await page.locator('.accueil-salut').innerText(), /Bienvenue, voyageur\(euse\)\./);
    assert.equal(await page.getByRole('link').count(), 1, 'l\'accueil ne doit contenir qu\'un bouton');
    assert.equal(await page.locator('h1').count(), 0, 'aucun titre sur l\'accueil');
    await page.getByRole('link', { name: 'Comment ça marche ?' }).click();
    assert.ok(await page.getByRole('heading', { name: 'But du jeu' }).isVisible());
    assert.ok(await page.getByRole('link', { name: 'Retour à l\'accueil' }).isVisible());
    assert.ok(await page.getByRole('link', { name: 'Rejoindre une partie' }).isVisible());
    await page.getByRole('link', { name: 'Créer une partie' }).click();
    // Salle d'attente : hôte, 1 autre personne
    assert.ok(await page.locator('.code-partie').isVisible());
    const bouton = page.getByRole('button', { name: 'Je suis prêt(e)' });
    assert.ok(await bouton.isDisabled(), 'prêt(e) doit être inactif sans prénom ni emblème');
    const commencer = page.getByRole('button', { name: 'Commencer la quête' });
    assert.ok(await commencer.isDisabled());
    await page.locator('#champ-prenom').fill('Robin');
    assert.ok(await bouton.isDisabled(), 'prêt(e) inactif sans emblème');
    // Emblème déjà pris grisé
    const pris = page.locator('.embleme-choix:disabled');
    assert.equal(await pris.count(), 1);
    await page.getByRole('radio', { name: /Dragon/ }).click();
    assert.equal(await page.getByRole('radio', { name: /Dragon/ }).getAttribute('aria-checked'), 'true');
    assert.ok(await bouton.isEnabled());
    await bouton.click();
    assert.ok(await commencer.isEnabled(), 'hôte prêt(e) + 1 autre : commencer doit être actif');
    await page.screenshot({ path: path.join(CAPTURES, 'parcours-salle-360.png'), fullPage: true });
    await commencer.click();
    for (let tour = 1; tour <= config.tours; tour += 1) {
      assert.equal(await page.locator('.compteur').innerText(), `Tour ${tour} / ${config.tours}`);
      assert.ok(await page.getByRole('heading', { name: 'À toi de jouer !' }).isVisible());
      assert.equal(await page.locator('.dos').count(), 2);
      await page.locator(tour % 2 ? '.dos-epreuve' : '.dos-revelation').click();
      assert.ok(await page.locator('.carte-texte').isVisible());
      assert.equal(await page.locator('.compteur').innerText(), `Tour ${tour} / ${config.tours}`);
      if (tour === 2) {
        // bouclier : confirmation puis annulation
        await page.getByRole('button', { name: 'Invoquer un bouclier' }).click();
        assert.match(await page.locator('dialog[open] .dialogue-texte').innerText(), /Invoquer un bouclier \? Ton tour sera tout de même compté\./);
        await page.getByRole('button', { name: 'Annuler' }).click();
        assert.equal(await page.locator('dialog[open]').count(), 0);
        await page.getByRole('button', { name: 'Invoquer un bouclier' }).click();
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('dialog[open]').count(), 0, 'Échap doit fermer la confirmation');
        await page.getByRole('button', { name: 'Invoquer un bouclier' }).click();
        await page.locator('dialog[open]').getByRole('button', { name: 'Invoquer' }).click();
        assert.match(await page.locator('.transition-texte').innerText(), /a invoqué un bouclier\.$/);
      } else {
        await page.getByRole('link', { name: 'Le sort est jeté' }).click();
        assert.match(await page.locator('.transition-texte').innerText(), /^Le sort est jeté pour .+\.$/);
      }
      if (tour < config.tours) await page.waitForSelector('.ecran-choix', { timeout: 4000 });
    }
    await page.waitForSelector('.ecran-fin', { timeout: 4000 });
    assert.match(await page.locator('.accueil-salut').innerText(), /La quête s'achève\./);
    await page.screenshot({ path: path.join(CAPTURES, 'parcours-fin-360.png'), fullPage: true });
    await page.getByRole('link', { name: 'Nouvelle quête' }).click();
    assert.ok(await page.locator('.ecran-accueil').isVisible());
    // Bouton Précédent du navigateur
    await page.goBack();
    assert.ok(await page.locator('.ecran-fin').isVisible(), 'Précédent doit revenir à l\'écran de fin');
    await fermer(page);
  });

  it('parcours « rejoindre » : salle sans bouton « Commencer », limite de joueur(se)s et partie complète', async () => {
    const page = await ouvrir('index.html?ecran=regles');
    await page.getByRole('link', { name: 'Rejoindre une partie' }).click();
    assert.equal(await page.getByRole('button', { name: /copier|partager/i }).count(), 0, 'pas de bouton copier ni partager');
    assert.equal(await page.getByRole('button', { name: 'Commencer la quête' }).count(), 0, 'seul(e) l\'hôte voit « Commencer »');
    assert.equal(await page.locator('.joueur-ligne').count(), config.joueursMax);
    await fermer(page);
    const pleine = await ouvrir('index.html?ecran=salle&complete=1');
    assert.match(await pleine.locator('.avis-complete').innerText(), /^La partie est complète$/);
    assert.equal(await pleine.getByRole('button').filter({ hasNotText: /animations/ }).count(), 0);
    assert.equal(await pleine.locator('.joueur-ligne:not(.joueur-libre)').count(), config.joueursMax);
    await fermer(pleine);
    const seule = await ouvrir('index.html?ecran=salle&hote=1&autres=0');
    assert.ok(await seule.getByRole('button', { name: 'Commencer la quête' }).isDisabled());
    await seule.locator('#champ-prenom').fill('Ana');
    await seule.getByRole('radio', { name: /Fée/ }).click();
    await seule.getByRole('button', { name: 'Je suis prêt(e)' }).click();
    assert.ok(await seule.getByRole('button', { name: 'Commencer la quête' }).isDisabled(), 'une seule personne prête : commencer reste inactif');
    await fermer(seule);
  });

  it('paramètres d\'adresse hostiles ou absurdes : pas d\'erreur, pas d\'injection HTML, valeurs bornées', async () => {
    const hostile = encodeURIComponent('<img src=x onerror="window.__xss=1">');
    for (const url of [
      `index.html?ecran=salle&prenom=${hostile}&embleme=sirene&autres=2`,
      `index.html?ecran=attente&prenom=${hostile}`,
      `index.html?ecran=transition&prenom=${hostile}`,
      'index.html?ecran=inconnu', 'index.html?ecran=__proto__', 'index.html?ecran=constructor',
      'index.html?ecran=carte&carte=nexistepas&tour=999', 'index.html?ecran=choix&tour=-3', 'index.html?ecran=choix&tour=abc',
      'index.html?ecran=salle&autres=99', 'index.html?ecran=salle&autres=-4', 'index.html?ecran=salle&code=PIRATE&embleme=inconnu',
    ]) {
      const page = await ouvrir(url);
      assert.equal(await page.evaluate(() => window.__xss), undefined, `injection via ${url}`);
      assert.equal(await page.locator('img[src="x"]').count(), 0);
      const t = await texteVisible(page);
      assert.ok(t.length > 10, `écran vide pour ${url}`);
      assert.ok(!/undefined|NaN|\[object/.test(t), `texte douteux pour ${url} : ${t.slice(0, 80)}`);
      await fermer(page);
    }
    const p = await ouvrir('index.html?ecran=choix&tour=999');
    assert.equal(await p.locator('.compteur').innerText(), `Tour ${config.tours} / ${config.tours}`);
    await fermer(p);
    const q = await ouvrir('index.html?ecran=salle&autres=99');
    assert.equal(await q.locator('.joueur-ligne').count(), config.joueursMax);
    await fermer(q);
  });

  /* ============ 6. Réglages jamais en dur : on change config.json ============ */
  it('config.json pilote tout : 6 tours et 7 joueur(se)s maximum modifient l\'affichage partout', async () => {
    const cfg = { tours: 6, joueursMax: 7 };
    const choix = await ouvrir('index.html?ecran=choix&tour=6', { config: cfg });
    assert.equal(await choix.locator('.compteur').innerText(), 'Tour 6 / 6');
    await fermer(choix);
    const regles = await ouvrir('index.html?ecran=regles', { config: cfg });
    const t = await regles.locator('.ecran-regles').innerText();
    assert.match(t, /joué 6 fois/);
    assert.ok(!/joué 4 fois/.test(t));
    await fermer(regles);
    const salle = await ouvrir('index.html?ecran=salle&autres=6', { config: cfg });
    assert.equal(await salle.locator('.joueur-ligne').count(), 7);
    assert.equal(await salle.locator('.embleme-choix:disabled').count(), 6);
    await fermer(salle);
    const complete = await ouvrir('index.html?ecran=salle&complete=1', { config: cfg });
    assert.equal(await complete.locator('.joueur-ligne:not(.joueur-libre)').count(), 7);
    await fermer(complete);
    // Parcours entier avec 2 tours : la fin arrive après le 2e tour.
    const court = await ouvrir('index.html?ecran=choix&tour=1', { config: { tours: 2, joueursMax: 3 } });
    await court.locator('.dos-epreuve').click();
    await court.getByRole('link', { name: 'Le sort est jeté' }).click();
    await court.waitForSelector('.ecran-choix', { timeout: 4000 });
    assert.equal(await court.locator('.compteur').innerText(), 'Tour 2 / 2');
    await court.locator('.dos-epreuve').click();
    await court.getByRole('link', { name: 'Le sort est jeté' }).click();
    await court.waitForSelector('.ecran-fin', { timeout: 4000 });
    await fermer(court);
  });

  /* ============ 7. Textes affichés ============ */
  const FEMININ_INTERDIT = [
    [/\bjoueuses?\b/i, 'joueuse'], [/\belles?\b/i, 'elle'], [/\bcelles?\b/i, 'celle'],
    [/\bprêtes?\b/i, 'prête'], [/\bprêts?\b(?!\(e\))/i, 'prêt sans (e)'],
    [/\bchacune?\b(?!\()/i, 'chacun(e) sans parenthèse'], [/\bvoyageuses?\b/i, 'voyageuse'], [/\btoutes\b/i, 'toutes'],
    [/\bseule?s?\b(?!\()/i, 'seul(e) sans parenthèse'],
  ];
  it('textes affichés : écriture inclusive et vocabulaire « butin » (tous les écrans, tous les textes)', async () => {
    const defauts = [];
    const pages = [...ECRANS.map(([nom, c]) => [nom, `index.html${c}`]), ['demo', 'demo.html']];
    for (const [nom, url] of pages) {
      const page = await ouvrir(url);
      const t = await texteVisible(page);
      const aVerifier = nom.startsWith('carte') || nom.startsWith('attente') ? t.replace(/\n[^\n]*\n/g, '\n') : t;
      void aVerifier;
      // On vérifie le texte de l'interface sans le texte des cartes (validées en phase 1, vérifiées ailleurs).
      const interface_ = await page.evaluate(() => {
        const copie = document.body.cloneNode(true);
        copie.querySelectorAll('.carte-texte, .demo-carte').forEach((e) => e.remove());
        return copie.innerText;
      });
      for (const [re, lib] of FEMININ_INTERDIT) {
        if (re.test(interface_)) defauts.push(`[${nom}] forme non inclusive « ${lib} » : ${interface_.match(re)[0]}`);
      }
      if (/\b(poches?|sacs?)\b/i.test(interface_)) defauts.push(`[${nom}] vocabulaire « poche/sac » dans l'interface`);
      await fermer(page);
    }
    // Le mot « butin » est bien employé aux endroits attendus.
    const accueil = await ouvrir('index.html?ecran=accueil');
    assert.match(await texteVisible(accueil), /Récupérez votre butin/);
    await fermer(accueil);
    const regles = await ouvrir('index.html?ecran=regles');
    assert.match(await texteVisible(regles), /butin mystère/);
    await fermer(regles);
    assert.deepEqual(defauts, []);
  });

  it('textes affichés : accueil, règles et fin identiques à docs/regles.md (mot pour mot)', async () => {
    const regles = fs.readFileSync(path.join(RACINE, 'docs', 'regles.md'), 'utf8');
    const norm = (s) => s.replace(/\*+/g, '').replace(/\s+/g, ' ').trim();
    const source = norm(regles);
    const pages = { accueil: '?ecran=accueil', regles: '?ecran=regles', fin: '?ecran=fin', salle: '?ecran=salle&hote=1&autres=1' };
    const attendus = {
      accueil: ['Bienvenue, voyageur(euse).', 'Les Cours s\'agitent, les dragons s\'éveillent et le destin s\'apprête à battre ses cartes.',
        'Récupérez votre butin, choisissez votre emblème et laissez le sort décider du trésor qui sera le vôtre.', 'Comment ça marche ?'],
      regles: ['But du jeu', 'Déroulement', 'Invoquer un bouclier', 'Fin de la partie', 'Créer une partie', 'Rejoindre une partie'],
      fin: ['La quête s\'achève.', 'Le destin a rendu son verdict. Chacun(e) tient désormais entre ses mains le butin que le sort lui a réservé. Le moment est venu de le découvrir !', 'Nouvelle quête'],
      salle: ['Rassemblez votre troupe. La quête commencera quand l\'hôte donnera le signal.', 'Commencer la quête'],
    };
    for (const [nom, q] of Object.entries(pages)) {
      const page = await ouvrir(`index.html${q}`);
      const t = norm(await texteVisible(page));
      for (const phrase of attendus[nom]) {
        assert.ok(t.includes(norm(phrase)), `[${nom}] phrase absente de l'écran : ${phrase}`);
        assert.ok(source.includes(norm(phrase)) || ['Créer une partie', 'Rejoindre une partie'].includes(phrase), `[${nom}] phrase absente de regles.md : ${phrase}`);
      }
      await fermer(page);
    }
    // Paragraphes des règles : chaque paragraphe de regles.md (section « Comment ça marche ? ») figure à l'écran.
    const page = await ouvrir('index.html?ecran=regles');
    const ecran = norm(await texteVisible(page));
    const sectionDebut = regles.indexOf('## Écran « Comment ça marche ? »');
    const section = regles.slice(sectionDebut, regles.indexOf('## Cartes'));
    const paragraphes = section.split('\n').filter((l) => /^>|^- /.test(l.trim())).map((l) => norm(l.replace(/^>\s?/, '').replace(/^- /, '')))
      .filter((l) => l.length > 15);
    assert.ok(paragraphes.length >= 8);
    for (const p of paragraphes) {
      const attendu = p.replace('4 fois', `${config.tours} fois`);
      assert.ok(ecran.includes(attendu), `paragraphe de regles.md absent ou modifié à l'écran : ${p.slice(0, 70)}…`);
    }
    // Phrase des effets durables (validée), placée après la carte Épreuve et avant le bouclier.
    const effets = 'Certaines cartes Épreuve produisent un effet qui dure. Il prend fin dès qu\'il a provoqué un échange de butins.';
    assert.ok(ecran.indexOf(effets) > ecran.indexOf('Carte Épreuve (action)') && ecran.indexOf(effets) < ecran.indexOf('Invoquer un bouclier'));
    // Phrase refusée : ne doit pas apparaître.
    assert.ok(!/Terminez les échanges/.test(ecran));
    await fermer(page);
  });

  it('textes affichés : écrans de tour conformes (compteur, attente, transition, confirmation du bouclier)', async () => {
    const att = await ouvrir('index.html?ecran=attente&type=epreuve&tour=2');
    const t = await texteVisible(att);
    assert.match(t, /Tour 2 \/ \d+/);
    assert.match(t, /Au tour de\s+\S+/);
    assert.match(t, /En attente de Léa…/);
    assert.equal(await att.locator('.ecran-attente button, .ecran-attente a').count(), 0, 'l\'écran d\'attente ne doit avoir aucun bouton d\'action');
    assert.match(t, /Effets en cours/i);
    await fermer(att);
    const tr = await ouvrir('index.html?ecran=transition');
    assert.match(await texteVisible(tr), /Le sort est jeté pour Léa\./);
    await fermer(tr);
    const carte = await ouvrir('index.html?ecran=carte&type=revelation');
    assert.match(await carte.locator('.carte-entete').innerText(), /Révélation/);
    assert.equal(await carte.locator('.carte-entete svg use').getAttribute('href'), '#i-etoile');
    await fermer(carte);
    const ep = await ouvrir('index.html?ecran=carte&type=epreuve');
    assert.match(await ep.locator('.carte-entete').innerText(), /Épreuve/);
    assert.equal(await ep.locator('.carte-entete svg use').getAttribute('href'), '#i-epee');
    await fermer(ep);
  });

  /* ============ 8. demo.html ============ */
  it('demo.html : se charge, liste les 8 écrans et les 40 cartes, tous les liens ouvrent un écran sans erreur (360 px)', async () => {
    const page = await ouvrir('demo.html', { largeur: 360 });
    await page.screenshot({ path: path.join(CAPTURES, 'demo-360.png'), fullPage: true });
    const debord = await page.evaluate(mesurerDebordements);
    const liens = await page.evaluate(() => [...document.querySelectorAll('#demo-liste a.demo-lien')].map((a) => a.getAttribute('href')));
    const parcours = await page.evaluate(() => document.querySelector('a[href="index.html"]')?.textContent);
    assert.match(parcours, /Parcours complet/);
    assert.ok(liens.length >= 40 * 2 + 20, `trop peu de liens : ${liens.length}`);
    const nbCartes = await page.locator('.demo-carte').count();
    assert.equal(nbCartes, cartes.length);
    await fermer(page);
    assert.deepEqual(debord, []);
    const ecransVus = new Set(); const defauts = [];
    const ctxPage = await ouvrir('index.html', { largeur: 360 });
    for (const lien of [...new Set(liens)]) {
      await ctxPage.goto(new URL(lien, `${base}/`).toString());
      await ctxPage.waitForSelector('#ecran > *');
      const ecran = await ctxPage.evaluate(() => document.body.dataset.ecran);
      ecransVus.add(ecran);
      const t = await texteVisible(ctxPage);
      if (t.trim().length < 15) defauts.push(`écran vide : ${lien}`);
      if (/undefined|NaN|\[object|Impossible de charger/.test(t)) defauts.push(`texte douteux : ${lien}`);
    }
    await fermer(ctxPage);
    for (const e of ['accueil', 'regles', 'salle', 'choix', 'carte', 'attente', 'transition', 'fin']) {
      assert.ok(ecransVus.has(e), `demo.html n'ouvre jamais l'écran « ${e} »`);
    }
    assert.deepEqual(defauts, []);
  });

  it('demo.html : lisible sur 412 px, sans défilement horizontal', async () => {
    const page = await ouvrir('demo.html', { largeur: 412 });
    const debord = await page.evaluate(mesurerDebordements);
    await page.screenshot({ path: path.join(CAPTURES, 'demo-412.png'), fullPage: false });
    await fermer(page);
    assert.deepEqual(debord, []);
  });

  /* ============ 9. Page d'accueil : pas de défilement inutile, retournement, bandeau ============ */
  it('carte révélée : retournement 3D terminé, carte face visible et bandeau d\'effet pour les cartes durables', async () => {
    const page = await ouvrir(`index.html?ecran=carte&carte=${durable.id}&tour=2`, { largeur: 412 });
    await finAnimations(page);
    const m = await page.evaluate(() => {
      const f = document.querySelector('.carte-face').getBoundingClientRect();
      const d = getComputedStyle(document.querySelector('.carte-3d')).transform;
      return { w: f.width, h: f.height, transform: d, bandeau: document.querySelector('.bandeau-effet')?.innerText };
    });
    assert.ok(m.w > 300 && m.h > 150);
    assert.ok(m.transform === 'none' || /matrix3d\(1, 0, 0, 0, 0, 1, 0, 0|matrix\(1, 0, 0, 1/.test(m.transform), `rotation finale : ${m.transform}`);
    assert.ok(m.bandeau.includes(durable.effet), m.bandeau);
    await page.screenshot({ path: path.join(CAPTURES, `carte-durable-412.png`), fullPage: true });
    await fermer(page);
    // Pendant le retournement (début d'animation), la face est bien cachée puis révélée
    const p2 = await ouvrir('index.html?ecran=carte&type=epreuve', { largeur: 412 });
    const nom = await p2.evaluate(() => getComputedStyle(document.querySelector('.carte-3d')).animationName);
    assert.equal(nom, 'retournement');
    await fermer(p2);
  });

  it('accueil et fin : aucun défilement nécessaire sur 360 x 640 et bouton visible', async () => {
    for (const ecran of ['accueil', 'fin']) {
      const page = await ouvrir(`index.html?ecran=${ecran}`, { largeur: 360, hauteur: 640 });
      await finAnimations(page);
      const m = await page.evaluate(() => ({ sh: document.documentElement.scrollHeight, h: innerHeight, b: document.querySelector('.bouton').getBoundingClientRect().bottom }));
      assert.ok(m.sh <= m.h + 1, `${ecran} : défile (${m.sh} > ${m.h})`);
      assert.ok(m.b <= m.h, `${ecran} : bouton hors de la fenêtre`);
      await page.screenshot({ path: path.join(CAPTURES, `${ecran}-360x640.png`) });
      await fermer(page);
    }
  });

  it('règles : le dernier paragraphe n\'est jamais masqué par la barre de boutons fixée en bas, boutons toujours visibles', async () => {
    for (const largeur of LARGEURS) {
      const page = await ouvrir('index.html?ecran=regles', { largeur, hauteur: 640 });
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      const m = await page.evaluate(() => {
        const barre = document.querySelector('.barre-bas').getBoundingClientRect();
        const derniers = [...document.querySelectorAll('.regles-corps .texte')].pop().getBoundingClientRect();
        const b = [...document.querySelectorAll('.barre-bas .bouton')].map((x) => x.getBoundingClientRect());
        return { barre: barre.top, dernier: derniers.bottom, b: b.map((x) => [x.top, x.bottom]), H: innerHeight };
      });
      assert.ok(m.dernier <= m.barre + 1, `${largeur} : dernier paragraphe masqué (${m.dernier} > ${m.barre})`);
      assert.ok(m.b.every(([t, bt]) => t >= 0 && bt <= m.H), `${largeur} : boutons hors fenêtre`);
      // Les boutons sont fixés en bas même au début du défilement
      await page.evaluate(() => window.scrollTo(0, 0));
      const haut = await page.evaluate(() => document.querySelector('.barre-bas .bouton').getBoundingClientRect().bottom);
      assert.ok(haut <= 640, `${largeur} : boutons non fixés en bas au début`);
      await page.screenshot({ path: path.join(CAPTURES, `regles-bas-${largeur}x640.png`) });
      await fermer(page);
    }
  });

  /* ============ 10. Bilan : aucune erreur de console ============ */
  it('aucune erreur ni avertissement de console, aucune requête échouée ni 404, aucune requête externe sur toutes les pages visitées', () => {
    assert.deepEqual([...new Set(problemes)], []);
    assert.deepEqual(requetesExternes, []);
  });
});
