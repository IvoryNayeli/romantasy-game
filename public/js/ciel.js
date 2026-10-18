// Constellations : quelques étoiles reliées par des filets très fins, inventées ou inspirées du ciel (aucun texte).
// Décor pur (aria-hidden), dessiné en SVG à la volée. Elles ne sont posées que dans des zones sans texte :
// la bande d'en-tête (de part et d'autre du logo) et l'espace libre au-dessus et au-dessous du contenu de l'accueil,
// de l'écran de fin et de l'écran de transition (voir `.ciel-libre` dans style.css).
// Couleurs : --c-etoile et --c-lune seulement ; on n'anime que l'opacité (quelques étoiles scintillent, classe `etoile`).

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
  m.etoiles.forEach(([, , r, scintille], i) => {
    const clair = r >= 1.6;
    svg.append(el('circle', {
      class: `astre${clair ? '' : ' astre-lune'}${scintille ? ' etoile' : ''}`, cx: p[i][0], cy: p[i][1], r: clair ? r + 0.3 : r + 0.2,
    }));
  });
  return svg;
}
