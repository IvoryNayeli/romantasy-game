/* Script classique (non module), seul à pouvoir s'exécuter si la page est ouverte
   directement depuis le dossier (file://) : les modules et fetch y sont bloqués par le navigateur. */
(function () {
  if (window.location.protocol !== 'file:') return;
  document.addEventListener('DOMContentLoaded', function () {
    var zone = document.getElementById('ecran');
    if (!zone) return;
    var p = document.createElement('p');
    p.className = 'texte';
    p.textContent = 'Ouvrez cette page depuis un serveur web (voir le README), pas directement depuis le dossier.';
    zone.appendChild(p);
  });
})();
