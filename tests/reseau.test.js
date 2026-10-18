'use strict';

// Phase 4 : contrôles du réseau SANS émulateur ni navigateur (rapides, sans accès réseau).
// Garde-fou « émulateur local seulement », cohérence des règles de database.rules.json avec les données et le code,
// SDK isolé dans firebase.js et chargé à la demande, écoutes limitées au chemin de la partie, choix de la base.
// Lancer : npm run test:rapide

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const E = require('./aide-emulateur.js');

const JS = path.join(E.PUBLIC, 'js');
const lireJs = (nom) => fs.readFileSync(path.join(JS, nom), 'utf8');
const lireRacine = (nom) => fs.readFileSync(path.join(E.RACINE, nom), 'utf8');
const regles = JSON.parse(lireRacine('database.rules.json'));
const partie = regles.rules.parties.$code;
const codes = E.lireJson('codes.json');
const emblemes = E.lireJson('emblemes.json').map((e) => e.id);
const sansCommentaires = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\'"`])\/\/.*$/gm, '$1');

test('garde-fou : les tests refusent toute adresse d\'émulateur non locale', () => {
  for (const ok of ['127.0.0.1:9000', 'localhost:9000', '[::1]:9000', '0.0.0.0:9000']) {
    assert.doesNotThrow(() => E.verifierAdresseLocale(ok), ok);
  }
  for (const non of ['romantasy-dev-default-rtdb.europe-west1.firebasedatabase.app:443',
    'romantasy-prod-default-rtdb.europe-west1.firebasedatabase.app:443', '192.168.1.23:9000', '8.8.8.8:9000',
    'exemple.fr:9000', '127.0.0.1.exemple.fr:9000', '', 'localhost']) {
    assert.throws(() => E.verifierAdresseLocale(non), /Refus|illisible/, non);
  }
});

test('garde-fou : sans émulateur démarré, les tests de l\'émulateur échouent avec un message clair', () => {
  const avant = process.env.FIREBASE_DATABASE_EMULATOR_HOST;
  delete process.env.FIREBASE_DATABASE_EMULATOR_HOST;
  try {
    assert.throws(() => E.adresseEmulateur(), /npm test/);
    process.env.FIREBASE_DATABASE_EMULATOR_HOST = 'romantasy-dev-default-rtdb.europe-west1.firebasedatabase.app:443';
    assert.throws(() => E.adresseEmulateur(), /Refus/);
    assert.throws(() => E.client(), /Refus/, 'aucun client créé vers une adresse non locale');
  } finally {
    if (avant === undefined) delete process.env.FIREBASE_DATABASE_EMULATOR_HOST;
    else process.env.FIREBASE_DATABASE_EMULATOR_HOST = avant;
  }
});

test('règles : racine fermée, seules les parties `parties/<CODE>` sont lisibles, et rien d\'autre', () => {
  assert.equal(regles.rules['.read'], false);
  assert.equal(regles.rules['.write'], false);
  assert.deepEqual(Object.keys(regles.rules).sort(), ['.read', '.write', 'parties']);
  assert.deepEqual(Object.keys(regles.rules.parties), ['$code'], 'pas de lecture de la liste des parties');
  assert.equal(partie.$autre['.validate'], false, 'champ inconnu refusé dans une partie');
  assert.equal(partie.joueurs.$id.$autre['.validate'], false, 'champ inconnu refusé chez une personne');
});

test('règles : codes, emblèmes, durée d\'expiration, longueur du prénom et places identiques aux données et au code', async () => {
  const { salon } = await E.chargerModules();
  const listeRegle = (texte) => texte.match(/\^\(([^)]*)\)\$/)[1].split('|');
  assert.deepEqual(listeRegle(partie['.read']), codes, 'codes lisibles = codes.json');
  assert.deepEqual(listeRegle(partie['.write']), codes, 'codes modifiables = codes.json');
  assert.deepEqual(listeRegle(partie.emblemes.$embleme['.validate']), emblemes, 'emblèmes = emblemes.json');
  assert.deepEqual(listeRegle(partie.joueurs.$id.embleme['.validate']), emblemes);
  const texte = JSON.stringify(regles);
  const durees = [...texte.matchAll(/now - (\d+)/g)].map((m) => Number(m[1]));
  assert.ok(durees.length > 0);
  for (const d of durees) assert.equal(d, salon.EXPIRATION_MS, 'même expiration que salon.js');
  assert.match(partie.joueurs.$id.prenom['.validate'], new RegExp(`length <= ${salon.PRENOM_MAX}\\b`));
  // Places : bornées par le champ « max » de la partie (recopié de config.json), lui-même borné par le nombre
  // d'emblèmes (chaque personne a un emblème différent).
  assert.match(partie.max['.validate'], new RegExp(`newData.val\\(\\) <= ${emblemes.length}\\b`));
  assert.match(partie.nb['.validate'], /newData\.val\(\) <= newData\.parent\(\)\.child\('max'\)\.val\(\)/);
  const config = E.lireJson('config.json');
  assert.ok(config.joueursMax <= emblemes.length, 'config.joueursMax ne dépasse pas le nombre d\'emblèmes');
  assert.doesNotMatch(texte, /joueursMax|tours/, 'aucun réglage de config.json recopié dans les règles');
});

