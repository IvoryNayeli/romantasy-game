'use strict';

// Aide commune des tests sur l'émulateur Firebase local (phase 4). Ce fichier ne contient aucun test.
//
// Prérequis : lancer les tests par `npm test` ou `npm run test:emulateur`, qui démarrent l'émulateur
// (firebase emulators:exec, projet de démonstration « demo-romantasy ») et définissent
// FIREBASE_DATABASE_EMULATOR_HOST. Sans cette variable, les tests échouent avec un message clair.
//
// Garde-fou : seule une adresse locale (127.0.0.1, localhost, ::1) est acceptée. Toute autre adresse,
// en particulier une vraie base *.firebasedatabase.app, est refusée avant la moindre connexion.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

// Node 18 n'expose pas encore `crypto` en global (salon.js s'en sert pour tirer les identifiants).
if (!globalThis.crypto) globalThis.crypto = require('node:crypto').webcrypto;

const RACINE = path.join(__dirname, '..');
const PUBLIC = path.join(RACINE, 'public');
const PROJET_DEMO = 'demo-romantasy';
// Base de l'émulateur visée par défaut : celle du jeu (firebase-config.js). Un fichier de tests peut prendre
// sa propre base (utiliserBase) pour ne pas être dérangé par les autres fichiers, lancés en parallèle ;
// les règles de database.rules.json y sont alors chargées (chargerRegles).
let NAMESPACE = `${PROJET_DEMO}-default-rtdb`;
function utiliserBase(nom) { NAMESPACE = nom; }

const lireJson = (nom) => JSON.parse(fs.readFileSync(path.join(PUBLIC, 'data', nom), 'utf8'));

const MESSAGE_SANS_EMULATEUR = 'Émulateur Firebase absent : lancer « npm test » ou « npm run test:emulateur », '
  + 'qui démarrent l\'émulateur local (Firebase CLI et Java nécessaires, voir le README).';

// Vérifie qu'une adresse « hôte:port » désigne la machine locale ; renvoie { hote, port } ou lève une erreur.
function verifierAdresseLocale(adresse) {
  const texte = String(adresse || '').trim();
  const m = texte.match(/^\[?([^\]]+?)\]?:(\d+)$/);
  if (!m) throw new Error(`Adresse d'émulateur illisible : « ${texte} » (attendu hôte:port)`);
  let hote = m[1].toLowerCase();
  if (hote === '0.0.0.0') hote = '127.0.0.1';
  if (!['127.0.0.1', 'localhost', '::1'].includes(hote)) {
    throw new Error(`Refus : les tests ne visent que l'émulateur local, pas « ${texte} ».`);
  }
  return { hote, port: Number(m[2]) };
}

function adresseEmulateur() {
  const brute = process.env.FIREBASE_DATABASE_EMULATOR_HOST;
  if (!brute) throw new Error(MESSAGE_SANS_EMULATEUR);
  return verifierAdresseLocale(brute);
}

function urlRest(chemin) {
  const { hote, port } = adresseEmulateur();
  const h = hote.includes(':') ? `[${hote}]` : hote;
  return `http://${h}:${port}/${chemin.replace(/^\/+/, '')}.json?ns=${NAMESPACE}`;
}

// Accès REST à l'émulateur. `admin` : jeton « owner » propre à l'émulateur, qui contourne les règles
// (préparation des cas de test seulement). Sans `admin`, les règles de database.rules.json s'appliquent.
async function rest(methode, chemin, valeur, { admin = false } = {}) {
  const reponse = await fetch(urlRest(chemin), {
    method: methode,
    headers: admin ? { Authorization: 'Bearer owner' } : {},
    body: valeur === undefined ? undefined : JSON.stringify(valeur),
  });
  const texte = await reponse.text();
  return { ok: reponse.ok, statut: reponse.status, corps: texte ? JSON.parse(texte) : null };
}

const viderBase = () => rest('DELETE', '', undefined, { admin: true });

async function chargerRegles() {
  const { hote, port } = adresseEmulateur();
  const reponse = await fetch(`http://${hote.includes(':') ? `[${hote}]` : hote}:${port}/.settings/rules.json?ns=${NAMESPACE}`, {
    method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: fs.readFileSync(path.join(RACINE, 'database.rules.json'), 'utf8'),
  });
  if (!reponse.ok) throw new Error(`Règles non chargées dans l'émulateur : ${await reponse.text()}`);
}

// Modules du jeu (ES) copiés dans un dossier temporaire marqué « type: module », pour Node.
let modules = null;
function chargerModules() {
  if (!modules) {
    const dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'romantasy-js-'));
    fs.writeFileSync(path.join(dossier, 'package.json'), '{"type":"module"}');
    for (const f of fs.readdirSync(path.join(PUBLIC, 'js'))) {
      if (f.endsWith('.js')) fs.copyFileSync(path.join(PUBLIC, 'js', f), path.join(dossier, f));
    }
    const charger = (nom) => import(pathToFileURL(path.join(dossier, nom)).href);
    modules = Promise.all([charger('salon.js'), charger('firebase-config.js')])
      .then(([salon, config]) => ({ salon, config }));
  }
  return modules;
}

// Un client = une application Firebase distincte, avec sa propre connexion (comme un téléphone).
// `espion` compte les transactions, suppressions, lectures et écoutes, avec le chemin visé.
let numero = 0;
function client() {
  const { hote, port } = adresseEmulateur();
  const { initializeApp, deleteApp } = require('firebase/app');
  const db = require('firebase/database');
  numero += 1;
  const app = initializeApp({ projectId: PROJET_DEMO, databaseURL: `https://${NAMESPACE}.firebaseio.com` }, `client-${numero}`);
  const base = db.getDatabase(app);
  db.connectDatabaseEmulator(base, hote, port);
  const espion = { transactions: [], suppressions: [], lectures: [], ecoutes: [] };
  const chemin = (reference) => decodeURIComponent(new URL(reference.toString()).pathname).replace(/^\/+/, '');
  const fb = {
    db: base,
    ref: db.ref,
    serverTimestamp: db.serverTimestamp,
    runTransaction: (r, ...args) => { espion.transactions.push(chemin(r)); return db.runTransaction(r, ...args); },
    remove: (r) => { espion.suppressions.push(chemin(r)); return db.remove(r); },
    get: (r) => { espion.lectures.push(chemin(r)); return db.get(r); },
    onValue: (r, ...args) => { espion.ecoutes.push(chemin(r)); return db.onValue(r, ...args); },
  };
  return { fb, espion, app, fermer: () => deleteApp(app) };
}

module.exports = {
  RACINE, PUBLIC, PROJET_DEMO, MESSAGE_SANS_EMULATEUR,
  lireJson, verifierAdresseLocale, adresseEmulateur, rest, viderBase, chargerModules, client, utiliserBase, chargerRegles,
};
