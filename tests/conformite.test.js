'use strict';

// Tests complémentaires du testeur (phase 1) : conformité aux documents de référence.
// Lancer : node --test tests/
// Ces tests lisent uniquement des fichiers locaux.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const RACINE = path.join(__dirname, '..');
const lireBrut = (...parties) => fs.readFileSync(path.join(RACINE, ...parties));
const lire = (...parties) => lireBrut(...parties).toString('utf8');
const lireJson = (nom) => JSON.parse(lire('public', 'data', nom));

const cartes = lireJson('cartes.json');
const emblemes = lireJson('emblemes.json');
const codes = lireJson('codes.json');

function lireSource() {
  const attendues = [];
  let prefixe = null;
  for (const ligne of lire('docs', 'cartes-source.md').split('\n')) {
    if (ligne.startsWith('## Révélations')) prefixe = 'rev';
    else if (ligne.startsWith('## Épreuves')) prefixe = 'epr';
    else if (ligne.startsWith('## ')) prefixe = null;
    const m = ligne.match(/^(\d+)\. (.*)$/);
    if (!prefixe || !m) continue;
    const durable = m[2].match(/^🔁 \[(\w+), « (.*?) »\] (.*)$/);
    const carte = {
      id: `${prefixe}-${m[1].padStart(2, '0')}`,
      type: prefixe === 'rev' ? 'revelation' : 'epreuve',
      texte: durable ? durable[3] : m[2],
    };
    if (durable) {
      carte.duree = durable[1];
      carte.effet = durable[2];
    }
    attendues.push(carte);
  }
  return attendues;
}

test('conformité : les 40 cartes (id, type, texte, durée, effet) sont identiques à la source, dans l\'ordre', () => {
  const attendues = lireSource();
  assert.equal(attendues.length, 40);
  assert.deepEqual(cartes, attendues);
});

test('conformité : les 9 cartes durables sont celles marquées par le symbole de la source, avec la bonne durée', () => {
  const attendus = lireSource().filter((c) => c.duree !== undefined);
  assert.deepEqual(attendus.map((c) => c.id), [
    'epr-06', 'epr-07', 'epr-08', 'epr-09', 'epr-14', 'epr-16', 'epr-17', 'epr-18', 'epr-19',
  ]);
  const reels = cartes.filter((c) => c.duree !== undefined);
  assert.deepEqual(reels.map((c) => [c.id, c.duree, c.effet]), attendus.map((c) => [c.id, c.duree, c.effet]));
});

test('conformité : texte des cartes sur une seule ligne, sans tabulation ni double espace', () => {
  for (const c of cartes) {
    for (const champ of ['texte', 'effet']) {
      if (c[champ] === undefined) continue;
      assert.doesNotMatch(c[champ], /[\n\r\t]/, `retour ligne ou tabulation : ${c.id}`);
      assert.doesNotMatch(c[champ], / {2}/, `double espace : ${c.id}`);
      assert.equal(c[champ], c[champ].normalize('NFC'), `caractères non normalisés (NFC) : ${c.id}`);
    }
  }
});

test('conformité : emblèmes identiques à la liste de docs/PROJET.md (noms, ordre)', () => {
  const section = lire('docs', 'PROJET.md').split('## Emblèmes')[1].split('## Codes')[0];
  const ligne = section.split('\n').slice(1).find((l) => l.trim());
  assert.ok(ligne, 'liste des emblèmes introuvable dans PROJET.md');
  const attendus = ligne.replace(/\.$/, '').split(', ');
  assert.equal(attendus.length, 9);
  assert.deepEqual(emblemes.map((e) => e.nom), attendus);
});

test('conformité : codes identiques à la liste de docs/PROJET.md (mots, ordre)', () => {
  const section = lire('docs', 'PROJET.md').split('## Codes de partie')[1];
  const ligne = section.split('\n').find((l) => l.includes('ECLIPSE'));
  const attendus = ligne.match(/ECLIPSE.*?OBSIDIENNE/)[0].split(', ');
  assert.deepEqual(codes, attendus);
});

test('conformité : fichiers de données en UTF-8 valide, sans BOM', () => {
  for (const nom of ['cartes.json', 'emblemes.json', 'codes.json', 'config.json']) {
    const brut = lireBrut('public', 'data', nom);
    assert.doesNotThrow(() => new TextDecoder('utf-8', { fatal: true }).decode(brut), `${nom} n'est pas de l'UTF-8 valide`);
    assert.notEqual(brut[0], 0xef, `BOM dans ${nom}`);
    assert.doesNotMatch(brut.toString('utf8'), /\r/, `retour chariot (CRLF) dans ${nom}`);
  }
});

test('conformité : emblèmes et codes sans « poche » ni « sac » ni forme exclusivement féminine ou masculine pour une personne qui joue', () => {
  const texte = JSON.stringify([emblemes.map((e) => e.nom), codes]);
  assert.doesNotMatch(texte, /\b(poches?|sacs?|joueuses?|joueurs?|voisines?|voisins?|chacunes?|elles?|celles?|celui|ceux)\b/i);
});

test('conformité : aucun réglage (4 tours, 5 personnes au maximum) écrit en dur dans le code livré hors config.json', () => {
  const dossiers = ['public', 'scripts'];
  const trouves = [];
  const parcourir = (dossier) => {
    for (const e of fs.readdirSync(dossier, { withFileTypes: true })) {
      const chemin = path.join(dossier, e.name);
      if (e.isDirectory()) parcourir(chemin);
      else if (/\.(js|html|css|mjs)$/.test(e.name)) {
        const contenu = fs.readFileSync(chemin, 'utf8');
        if (/\b(tours?|joueursMax|maxJoueurs|MAX_JOUEURS|NB_TOURS)\s*[:=]\s*[45]\b/i.test(contenu)) trouves.push(chemin);
      }
    }
  };
  for (const d of dossiers) parcourir(path.join(RACINE, d));
  assert.deepEqual(trouves, []);
});
