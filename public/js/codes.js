// Codes de partie : mots du thème (public/data/codes.json), insensibles à la casse et aux accents à la saisie
// (docs/PROJET.md, « Codes de partie »). Phase 2 : simple comparaison avec la liste, sans réseau.

// « Élixir », « elixir » et « ELIXIR » donnent la même forme : ELIXIR.
export function normaliserCode(saisie) {
  return String(saisie ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleUpperCase('fr');
}

// Renvoie le code de la liste correspondant à la saisie, ou null si la saisie n'en est pas un.
export function trouverCode(saisie, codes) {
  const voulu = normaliserCode(saisie);
  if (!voulu) return null;
  return codes.find((code) => normaliserCode(code) === voulu) ?? null;
}
