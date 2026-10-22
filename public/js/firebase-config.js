// Configuration Firebase du navigateur (fichier de configuration identifié comme tel).
// Ces identifiants sont publics par conception : ils figurent dans toute page web qui utilise Firebase.
// Ce ne sont pas des secrets. Aucune clé d'API : la Realtime Database seule n'en demande pas.
// La sécurité repose sur les règles de database.rules.json.

// Version figée du SDK Firebase, chargé depuis le CDN officiel (gstatic). Même version que le paquet
// `firebase` des devDependencies (package.json), qui ne sert qu'aux tests.
export const VERSION_SDK = '11.10.0';

export const PORT_EMULATEUR = 9000;

// Bases possibles. L'émulateur local utilise un projet « demo- » : il ne peut jamais toucher un projet réel.
export const BASES = Object.freeze({
  emulateur: { projectId: 'demo-romantasy', databaseURL: 'https://demo-romantasy-default-rtdb.firebaseio.com' },
  dev: { projectId: 'romantasy-dev', databaseURL: 'https://romantasy-dev-default-rtdb.europe-west1.firebasedatabase.app' },
  prod: { projectId: 'romantasy-prod', databaseURL: 'https://romantasy-prod-default-rtdb.europe-west1.firebasedatabase.app' },
});

// Adresse locale : l'ordinateur lui-même ou un appareil du réseau local (Wi-Fi de la maison).
export function estAdresseLocale(hote) {
  const h = String(hote || '').replace(/^\[|\]$/g, '').toLowerCase();
  if (h === 'localhost' || h === '127.0.0.1' || h === '::1' || h.endsWith('.local')) return true;
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  return a === 10 || a === 127 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31);
}

// Choix de la base d'après l'adresse de la page :
// - page servie depuis l'ordinateur ou le réseau local : émulateur, sur la même machine que la page ;
//   `?base=dev` force la base romantasy-dev (essais sur la vraie base de développement) ;
// - page servie ailleurs (en ligne, GitHub Pages) : romantasy-prod, la base de production (phase 8) ;
//   `?base=dev` y force aussi romantasy-dev.
export function choisirBase(hote, params) {
  const demande = params?.get?.('base');
  if (demande === 'dev') return { nom: 'dev', ...BASES.dev };
  if (estAdresseLocale(hote) || demande === 'emulateur') {
    return { nom: 'emulateur', ...BASES.emulateur, emulateur: { hote: String(hote).replace(/^\[|\]$/g, ''), port: PORT_EMULATEUR } };
  }
  return { nom: 'prod', ...BASES.prod };
}
