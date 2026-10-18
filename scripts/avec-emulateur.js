#!/usr/bin/env node
'use strict';

// Lance une commande avec l'émulateur Firebase Realtime Database LOCAL démarré autour d'elle
// (firebase emulators:exec), sous le projet de démonstration « demo-romantasy » : aucun projet réel n'est touché.
// Si la Firebase CLI ou Java manquent, échoue tout de suite avec un message clair.
// Usage : node scripts/avec-emulateur.js <commande…>

const { spawnSync } = require('node:child_process');
const path = require('node:path');

const RACINE = path.join(__dirname, '..');
// « node » est remplacé par le chemin du Node courant : dans emulators:exec, la Firebase CLI (binaire autonome)
// placerait sinon son propre exécutable sous ce nom.
const commande = process.argv.slice(2).map((a, i) => (i === 0 && a === 'node' ? process.execPath : a));
if (commande.length === 0) {
  console.error('Usage : node scripts/avec-emulateur.js <commande…>');
  process.exit(2);
}

function present(programme, args) {
  const r = spawnSync(programme, args, { stdio: 'ignore', shell: process.platform === 'win32' });
  return r.status === 0;
}

if (!present('firebase', ['--version'])) {
  console.error('ÉCHEC : Firebase CLI introuvable. Installer la Firebase CLI (voir le README, « Lancer les tests automatiques »), '
    + 'puis relancer. Les tests rapides restent possibles : npm run test:rapide');
  process.exit(1);
}
if (!present('java', ['-version'])) {
  console.error('ÉCHEC : Java introuvable. L\'émulateur Firebase a besoin de Java (version 11 ou plus récente). '
    + 'Les tests rapides restent possibles : npm run test:rapide');
  process.exit(1);
}

const echapper = (a) => (/^[\w./=:@-]+$/.test(a) ? a : `'${a.replace(/'/g, '\'\\\'\'')}'`);
const r = spawnSync('firebase', [
  'emulators:exec', '--only', 'database', '--project', 'demo-romantasy', commande.map(echapper).join(' '),
], { cwd: RACINE, stdio: ['inherit', 'pipe', 'inherit'], encoding: 'utf8', shell: process.platform === 'win32' });

// Sortie courte : on retire les lignes d'information de la CLI (« i  emulators: … »).
const lignes = (r.stdout || '').split('\n').filter((l) => !/^(i |⚠  database: Database Emulator logging|✔  Script exited)/.test(l));
process.stdout.write(lignes.join('\n'));
if (r.error) console.error(`ÉCHEC : impossible de lancer l'émulateur (${r.error.message}).`);
process.exit(r.status ?? 1);