test('règles : invariants vérifiés au niveau de la partie (emblème unique pour chaque emblème, départ à 2 présences)', async () => {
  // Chaque emblème a sa clause au niveau de la partie (évaluée pour toute écriture, même profonde ou suppression) :
  // son titulaire le porte, et il ne change de titulaire que si l'ancien ne le porte plus (défauts D1 et D3).
  for (const e of emblemes) {
    assert.ok(partie['.validate'].includes(`child('emblemes').child('${e}')`), `clause manquante pour ${e}`);
    assert.ok(partie['.validate'].includes(`.child('embleme').val() != '${e}'`), `changement de titulaire non contrôlé pour ${e}`);
  }
  // Départ (défaut D4) : liste « ordre » d'au moins JOUEURS_MINIMUM personnes prêtes et distinctes.
  const jeu = fs.readFileSync(path.join(JS, 'game.js'), 'utf8');
  const minimum = Number(jeu.match(/export const JOUEURS_MINIMUM = (\d+);/)[1]);
  const indices = Array.from({ length: minimum }, (_, i) => `'${i}'`).join(', ');
  assert.ok(partie.ordre['.validate'].includes(`hasChildren([${indices}])`), 'ordre : minimum de game.js');
  for (let i = 0; i < minimum; i += 1) assert.ok(partie.statut['.validate'].includes(`child('ordre').child('${i}').exists()`));
  assert.match(partie.ordre.$i['.validate'], /child\('pret'\)\.val\(\) == true/);
  // Arrivée seulement en salle (défaut D5).
  assert.match(partie.joueurs.$id.rang['.validate'], /child\('statut'\)\.val\(\) == 'salle'/);
  assert.match(partie.nb['.validate'], /child\('statut'\)\.val\(\) == 'salle'/);
});

test('identifiants : ceux tirés par salon.js respectent la règle de la base', async () => {
  const { salon } = await E.chargerModules();
  const motif = partie.joueurs.$id['.validate'].match(/\$id\.matches\(\/(.*?)\/\)/)[1];
  const ids = new Set();
  for (let i = 0; i < 200; i += 1) {
    const id = salon.nouvelIdentifiant();
    assert.match(id, new RegExp(motif));
    ids.add(id);
  }
  assert.equal(ids.size, 200);
});

test('salon.js : fonctions pures (chemin, expiration, ordre d\'arrivée, minimum pour commencer)', async () => {
  const { salon } = await E.chargerModules();
  assert.equal(salon.cheminPartie('RUNE'), 'parties/RUNE');
  for (const faux of ['', 'rune', '../x', 'RUNE/joueurs', null, undefined, 'A']) assert.throws(() => salon.cheminPartie(faux), /invalide/);
  const maintenant = 1e12;
  assert.equal(salon.estExpiree({ actif: maintenant - 1000 }, maintenant), false);
  assert.equal(salon.estExpiree({ actif: maintenant - salon.EXPIRATION_MS - 1 }, maintenant), true);
  assert.equal(salon.estExpiree(null, maintenant), true);
  const p = { statut: 'salle', joueurs: { b: { rang: 1, pret: true }, a: { rang: 0, pret: false }, c: { rang: 2, pret: true } } };
  assert.deepEqual(salon.joueursOrdonnes(p).map((j) => j.id), ['a', 'b', 'c']);
  assert.equal(salon.nombrePrets(p), 2);
  assert.equal(salon.peutCommencer(p), true, 'deux présences confirmées suffisent (JOUEURS_MINIMUM)');
  p.joueurs.c.pret = false;
  assert.equal(salon.peutCommencer(p), false);
  assert.equal(salon.peutCommencer({ ...p, statut: 'partie' }), false);
});

