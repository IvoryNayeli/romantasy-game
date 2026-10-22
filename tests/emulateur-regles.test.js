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
// Mêmes durées que salon.js (vérifiées par tests/reseau.test.js) : salle d'attente 30 minutes, partie démarrée 3 heures.
const EXPIRATION_SALLE_MS = 30 * 60 * 1000;
const EXPIRATION_PARTIE_MS = 3 * 60 * 60 * 1000;
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
      ? { rang: 0, pret: true, prenom: 'Lea', embleme: 'demon' }
      : { rang: 0, pret: false, embleme: 'demon' },
    [B]: { rang: 1, pret: false, embleme: 'fee' },
  },
  emblemes: { demon: A, fee: B },
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
    // B prend « demon », déjà porté par A : la règle doit refuser (invariant « emblème unique »).
    const r = await E.rest('PATCH', 'parties/RUNE', { [`joueurs/${B}/embleme`]: 'demon', 'emblemes/demon': B });
    assert.equal(r.statut, 401, `emblème déjà pris accepté par la base : ${JSON.stringify(r.corps)}`);
  });

  // D2 non corrigeable sans authentification : la base ne peut pas distinguer la personne concernée d'un tiers.
  // Marqué « todo » en attendant le choix de la propriétaire (docs/SUIVI.md, décision « Pas d'authentification »).
  it('D2 : l\'emblème d\'une personne qui n\'a pas encore confirmé sa présence ne peut pas être changé par un tiers', {
    todo: 'sans authentification, voir docs/SUIVI.md (décision « Pas d\'authentification »)',
  }, async () => {
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

  // Variantes : d'autres chemins d'écriture que celui du jeu (partie entière, un seul emblème, une seule personne).
  it('D1 (variantes) : un emblème déjà porté ne peut pas être pris par partie entière, par « emblemes/ » seul, ou par « joueurs/ » seul', async () => {
    await E.rest('PUT', 'parties/RUNE', partieAvecDeux(), { admin: true });
    const partieEntiere = partieAvecDeux();
    partieEntiere.joueurs[B].embleme = 'demon';
    partieEntiere.emblemes = { demon: B };
    const essais = [
      ['PUT', 'parties/RUNE', partieEntiere],
      ['PUT', 'parties/RUNE/emblemes/demon', B],
      ['PUT', `parties/RUNE/joueurs/${B}/embleme`, 'demon'],
    ];
    for (const [methode, chemin, valeur] of essais) {
      const r = await E.rest(methode, chemin, valeur);
      assert.equal(r.statut, 401, `${methode} ${chemin} : accepté (${JSON.stringify(r.corps)})`);
    }
  });

  it('D3 (variantes) : une personne qui a confirmé sa présence, ou qui porte un emblème, ne peut pas être retirée', async () => {
    await E.rest('PUT', 'parties/RUNE', partieAvecDeux({ aPret: true }), { admin: true });
    assert.equal((await E.rest('DELETE', `parties/RUNE/joueurs/${A}`)).statut, 401, 'personne prête retirée');
    await E.viderBase();
    await E.rest('PUT', 'parties/RUNE', partieAvecDeux(), { admin: true });
    assert.equal((await E.rest('DELETE', `parties/RUNE/joueurs/${B}`)).statut, 401, 'personne avec emblème retirée');
  });

  it('D4 (variantes) : départ refusé avec une liste d\'ordre fausse (personne non prête, personne inconnue, personne en double)', async () => {
    const pret = (extra = {}) => partieAvecDeux({ aPret: true, ...extra });
    await E.rest('PUT', 'parties/RUNE', pret(), { admin: true });
    const sansPresence = await E.rest('PATCH', 'parties/RUNE', { statut: 'partie', ordre: [A, B] });
    assert.equal(sansPresence.statut, 401, 'B n\'est pas prête');
    const inconnue = await E.rest('PATCH', 'parties/RUNE', { statut: 'partie', ordre: [A, C] });
    assert.equal(inconnue.statut, 401, 'C ne fait pas partie de la partie');
    const double = await E.rest('PATCH', 'parties/RUNE', { statut: 'partie', ordre: [A, A] });
    assert.equal(double.statut, 401, 'A en double');
    assert.equal((await E.rest('GET', 'parties/RUNE/statut', undefined, { admin: true })).corps, 'salle', 'la partie reste en salle');
  });

  it('départ valide accepté, puis l\'ordre des tours n\'est plus modifiable (écriture d\'un rang, ajout)', async () => {
    await E.rest('PUT', 'parties/RUNE', partieAvecDeux({ aPret: true }), { admin: true });
    await E.rest('PATCH', 'parties/RUNE', { [`joueurs/${B}`]: { rang: 1, pret: true, prenom: 'Tom', embleme: 'fee' }, nb: 2, actif: ts, 'emblemes/fee': B });
    const depart = await E.rest('PATCH', 'parties/RUNE', { statut: 'partie', ordre: [A, B] });
    assert.ok(depart.ok, `départ valide refusé (${JSON.stringify(depart.corps)})`);
    assert.equal((await E.rest('PUT', 'parties/RUNE/ordre/1', A)).statut, 401, 'ordre/1 réécrit après le départ');
    assert.equal((await E.rest('PUT', 'parties/RUNE/ordre/2', C)).statut, 401, 'ordre/2 ajouté après le départ');
  });

  it('D6 : la liste d\'ordre des tours ne peut pas être effacée après le départ', async () => {
    await E.rest('PUT', 'parties/RUNE', partieAvecDeux({ aPret: true }), { admin: true });
    await E.rest('PATCH', 'parties/RUNE', { [`joueurs/${B}`]: { rang: 1, pret: true, prenom: 'Tom', embleme: 'fee' }, nb: 2, actif: ts, 'emblemes/fee': B });
    assert.ok((await E.rest('PATCH', 'parties/RUNE', { statut: 'partie', ordre: [A, B] })).ok);
    const r = await E.rest('DELETE', 'parties/RUNE/ordre');
    assert.equal(r.statut, 401, `ordre effacé après le départ (${r.statut})`);
  });

  it('D5 (variante) : une arrivée refusée par écriture partielle après le départ', async () => {
    await E.rest('PUT', 'parties/RUNE', partieAvecDeux({ aPret: true }), { admin: true });
    assert.equal((await E.rest('PUT', `parties/RUNE/joueurs/${C}`, { rang: 2, pret: false })).statut, 401, 'joueurs/ seul, nb inchangé');
  });

  it('D7 : une partie expirée ne peut plus être modifiée par une écriture partielle (arrivée, hôte)', async () => {
    const vieux = Date.now() - EXPIRATION_SALLE_MS;
    await E.rest('PUT', 'parties/RUNE', { ...partieAvecDeux(), cree: vieux, actif: vieux }, { admin: true });
    const arrivee = await E.rest('PATCH', 'parties/RUNE', { nb: 3, [`joueurs/${C}`]: { rang: 2, pret: false } });
    assert.equal(arrivee.statut, 401, `arrivée dans une partie expirée (${arrivee.statut})`);
    const hote = await E.rest('PUT', 'parties/RUNE/hote', B);
    assert.equal(hote.statut, 401, `hôte changé dans une partie expirée (${hote.statut})`);
  });

  it('D8 : une partie expirée ne peut pas être ranimée en changeant seulement son horodatage de création et d\'activité', async () => {
    const vieux = Date.now() - EXPIRATION_SALLE_MS;
    await E.rest('PUT', 'parties/RUNE', { ...partieAvecDeux(), cree: vieux, actif: vieux }, { admin: true });
    const r = await E.rest('PATCH', 'parties/RUNE', { cree: Date.now(), actif: ts });
    assert.equal(r.statut, 401, `partie expirée ranimée avec ses anciennes personnes (${r.statut})`);
  });
  // Variantes voisines (phase 4, itération 1, retest final) : autres chemins d'écriture sur une partie expirée
  // et sur une partie commencée. Toutes doivent être refusées ; seule la suppression complète de la partie est permise.
  it('D7/D8 (variantes) : une partie expirée refuse toute écriture partielle ou complète (actif seul, arrivée, statut, emblème)', async () => {
    const vieux = Date.now() - EXPIRATION_SALLE_MS;
    const expiree = () => ({ ...partieAvecDeux(), cree: vieux, actif: vieux });
    const essais = [
      ['PUT', 'parties/RUNE/actif', ts],
      ['PUT', `parties/RUNE/joueurs/${C}`, { rang: 2, pret: false }],
      ['PUT', 'parties/RUNE/statut', 'salle'],
      ['PATCH', 'parties/RUNE', { [`joueurs/${B}/embleme`]: 'sirene', 'emblemes/sirene': B, 'emblemes/fee': null }],
      ['PUT', 'parties/RUNE', { ...expiree(), nb: 1, hote: C, joueurs: { [C]: { rang: 0, pret: false } }, emblemes: {} }],
    ];
    for (const [methode, chemin, valeur] of essais) {
      await E.rest('PUT', 'parties/RUNE', expiree(), { admin: true });
      const r = await E.rest(methode, chemin, valeur);
      assert.equal(r.statut, 401, `${methode} ${chemin} sur une partie expirée : accepté (${JSON.stringify(r.corps)})`);
    }
    await E.rest('PUT', 'parties/RUNE', expiree(), { admin: true });
    assert.equal((await E.rest('DELETE', 'parties/RUNE')).statut, 200, 'suppression complète permise');
  });

  it('D6 (variantes) : une partie commencée garde son ordre tel quel (effacer, retirer, réécrire une position, retirer la personne)', async () => {
    await E.rest('PUT', 'parties/RUNE', partieAvecDeux({ aPret: true }), { admin: true });
    await E.rest('PATCH', 'parties/RUNE', { [`joueurs/${B}`]: { rang: 1, pret: true, prenom: 'Tom', embleme: 'fee' }, nb: 2, actif: ts, 'emblemes/fee': B });
    assert.ok((await E.rest('PATCH', 'parties/RUNE', { statut: 'partie', ordre: [A, B] })).ok, 'départ valide');
    const essais = [
      ['DELETE', 'parties/RUNE/ordre'],
      ['DELETE', 'parties/RUNE/ordre/1'],
      ['PUT', 'parties/RUNE/ordre/0', B],
      ['PUT', 'parties/RUNE/ordre/1', A],
      ['PUT', 'parties/RUNE/ordre', null],
      ['DELETE', `parties/RUNE/joueurs/${B}`],
    ];
    for (const [methode, chemin, valeur] of essais) {
      const r = await E.rest(methode, chemin, valeur);
      assert.equal(r.statut, 401, `${methode} ${chemin} après le départ : accepté (${JSON.stringify(r.corps)})`);
    }
    const etat = (await E.rest('GET', 'parties/RUNE', undefined, { admin: true })).corps;
    assert.deepEqual(etat.ordre, [A, B], 'ordre inchangé');
    assert.equal(etat.statut, 'partie');
  });

  it('D4/D5 (variantes) : aucun départ ni arrivée possibles à partir d\'une partie expirée', async () => {
    const vieux = Date.now() - EXPIRATION_SALLE_MS;
    await E.rest('PUT', 'parties/RUNE', { ...partieAvecDeux({ aPret: true }), cree: vieux, actif: vieux }, { admin: true });
    assert.equal((await E.rest('PATCH', 'parties/RUNE', { statut: 'partie', ordre: [A, B] })).statut, 401, 'départ d\'une partie expirée');
  });

  // Remarque 1 de la propriétaire (itération 1) : deux délais d'expiration, 30 minutes pour une salle d'attente,
  // 3 heures pour une partie démarrée.
  const minute = 60 * 1000;
  const partieDemarree = (depuis) => ({
    ...partieAvecDeux(),
    cree: Date.now() - depuis,
    actif: Date.now() - depuis,
    statut: 'partie',
    joueurs: {
      [A]: { rang: 0, pret: true, prenom: 'Lea', embleme: 'demon' },
      [B]: { rang: 1, pret: true, prenom: 'Tom', embleme: 'fee' },
    },
    ordre: [A, B],
  });
  const salleInactive = (depuis) => ({ ...partieAvecDeux(), cree: Date.now() - depuis, actif: Date.now() - depuis });

  it('expiration (règles) : salle modifiable à 29 min, refusée à 31 min ; partie démarrée modifiable à 31 min, refusée après 3 h', async () => {
    await E.rest('PUT', 'parties/RUNE', salleInactive(29 * minute), { admin: true });
    assert.ok((await E.rest('PUT', 'parties/RUNE/actif', ts)).ok, 'salle inactive depuis 29 min encore modifiable');
    await E.rest('PUT', 'parties/RUNE', salleInactive(31 * minute), { admin: true });
    assert.equal((await E.rest('PUT', 'parties/RUNE/actif', ts)).statut, 401, 'salle inactive depuis 31 min expirée');
    await E.rest('PUT', 'parties/RUNE', partieDemarree(31 * minute), { admin: true });
    assert.ok((await E.rest('PUT', 'parties/RUNE/actif', ts)).ok, 'partie démarrée inactive depuis 31 min encore modifiable');
    await E.rest('PUT', 'parties/RUNE', partieDemarree(EXPIRATION_PARTIE_MS - minute), { admin: true });
    assert.ok((await E.rest('PUT', 'parties/RUNE/actif', ts)).ok, 'partie démarrée inactive depuis 2 h 59 encore modifiable');
    await E.rest('PUT', 'parties/RUNE', partieDemarree(EXPIRATION_PARTIE_MS + minute), { admin: true });
    assert.equal((await E.rest('PUT', 'parties/RUNE/actif', ts)).statut, 401, 'partie démarrée inactive depuis plus de 3 h expirée');
    assert.equal((await E.rest('DELETE', 'parties/RUNE')).statut, 200, 'suppression complète permise');
  });

  it('expiration (salon.js) : la salle inactive depuis 31 min est nettoyée, la partie démarrée inactive depuis 31 min est gardée', async () => {
    const { salon: S } = await E.chargerModules();
    const c = E.client();
    try {
      await E.rest('PUT', 'parties/RUNE', salleInactive(31 * minute), { admin: true });
      await E.rest('PUT', 'parties/ONYX', partieDemarree(31 * minute), { admin: true });
      await E.rest('PUT', 'parties/AURORE', partieDemarree(EXPIRATION_PARTIE_MS + minute), { admin: true });
      assert.deepEqual([...await S.codesPris(c.fb, ['RUNE', 'ONYX', 'AURORE'])], ['ONYX']);
      assert.equal((await E.rest('GET', 'parties/RUNE', undefined, { admin: true })).corps, null, 'salle expirée supprimée');
      assert.equal((await E.rest('GET', 'parties/AURORE', undefined, { admin: true })).corps, null, 'partie expirée supprimée');
      assert.equal((await S.rejoindrePartie(c.fb, { code: 'ONYX', id: C })).issue, S.ISSUES.COMMENCEE, 'partie démarrée toujours là');
    } finally {
      await c.fermer();
    }
  });
  it('création sur un code expiré (salon.js) : la partie expirée est supprimée puis remplacée ; si quelqu\'un crée entre-temps, « pris »', async () => {
    const { salon: S } = await E.chargerModules();
    const config = E.lireJson('config.json');
    const vieux = Date.now() - EXPIRATION_SALLE_MS;
    const c = E.client();
    try {
      // Cas normal : code expiré, création réussie avec la nouvelle hôte.
      await E.rest('PUT', 'parties/RUNE', { ...partieAvecDeux(), cree: vieux, actif: vieux }, { admin: true });
      const moi = 'e'.repeat(32);
      const r = await S.creerPartie(c.fb, { code: 'RUNE', id: moi, config });
      assert.equal(r.issue, S.ISSUES.OK);
      assert.equal(r.partie.hote, moi);
      assert.ok(c.espion.suppressions.includes('parties/RUNE'), 'la partie expirée a été supprimée');

      // Course : quelqu'un d'autre crée la partie juste après la suppression : résultat « pris ».
      await E.rest('DELETE', 'parties/RUNE', undefined, { admin: true });
      await E.rest('PUT', 'parties/RUNE', { ...partieAvecDeux(), cree: vieux, actif: vieux }, { admin: true });
      const concurrent = E.client();
      const fbCourse = { ...c.fb, remove: async (ref) => {
        await c.fb.remove(ref);
        await S.creerPartie(concurrent.fb, { code: 'RUNE', id: 'f'.repeat(32), config });
      } };
      const perdu = await S.creerPartie(fbCourse, { code: 'RUNE', id: 'g'.repeat(32), config });
      assert.equal(perdu.issue, S.ISSUES.PRIS, 'une création faite entre-temps n\'est pas écrasée');
      assert.equal((await E.rest('GET', 'parties/RUNE/hote', undefined, { admin: true })).corps, 'f'.repeat(32));
      await concurrent.fermer();
    } finally {
      await c.fermer();
    }
  });
});
