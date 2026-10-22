// Constellations : quelques étoiles reliées par des filets très fins, inventées ou inspirées du ciel (aucun texte).
// Décor pur (aria-hidden), dessiné en SVG à la volée. Elles ne sont posées que dans des zones sans texte :
// la bande d'en-tête (de part et d'autre du logo) et l'espace libre au-dessus et au-dessous du contenu de l'accueil,
// de l'écran de fin et de l'écran de transition (voir `.ciel-libre` dans style.css).
// Couleurs : --c-etoile et --c-lune seulement ; on n'anime que l'opacité (une étoile sur deux scintille, classe `etoile`).

const NS = 'http://www.w3.org/2000/svg';

// Étoile : [x, y, rayon, scintille (1 = oui)]. Liens : paires d'indices d'étoiles. `l` x `h` : taille du dessin.
export const MOTIFS = {
  // Petits motifs (à gauche du logo dans l'en-tête).
  lyre: {
    l: 64, h: 44,
    etoiles: [[30, 5, 2.2, 1], [16, 22, 1.5], [42, 19, 1.5], [20, 39, 1.4], [46, 35, 1.6], [58, 6, 0.9], [6, 12, 0.9]],
    liens: [[0, 1], [0, 2], [1, 2], [1, 3], [2, 4], [3, 4]],
  },
  croix: {
    l: 64, h: 44,
    etoiles: [[32, 4, 2, 1], [32, 19, 1.6], [32, 40, 1.4], [10, 21, 1.4], [54, 16, 1.5], [56, 38, 0.9], [8, 6, 0.9]],
    liens: [[0, 1], [1, 2], [3, 1], [1, 4]],
  },
  couronne: {
    l: 64, h: 44,
    etoiles: [[4, 34, 1.3], [12, 22, 1.5], [24, 14, 1.8, 1], [38, 11, 1.4], [50, 15, 1.6], [60, 26, 1.3], [34, 34, 0.9], [52, 40, 0.9]],
    liens: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]],
  },
  fleche: {
    l: 64, h: 44,
    etoiles: [[4, 26, 1.3], [28, 23, 1.6], [60, 19, 2, 1], [50, 9, 1.3], [48, 31, 1.3], [14, 8, 0.9], [30, 40, 0.9], [58, 38, 0.9]],
    liens: [[0, 1], [1, 2], [2, 3], [2, 4]],
  },
  // Motifs plus larges (à droite du logo, et grands tracés des zones libres).
  cassiopee: {
    l: 120, h: 44,
    etoiles: [[4, 32, 1.4], [26, 10, 1.8, 1], [50, 30, 1.6], [74, 12, 1.8], [100, 34, 1.5], [112, 12, 0.9], [62, 40, 0.9], [14, 8, 0.9]],
    liens: [[0, 1], [1, 2], [2, 3], [3, 4]],
  },
  ourse: {
    l: 120, h: 44,
    etoiles: [[4, 10, 1.4], [22, 7, 1.6], [40, 13, 1.6], [58, 19, 1.8, 1], [60, 37, 1.6], [92, 40, 1.6], [96, 22, 1.8], [112, 10, 0.9], [106, 36, 0.9], [76, 6, 0.9]],
    liens: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]],
  },
  dragon: {
    l: 120, h: 44,
    etoiles: [[6, 14, 1.6], [16, 6, 1.5], [26, 14, 1.8, 1], [14, 22, 1.3], [38, 28, 1.4], [54, 20, 1.5], [66, 32, 1.4], [84, 24, 1.6], [98, 36, 1.3], [114, 30, 1.5], [46, 40, 0.9], [90, 8, 0.9], [70, 8, 0.9]],
    liens: [[0, 1], [1, 2], [2, 3], [3, 0], [2, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9]],
  },
  orion: {
    l: 120, h: 44,
    etoiles: [[20, 8, 1.8, 1], [72, 10, 1.6], [38, 24, 1.4], [48, 25, 1.4], [58, 26, 1.4], [26, 40, 1.5], [70, 38, 1.8], [96, 14, 0.9], [100, 34, 0.9], [8, 28, 0.9], [112, 22, 0.9]],
    liens: [[0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6]],
  },
};

function el(balise, attrs) {
  const noeud = document.createElementNS(NS, balise);
  for (const [cle, val] of Object.entries(attrs)) noeud.setAttribute(cle, val);
  return noeud;
}

