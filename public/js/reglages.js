// Réglage « réduire les animations » : demande du système (prefers-reduced-motion)
// OU choix manuel dans l'interface, mémorisé sur ce téléphone.
// Le CSS lit l'attribut data-animations de <html> : « reduites » ou « completes ».

const CLE = 'romantasy.animations';

function lireChoix() {
  try {
    const v = localStorage.getItem(CLE);
    if (v === 'reduites' || v === 'completes') return v;
  } catch { /* stockage indisponible : on suit le système */ }
  return null;
}

function appliquer(valeur) {
  document.documentElement.dataset.animations = valeur;
  const bouton = document.getElementById('reglage-animations');
  if (bouton) bouton.setAttribute('aria-pressed', String(valeur === 'reduites'));
}

export function animationsReduites() {
  return document.documentElement.dataset.animations === 'reduites';
}

export function initReglageAnimations() {
  const systeme = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduites' : 'completes';
  appliquer(lireChoix() || systeme);
  const bouton = document.getElementById('reglage-animations');
  bouton?.addEventListener('click', () => {
    const suivant = animationsReduites() ? 'completes' : 'reduites';
    try { localStorage.setItem(CLE, suivant); } catch { /* sans mémoire : valable pour cette page */ }
    appliquer(suivant);
  });
}
