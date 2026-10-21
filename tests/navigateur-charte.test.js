'use strict';

// Phase 2 (itération 2) : conformité machine à docs/charte-graphique.md, mesurée dans Chrome (styles calculés,
// CSSOM, géométrie réelle). Écrit par le testeur. Les points qui ne se jugent qu'à l'œil sont dans le rapport.
//   §2 variables, §3 palette et interdits, §4 typographie, §5 formes, §6 cartes et dos, §7 boutons,
//   §8 fond / grain, §9 mouvement, §11 accessibilité, §12 « à ne pas faire ».
// Prérequis : `npm install` et Google Chrome (sinon tests sautés). Mesures et serveur : aide-navigateur.js.

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const A = require('./aide-navigateur');

const { cartes, ECRANS, LARGEURS, durable } = A;

/* ---------- Lecture de la charte et de la feuille de style (côté Node) ---------- */
const charte = fs.readFileSync(path.join(A.RACINE, 'docs', 'charte-graphique.md'), 'utf8');
const css = fs.readFileSync(path.join(A.PUBLIC, 'css', 'style.css'), 'utf8');
const html = fs.readFileSync(path.join(A.PUBLIC, 'index.html'), 'utf8');

function variablesDuBloc(texte) {
  const bloc = texte.match(/:root\s*\{([\s\S]*?)\n\}/);
  assert.ok(bloc, 'bloc :root introuvable');
  const variables = {};
  for (const m of bloc[1].replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    variables[m[1]] = m[2].trim().replace(/\s+/g, ' ').toLowerCase();
  }
  return variables;
}
const VARIABLES_CHARTE = variablesDuBloc(charte);
const PALETTE_HEX = ['060B1E', '0F1E4A', '3C5A8C', 'C9D8EE', '8FA6C8', 'F4F1E8', 'F0A35E', 'D9693A'];
const PALETTE_RGB = PALETTE_HEX.map((h) => [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)));
// Phase 7 (remarque 39) : bleus du logo, admis seulement sur le parchemin des règles (variables --parchemin-*).
const BLEUS_PARCHEMIN_HEX = ['0F253E', '08162A', '45627D'];
const BLEUS_PARCHEMIN_RGB = BLEUS_PARCHEMIN_HEX.map((h) => [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)));

/* ---------- Mesures dans la page ---------- */

// Inventaire de toutes les couleurs réellement appliquées (éléments, pseudo-éléments, fenêtre ouverte).
function inventaireCouleurs() {
  const sorties = []; const textes = []; const nonLus = [];
  const lire = (chaine) => {
    const r = [];
    for (const m of chaine.matchAll(/rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)/g)) {
      const a = m[4] === undefined ? 1 : (m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]));
      r.push([Math.round(m[1]), Math.round(m[2]), Math.round(m[3]), a]);
    }
    for (const m of chaine.matchAll(/color\(srgb\s+([\d.e-]+)\s+([\d.e-]+)\s+([\d.e-]+)(?:\s*\/\s*([\d.]+%?))?\s*\)/g)) {
      const a = m[4] === undefined ? 1 : (m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]));
      r.push([Math.round(m[1] * 255), Math.round(m[2] * 255), Math.round(m[3] * 255), a]);
    }
    if (/(oklab|oklch|lab\(|lch\(|hsl|hwb|color-mix|color\((?!srgb))/.test(chaine)) nonLus.push(chaine.slice(0, 80));
    return r;
  };
  const decrire = (el, pseudo) => `${el.tagName.toLowerCase()}${typeof el.className === 'string' && el.className ? `.${el.className.trim().replace(/\s+/g, '.')}` : ''}${pseudo || ''}`;
  const visible = (el, s) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden' && parseFloat(s.opacity) > 0;
  };
  const examiner = (el, pseudo) => {
    const s = getComputedStyle(el, pseudo || null);
    const ou = decrire(el, pseudo);
    const noter = (prop, valeur) => { for (const c of lire(valeur)) sorties.push({ ou, prop, rgb: c.slice(0, 3), a: c[3] }); };
    noter('color', s.color);
    noter('background-color', s.backgroundColor);
    noter('background-image', s.backgroundImage);
    noter('box-shadow', s.boxShadow);
    noter('text-shadow', s.textShadow);
    if (/drop-shadow/.test(s.filter)) sorties.push({ ou, prop: 'filter drop-shadow', rgb: [0, 0, 0], a: 1 });
    for (const cote of ['Top', 'Right', 'Bottom', 'Left']) {
      if (s[`border${cote}Style`] !== 'none' && parseFloat(s[`border${cote}Width`]) > 0) noter(`border-${cote}`, s[`border${cote}Color`]);
    }
    if (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) noter('outline', s.outlineColor);
    if (s.textDecorationLine !== 'none') noter('text-decoration', s.textDecorationColor);
    if (el instanceof SVGElement && el.tagName.toLowerCase() !== 'svg') {
      if (s.fill !== 'none') noter('fill', s.fill);
      if (s.stroke !== 'none') noter('stroke', s.stroke);
    }
    return s;
  };
  for (const el of document.querySelectorAll('html, body, body *')) {
    if (el.closest('.grain, noscript, script, style, defs, symbol, filter')) continue;
    const s = getComputedStyle(el);
    if (el !== document.body && el !== document.documentElement && !visible(el, s)) continue;
    // <html> garde la couleur de texte par défaut du navigateur (noir) mais ne porte aucun texte : le corps de page
    // (body.ciel) fixe la couleur. <use> : son fill par défaut est remplacé par celui de chaque symbole (vérifié en statique).
    if (el === document.documentElement || el.tagName.toLowerCase() === 'use') continue;
    examiner(el, null);
    const direct = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (direct && !(el instanceof SVGElement)) {
      for (const c of lire(s.color)) textes.push({ ou: decrire(el), rgb: c.slice(0, 3), a: c[3] });
    }
    if (el instanceof SVGElement && el.tagName.toLowerCase() !== 'svg') continue;
    for (const pseudo of ['::before', '::after']) {
      const sp = getComputedStyle(el, pseudo);
      if (['none', 'normal'].includes(sp.content)) continue;
      examiner(el, pseudo);
      if (!['""', "''"].includes(sp.content)) for (const c of lire(sp.color)) textes.push({ ou: decrire(el, pseudo), rgb: c.slice(0, 3), a: c[3] });
    }
    if (el.matches('.carte-texte')) {
      const sl = getComputedStyle(el, '::first-letter');
      for (const c of lire(sl.color)) { sorties.push({ ou: `${decrire(el)}::first-letter`, prop: 'color', rgb: c.slice(0, 3), a: c[3] }); textes.push({ ou: `${decrire(el)}::first-letter`, rgb: c.slice(0, 3), a: c[3] }); }
    }
    if (el.matches('dialog[open]')) {
      const sb = getComputedStyle(el, '::backdrop');
      for (const c of lire(sb.backgroundColor)) sorties.push({ ou: 'dialog::backdrop', prop: 'background-color', rgb: c.slice(0, 3), a: c[3] });
    }
  }
  return { sorties, textes, nonLus };
}

// Inventaire du mouvement : propriétés des @keyframes, transitions réellement déclarées, :hover, background fixed.
function inventaireMouvement() {
  const res = { keyframes: {}, selecteursHover: [], mediaHover: [], fixed: [], variables: [] };
  const parcourir = (regles) => {
    for (const r of regles) {
      if (r instanceof CSSKeyframesRule) {
        const props = new Set();
        for (const k of r.cssRules) for (let i = 0; i < k.style.length; i += 1) props.add(k.style[i]);
        res.keyframes[r.name] = [...props];
      } else if (r instanceof CSSStyleRule) {
        if (/:hover/.test(r.selectorText)) res.selecteursHover.push(r.selectorText);
        if (r.style.backgroundAttachment && r.style.backgroundAttachment.includes('fixed')) res.fixed.push(r.selectorText);
        for (let i = 0; i < r.style.length; i += 1) if (r.style[i].startsWith('--')) res.variables.push(r.style[i]);
      }
      if (r instanceof CSSMediaRule && /hover/.test(r.conditionText)) res.mediaHover.push(r.conditionText);
      if (r.cssRules && !(r instanceof CSSKeyframesRule)) parcourir(r.cssRules);
    }
  };
  for (const f of document.styleSheets) parcourir(f.cssRules);
  const transitions = new Set(); const animations = new Set(); const attachements = new Set();
  for (const el of document.querySelectorAll('html, body, body *')) {
    const s = getComputedStyle(el);
    const durees = s.transitionDuration.split(',').map((x) => parseFloat(x));
    // Phase 7 (remarque 51) : seul écart voulu, le cartouche du prénom s'élargit en douceur (transition de largeur).
    s.transitionProperty.split(',').forEach((p, i) => { if ((durees[i % durees.length] || 0) > 0) transitions.add(el.matches('.cartouche') && p.trim() === 'width' ? 'width (cartouche)' : p.trim()); });
    s.animationName.split(',').forEach((n) => { if (n.trim() !== 'none') animations.add(n.trim()); });
    s.backgroundAttachment.split(',').forEach((x) => attachements.add(x.trim()));
  }
  res.transitions = [...transitions]; res.animations = [...animations]; res.attachements = [...attachements];
  return res;
}