// Dessine un motif. `echelle` agrandit les positions (pas les étoiles : elles restent petites et légères).
export function constellation(nom, { classe = '', echelle = 1, fluide = false } = {}) {
  const m = MOTIFS[nom];
  const l = m.l * echelle;
  const h = m.h * echelle;
  const svg = el('svg', {
    class: `constellation ${classe}`.trim(), viewBox: `0 0 ${l} ${h}`, width: l, height: h,
    'aria-hidden': 'true', focusable: 'false',
  });
  // Fluide : le dessin se réduit pour tenir dans la place disponible (jamais plus grand que sa taille d'origine).
  if (fluide) svg.setAttribute('style', `width:100%;height:100%;max-width:${l}px;max-height:${h}px`);
  const p = m.etoiles.map(([x, y]) => [x * echelle, y * echelle]);
  svg.append(el('path', {
    class: 'liens', d: m.liens.map(([a, b]) => `M${p[a][0]} ${p[a][1]}L${p[b][0]} ${p[b][1]}`).join(''),
  }));
  // Phase 7 : on doit voir les constellations scintiller. En plus des étoiles marquées, une étoile sur deux
  // scintille, chacune décalée dans le temps (retard négatif : le cycle est déjà en cours à l'affichage).
  m.etoiles.forEach(([, , r, marquee], i) => {
    const clair = r >= 1.6;
    const scintille = marquee || i % 2 === 0;
    const circle = el('circle', {
      class: `astre${clair ? '' : ' astre-lune'}${scintille ? ' etoile' : ''}`, cx: p[i][0], cy: p[i][1], r: clair ? r + 0.3 : r + 0.2,
    });
    if (scintille) circle.setAttribute('style', `animation-delay:-${(i * 1.3) % 3}s`);
    svg.append(circle);
  });
  return svg;
}

/* ---------- Écran du prénom (phase 7, remarque 51) ----------
   Chaque lettre tapée allume une constellation dans le fond de l'écran (maquette de la propriétaire) : les étoiles
   naissent une à une, les traits se dessinent (transform et opacité seulement), une étoile de chaque constellation
   est ambre. 24 formes toutes différentes, une par caractère possible (le prénom en compte 24 au plus), dans un ordre
   tiré au hasard à chaque ouverture de l'écran. Coordonnées de 0 à 1 ; p : étoiles ; s : traits (paires d'indices). */
export const FORMES_LETTRES = [
  { nom: 'grande ourse', p: [[0, .15], [.2, .1], [.38, .2], [.55, .32], [.58, .62], [.9, .7], [.95, .38]], s: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]] },
  { nom: 'cassiopée', p: [[0, .3], [.25, .75], [.5, .45], [.75, .85], [1, .35]], s: [[0, 1], [1, 2], [2, 3], [3, 4]] },
  { nom: 'orion', p: [[.2, 0], [.8, .05], [.38, .5], [.5, .52], [.62, .54], [.25, 1], [.78, .95]], s: [[0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6]] },
  { nom: 'cygne', p: [[.5, 0], [.5, .4], [.5, 1], [0, .35], [1, .45]], s: [[0, 1], [1, 2], [3, 1], [1, 4]] },
  { nom: 'lyre', p: [[.5, 0], [.3, .4], [.7, .35], [.35, .95], [.75, .9]], s: [[0, 1], [0, 2], [1, 2], [1, 3], [2, 4], [3, 4]] },
  { nom: 'couronne', p: [[0, .7], [.15, .35], [.35, .15], [.6, .1], [.8, .25], [1, .55]], s: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]] },
  { nom: 'lion', p: [[.15, .1], [.05, .3], [.15, .5], [.3, .55], [.3, .25], [.7, .45], [1, .7], [.65, .8]], s: [[0, 1], [1, 2], [2, 3], [0, 4], [4, 3], [3, 5], [5, 6], [6, 7], [7, 3]] },
  { nom: 'scorpion', p: [[0, .1], [.1, .25], [.05, .4], [.3, .35], [.45, .5], [.5, .75], [.65, .95], [.85, .9], [.95, .7]], s: [[0, 1], [2, 1], [1, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8]] },
  { nom: 'gémeaux', p: [[.2, 0], [.25, .5], [.3, 1], [.7, .05], [.75, .5], [.8, .95]], s: [[0, 1], [1, 2], [3, 4], [4, 5], [0, 3]] },
  { nom: 'taureau', p: [[0, 0], [.4, .55], [.55, .75], [.7, .5], [1, .05], [.75, 1]], s: [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5]] },
  { nom: 'pégase', p: [[.4, .2], [.85, .2], [.85, .65], [.4, .65], [.15, .85], [0, .7]], s: [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5]] },
  { nom: 'andromède', p: [[0, .5], [.35, .45], [.7, .3], [1, .15], [.65, .6], [1, .75]], s: [[0, 1], [1, 2], [2, 3], [1, 4], [4, 5]] },
  { nom: 'bouvier', p: [[.5, 1], [.3, .6], [.7, .55], [.35, .15], [.65, .05]], s: [[0, 1], [0, 2], [1, 3], [2, 4], [3, 4]] },
  { nom: 'hercule', p: [[.3, .3], [.7, .3], [.65, .6], [.35, .6], [0, 0], [1, .05], [.1, 1], [.95, .9]], s: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 4], [1, 5], [3, 6], [2, 7]] },
  { nom: 'aigle', p: [[0, .3], [.3, .55], [.5, .5], [.7, .45], [1, .2], [.55, 1]], s: [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5]] },
  { nom: 'dauphin', p: [[.2, .2], [.4, 0], [.55, .25], [.35, .45], [.6, .7], [.9, .95]], s: [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5]] },
  { nom: 'bélier', p: [[0, .2], [.45, .3], [.75, .5], [.85, .85]], s: [[0, 1], [1, 2], [2, 3]] },
  { nom: 'flèche', p: [[0, .55], [.6, .5], [1, .45], [.8, .25], [.8, .7]], s: [[0, 1], [1, 2], [2, 3], [2, 4]] },
  { nom: 'poissons', p: [[0, .2], [.2, .4], [.5, .95], [.75, .6], [1, .3], [.9, .05]], s: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]] },
  { nom: 'dragon', p: [[.05, .15], [.15, 0], [.25, .15], [.12, .28], [.35, .45], [.55, .35], [.7, .6], [.9, .5], [1, .85]], s: [[0, 1], [1, 2], [2, 3], [3, 0], [2, 4], [4, 5], [5, 6], [6, 7], [7, 8]] },
  { nom: 'balance', p: [[.5, 0], [.15, .4], [.85, .4], [.1, .95], [.9, .9]], s: [[0, 1], [0, 2], [1, 2], [1, 3], [2, 4]] },
  { nom: 'corbeau', p: [[.15, .25], [.75, .05], [1, .75], [.3, .9], [0, 0]], s: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 4]] },
  { nom: 'licorne', p: [[0, .9], [.25, .6], [.4, .75], [.6, .35], [.8, .45], [1, 0]], s: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]] },
  { nom: 'petite ourse', p: [[0, .1], [.2, .2], [.4, .25], [.55, .45], [.6, .75], [.9, .8], [.88, .5]], s: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]] },
];

