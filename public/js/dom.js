// Petits outils pour construire le DOM sans framework.

const NS = 'http://www.w3.org/2000/svg';

// Crée un élément. `classe` = attribut class, `onXxx` = écouteur, valeur false/null = attribut absent.
export function h(balise, attrs, ...enfants) {
  const el = document.createElement(balise);
  for (const [cle, val] of Object.entries(attrs || {})) {
    if (val == null || val === false) continue;
    if (cle === 'classe') el.className = val;
    else if (cle.startsWith('on')) el.addEventListener(cle.slice(2), val);
    else if (val === true) el.setAttribute(cle, '');
    else el.setAttribute(cle, val);
  }
  for (const enfant of enfants.flat()) {
    if (enfant == null || enfant === false) continue;
    el.append(enfant.nodeType ? enfant : document.createTextNode(String(enfant)));
  }
  return el;
}

// Icône du sprite SVG défini dans index.html (symbole « i-nom »).
export function icone(nom, classe = '') {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', `icone ${classe}`.trim());
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const use = document.createElementNS(NS, 'use');
  use.setAttribute('href', `#i-${nom}`);
  svg.append(use);
  return svg;
}

// Adresse interne (paramètres d'URL) : { ecran: 'carte', type: 'epreuve' } -> '?ecran=carte&type=epreuve'
export function adresse(params) {
  const p = new URLSearchParams();
  for (const [cle, val] of Object.entries(params)) {
    if (val != null && val !== '') p.set(cle, val);
  }
  return `?${p.toString()}`;
}

// Lien d'aspect bouton (navigation interne interceptée par app.js grâce à data-nav).
export function lienBouton(texte, params, { variante = 'principal', symbole = null } = {}) {
  return h('a', { classe: `bouton bouton-${variante}`, href: adresse(params), 'data-nav': '' },
    symbole ? icone(symbole) : null,
    h('span', null, texte));
}