// Formes : tout rayon de bordure > 8 px (pilule, arche, cercle) sur un élément à boîte visible.
function mesurerFormes() {
  const defauts = []; const rayons = {};
  const noms = ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius'];
  for (const el of document.querySelectorAll('body *')) {
    if (el.closest('svg, .grain, noscript')) continue;
    for (const pseudo of [null, '::before', '::after']) {
      const s = getComputedStyle(el, pseudo);
      if (pseudo && ['none', 'normal'].includes(s.content)) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0 || parseFloat(s.opacity) === 0 || s.display === 'none') continue;
      const aBoite = (s.backgroundColor !== 'rgba(0, 0, 0, 0)' || s.backgroundImage !== 'none' || parseFloat(s.borderTopWidth) > 0 || s.boxShadow !== 'none');
      if (!aBoite) continue;
      for (const n of noms) {
        const v = s[n];
        const px = v.endsWith('%') ? (parseFloat(v) / 100) * Math.min(r.width, r.height) : parseFloat(v);
        const nom = `${el.tagName.toLowerCase()}${typeof el.className === 'string' && el.className ? `.${el.className.trim().replace(/\s+/g, '.')}` : ''}${pseudo || ''}`;
        rayons[nom] = Math.max(rayons[nom] || 0, px);
        if (px > 8.01) defauts.push(`${nom} : rayon ${v} (${px.toFixed(1)} px) > 8 px (pilule ou arche interdite)`);
      }
    }
  }
  return { defauts, rayons };
}

// Longueur maximale (en caractères) d'une ligne dans chaque élément.
function longueursLignes(sel) {
  const sorties = [];
  for (const el of document.querySelectorAll(sel)) {
    const lignes = new Map();
    const marcheur = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = marcheur.nextNode())) {
      for (let i = 0; i < n.textContent.length; i += 1) {
        const plage = document.createRange();
        plage.setStart(n, i); plage.setEnd(n, i + 1);
        const r = plage.getClientRects()[0];
        if (!r) continue;
        const cle = Math.round(r.bottom / 8);
        lignes.set(cle, (lignes.get(cle) || 0) + 1);
      }
    }
    sorties.push(Math.max(0, ...lignes.values()));
  }
  return sorties;
}

// Étoiles du fond (dégradés radiaux de body.ciel) et étincelles de l'accueil qui tombent sur une ligne de texte.
// Les dégradés sont positionnés en pourcentage de la hauteur de la PAGE : sur un écran long, ils glissent dans le texte.
function etoilesSurTexte() {
  const racine = document.documentElement;
  const W = racine.getBoundingClientRect().width; const H = Math.max(racine.scrollHeight, innerHeight);
  const image = getComputedStyle(document.body).backgroundImage;
  const couches = []; let profondeur = 0; let debut = 0;
  for (let i = 0; i < image.length; i += 1) {
    if (image[i] === '(') profondeur += 1;
    else if (image[i] === ')') profondeur -= 1;
    else if (image[i] === ',' && profondeur === 0) { couches.push(image.slice(debut, i).trim()); debut = i + 1; }
  }
  couches.push(image.slice(debut).trim());
  const etoiles = [];
  for (const c of couches) {
    const m = c.match(/^radial-gradient\(circle at ([\d.]+)% ([\d.]+)%/);
    if (!m) continue;
    const reste = c.replace(/rgba?\([^)]*\)/g, '');
    const rayons = [...reste.matchAll(/([\d.]+)px/g)].map((x) => parseFloat(x[1]));
    etoiles.push({ nom: `fond ${m[1]}% ${m[2]}%`, x: (parseFloat(m[1]) / 100) * W, y: (parseFloat(m[2]) / 100) * H, r: Math.max(...rayons) * 0.6 });
  }
  for (const e of document.querySelectorAll('.etoile')) {
    const r = e.getBoundingClientRect();
    etoiles.push({ nom: 'étincelle de l\'accueil', x: r.left + r.width / 2 + scrollX, y: r.top + r.height / 2 + scrollY, r: 5 });
  }
  const touches = [];
  const opaque = (el) => {
    for (let a = el; a && a !== document.documentElement; a = a.parentElement) {
      const s = getComputedStyle(a);
      const alpha = s.backgroundColor.match(/rgba\([^)]*,\s*([\d.]+)\)/);
      if ((s.backgroundColor.startsWith('rgb(') || (alpha && parseFloat(alpha[1]) >= 0.85)) && a !== document.body) return true;
      if (/gradient/.test(s.backgroundImage) && !/rgba\(\d+, \d+, \d+, 0(\.\d+)?\)/.test(s.backgroundImage) && a !== document.body) return true;
    }
    return false;
  };
  const marcheur = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = marcheur.nextNode())) {
    const p = n.parentElement;
    if (!n.textContent.trim() || !p || p.closest('script, style, noscript, svg')) continue;
    if (p.getClientRects().length === 0 || getComputedStyle(p).visibility === 'hidden' || opaque(p)) continue;
    const plage = document.createRange();
    plage.selectNodeContents(n);
    for (const r of plage.getClientRects()) {
      if (r.width < 2) continue;
      const g = { l: r.left + scrollX, t: r.top + scrollY + r.height * 0.15, rr: r.right + scrollX, b: r.bottom + scrollY - r.height * 0.15 };
      for (const e of etoiles) {
        if (e.x >= g.l - e.r && e.x <= g.rr + e.r && e.y >= g.t - e.r && e.y <= g.b + e.r) touches.push(`${e.nom} (${e.x.toFixed(0)}, ${e.y.toFixed(0)}) derrière « ${n.textContent.trim().slice(0, 28)} »`);
      }
    }
  }
  return [...new Set(touches)];
}

const instantane = (sel) => {
  const el = document.querySelector(sel);
  const s = getComputedStyle(el);
  return ['color', 'backgroundColor', 'backgroundImage', 'borderTopColor', 'boxShadow', 'transform', 'opacity', 'outlineStyle', 'textDecorationLine', 'filter', 'borderTopWidth']
    .map((p) => `${p}=${s[p]}`).join('|');
};

