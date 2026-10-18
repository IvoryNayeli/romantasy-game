'use strict';

// Phase 4 : règles de sécurité contournées par écriture directe (sans passer par salon.js), sur l'émulateur
// Firebase LOCAL uniquement (voir aide-emulateur.js). Les écritures de cette page n'ont pas d'identifiant
// d'administrateur : seules les règles de database.rules.json s'appliquent.
// Les tests marqués « D1 » à « D5 » décrivent le comportement attendu : ils échouent tant que le défaut
// correspondant n'est pas corrigé (défauts ouverts du rapport de vérification de la phase 4, itération 1).
// Lancer : npm test (ou node scripts/avec-emulateur.js node --test tests/emulateur-regles.test.js).

const { describe, it, before, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const E = require('./aide-emulateur.js');

// Base propre à ce fichier : les autres fichiers de tests, lancés en parallèle, n'en sont pas dérangés.
E.utiliserBase('demo-romantasy-tests-regles');

const ts = { '.sv': 'timestamp' };
const A = 'a'.repeat(32);
const B = 'b'.repeat(32);
const C = 'c'.repeat(32);

// Partie à deux personnes, posée en administrateur (les règles ne permettent pas de la créer d'un coup).
const partieAvecDeux = ({ statut = 'salle', aPret = false } = {}) => ({
  cree: Date.now(),
  actif: Date.now(),
  hote: A,
  max: 5,
  nb: 2,
  statut,
  joueurs: {
    [A]: aPret
      ? { rang: 0, pret: true, prenom: 'Lea', embleme: 'dragon' }
      : { rang: 0, pret: false, embleme: 'dragon' },
    [B]: { rang: 1, pret: false, embleme: 'fee' },
  },
  emblemes: { dragon: A, fee: B },
});

describe('règles : écritures directes (contournement du jeu)', () => {
  before(async () => {
    E.adresseEmulateur(); // échoue avec un message clair si l'émulateur n'a pas été démarré
    await E.chargerRegles();
  });
  beforeEach(async () => { await E.viderBase(); });

  it('contrôle : un changement d\'emblème légitime (emblème libre, écrit en un seul bloc) est accepté', async () => {
    await E.rest('PUT', 'parties/RUNE', partieAvecDeux(), { admin: true });
    const r = await E.rest('PATCH', 'parties/RUNE', {
      [`joueurs/${B}/embleme`]: 'sirene', 'emblemes/sirene': B, 'emblemes/fee': null,
    });
    assert.ok(r.ok, `le changement légitime doit passer (${r.statut})`);
  });

  it('D1 : deux personnes ne peuvent pas avoir le même emblème, même par écriture directe', async () => {
    await E.rest('PUT', 'parties/RUNE', partieAvecDeux(), { admin: true });
    // B prend « dragon », déjà porté par A : la règle doit refuser (invariant « emblème unique »).
    const r = await E.rest('PATCH', 'parties/RUNE', { [`joueurs/${B}/embleme`]: 'dragon', 'emblemes/dragon': B });
    assert.equal(r.statut, 401, `emblème déjà pris accepté par la base : ${JSON.stringify(r.corps)}`);
  });

  it('D2 : l\'emblème d\'une personne qui n\'a pas encore confirmé sa présence ne peut pas être changé par un tiers', async () => {
    await E.rest('PUT', 'parties/RUNE', partieAvecDeux(), { admin: true });
    // Écriture de B (autre que l'émetteur du jeu) : fee -> sirene. Attendu : refusé (seule la personne concernée
    // choisit son emblème, et seulement tant que sa présence n'est pas confirmée ; voir salon.js).
    const r = await E.rest('PATCH', 'parties/RUNE', {
      [`joueurs/${B}/embleme`]: 'sirene', 'emblemes/sirene': B, 'emblemes/fee': null,
    });
    assert.equal(r.statut, 401, `emblème modifié sans règle par la base : ${JSON.stringify(r.corps)}`);
  });

  it('D3 : une personne dont la présence est confirmée ne peut pas être retirée de la partie par écriture directe', async () => {
    await E.rest('PUT', 'parties/RUNE', partieAvecDeux({ aPret: true }), { admin: true });
    const r = await E.rest('DELETE', `parties/RUNE/joueurs/${A}`);
    assert.equal(r.statut, 401, `présence confirmée supprimée sans règle (${JSON.stringify(r.corps)})`);
  });

  it('D4 : la partie ne peut pas passer à « partie » sans les présences minimales (2)', async () => {
    await E.rest('PUT', 'parties/RUNE', partieAvecDeux({ aPret: false }), { admin: true });
    const r = await E.rest('PUT', 'parties/RUNE/statut', 'partie');
    assert.equal(r.statut, 401, `démarrage sans présences accepté par la base (${JSON.stringify(r.corps)})`);
  });

  it('D5 : on ne peut pas rejoindre une partie déjà commencée par écriture directe', async () => {
    await E.rest('PUT', 'parties/RUNE', partieAvecDeux({ statut: 'partie', aPret: true }), { admin: true });
    const r = await E.rest('PATCH', 'parties/RUNE', { nb: 3, actif: ts, [`joueurs/${C}`]: { rang: 2, pret: false } });
    assert.equal(r.statut, 401, `arrivée dans une partie commencée acceptée par la base (${JSON.stringify(r.corps)})`);
  });
});
