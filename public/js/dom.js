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

// Symbole du sprite SVG défini dans index.html (symbole « i-nom »), décoratif.
function symbole(nom, classe) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', classe);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const use = document.createElementNS(NS, 'use');
  use.setAttribute('href', `#i-${nom}`);
  svg.append(use);
  return svg;
}

// Icône au trait fin (épée, étoile, bouclier, retour, coche, lueur).
export function icone(nom, classe = '') {
  return symbole(nom, `icone ${classe}`.trim());
}

// Quatre étincelles dans les coins d'une carte, d'un panneau ou d'une fenêtre (parent en position: relative).
export function coins() {
  return ['hg', 'hd', 'bg', 'bd'].map((place) => symbole('etincelle', `coin coin-${place}`));
}

// Séparateur filigrane.
export function filigrane(classe = '') {
  return symbole('filigrane', `filigrane ${classe}`.trim());
}

// Logo (dessin provisoire) : décoratif ici, son nom accessible est porté par le conteneur.
export function logo(classe = '') {
  return symbole('logo', classe);
}

// Étoile qui scintille (décor de l'accueil) : dans la marge de gauche ('g') ou de droite ('d'),
// à `haut` % de la hauteur de l'écran.
export function etoile(cote, haut) {
  const svg = symbole('etincelle', `etoile etoile-${cote}`);
  svg.setAttribute('style', `top:${haut}%`);
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