// Chrome arrondit à 1 px la bordure de 1,5 px dans les styles calculés (même à 2x) : la valeur 1,5 px de la charte est
// donc vérifiée sur la déclaration (variable --bordure = 1.5px, vérifiée au §2) et non sur la valeur calculée.
const cssSansCommentaires = css.replace(/\/\*[\s\S]*?\*\//g, '');
function regleCss(selecteur) {
  const motif = new RegExp(`(?:^|\\})\\s*${selecteur.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`, 'm');
  const m = cssSansCommentaires.match(motif);
  assert.ok(m, `règle CSS introuvable : ${selecteur}`);
  return m[1];
}

describe('navigateur : conformité à la charte graphique (docs/charte-graphique.md)', { skip: A.raisonSaut || false }, () => {
  const ctx = A.contexte();
  const { ouvrir, fermer, finAnimations } = ctx;

  /* ============ §2 : variables ============ */
  it('§2 variables : le bloc :root de style.css est identique à celui de la charte (33 variables, aucune en plus, aucune en moins)', async () => {
    const miennes = variablesDuBloc(css);
    assert.deepEqual(Object.keys(miennes).sort(), Object.keys(VARIABLES_CHARTE).sort(), 'liste des variables');
    // Seul écart, demandé par la propriétaire (phase 7, remarque 46) : --marge à 24 px au lieu de 16 px.
    for (const [nom, valeur] of Object.entries(VARIABLES_CHARTE)) assert.equal(miennes[nom], nom === '--marge' ? '24px' : valeur, `${nom}`);
    assert.ok(Object.keys(VARIABLES_CHARTE).length >= 25);
    // Valeurs calculées dans la page.
    const page = await ouvrir('index.html?ecran=accueil');
    const calc = await page.evaluate((noms) => Object.fromEntries(noms.map((n) => [n, getComputedStyle(document.documentElement).getPropertyValue(n).trim().replace(/\s+/g, ' ').toLowerCase()])), Object.keys(VARIABLES_CHARTE));
    // --haut et --bas valent env(safe-area-inset-…, 0px) : le navigateur les résout en 0px hors zone sûre.
    const attendu = { ...VARIABLES_CHARTE, '--haut': '0px', '--bas': '0px', '--marge': '24px' };
    assert.match(VARIABLES_CHARTE['--haut'], /^env\(safe-area-inset-top, 0px\)$/);
    assert.match(VARIABLES_CHARTE['--bas'], /^env\(safe-area-inset-bottom, 0px\)$/);
    assert.deepEqual(calc, attendu);
    // Aucune variable inventée dans les règles (--rarete et --lueur sont dans la charte, section 6).
    const mvt = await page.evaluate(inventaireMouvement);
    // Phase 7 : variables de composant posées par ecrans.js (--lettres, --colonnes) et bleus locaux du parchemin.
    const permises = new Set([...Object.keys(VARIABLES_CHARTE), '--rarete', '--lueur', '--lettres', '--colonnes',
      '--parchemin-haut', '--parchemin-bas', '--parchemin-halo', '--parchemin-ombre']);
    assert.deepEqual([...new Set(mvt.variables)].filter((v) => !permises.has(v)), [], 'variables CSS non prévues par la charte');
    // Aucun import externe (écart volontaire : polices hébergées).
    assert.ok(!/@import|googleapis|gstatic/.test(css), 'aucun @import ni Google Fonts');
    // Base : corps de page, marges, tactile, taille du texte.
    const base = await page.evaluate(() => {
      const b = getComputedStyle(document.body);
      return {
        marge: b.margin, padding: b.paddingLeft, minHauteur: b.minHeight, boite: b.boxSizing, tactile: b.touchAction,
        police: b.fontFamily, taille: b.fontSize, interligne: b.lineHeight, couleur: b.color, fond: b.backgroundColor,
        ajust: getComputedStyle(document.documentElement).webkitTextSizeAdjust, hauteurFenetre: innerHeight,
      };
    });
    assert.equal(base.marge, '0px'); assert.equal(base.padding, '24px', 'marge latérale de 24 px (phase 7)'); assert.equal(base.boite, 'border-box');
    assert.equal(base.tactile, 'manipulation');
    assert.equal(Math.round(parseFloat(base.minHauteur)), base.hauteurFenetre, 'min-height: 100dvh');
    assert.match(base.police, /^Jost/); assert.equal(base.taille, '15px'); assert.equal(base.interligne, '22.5px');
    assert.equal(base.couleur, 'rgb(201, 216, 238)'); assert.equal(base.fond, 'rgb(6, 11, 30)'); assert.equal(base.ajust, '100%');
    assert.match(html, /viewport-fit=cover/, 'zones sûres (safe-area)');
    await fermer(page);
  });

  /* ============ §3 + §12 : couleurs ============ */
  it('§3 couleurs : aucune couleur hors palette, aucun violet, rose, vert vif, blanc ou noir pur, aucune ombre noire, sur tous les écrans', async () => {
    const hsl = ([r, g, b]) => {
      const x = [r, g, b].map((v) => v / 255); const max = Math.max(...x); const min = Math.min(...x); const l = (max + min) / 2;
      const d = max - min; if (d === 0) return [0, 0, l];
      const s = d / (1 - Math.abs(2 * l - 1));
      let h; if (max === x[0]) h = ((x[1] - x[2]) / d) % 6; else if (max === x[1]) h = (x[2] - x[0]) / d + 2; else h = (x[0] - x[1]) / d + 4;
      return [(h * 60 + 360) % 360, s, l];
    };
    const interdits = new Map(); const horsPalette = new Map(); let nonLus = []; let total = 0;
    const pages = [...ECRANS.map(([n, c]) => [n, `index.html${c}`]), ['demo', 'demo.html']];
    for (const [nom, url] of [...pages, ['carte-dialogue', 'index.html?ecran=carte&type=epreuve']]) {
      const page = await ouvrir(url, { reduit: true });
      if (nom === 'carte-dialogue') { await page.getByRole('button', { name: /Invoquer un bouclier/i }).click(); await page.waitForSelector('dialog[open]'); }
      const inv = await page.evaluate(inventaireCouleurs);
      nonLus = nonLus.concat(inv.nonLus);
      for (const c of inv.sorties) {
        if (c.a < 0.01) continue;
        total += 1;
        const [r, g, b] = c.rgb; const [h, s, l] = hsl(c.rgb);
        const cle = `${nom} : ${c.ou} ${c.prop} rgb(${c.rgb}) a=${c.a.toFixed(2)}`;
        if ((r === 255 && g === 255 && b === 255) || (r === 0 && g === 0 && b === 0)) interdits.set(cle, 'blanc ou noir pur / ombre noire');
        else if (s > 0.2 && h >= 255 && h <= 345) interdits.set(cle, 'violet ou rose');
        else if (s > 0.5 && h >= 70 && h <= 170) interdits.set(cle, 'vert vif');
        // Bleus du logo : parchemin des règles et, depuis la remarque 51, cartouche du prénom (salle d'attente) ; depuis
        // la remarque 57, cartouche du code (« Rejoindre une partie »).
        const parchemin = ((nom === 'regles' && /parchemin|fermoir|^svg/.test(c.ou)) || ((nom.startsWith('salle') || nom.startsWith('rejoindre')) && /cartouche/.test(c.ou))) && BLEUS_PARCHEMIN_RGB.some((p) => p.every((v, i) => Math.abs(v - c.rgb[i]) <= 2));
        if (!parchemin && !PALETTE_RGB.some((p) => p.every((v, i) => Math.abs(v - c.rgb[i]) <= 2))) horsPalette.set(cle, 'hors palette');
      }
      await fermer(page);
    }
    console.log(`# ${total} couleurs appliquées relevées (éléments, pseudo-éléments, fenêtre, démonstration)`);
    assert.deepEqual(nonLus, [], 'format de couleur non interprété');
    assert.deepEqual([...interdits].map(([k, v]) => `${v} — ${k}`), []);
    assert.deepEqual([...horsPalette].map(([k]) => k), [], 'toute couleur doit venir des huit variables --c-*');
  });

  it('§3 couleurs : chaque forme des symboles SVG fixe elle-même son remplissage (rien ne retombe sur le noir par défaut)', () => {
    const symboles = [...html.matchAll(/<symbol id="([^"]+)"[\s\S]*?<\/symbol>/g)];
    assert.ok(symboles.length >= 5);
    for (const [bloc, id] of symboles) {
      for (const forme of bloc.matchAll(/<(path|circle|rect|ellipse|polygon|line)\b[^>]*>/g)) {
        assert.ok(/\bfill\s*=|fill\s*:/.test(forme[0]), `${id} : forme sans fill explicite : ${forme[0].slice(0, 60)}`);
      }
    }
  });

  it('§3 couleurs : feuille de style et HTML — seules les huit couleurs de la charte, aucun nom de couleur, rgb(), hsl()', () => {
    const sansCommentaires = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '');
    for (const [nom, texte] of [['style.css', css], ['index.html', html], ['demo.html', fs.readFileSync(path.join(A.PUBLIC, 'demo.html'), 'utf8')],
      ['ecrans.js', fs.readFileSync(path.join(A.PUBLIC, 'js', 'ecrans.js'), 'utf8')], ['dom.js', fs.readFileSync(path.join(A.PUBLIC, 'js', 'dom.js'), 'utf8')]]) {
      const t = sansCommentaires(texte);
      const hex = [...t.matchAll(/#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g)].map((m) => m[1]);
      // Bleus du parchemin : seulement dans la déclaration de ses variables locales (style.css).
      const parchemin = nom === 'style.css' ? [...t.matchAll(/--parchemin-[\w-]+:\s*#([0-9a-fA-F]{6,8});/g)].map((m) => m[1]) : [];
      assert.deepEqual([...new Set(parchemin.map((h) => h.slice(0, 6).toUpperCase()))].sort(), nom === 'style.css' ? [...BLEUS_PARCHEMIN_HEX].sort() : []);
      for (const h of hex.filter((x) => !parchemin.includes(x))) {
        const six = h.length <= 4 ? h.split('').slice(0, 3).map((c) => c + c).join('') : h.slice(0, 6);
        assert.ok(PALETTE_HEX.includes(six.toUpperCase()), `${nom} : couleur #${h} hors palette`);
      }
      assert.ok(!/\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/.test(t), `${nom} : fonction de couleur hors variables`);
      assert.ok(!/(:|\s)(white|black|red|blue|green|purple|violet|pink|magenta|orange|yellow|gray|grey|crimson|fuchsia|indigo|cyan)\b\s*[;}]/i.test(t), `${nom} : nom de couleur`);
      assert.ok(!/box-shadow:[^;]*#0{3,6}\b/i.test(t), `${nom} : ombre noire`);
    }
  });

  it('§3 + §11 + §12 aucun texte en --c-brume (texte, lettrine, pseudo-éléments, toutes pages), texte courant en lune ou étoile', async () => {
    const defauts = [];
    const couleursVues = new Set();
    const pages = [...ECRANS.map(([n, c]) => [n, `index.html${c}`]), ['demo', 'demo.html']];
    for (const [nom, url] of pages) {
      const page = await ouvrir(url, { reduit: true });
      const { textes } = await page.evaluate(inventaireCouleurs);
      for (const t of textes) {
        couleursVues.add(t.rgb.join(','));
        if (t.a > 0.01 && t.rgb.join(',') === '60,90,140') defauts.push(`[${nom}] texte en --c-brume : ${t.ou}`);
        // §11 : texte courant et titres en --c-lune ou --c-etoile ; --c-lune-douce réservé au texte secondaire.
        if (/\.(texte|carte-texte|accueil-salut|transition-texte|titre-tour|titre-ecran|dialogue-texte)(\.|$)/.test(t.ou) && !/::/.test(t.ou)
          && !['201,216,238', '244,241,232'].includes(t.rgb.join(','))) defauts.push(`[${nom}] texte courant ni en --c-lune ni en --c-etoile : ${t.ou} rgb(${t.rgb})`);
      }
      await fermer(page);
    }
    assert.deepEqual(defauts, []);
    assert.ok(couleursVues.size >= 4, 'plusieurs couleurs de texte relevées (le contrôle a bien lu le texte)');
    // Statique : jamais `color: var(--c-brume)` (ni couleur de texte brume en valeur littérale).
    const proprietes = [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/(?:^|[;{\s])(color)\s*:\s*([^;}]+)/gm)].map((m) => m[2]);
    assert.ok(proprietes.length > 20);
    assert.ok(proprietes.every((v) => !/--c-brume|#3C5A8C/i.test(v)), 'une règle color: utilise --c-brume');
  });

  /* ============ §5 + §12 : formes ============ */
  it('§5 formes : aucune pilule ni arche (rayon <= 8 px), cartes à 8 px, boutons et fenêtre à 4 px, bordure de carte 1,5 px', async () => {
    const defauts = [];
    const vus = {};
    for (const [nom, c] of [...ECRANS.map(([n, ch]) => [n, `index.html${ch}`]), ['demo', 'demo.html']]) {
      const page = await ouvrir(c, { reduit: true });
      const m = await page.evaluate(mesurerFormes);
      for (const d of m.defauts) defauts.push(`[${nom}] ${d}`);
      Object.assign(vus, m.rayons);
      await fermer(page);
    }
    assert.deepEqual(defauts, []);
    // Écran à 2 pixels par pixel CSS (téléphone) : à 1x, Chrome arrondit une bordure de 1,5 px à 1 px dans les styles calculés.
    const carte = await ouvrir('index.html?ecran=carte&type=epreuve', { reduit: true, dpr: 2 });
    const g = await carte.evaluate(() => {
      const s = (sel, pseudo) => getComputedStyle(document.querySelector(sel), pseudo || null);
      return {
        carte: s('.carte-face').borderTopLeftRadius, bordure: s('.carte-face').borderTopWidth, boutons: [...document.querySelectorAll('.barre-bas .bouton')].map((b) => getComputedStyle(b).borderTopLeftRadius),
        filet: s('.carte-face', '::before').borderTopWidth, retour: null,
      };
    });
    assert.equal(g.carte, '8px'); assert.deepEqual(g.boutons, ['4px', '4px']); assert.equal(g.filet, '1px');
    assert.match(regleCss('.carte-face'), /border:\s*var\(--bordure\) solid var\(--rarete\)/, 'bordure de carte : var(--bordure) (1,5 px)');
    assert.match(regleCss('.carte-face'), /border-radius:\s*var\(--r-carte\)/);
    await fermer(carte);
    // Phase 7 (remarque 57) : le champ du code est lui aussi dans un cartouche aux coins de carte (8 px), sans cadre propre.
    const rejoindre = await ouvrir('index.html?ecran=rejoindre', { reduit: true });
    assert.equal(await rejoindre.evaluate(() => getComputedStyle(document.querySelector('.cartouche')).borderTopLeftRadius), '8px');
    assert.equal(await rejoindre.evaluate(() => getComputedStyle(document.querySelector('.champ')).borderTopWidth), '0px');
    await fermer(rejoindre);
    // Phase 7 (remarque 51) : le champ du prénom est dans un cartouche aux coins de carte (8 px), sans cadre propre.
    const salle = await ouvrir('index.html?ecran=salle&hote=1&autres=1', { reduit: true });
    assert.equal(await salle.evaluate(() => getComputedStyle(document.querySelector('.cartouche')).borderTopLeftRadius), '8px');
    await fermer(salle);
    const pop = await ouvrir('index.html?ecran=attente&type=epreuve&tour=2', { reduit: true, dpr: 2 });
    const panneau = await pop.evaluate(() => {
      const el = document.querySelector('.panneau');
      const s = getComputedStyle(el);
      return {
        rayon: s.borderTopLeftRadius, bordure: s.borderTopWidth, couleur: s.borderTopColor, fond: s.backgroundImage,
        coins: el.querySelectorAll(':scope > .coin').length, filet: getComputedStyle(el, '::before').borderTopWidth,
      };
    });
    assert.equal(panneau.rayon, '8px'); assert.match(regleCss('.panneau'), /border:\s*var\(--bordure\) solid var\(--c-brume\)/); assert.equal(panneau.couleur, 'rgb(60, 90, 140)');
    assert.match(panneau.fond, /linear-gradient\(.*rgb\(15, 30, 74\).*rgb\(6, 11, 30\)/); assert.equal(panneau.coins, 4); assert.equal(panneau.filet, '1px');
    await fermer(pop);
  });

  /* ============ §7 + §12 : boutons, états, aucun :hover ============ */
  it('§7 boutons : principal (ambre, texte nuit, 14 px, capitales .2em, double filet, lueur) et secondaire (fond nuit, filet lune), >= 48 px', async () => {
    const page = await ouvrir('index.html?ecran=regles', { reduit: true });
    const b = await page.evaluate(() => {
      const lire = (sel) => {
        const el = document.querySelector(sel); const s = getComputedStyle(el); const r = el.getBoundingClientRect();
        return {
          fond: s.backgroundColor, couleur: s.color, taille: s.fontSize, graisse: s.fontWeight, famille: s.fontFamily, casse: s.textTransform,
          espacement: s.letterSpacing, rayon: s.borderTopLeftRadius, ombre: s.boxShadow, bordure: `${s.borderTopWidth} ${s.borderTopStyle} ${s.borderTopColor}`,
          hauteur: r.height, largeur: r.width,
        };
      };
      return { principal: lire('.barre-bas .bouton-principal'), secondaire: lire('.barre-bas .bouton-secondaire') };
    });
    const p = b.principal; const s = b.secondaire;
    assert.equal(p.fond, 'rgb(240, 163, 94)'); assert.equal(p.couleur, 'rgb(6, 11, 30)');
    assert.equal(p.taille, '14px'); assert.equal(p.graisse, '500'); assert.match(p.famille, /^Jost/); assert.equal(p.casse, 'uppercase');
    assert.equal(p.espacement, '2.8px', 'interlettrage .2em'); assert.equal(p.rayon, '4px'); assert.ok(p.hauteur >= 48 && p.largeur >= 140);
    assert.equal((p.ombre.match(/inset/g) || []).length, 2, 'double filet : deux ombres internes');
    assert.match(p.ombre, /rgba\(240, 163, 94, 0\.333\) 0px 0px 20px/, 'lueur 0 0 20px #F0A35E55');
    assert.equal(s.fond, 'rgba(0, 0, 0, 0)', 'phase 7 (remarque 47) : fond transparent, le bouton ne passe plus au-dessus du contenu'); assert.equal(s.couleur, 'rgb(201, 216, 238)'); assert.equal(s.bordure, '1px solid rgb(201, 216, 238)');
    assert.equal((s.ombre.match(/inset/g) || []).length, 2); assert.equal(s.taille, '14px'); assert.equal(s.casse, 'uppercase');
    assert.ok(s.hauteur >= 48);
    await ctx.capture(page, 'boutons-regles-360', { fullPage: false });
    await fermer(page);
  });

  it('§7 états tactiles : désactivé (opacité 40 %, sans lueur), appui (:active, échelle .97, lueur renforcée), focus clavier (2 px étoile décalé de 3 px)', async () => {
    const salle = await ouvrir('index.html?ecran=salle&hote=1&autres=1', { reduit: true });
    const dsb = await salle.evaluate(() => {
      const el = [...document.querySelectorAll('.barre-bas .bouton')].find((b) => b.disabled);
      const s = getComputedStyle(el);
      return { opacite: s.opacity, ombre: s.boxShadow };
    });
    assert.equal(dsb.opacite, '0.4');
    const exterieures = dsb.ombre.split(/,(?![^(]*\))/).filter((o) => !/inset/.test(o));
    assert.deepEqual(exterieures, [], `désactivé : pas de lueur extérieure (${dsb.ombre})`);
    // Focus clavier : tous les éléments atteignables par Tab ont un contour de 2 px, étoile, décalé de 3 px.
    const defauts = [];
    for (let i = 0; i < 6; i += 1) {
      await salle.keyboard.press('Tab');
      await salle.waitForTimeout(80); // sous prefers-reduced-motion toute transition dure 1 ms : on laisse finir
      const f = await salle.evaluate(() => {
        const e = document.activeElement; const s = getComputedStyle(e);
        const cartouche = e.closest('.cartouche');
        return { nom: `${e.tagName.toLowerCase()}.${e.className}`, style: s.outlineStyle, largeur: s.outlineWidth, couleur: s.outlineColor, decalage: s.outlineOffset, clavier: e.matches(':focus-visible'),
          prenom: e.id === 'champ-prenom', halo: cartouche ? getComputedStyle(cartouche).boxShadow : null };
      });
      if (f.nom.startsWith('body')) continue;
      // Phase 7 (remarque 51, maquette) : le champ du prénom n'a pas de contour ; le halo ambre du cartouche, plus fort,
      // signale qu'il est actif.
      if (f.prenom) { if (!/rgba\(240, 163, 94, 0\.467\) 0px 0px 30px/.test(f.halo)) defauts.push(`champ du prénom : halo du cartouche absent (${f.halo})`); continue; }
      if (!f.clavier || f.style !== 'solid' || f.largeur !== '2px' || f.couleur !== 'rgb(244, 241, 232)' || f.decalage !== '3px') defauts.push(`${JSON.stringify(f)}`);
    }
    assert.deepEqual(defauts, []);
    await fermer(salle);

    const page = await ouvrir('index.html?ecran=regles', { reduit: false });
    await finAnimations(page);
    const cible = page.locator('.barre-bas .bouton-principal');
    await cible.scrollIntoViewIfNeeded(); // phase 7 (remarque 47) : boutons des règles à la fin du contenu
    const avant = await cible.evaluate((e) => ({ t: getComputedStyle(e).transform, o: getComputedStyle(e).boxShadow }));
    const r = await cible.boundingBox();
    await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(400);
    const appui = await cible.evaluate((e) => ({ t: getComputedStyle(e).transform, o: getComputedStyle(e).boxShadow, dur: getComputedStyle(e).transitionDuration }));
    await page.mouse.move(2, 2);
    await page.mouse.up();
    assert.equal(avant.t, 'none');
    assert.match(appui.t, /^matrix\(0\.97, 0, 0, 0\.97, 0, 0\)$/, `échelle .97 attendue, obtenu ${appui.t}`);
    assert.notEqual(appui.o, avant.o, 'lueur renforcée à l\'appui');
    assert.match(appui.o, /rgba\(240, 163, 94, 0\.667\) 0px 0px 30px/);
    assert.equal(appui.dur, '0.15s', 'durée 150 ms');
    await fermer(page);
  });

  it('§7 + §12 aucun état ne dépend de :hover : ni règle CSS :hover, ni @media (hover), ni changement de style au survol', async () => {
    assert.ok(!/:hover/.test(css.replace(/\/\*[\s\S]*?\*\//g, '')), 'style.css contient :hover');
    assert.ok(!/@media[^{]*hover/.test(css), 'style.css contient @media (hover…)');
    const cas = [
      ['index.html?ecran=regles', ['.barre-bas .bouton-principal', '.barre-bas .bouton-secondaire', '.bouton-retour']],
      ['index.html?ecran=salle&hote=1&autres=1', ['.champ']],
      ['index.html?ecran=salle&hote=1&autres=1&prenom=Noa&etape=embleme', ['.embleme-choix:not(:disabled)']],
      ['index.html?ecran=choix', ['.dos-epreuve', '.dos-revelation']],
      ['index.html?ecran=creer', ['.code-option-nom']],
      ['index.html?ecran=accueil', ['.bouton-principal']],
      ['demo.html', ['.demo-lien']],
    ];
    for (const [url, selecteurs] of cas) {
      const page = await ouvrir(url, { reduit: true });
      const mvt = await page.evaluate(inventaireMouvement);
      assert.deepEqual(mvt.selecteursHover, [], 'sélecteurs :hover trouvés dans le CSSOM');
      assert.deepEqual(mvt.mediaHover, []);
      for (const sel of selecteurs) {
        await page.mouse.move(1, 1);
        await page.waitForTimeout(100);
        const avant = await page.evaluate(instantane, sel);
        await page.hover(sel);
        await page.waitForTimeout(350);
        const pendant = await page.evaluate(instantane, sel);
        assert.equal(pendant, avant, `${url} ${sel} : le style change au survol`);
      }
      await fermer(page);
    }
  });

  /* ============ §8 : fond, grain ============ */
  it('§8 fond et grain : fond .ciel sans background-attachment: fixed, un seul calque de grain non interactif à 1 octave, sur chaque écran et après navigation', async () => {
    const verifier = async (page, nom) => {
      const m = await page.evaluate(() => {
        const g = document.querySelector('.grain'); const s = getComputedStyle(g);
        const plein = [...document.querySelectorAll('body *')].filter((e) => {
          const c = getComputedStyle(e); const r = e.getBoundingClientRect();
          return c.position === 'fixed' && r.width >= innerWidth * 0.9 && r.height >= innerHeight * 0.9;
        }).length;
        return {
          grains: document.querySelectorAll('.grain').length, turbulences: document.querySelectorAll('feTurbulence').length,
          filtres: document.querySelectorAll('filter').length, melanges: [...document.querySelectorAll('body *')].filter((e) => getComputedStyle(e).mixBlendMode !== 'normal').length,
          pleinEcran: plein, position: s.position, evenements: s.pointerEvents, melange: s.mixBlendMode, opacite: s.opacity, aria: g.getAttribute('aria-hidden'),
          freq: document.querySelector('feTurbulence').getAttribute('baseFrequency'), octaves: document.querySelector('feTurbulence').getAttribute('numOctaves'),
          typeBruit: document.querySelector('feTurbulence').getAttribute('type'), saturation: document.querySelector('feColorMatrix')?.getAttribute('values'),
        };
      });
      assert.equal(m.grains, 1, `${nom} : un seul calque .grain`); assert.equal(m.turbulences, 1, `${nom} : un seul feTurbulence`);
      assert.equal(m.filtres, 1); assert.equal(m.melanges, 1, `${nom} : un seul élément en mix-blend-mode`); assert.equal(m.pleinEcran, 1, `${nom} : un seul calque plein écran fixe`);
      assert.deepEqual([m.position, m.evenements, m.melange, m.opacite, m.aria], ['fixed', 'none', 'overlay', '0.18', 'true']);
      assert.deepEqual([m.freq, m.octaves, m.typeBruit, m.saturation], ['.85', '1', 'fractalNoise', '0']);
    };
    for (const [nom, c] of ECRANS) {
      const page = await ouvrir(`index.html${c}`, { reduit: true });
      await verifier(page, nom);
      const fond = await page.evaluate(() => {
        const b = getComputedStyle(document.body);
        return { classe: document.body.className, attachement: b.backgroundAttachment, degrades: (b.backgroundImage.match(/radial-gradient/g) || []).length, couleur: b.backgroundColor };
      });
      assert.match(fond.classe, /\bciel\b/); assert.ok(!fond.attachement.includes('fixed'), `${nom} : background-attachment ${fond.attachement}`);
      assert.equal(fond.degrades, 11, `${nom} : 9 étoiles + halo bleu + lueur de braise`); assert.equal(fond.couleur, 'rgb(6, 11, 30)');
      const mvt = await page.evaluate(inventaireMouvement);
      assert.ok(!mvt.attachements.includes('fixed') && mvt.fixed.length === 0, `${nom} : background fixed`);
      await fermer(page);
    }
    // Navigation interne : le grain ne se duplique pas.
    const page = await ouvrir('index.html', { reduit: true });
    await verifier(page, 'accueil');
    await page.getByRole('link', { name: /Comment ça marche ?/i }).click(); await verifier(page, 'règles');
    await page.getByRole('link', { name: /Créer une partie/i }).click(); await verifier(page, 'créer');
    await page.locator('.code-option').first().click(); await page.locator('button[type=submit]').click(); await verifier(page, 'salle');
    await page.goBack(); await page.getByRole('link', { name: /Retour aux règles/i }).click();
    await page.getByRole('link', { name: /Rejoindre une partie/i }).click(); await verifier(page, 'rejoindre');
    await page.locator('#champ-code').fill('rune'); await page.keyboard.press('Enter'); await verifier(page, 'salle 2');
    await page.getByRole('button', { name: /Je rejoins la compagnie/i }).count();
    await page.goto(new URL('index.html?ecran=choix', `${ctx.base}/`).toString()); await verifier(page, 'choix');
    await page.locator('.dos-epreuve').click(); await verifier(page, 'carte');
    await page.getByRole('link', { name: /Le sort est jeté/i }).click(); await verifier(page, 'transition');
    await fermer(page);
    const demo = await ouvrir('demo.html', { reduit: true });
    assert.equal(await demo.locator('.grain').count(), 1, 'demo.html : un seul grain');
    assert.equal(await demo.locator('feTurbulence').count(), 1);
    await fermer(demo);
  });

  /* ============ §9 : mouvement ============ */
  it('§8 lisibilité : aucune étoile du fond ni étincelle d\'accueil ne passe derrière une ligne de texte (360 x 800, 360 x 640, 412 x 800)', async () => {
    const defauts = [];
    for (const [largeur, hauteur] of [[360, 800], [360, 640], [412, 800]]) {
      for (const [nom, c] of ECRANS) {
        const page = await ouvrir(`index.html${c}`, { largeur, hauteur, reduit: true });
        for (const t of await page.evaluate(etoilesSurTexte)) defauts.push(`[${nom} ${largeur}x${hauteur}] ${t}`);
        await fermer(page);
      }
    }
    assert.deepEqual(defauts, []);
  });

  /* ============ §9 : mouvement (suite) ============ */
  it('§9 mouvement : animations et transitions limitées à opacity et transform ; fondu 300 ms, retournement 600 ms, étoiles 5-7 s en opacité seule', async () => {
    const defauts = [];
    const vues = new Set();
    for (const [nom, url] of [['accueil', 'index.html?ecran=accueil'], ['carte', 'index.html?ecran=carte&type=epreuve'], ['transition', 'index.html?ecran=transition'],
      ['salle', 'index.html?ecran=salle&autres=2'], ['creer', 'index.html?ecran=creer'], ['choix', 'index.html?ecran=choix'], ['demo', 'demo.html']]) {
      const page = await ouvrir(url);
      const m = await page.evaluate(inventaireMouvement);
      for (const [cle, props] of Object.entries(m.keyframes)) {
        vues.add(cle);
        for (const p of props) if (!['opacity', 'transform', 'offset'].includes(p)) defauts.push(`@keyframes ${cle} anime « ${p} »`);
      }
      for (const t of m.transitions) if (!['opacity', 'transform', 'width (cartouche)'].includes(t)) defauts.push(`[${nom}] transition sur « ${t} »`);
      for (const n of m.animations) if (!(n in m.keyframes)) defauts.push(`[${nom}] animation « ${n} » sans @keyframes`);
      await fermer(page);
    }
    assert.deepEqual([...new Set(defauts)], []);
    for (const attendu of ['scintille', 'fondu', 'retournement', 'pulse']) assert.ok(vues.has(attendu), `@keyframes ${attendu} attendu`);
    const page = await ouvrir('index.html?ecran=accueil');
    const kf = await page.evaluate(inventaireMouvement);
    assert.deepEqual(kf.keyframes.scintille, ['opacity'], 'scintillement des étoiles : opacité seule');
    const etoiles = await page.evaluate(() => [...document.querySelectorAll('.etoile')].map((e) => getComputedStyle(e).animationDuration));
    assert.ok(etoiles.length >= 6 && etoiles.every((d) => d === '5s' || d === '7s'), `durées ${etoiles}`);
    const iter = await page.evaluate(() => getComputedStyle(document.querySelector('.etoile')).animationIterationCount);
    assert.equal(iter, 'infinite');
    // Rien ne bondit ni ne s'anime vite : aucune durée d'animation inférieure à 300 ms (hors appui tactile de 150 ms, transition).
    const rapides = await page.evaluate(() => [...document.querySelectorAll('body *')].flatMap((e) => {
      const s = getComputedStyle(e);
      return s.animationName.split(',').map((n, i) => (n.trim() !== 'none' ? parseFloat(s.animationDuration.split(',')[i] || s.animationDuration) : null)).filter((d) => d !== null && d < 0.3);
    }));
    assert.deepEqual(rapides, [], 'animation de moins de 300 ms');
    assert.ok(!/cubic-bezier\([^)]*-\d|cubic-bezier\([^)]*1\.[1-9]/.test(css.replace(/--ease[^;]*;/, '')), 'pas de courbe avec rebond');
    await fermer(page);
  });

  /* ============ §4 : typographie ============ */
  it('§4 typographie : titres 32–40 px en Cormorant Garamond, texte en Jost, pas de texte justifié, lignes de 60 caractères au plus, capitales des légendes et boutons', async () => {
    const titres = [
      ['accueil', '?ecran=accueil', '.accueil-salut'], ['fin', '?ecran=fin', '.accueil-salut'], ['creer', '?ecran=creer', '.titre-ecran'],
      ['choix', '?ecran=choix', '.titre-tour'], ['attente', '?ecran=attente&type=epreuve', '.titre-tour'],
      ['transition', '?ecran=transition', '.transition-texte'],
    ];
    const defauts = [];
    for (const [nom, c, sel] of titres) {
      const page = await ouvrir(`index.html${c}`, { reduit: true });
      const t = await page.evaluate((s) => { const st = getComputedStyle(document.querySelector(s)); return { px: parseFloat(st.fontSize), famille: st.fontFamily, graisse: st.fontWeight, style: st.fontStyle }; }, sel);
      if (t.px < 32 || t.px > 40) defauts.push(`[${nom}] titre ${t.px}px hors de 32–40 px`);
      if (!/^"?Cormorant Garamond/.test(t.famille)) defauts.push(`[${nom}] titre en ${t.famille}`);
      if (!['500', '600'].includes(t.graisse)) defauts.push(`[${nom}] graisse ${t.graisse}`);
      await fermer(page);
    }
    // Phase 7 (remarque 57) : la consigne de l'écran du code reprend la phrase de l'écran du prénom (Cormorant Garamond
    // italique, 28 px, étoile), comme sa maquette.
    for (const [nom, c, sel] of [['rejoindre', '?ecran=rejoindre', '.titre-ecran'], ['prénom', '?ecran=salle&hote=1&autres=1', '.prenom-question']]) {
      const page = await ouvrir(`index.html${c}`, { reduit: true });
      const t = await page.evaluate((s) => { const st = getComputedStyle(document.querySelector(s)); return { px: parseFloat(st.fontSize), famille: st.fontFamily, style: st.fontStyle, couleur: st.color }; }, sel);
      if (t.px !== 28 || !/^"?Cormorant Garamond/.test(t.famille) || t.style !== 'italic' || t.couleur !== 'rgb(244, 241, 232)') defauts.push(`[${nom}] consigne ${JSON.stringify(t)}`);
      await fermer(page);
    }
    assert.deepEqual(defauts, []);
    // Aucun texte justifié ; lignes courtes ; légendes (compteur, types) en capitales espacées de .25em à .3em.
    const regles = await ouvrir('index.html?ecran=regles', { reduit: true });
    assert.equal(await regles.evaluate(() => [...document.querySelectorAll('body *')].filter((e) => getComputedStyle(e).textAlign === 'justify').length), 0);
    // Itération 4 : titres de section et filigrane alignés à gauche (même bord gauche que le texte).
    const alignes = await regles.evaluate(() => { const bord = document.querySelector('.regles-corps .texte').getBoundingClientRect().left; return [...document.querySelectorAll('.titre-section h2, .titre-section-ornement')].map((e) => Math.abs(e.getBoundingClientRect().left - bord)); });
    assert.ok(alignes.length >= 2 && alignes.every((d) => d < 1), `titres de section non alignés à gauche : ${alignes}`);
    const lignes = await regles.evaluate(longueursLignes, '.texte');
    assert.ok(lignes.length >= 6 && Math.max(...lignes) <= 60, `ligne de ${Math.max(...lignes)} caractères sur les règles (> 60)`);
    await fermer(regles);
    const cartePage = await ouvrir(`index.html?ecran=carte&carte=${A.plusLongue.id}`, { reduit: true });
    const lc = await cartePage.evaluate(longueursLignes, '.carte-texte');
    assert.ok(Math.max(...lc) <= 60, `ligne de ${lc} caractères sur la carte (> 60)`);
    const legendes = await cartePage.evaluate(() => ['.compteur', '.carte-entete'].map((s) => { const st = getComputedStyle(document.querySelector(s)); return { casse: st.textTransform, espace: parseFloat(st.letterSpacing) / parseFloat(st.fontSize), px: parseFloat(st.fontSize) }; }));
    for (const l of legendes) { assert.equal(l.casse, 'uppercase'); assert.ok(l.espace >= 0.245 && l.espace <= 0.305, `interlettrage ${l.espace}em`); assert.ok(l.px >= 12); }
    await fermer(cartePage);
    const salle = await ouvrir('index.html?ecran=salle&autres=2', { reduit: true });
    const lsalle = await salle.evaluate(longueursLignes, '.texte');
    assert.ok(Math.max(...lsalle) <= 60);
    await fermer(salle);
  });

  /* ============ §5 + §6 : cartes, dos, logo ============ */
  for (const largeur of LARGEURS) {
    it(`§6 cartes à ${largeur} px : 2:3, cqw (6cqw de marge, double filet à 2,2cqw, quatre étincelles à 3,5cqw), bordure et lueur par type, lettrine, type en légende, filigrane, sans coût ni nom ni image`, async () => {
      const defauts = [];
      for (const [nom, url, couleur, symbole, mot, lueur] of [
        ['épreuve', 'index.html?ecran=carte&type=epreuve', 'rgb(217, 105, 58)', 'img/epee.webp', 'Épreuve', /rgba\(217, 105, 58, 0\.267\) 0px 0px 14px/],
        ['révélation', 'index.html?ecran=carte&type=revelation', 'rgb(201, 216, 238)', 'img/etoile.webp', 'Révélation', /rgba\(201, 216, 238, 0\.267\) 0px 0px 14px/],
        ['durable', `index.html?ecran=carte&carte=${durable.id}&tour=2`, null, null, null, null],
        ['plus longue', `index.html?ecran=carte&carte=${A.plusLongue.id}`, null, null, null, null],
        ['attente', 'index.html?ecran=attente&type=epreuve&tour=2', 'rgb(217, 105, 58)', 'img/epee.webp', 'Épreuve', /rgba\(217, 105, 58, 0\.267\) 0px 0px 14px/],
      ]) {
        const page = await ouvrir(url, { largeur, hauteur: 800, reduit: true, dpr: 2 });
        const m = await page.evaluate(() => {
          const carte = document.querySelector('.carte'); const face = document.querySelector('.carte-face');
          const c = carte.getBoundingClientRect(); const f = face.getBoundingClientRect();
          const sf = getComputedStyle(face); const w = c.width;
          const filet = getComputedStyle(face, '::before');
          const coins = [...face.querySelectorAll(':scope > .coin')].map((e) => { const r = e.getBoundingClientRect(); return { g: r.left - f.left, h: r.top - f.top, d: f.right - r.right, b: f.bottom - r.bottom, l: r.width }; });
          const texte = document.querySelector('.carte-texte'); const st = getComputedStyle(texte); const sl = getComputedStyle(texte, '::first-letter');
          const entete = document.querySelector('.carte-entete'); const se = getComputedStyle(entete);
          const ordre = [...face.children].map((e) => e.className.baseVal ?? e.className);
          return {
            largeurCarte: w, largeurFace: f.width, hauteurFace: f.height, conteneur: getComputedStyle(carte).containerType,
            paddingCqw: parseFloat(sf.paddingLeft) / w, bordure: sf.borderTopWidth, couleurBordure: sf.borderTopColor, rayon: sf.borderTopLeftRadius, ombre: sf.boxShadow,
            fond: sf.backgroundImage, filetInset: parseFloat(filet.top) / w, filetBordure: filet.borderTopWidth, filetCouleur: filet.borderTopColor,
            coins, texteCouleur: st.color, textePx: parseFloat(st.fontSize), texteFamille: st.fontFamily, texteInterligne: st.lineHeight,
            lettrine: { flottant: sl.float, famille: sl.fontFamily, graisse: sl.fontWeight, couleur: sl.color, px: parseFloat(sl.fontSize) },
            enteteCouleur: se.color, enteteTexte: entete.textContent.trim(), enteteSymbole: entete.querySelector('img.icone-image')?.getAttribute('src'), enteteCasse: se.textTransform,
            ordre, interdits: document.querySelectorAll('.cout, .nom, .fenetre, .illustration, .carte img:not(.dos-logo):not(.icone-image), .carte picture, .carte canvas').length,
            filigrane: Boolean(face.querySelector('.carte-filigrane')),
          };
        });
        const nomCarte = `${nom} ${largeur}`;
        const attendueLargeur = Math.min(0.86 * largeur, 340);
        if (Math.abs(m.largeurCarte - attendueLargeur) > 1) defauts.push(`[${nomCarte}] largeur ${m.largeurCarte} ≠ min(86vw, 340px) = ${attendueLargeur.toFixed(1)}`);
        if (m.hauteurFace < m.largeurFace * 1.5 - 1) defauts.push(`[${nomCarte}] ratio ${(m.hauteurFace / m.largeurFace).toFixed(3)} < 1,5 (2:3)`);
        if (m.conteneur !== 'inline-size') defauts.push(`[${nomCarte}] container-type ${m.conteneur}`);
        if (Math.abs(m.paddingCqw - 0.06) > 0.002) defauts.push(`[${nomCarte}] marge intérieure ${(m.paddingCqw * 100).toFixed(2)}cqw ≠ 6cqw`);
        if (!/^[1-2]px$/.test(m.bordure) || m.rayon !== '8px') defauts.push(`[${nomCarte}] bordure ${m.bordure} rayon ${m.rayon}`);
        if (Math.abs(m.filetInset - 0.022) > 0.002 || m.filetBordure !== '1px') defauts.push(`[${nomCarte}] double filet à ${(m.filetInset * 100).toFixed(2)}cqw, ${m.filetBordure}`);
        if (!/linear-gradient\(.*rgb\(15, 30, 74\).*rgb\(6, 11, 30\)/.test(m.fond)) defauts.push(`[${nomCarte}] fond ${m.fond}`);
        if (m.coins.length !== 4) defauts.push(`[${nomCarte}] ${m.coins.length} étincelles au lieu de 4`);
        for (const c of m.coins) {
          const attendu = 0.035 * m.largeurCarte + parseFloat(m.bordure); // 3,5cqw du bord intérieur + épaisseur de la bordure
          if (c.l < 8 || Math.abs(Math.min(c.g, c.d) - attendu) > 2.5 || Math.abs(Math.min(c.h, c.b) - attendu) > 2.5) defauts.push(`[${nomCarte}] étincelle mal placée ${JSON.stringify(c)} (attendu ≈ ${attendu.toFixed(1)} du bord)`);
        }
        if (new Set(m.coins.map((c) => `${c.g < c.d}${c.h < c.b}`)).size !== 4) defauts.push(`[${nomCarte}] les quatre étincelles ne sont pas dans les quatre coins`);
        if (m.texteCouleur !== 'rgb(201, 216, 238)' || !/^Jost/.test(m.texteFamille) || m.textePx < 20) defauts.push(`[${nomCarte}] texte ${m.texteCouleur} ${m.texteFamille} ${m.textePx}px`);
        if (Math.abs(parseFloat(m.texteInterligne) / m.textePx - 1.5) > 0.01) defauts.push(`[${nomCarte}] interligne ${m.texteInterligne}`);
        if (m.lettrine.flottant !== 'left' || !/Cormorant/.test(m.lettrine.famille) || m.lettrine.graisse !== '600' || m.lettrine.px < 2 * m.textePx) defauts.push(`[${nomCarte}] lettrine ${JSON.stringify(m.lettrine)}`);
        if (m.enteteCasse !== 'uppercase' || !m.filigrane) defauts.push(`[${nomCarte}] légende ou filigrane manquant`);
        if (m.interdits) defauts.push(`[${nomCarte}] ${m.interdits} élément(s) de coût, nom, fenêtre ou image (non prévus pour ce jeu)`);
        // L'ordre : coins, légende de type, séparateur filigrane, texte (+ bandeau durable).
        const ordre = m.ordre.map((x) => String(x));
        const iEntete = ordre.findIndex((x) => /carte-entete/.test(x)); const iFiligrane = ordre.findIndex((x) => /carte-filigrane/.test(x)); const iTexte = ordre.findIndex((x) => /carte-texte/.test(x));
        if (!(iEntete >= 0 && iEntete < iFiligrane && iFiligrane < iTexte)) defauts.push(`[${nomCarte}] ordre des éléments ${ordre}`);
        if (couleur) {
          if (m.couleurBordure !== couleur || m.enteteCouleur !== couleur || m.lettrine.couleur !== couleur) defauts.push(`[${nomCarte}] couleur de type : bordure ${m.couleurBordure}, légende ${m.enteteCouleur}, lettrine ${m.lettrine.couleur} (attendu ${couleur})`);
          if (m.enteteSymbole !== symbole || !new RegExp(mot, 'i').test(m.enteteTexte)) defauts.push(`[${nomCarte}] symbole ${m.enteteSymbole}, mot « ${m.enteteTexte} »`);
          if (!lueur.test(m.ombre)) defauts.push(`[${nomCarte}] lueur ${m.ombre}`);
        }
        await fermer(page);
      }
      assert.deepEqual(defauts, []);
      assert.match(regleCss('.dos-corps'), /border:\s*var\(--bordure\) solid var\(--c-ambre\)/, 'bordure ambre de 1,5 px (var(--bordure))');
      assert.match(regleCss('.carte-face'), /padding:\s*6cqw/);
      assert.match(regleCss('.carte-texte::first-letter'), /float:\s*left/);
    });

    it(`§6 dos de carte à ${largeur} px : 2:3, bordure ambre, dégradé radial, double filet ambre + filet lune à 6cqw, quatre étincelles, logo à 52 % de la largeur`, async () => {
      const defauts = [];
      for (const [nom, url, sel] of [['choix épreuve', 'index.html?ecran=choix', '.dos-epreuve'], ['choix révélation', 'index.html?ecran=choix', '.dos-revelation'],
        ['carte (verso)', 'index.html?ecran=carte&type=epreuve', '.carte-dos']]) {
        const page = await ouvrir(url, { largeur, reduit: true, dpr: 2 });
        const m = await page.evaluate((s) => {
          const racine = document.querySelector(s); const corps = racine.querySelector('.dos-corps');
          const r = corps.getBoundingClientRect(); const sc = getComputedStyle(corps);
          const avant = getComputedStyle(corps, '::before'); const apres = getComputedStyle(corps, '::after');
          const logo = corps.querySelector('.dos-logo').getBoundingClientRect();
          return {
            w: r.width, h: r.height, bordure: sc.borderTopWidth, couleur: sc.borderTopColor, rayon: sc.borderTopLeftRadius, fond: sc.backgroundImage,
            avant: [avant.borderTopColor, avant.borderTopWidth, parseFloat(avant.top) / r.width], apres: [apres.borderTopColor, apres.borderTopWidth, parseFloat(apres.top) / r.width],
            coins: corps.querySelectorAll('.coin').length, logo: logo.width / r.width, symbole: corps.querySelector('img.dos-symbole')?.getAttribute('src'), nom: corps.querySelector('.dos-nom').textContent.trim(),
            nomPx: parseFloat(getComputedStyle(corps.querySelector('.dos-nom')).fontSize),
          };
        }, sel);
        const n = `${nom} ${largeur}`;
        if (Math.abs(m.h / m.w - 1.5) > 0.02) defauts.push(`[${n}] ratio ${(m.h / m.w).toFixed(3)}`);
        if (!/^[1-2]px$/.test(m.bordure) || m.couleur !== 'rgb(240, 163, 94)' || m.rayon !== '8px') defauts.push(`[${n}] bordure ${m.bordure} ${m.couleur} rayon ${m.rayon}`);
        if (!/radial-gradient\(circle at 50% 45%, rgba\(60, 90, 140, 0\.4\).*rgb\(6, 11, 30\) 70%/.test(m.fond)) defauts.push(`[${n}] fond ${m.fond}`);
        if (!/^rgba\(240, 163, 94/.test(m.avant[0]) || m.avant[1] !== '1px' || Math.abs(m.avant[2] - 0.022) > 0.003) defauts.push(`[${n}] double filet ambre ${m.avant}`);
        if (!/^rgba\(201, 216, 238/.test(m.apres[0]) || m.apres[1] !== '1px' || Math.abs(m.apres[2] - 0.06) > 0.003) defauts.push(`[${n}] filet lune ${m.apres}`);
        if (m.coins !== 4) defauts.push(`[${n}] ${m.coins} étincelles`);
        if (Math.abs(m.logo - 0.52) > 0.01) defauts.push(`[${n}] logo à ${(m.logo * 100).toFixed(1)} % de la largeur (attendu 52 %)`);
        if (m.nomPx < 12) defauts.push(`[${n}] nom du type ${m.nomPx}px`);
        await fermer(page);
      }
      assert.deepEqual(defauts, []);
    });
  }

  it('§5 logo : image de la propriétaire, version complète (200 px) sur l\'accueil (nom accessible « Logo du jeu »), version compacte de 40 px dans les barres, ornements aria-hidden', async () => {
    const accueil = await ouvrir('index.html?ecran=accueil', { reduit: true });
    const a = await accueil.evaluate(() => {
      const complet = document.querySelector('.logo-complet'); const image = document.querySelector('img.logo-grand'); const g = image.getBoundingClientRect();
      const compact = document.querySelector('.logo-compact');
      return { role: complet.getAttribute('role'), nom: complet.getAttribute('aria-label'), w: g.width, h: g.height, compactVisible: getComputedStyle(compact).visibility, src: image.getAttribute('src'), charge: image.naturalWidth > 0, masquee: image.getAttribute('aria-hidden') };
    });
    assert.deepEqual(a, { role: 'img', nom: 'Logo du jeu', w: 200, h: 200, compactVisible: 'hidden', src: 'img/logo.webp', charge: true, masquee: 'true' });
    await fermer(accueil);
    for (const [nom, c] of ECRANS.filter(([n]) => n !== 'accueil').slice(0, 12)) {
      const page = await ouvrir(`index.html${c}`, { reduit: true });
      const b = await page.evaluate(() => { const l = document.querySelector('.logo-compact'); const r = l.getBoundingClientRect(); return { w: r.width, h: r.height, balise: l.tagName, nom: l.getAttribute('alt'), charge: l.naturalWidth > 0, vis: getComputedStyle(l).visibility }; });
      assert.deepEqual(b, { w: 52, h: 52, balise: 'IMG', nom: 'Romantasy', charge: true, vis: 'visible' }, `logo compact sur ${nom}`);
      await fermer(page);
    }
    assert.doesNotMatch(html, /i-logo/, 'plus de symbole SVG provisoire');
    // Ornements décoratifs masqués aux lecteurs d'écran, images nommées, champs étiquetés.
    const page = await ouvrir('index.html?ecran=salle&hote=1&autres=1', { reduit: true });
    const acc = await page.evaluate(() => ({
      svgExposes: [...document.querySelectorAll('svg')].filter((s) => s.getAttribute('aria-hidden') !== 'true' && s.getAttribute('role') !== 'img').length,
      imagesSansNom: [...document.querySelectorAll('[role=img]')].filter((e) => !e.getAttribute('aria-label')).length,
      imgSansAlt: [...document.querySelectorAll('img')].filter((e) => !e.hasAttribute('alt')).length,
      imgNonChargees: [...document.querySelectorAll('img')].filter((e) => !(e.complete && e.naturalWidth > 0)).map((e) => e.getAttribute('src')),
      emblemesNommes: [...document.querySelectorAll('.joueur-ligne img.embleme')].every((e) => e.alt.length > 0),
      champsSansEtiquette: [...document.querySelectorAll('input:not(.code-radio), select, textarea')].filter((e) => !(e.labels && e.labels.length) && !e.getAttribute('aria-label')).length,
      langue: document.documentElement.lang, titreDoc: document.title,
    }));
    assert.deepEqual(acc, { svgExposes: 0, imagesSansNom: 0, imgSansAlt: 0, imgNonChargees: [], emblemesNommes: true, champsSansEtiquette: 0, langue: 'fr', titreDoc: 'Romantasy' });
    await fermer(page);
  });

  /* ============ §7 : barre d'actions, panneaux ============ */
  // Phase 7 (remarque 47, qui remplace la remarque 38) : boutons fixes en bas de la page, sans bande ni fond. Les
  // écrans fixes tiennent dans la hauteur, boutons en bas ; les règles défilent et leurs boutons viennent à la fin.
  it('§7 boutons du bas fixes : sans fond ni filet, en bas de l\'écran fixe, à la fin des règles, marge de sécurité', async () => {
    let page = await ouvrir('index.html?ecran=rejoindre', { largeur: 390, hauteur: 700, reduit: true });
    const fixe = await page.evaluate(() => {
      const barre = document.querySelector('.barre-bas'); const s = getComputedStyle(barre);
      const b = barre.querySelector('.bouton').getBoundingClientRect();
      return { fond: s.backgroundColor, filet: `${s.borderTopWidth} ${s.borderTopStyle} ${s.borderTopColor}`, position: s.position, defile: document.documentElement.scrollHeight - innerHeight, ecartBas: innerHeight - b.bottom };
    });
    assert.equal(fixe.fond, 'rgba(0, 0, 0, 0)'); assert.match(fixe.filet, /^0px none/); assert.equal(fixe.position, 'static');
    assert.ok(fixe.defile <= 0, `écran fixe : défilement de ${fixe.defile} px`);
    assert.ok(Math.abs(fixe.ecartBas - 12) <= 1, `bouton en bas de l'écran (${fixe.ecartBas} px du bas)`);
    await fermer(page);
    page = await ouvrir('index.html?ecran=regles', { largeur: 390, hauteur: 700, reduit: true });
    const y = async () => page.evaluate(() => Math.round(document.querySelector('.barre-bas .bouton').getBoundingClientRect().top));
    assert.ok(await y() > 700, 'règles : les boutons ne sont pas visibles avant le défilement (à la fin du contenu)');
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const fin = await page.evaluate(() => {
      const barre = document.querySelector('.barre-bas');
      const b = [...barre.querySelectorAll('.bouton')].map((x) => x.getBoundingClientRect());
      return { parchemin: document.querySelector('.parchemin').getBoundingClientRect().bottom, haut: barre.getBoundingClientRect().top, b: b.map((x) => [x.top, x.bottom]), ecart: getComputedStyle(barre).rowGap };
    });
    assert.ok(fin.haut >= fin.parchemin, 'règles : boutons après le parchemin');
    assert.ok(fin.b.every(([t, bt]) => t >= 0 && bt <= 700), 'règles : boutons visibles en fin de défilement');
    assert.ok(parseFloat(fin.ecart) >= 8, 'au moins 8 px entre les deux boutons');
    assert.match(css, /padding:\s*12px 0 calc\(12px \+ var\(--bas\)\)/, 'marge de sécurité --bas');
    assert.doesNotMatch(css.replace(/\/\*[\s\S]*?\*\//g, ''), /position:\s*sticky/, 'plus de bouton ni de pied collé pendant le défilement');
    await fermer(page);
  });

  /* ============ Bilan ============ */
  it('aucune erreur de console, aucune requête échouée ni externe pendant les contrôles de la charte', () => {
    assert.deepEqual([...new Set(ctx.problemes)], []);
    assert.deepEqual(ctx.requetesExternes, []);
    assert.ok(cartes.length === 40);
  });
});