// Hasard reproductible (même graine, même suite) et mélange d'une liste.
export function hasard(graine) {
  let s = graine;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}
export function melanger(liste, graine) {
  const r = hasard(graine);
  const t = [...liste];
  for (let i = t.length - 1; i > 0; i -= 1) {
    const j = Math.floor(r() * (i + 1));
    [t[i], t[j]] = [t[j], t[i]];
  }
  return t;
}

// Constellation de la lettre n° `rang`, de forme `forme`, posée dans la case `place` ({ x, y, cote }, en px).
// Légère inclinaison au hasard : la forme reste reconnaissable. Chaque trait est un segment horizontal tourné en
// place (le dessin du trait n'anime que sa transformation), les étoiles naissent l'une après l'autre.
export function constellationLettre(forme, place, rang) {
  const r = hasard(rang * 97 + 13);
  const taille = place.cote * (0.6 + r() * 0.25);
  const ox = place.x + (place.cote - taille) * r();
  const oy = place.y + (place.cote - taille) * r();
  const angle = (r() - 0.5) * Math.PI * 0.6;
  const pts = forme.p.map(([u, v]) => {
    const a = (u - 0.5) * taille;
    const b = (v - 0.5) * taille;
    return [ox + taille / 2 + a * Math.cos(angle) - b * Math.sin(angle), oy + taille / 2 + a * Math.sin(angle) + b * Math.cos(angle)];
  });
  const g = el('g', { class: 'lettre-constellation' });
  forme.s.forEach(([i, j], n) => {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[j];
    const longueur = Math.hypot(x2 - x1, y2 - y1);
    const degres = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
    const support = el('g', { transform: `translate(${x1.toFixed(1)} ${y1.toFixed(1)}) rotate(${degres.toFixed(1)})` });
    const trait = el('line', { class: 'lettre-trait', x1: 0, y1: 0, x2: longueur.toFixed(1), y2: 0 });
    trait.setAttribute('style', `animation-delay:${150 + n * 90}ms`);
    support.append(trait);
    g.append(support);
  });
  const vive = Math.floor(r() * pts.length); // une étoile ambre par constellation
  pts.forEach(([x, y], n) => {
    if (n === vive) {
      const halo = el('circle', { class: 'lettre-astre lettre-halo', cx: x.toFixed(1), cy: y.toFixed(1), r: 4.5 });
      halo.setAttribute('style', `animation-delay:${n * 70}ms`);
      g.append(halo);
    }
    const astre = el('circle', {
      class: n === vive ? 'lettre-astre lettre-astre-vive' : 'lettre-astre',
      cx: x.toFixed(1), cy: y.toFixed(1), r: n === vive ? 2 : (1.3 + r() * 0.6).toFixed(2),
    });
    astre.setAttribute('style', `animation-delay:${n * 70}ms`);
    g.append(astre);
  });
  return g;
}