test('SDK Firebase : chargé seulement par firebase.js, depuis le CDN officiel, à la version figée (= package.json)', async () => {
  const { config } = await E.chargerModules();
  const paquet = JSON.parse(lireRacine('package.json'));
  assert.equal(paquet.devDependencies.firebase, config.VERSION_SDK, 'même version pour les tests et pour le CDN');
  assert.deepEqual(Object.keys(paquet.dependencies || {}), [], 'aucune dépendance installée pour le jeu');
  const firebaseJs = lireJs('firebase.js');
  const adresses = [...firebaseJs.matchAll(/from '([^']+)'/g)].map((m) => m[1]);
  assert.ok(adresses.length >= 2);
  for (const a of adresses) assert.match(a, new RegExp(`^https://www\\.gstatic\\.com/firebasejs/${config.VERSION_SDK.replace(/\./g, '\\.')}/firebase-[a-z]+\\.js$`));
  for (const f of fs.readdirSync(JS).filter((n) => n.endsWith('.js') && n !== 'firebase.js')) {
    const source = sansCommentaires(lireJs(f));
    assert.doesNotMatch(source, /gstatic\.com|firebasejs|from ['"]firebase/, `${f} ne doit pas charger le SDK`);
    assert.doesNotMatch(source, /import\s[^;]*from\s+['"]\.\/firebase\.js['"]/, `${f} : firebase.js seulement à la demande`);
  }
  assert.match(lireJs('reseau.js'), /import\('\.\/firebase\.js'\)/, 'chargement à la demande (import dynamique)');
  for (const page of ['index.html', 'demo.html']) {
    assert.doesNotMatch(fs.readFileSync(path.join(E.PUBLIC, page), 'utf8'), /gstatic|firebase/i, `${page} ne charge pas le SDK`);
  }
});

test('écoutes : uniquement sur le chemin de la partie en cours, jamais sur la racine ni sur « parties »', () => {
  for (const f of fs.readdirSync(JS).filter((n) => n.endsWith('.js'))) {
    const source = sansCommentaires(lireJs(f));
    const appels = [...source.matchAll(/\bonValue\(([^,)]*)/g)].map((m) => m[1].trim());
    if (f === 'salon.js') {
      assert.deepEqual(appels, ['refPartie(fb'], 'salon.js n\'écoute que refPartie(fb, code)');
    } else if (f !== 'firebase.js') {
      assert.deepEqual(appels, [], `${f} ne doit pas écouter la base directement`);
    }
    assert.doesNotMatch(source, /\bref\(\s*(?:fb\.)?db\s*\)/, `${f} : référence à la racine`);
    assert.doesNotMatch(source, /\bref\(\s*(?:fb\.)?db\s*,\s*['"`](?:\/?|\/?parties\/?)['"`]\s*\)/, `${f} : référence à la racine ou à « parties »`);
    assert.doesNotMatch(source, /\bfb\.(?:set|update|push)\(/, `${f} : écritures par transaction seulement`);
  }
  const salon = sansCommentaires(lireJs('salon.js'));
  assert.match(salon, /function refPartie\(fb, code, sousChemin = ''\) \{\s*return fb\.ref\(fb\.db, sousChemin \? `\$\{cheminPartie\(code\)\}\/\$\{sousChemin\}` : cheminPartie\(code\)\);/);
  assert.equal((salon.match(/fb\.ref\(/g) || []).length, 1, 'une seule fabrique de références');
});

test('choix de la base : émulateur pour une page locale ou du réseau local, jamais la prod avant la phase 7', async () => {
  const { config } = await E.chargerModules();
  const p = (q = '') => new URLSearchParams(q);
  for (const hote of ['localhost', '127.0.0.1', '192.168.1.23', '10.0.0.5', '172.20.1.2', 'mon-ordi.local']) {
    const b = config.choisirBase(hote, p());
    assert.equal(b.nom, 'emulateur', hote);
    assert.equal(b.projectId, 'demo-romantasy', 'projet de démonstration : jamais un projet réel');
    assert.deepEqual(b.emulateur, { hote, port: config.PORT_EMULATEUR });
  }
  assert.equal(config.choisirBase('192.168.1.23', p('base=dev')).nom, 'dev');
  assert.equal(config.choisirBase('ivorynayeli.github.io', p()).nom, 'dev');
  assert.equal(config.choisirBase('172.32.0.1', p()).nom, 'dev', '172.32 n\'est pas une adresse privée');
  assert.equal(config.choisirBase('exemple.fr', p('base=prod')).nom, 'dev', 'prod non sélectionnable avant la phase 7');
  assert.match(config.BASES.dev.databaseURL, /^https:\/\/romantasy-dev-default-rtdb\.europe-west1\.firebasedatabase\.app$/);
  assert.match(config.BASES.prod.databaseURL, /^https:\/\/romantasy-prod-default-rtdb\.europe-west1\.firebasedatabase\.app$/);
  assert.doesNotMatch(sansCommentaires(lireJs('firebase-config.js')), /apiKey|AIza|secret|token|password/i, 'aucune clé ni jeton');
});

test('Firebase CLI : projets dev (par défaut) et prod, règles de database.rules.json, émulateur sans interface', () => {
  const rc = JSON.parse(lireRacine('.firebaserc'));
  assert.deepEqual(rc.projects, { default: 'romantasy-dev', dev: 'romantasy-dev', prod: 'romantasy-prod' });
  const fb = JSON.parse(lireRacine('firebase.json'));
  assert.equal(fb.database.rules, 'database.rules.json');
  assert.equal(fb.emulators.database.port, 9000);
  assert.equal(fb.emulators.ui.enabled, false);
  assert.deepEqual(Object.keys(fb).sort(), ['database', 'emulators'], 'rien d\'autre à déployer (pas de Functions, pas d\'hébergement)');
  const paquet = JSON.parse(lireRacine('package.json'));
  assert.match(paquet.scripts.test, /avec-emulateur\.js/);
  assert.match(lireRacine('scripts/avec-emulateur.js'), /'--project', 'demo-romantasy'/);
  assert.doesNotMatch(paquet.scripts['test:rapide'], /emulateur\.test|navigateur/);
});
