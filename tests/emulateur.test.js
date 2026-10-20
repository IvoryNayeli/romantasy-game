'use strict';

// Phase 4 : salle d'attente en réseau, sur l'émulateur Firebase LOCAL uniquement (voir aide-emulateur.js).
// Clients simultanés, sixième personne refusée, même emblème visé en même temps, code introuvable, code déjà pris,
// règles de sécurité (taille, forme), non-boucle d'écriture, écoutes limitées au chemin de la partie, nettoyage.
// Lancer : npm run test:emulateur (ou npm test).

const { describe, it, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const E = require('./aide-emulateur.js');

// Base propre à ce fichier : les tests de navigateur, lancés en parallèle, utilisent celle du jeu.
E.utiliserBase('demo-romantasy-tests-noeud');

const config = E.lireJson('config.json');
const cartes = E.lireJson('cartes.json');
const codes = E.lireJson('codes.json');
const emblemes = E.lireJson('emblemes.json').map((e) => e.id);

const attendre = (ms) => new Promise((ok) => setTimeout(ok, ms));

describe('émulateur : salle d\'attente en réseau', () => {
  let S;
  let C;
  const ouverts = [];
  const nouveauClient = () => { const c = E.client(); ouverts.push(c); return c; };
  const id = () => S.nouvelIdentifiant();

  before(async () => {
    E.adresseEmulateur(); // échoue avec un message clair si l'émulateur n'a pas été démarré
    await E.chargerRegles();
    ({ salon: S, config: C } = await E.chargerModules());
  });
  beforeEach(async () => { await E.viderBase(); });
  after(async () => {
    await Promise.all(ouverts.map((c) => c.fermer()));
    await E.viderBase();
  });

  // Partie créée par un premier client ; renvoie le client et l'identifiant de l'hôte.
  async function partieCreee(code = 'RUNE') {
    const hote = nouveauClient();
    const idHote = id();
    const r = await S.creerPartie(hote.fb, { code, id: idHote, config });
    assert.equal(r.issue, S.ISSUES.OK);
    return { hote, idHote, partie: r.partie };
  }

  it('les règles de sécurité sont bien actives : lecture et écoute de la racine ou de « parties » refusées', async () => {
    for (const chemin of ['', 'parties']) {
      const r = await E.rest('GET', chemin);
      assert.equal(r.statut, 401, `lecture de « /${chemin} » : ${JSON.stringify(r.corps)}`);
    }
    const c = nouveauClient();
    const { ref, onValue } = require('firebase/database');
    const erreur = await new Promise((ok) => { onValue(ref(c.fb.db, 'parties'), () => ok(null), (e) => ok(e)); });
    assert.ok(erreur, 'l\'écoute de « parties » doit être refusée par le serveur');
    assert.match(String(erreur.message || erreur), /permission/i);
  });

  it('créer : la partie a la forme attendue (hôte au rang 0, places de config.json, statut « salle »)', async () => {
    const { idHote, partie } = await partieCreee('ONYX');
    assert.equal(partie.hote, idHote);
    assert.equal(partie.max, config.joueursMax);
    assert.equal(partie.nb, 1);
    assert.equal(partie.statut, 'salle');
    assert.deepEqual(partie.joueurs, { [idHote]: { rang: 0, pret: false } });
    assert.equal(typeof partie.cree, 'number');
    assert.equal(typeof partie.actif, 'number');
    assert.ok(Math.abs(partie.actif - Date.now()) < 60000, 'horodatage du serveur');
  });

  it('code déjà pris : une deuxième partie ne peut pas prendre un code en cours (y compris en même temps)', async () => {
    await partieCreee('RUNE');
    const autre = nouveauClient();
    assert.equal((await S.creerPartie(autre.fb, { code: 'RUNE', id: id(), config })).issue, S.ISSUES.PRIS);

    const clients = [nouveauClient(), nouveauClient(), nouveauClient()];
    const issues = await Promise.all(clients.map((c) => S.creerPartie(c.fb, { code: 'ONYX', id: id(), config })));
    assert.equal(issues.filter((r) => r.issue === S.ISSUES.OK).length, 1, 'une seule création réussit');
    assert.equal(issues.filter((r) => r.issue === S.ISSUES.PRIS).length, clients.length - 1);

    const pris = await S.codesPris(autre.fb, codes);
    assert.deepEqual([...pris].sort(), ['ONYX', 'RUNE']);
  });

  it('code introuvable : rejoindre un code sans partie est refusé, sans rien écrire', async () => {
    const c = nouveauClient();
    const r = await S.rejoindrePartie(c.fb, { code: 'AURORE', id: id() });
    assert.equal(r.issue, S.ISSUES.INTROUVABLE);
    assert.equal((await E.rest('GET', 'parties/AURORE', undefined, { admin: true })).corps, null);
  });

  it('clients simultanés : une personne de plus que les places tente de rejoindre en même temps ; la sixième est refusée', async () => {
    const { idHote } = await partieCreee('CRYPTE');
    const candidats = Array.from({ length: config.joueursMax }, () => ({ c: nouveauClient(), id: id() }));
    const issues = await Promise.all(candidats.map(({ c, id: i }) => S.rejoindrePartie(c.fb, { code: 'CRYPTE', id: i })));
    const acceptes = issues.filter((r) => r.issue === S.ISSUES.OK).length;
    assert.equal(acceptes, config.joueursMax - 1, 'toutes les places restantes sont prises, pas une de plus');
    assert.equal(issues.filter((r) => r.issue === S.ISSUES.COMPLETE).length, 1, 'une seule personne voit « La partie est complète »');

    const partie = (await E.rest('GET', 'parties/CRYPTE', undefined, { admin: true })).corps;
    assert.equal(Object.keys(partie.joueurs).length, config.joueursMax);
    assert.equal(partie.nb, config.joueursMax);
    const rangs = Object.values(partie.joueurs).map((j) => j.rang).sort((a, b) => a - b);
    assert.deepEqual(rangs, Array.from({ length: config.joueursMax }, (_, i) => i), 'rangs uniques, sans trou');
    assert.equal(partie.joueurs[idHote].rang, 0, 'l\'hôte reste le premier');

    // Une personne déjà inscrite qui réessaie (délai réseau) est acceptée sans prendre une deuxième place.
    const deja = candidats.find((x, i) => issues[i].issue === S.ISSUES.OK);
    assert.equal((await S.rejoindrePartie(deja.c.fb, { code: 'CRYPTE', id: deja.id })).issue, S.ISSUES.OK);
    const encore = nouveauClient();
    assert.equal((await S.rejoindrePartie(encore.fb, { code: 'CRYPTE', id: id() })).issue, S.ISSUES.COMPLETE);
  });

  it('ordre d\'arrivée : le rang suit l\'ordre des jonctions (il servira d\'ordre des tours)', async () => {
    const { hote, idHote } = await partieCreee('GRIMOIRE');
    const ids = [idHote];
    for (let i = 1; i < config.joueursMax; i += 1) {
      const c = nouveauClient();
      const moi = id();
      assert.equal((await S.rejoindrePartie(c.fb, { code: 'GRIMOIRE', id: moi })).issue, S.ISSUES.OK);
      ids.push(moi);
    }
    const partie = (await E.rest('GET', 'parties/GRIMOIRE', undefined, { admin: true })).corps;
    assert.deepEqual(S.joueursOrdonnes(partie).map((j) => j.id), ids);
    assert.ok(hote);
  });

  it('même emblème visé en même temps : une seule personne l\'obtient, les autres le voient pris (répété)', async () => {
    const { hote, idHote } = await partieCreee('TALISMAN');
    const membres = [{ c: hote, id: idHote }];
    for (let i = 1; i < config.joueursMax; i += 1) {
      const m = { c: nouveauClient(), id: id() };
      await S.rejoindrePartie(m.c.fb, { code: 'TALISMAN', id: m.id });
      membres.push(m);
    }
    for (const embleme of emblemes.slice(0, membres.length)) {
      const libres = [];
      for (const m of membres) if (!m.embleme) libres.push(m);
      const issues = await Promise.all(libres.map((m) => S.choisirEmbleme(m.c.fb, { code: 'TALISMAN', id: m.id, embleme })));
      const gagnants = libres.filter((_, i) => issues[i].issue === S.ISSUES.OK);
      assert.equal(gagnants.length, 1, `« ${embleme} » : une seule personne`);
      assert.ok(issues.every((r) => r.issue === S.ISSUES.OK || r.issue === S.ISSUES.PRIS));
      gagnants[0].embleme = embleme;
    }
    const partie = (await E.rest('GET', 'parties/TALISMAN', undefined, { admin: true })).corps;
    for (const m of membres) {
      assert.equal(partie.joueurs[m.id].embleme, m.embleme);
      assert.equal(partie.emblemes[m.embleme], m.id);
    }
  });

  it('emblème : en changer libère l\'ancien ; « Je rejoins l\'aventure » exige prénom et emblème, puis devient définitif', async () => {
    const { hote, idHote } = await partieCreee('ELIXIR');
    const autre = { c: nouveauClient(), id: id() };
    await S.rejoindrePartie(autre.c.fb, { code: 'ELIXIR', id: autre.id });

    assert.equal((await S.confirmerPresence(hote.fb, { code: 'ELIXIR', id: idHote, prenom: 'Léa' })).issue, S.ISSUES.REFUSE, 'sans emblème');
    await S.choisirEmbleme(hote.fb, { code: 'ELIXIR', id: idHote, embleme: 'demon' });
    await S.choisirEmbleme(hote.fb, { code: 'ELIXIR', id: idHote, embleme: 'fee' });
    assert.equal((await S.choisirEmbleme(autre.c.fb, { code: 'ELIXIR', id: autre.id, embleme: 'demon' })).issue, S.ISSUES.OK, 'démon libéré');
    assert.equal((await S.choisirEmbleme(autre.c.fb, { code: 'ELIXIR', id: autre.id, embleme: 'fee' })).issue, S.ISSUES.PRIS);

    assert.equal((await S.confirmerPresence(hote.fb, { code: 'ELIXIR', id: idHote, prenom: '   ' })).issue, S.ISSUES.REFUSE, 'prénom vide');
    assert.equal((await S.confirmerPresence(hote.fb, { code: 'ELIXIR', id: idHote, prenom: 'x'.repeat(S.PRENOM_MAX + 1) })).issue, S.ISSUES.REFUSE);
    const r = await S.confirmerPresence(hote.fb, { code: 'ELIXIR', id: idHote, prenom: '  Léa ' });
    assert.equal(r.issue, S.ISSUES.OK);
    assert.deepEqual(r.partie.joueurs[idHote], { rang: 0, pret: true, prenom: 'Léa', embleme: 'fee' });
    assert.equal((await S.choisirEmbleme(hote.fb, { code: 'ELIXIR', id: idHote, embleme: 'elfe' })).issue, S.ISSUES.REFUSE, 'verrouillé');
  });

  it('« Commencer la quête » : hôte seulement, dès 2 présences confirmées ; ensuite, plus personne ne rejoint', async () => {
    const { hote, idHote } = await partieCreee('SORTILEGE');
    const autre = { c: nouveauClient(), id: id() };
    await S.rejoindrePartie(autre.c.fb, { code: 'SORTILEGE', id: autre.id });
    await S.choisirEmbleme(hote.fb, { code: 'SORTILEGE', id: idHote, embleme: 'sirene' });
    await S.confirmerPresence(hote.fb, { code: 'SORTILEGE', id: idHote, prenom: 'Noa' });
    assert.equal((await S.commencerPartie(hote.fb, { code: 'SORTILEGE', id: idHote, cartes, config })).issue, S.ISSUES.REFUSE, 'une seule présence');
    await S.choisirEmbleme(autre.c.fb, { code: 'SORTILEGE', id: autre.id, embleme: 'elfe' });
    await S.confirmerPresence(autre.c.fb, { code: 'SORTILEGE', id: autre.id, prenom: 'Sacha' });
    assert.equal((await S.commencerPartie(autre.c.fb, { code: 'SORTILEGE', id: autre.id, cartes, config })).issue, S.ISSUES.REFUSE, 'pas l\'hôte');
    const r = await S.commencerPartie(hote.fb, { code: 'SORTILEGE', id: idHote, cartes, config });
    assert.equal(r.issue, S.ISSUES.OK);
    assert.equal(r.partie.statut, 'partie');
    const tard = nouveauClient();
    assert.equal((await S.rejoindrePartie(tard.fb, { code: 'SORTILEGE', id: id() })).issue, S.ISSUES.COMMENCEE);
  });

  it('nettoyage : une salle inactive depuis plus que l\'expiration libère son code et est supprimée', async () => {
    const vieux = Date.now() - S.EXPIRATION_SALLE_MS - 60000;
    const ancienne = (hote) => ({ cree: vieux, actif: vieux, hote, max: config.joueursMax, nb: 1, statut: 'salle', joueurs: { [hote]: { rang: 0, pret: false } } });
    await E.rest('PUT', 'parties/RUNE', ancienne(id()), { admin: true });
    await E.rest('PUT', 'parties/ONYX', ancienne(id()), { admin: true });
    await E.rest('PUT', 'parties/AURORE', ancienne(id()), { admin: true });
    const c = nouveauClient();

    // Lecture des codes pris (écran « Créer ») : les parties expirées sont supprimées au passage.
    assert.deepEqual([...await S.codesPris(c.fb, codes)], []);
    assert.equal((await E.rest('GET', 'parties/RUNE', undefined, { admin: true })).corps, null);

    // Jonction d'une partie expirée : code introuvable, partie supprimée.
    await E.rest('PUT', 'parties/RUNE', ancienne(id()), { admin: true });
    assert.equal((await S.rejoindrePartie(c.fb, { code: 'RUNE', id: id() })).issue, S.ISSUES.INTROUVABLE);
    assert.equal((await E.rest('GET', 'parties/RUNE', undefined, { admin: true })).corps, null);

    // Création à la place d'une partie expirée : la partie expirée est supprimée, puis la nouvelle est créée.
    await E.rest('PUT', 'parties/RUNE', ancienne(id()), { admin: true });
    const moi = id();
    const r = await S.creerPartie(c.fb, { code: 'RUNE', id: moi, config });
    assert.equal(r.issue, S.ISSUES.OK);
    assert.equal(r.partie.hote, moi);

    // Partie terminée : supprimée sur demande.
    await S.supprimerPartie(c.fb, 'RUNE');
    assert.equal((await E.rest('GET', 'parties/RUNE', undefined, { admin: true })).corps, null);
  });

  it('non-boucle d\'écriture : chaque action fait une seule écriture, les écoutes n\'écrivent jamais', async () => {
    const membres = [];
    const { hote, idHote } = await partieCreee('ECLIPSE');
    membres.push({ c: hote, id: idHote });
    for (let i = 1; i < 3; i += 1) {
      const m = { c: nouveauClient(), id: id() };
      await S.rejoindrePartie(m.c.fb, { code: 'ECLIPSE', id: m.id });
      membres.push(m);
    }
    const evenements = membres.map(() => 0);
    const arrets = membres.map((m, i) => S.ecouterPartie(m.c.fb, 'ECLIPSE', () => { evenements[i] += 1; }));
    await attendre(300);
    for (const m of membres) m.c.espion.transactions.length = 0;

    const actions = [];
    for (const [i, m] of membres.entries()) {
      actions.push(S.choisirEmbleme(m.c.fb, { code: 'ECLIPSE', id: m.id, embleme: emblemes[i] }));
    }
    await Promise.all(actions);
    for (const m of membres) await S.confirmerPresence(m.c.fb, { code: 'ECLIPSE', id: m.id, prenom: 'P' });
    await S.commencerPartie(hote.fb, { code: 'ECLIPSE', id: idHote, cartes, config });
    await attendre(300);

    const nbActions = membres.length * 2 + 1;
    const transactions = membres.reduce((n, m) => n + m.c.espion.transactions.length, 0);
    assert.equal(transactions, nbActions, 'une transaction par action, aucune de plus');
    const suppressions = membres.reduce((n, m) => n + m.c.espion.suppressions.length, 0);
    assert.equal(suppressions, 0);

    // Calme plat : plus aucun événement une fois les actions terminées.
    const avant = evenements.slice();
    await attendre(1000);
    assert.deepEqual(evenements, avant, 'aucune écriture en retour après les événements reçus');
    for (const n of avant) assert.ok(n <= nbActions + 1, `nombre d'événements borné (${n})`);
    arrets.forEach((arreter) => arreter());
  });

  it('écoutes limitées au chemin de la partie : seule `parties/<CODE>` est écoutée, jamais la racine', async () => {
    const { hote } = await partieCreee('OBSIDIENNE');
    hote.espion.ecoutes.length = 0;
    const arreter = S.ecouterPartie(hote.fb, 'OBSIDIENNE', () => {});
    arreter();
    assert.deepEqual(hote.espion.ecoutes, ['parties/OBSIDIENNE']);
    hote.espion.lectures.length = 0;
    await S.codesPris(hote.fb, codes);
    assert.deepEqual(hote.espion.lectures, codes.flatMap((c) => [`parties/${c}/actif`, `parties/${c}/statut`]), 'lectures ponctuelles, code par code');
    assert.throws(() => S.ecouterPartie(hote.fb, '', () => {}), /invalide/);
    assert.throws(() => S.ecouterPartie(hote.fb, '../', () => {}), /invalide/);
  });

  describe('règles de sécurité (écritures brutes, sans passer par le jeu)', () => {
    const ts = { '.sv': 'timestamp' };
    const idA = 'a'.repeat(32);
    const idB = 'b'.repeat(32);
    const base = (extra = {}) => ({
      cree: ts, actif: ts, hote: idA, max: config.joueursMax, nb: 1, statut: 'salle',
      joueurs: { [idA]: { rang: 0, pret: false } }, ...extra,
    });
    const refuse = async (chemin, valeur, message, methode = 'PUT') => {
      const r = await E.rest(methode, chemin, valeur);
      assert.equal(r.statut, 401, `${message} : devrait être refusé (${JSON.stringify(r.corps)})`);
    };
    const accepte = async (chemin, valeur, message, methode = 'PUT') => {
      const r = await E.rest(methode, chemin, valeur);
      assert.ok(r.ok, `${message} : devrait être accepté (${JSON.stringify(r.corps)})`);
    };

    it('forme : partie valide acceptée ; champ inconnu, type faux, champ manquant ou code hors liste refusés', async () => {
      await accepte('parties/RUNE', base(), 'partie valide');
      await E.viderBase();
      await refuse('parties/DRAGON', base(), 'code hors de codes.json');
      await refuse('parties/rune', base(), 'code en minuscules');
      await refuse('autre', { x: 1 }, 'écriture hors de « parties »');
      await refuse('parties/RUNE', base({ intrus: 1 }), 'champ inconnu');
      await refuse('parties/RUNE', { ...base(), statut: undefined }, 'statut manquant');
      await refuse('parties/RUNE', base({ statut: 'fin' }), 'statut inconnu');
      await refuse('parties/RUNE', base({ max: '5' }), 'max en texte');
      await refuse('parties/RUNE', base({ cree: Date.now() + 3600000 }), 'horodatage dans le futur');
      await refuse('parties/RUNE', base({ hote: idB }), 'hôte absent de la liste');
      await refuse('parties/RUNE', base({ joueurs: { court: { rang: 0, pret: false } } }), 'identifiant trop court');
      await refuse('parties/RUNE', base({ joueurs: { [idA]: { rang: 0, pret: false, intrus: true } } }), 'champ inconnu chez une personne');
      await refuse('parties/RUNE', base({ joueurs: { [idA]: { rang: 0, pret: 'oui' } } }), 'pret en texte');
    });

    it('taille : prénom borné, places bornées par max, pas plus de places que d\'emblèmes', async () => {
      const avecPrenom = (prenom) => base({
        joueurs: { [idA]: { rang: 0, pret: true, prenom, embleme: 'demon' } }, emblemes: { demon: idA },
      });
      await refuse('parties/RUNE', avecPrenom('x'.repeat(25)), 'prénom de 25 caractères');
      await refuse('parties/RUNE', avecPrenom(''), 'prénom vide');
      await refuse('parties/RUNE', avecPrenom('   '), 'prénom fait d\'espaces');
      await accepte('parties/RUNE', avecPrenom('x'.repeat(24)), 'prénom de 24 caractères');
      await E.viderBase();
      await refuse('parties/RUNE', base({ max: 11 }), 'plus de places que d\'emblèmes');
      await refuse('parties/RUNE', base({ nb: config.joueursMax + 1 }), 'nb au-delà de max');

      // Partie pleine (écrite en administrateur), puis tentative d'ajouter une personne de plus, sans transaction.
      const joueurs = {};
      for (let i = 0; i < config.joueursMax; i += 1) joueurs[`j${String(i).repeat(19)}`] = { rang: i, pret: false };
      const pleine = { ...base(), hote: `j${'0'.repeat(19)}`, nb: config.joueursMax, joueurs, cree: Date.now(), actif: Date.now() };
      await E.rest('PUT', 'parties/RUNE', pleine, { admin: true });
      await refuse('parties/RUNE/joueurs/' + 'z'.repeat(20), { rang: config.joueursMax, pret: false }, 'personne en trop (rang = max)');
      await refuse('parties/RUNE', { ...pleine, nb: config.joueursMax + 1, joueurs: { ...joueurs, ['z'.repeat(20)]: { rang: config.joueursMax, pret: false } }, actif: ts }, 'personne en trop (nb > max)');
    });

    it('invariants : emblème unique, rang et présence non modifiables, code en cours non réattribuable', async () => {
      await refuse('parties/RUNE', base({
        nb: 2, joueurs: { [idA]: { rang: 0, pret: false }, [idB]: { rang: 1, pret: false } },
      }), 'création d\'une partie avec déjà deux personnes');
      await accepte('parties/RUNE', base(), 'création');
      await accepte('parties/RUNE', { nb: 2, actif: ts, [`joueurs/${idB}`]: { rang: 1, pret: false } }, 'arrivée au bon rang', 'PATCH');
      await refuse('parties/RUNE', { nb: 3, actif: ts, [`joueurs/${'c'.repeat(32)}`]: { rang: 1, pret: false } }, 'arrivée avec un rang déjà pris', 'PATCH');
      await E.viderBase();
      await accepte('parties/RUNE', base({ joueurs: { [idA]: { rang: 0, pret: false, embleme: 'demon' } }, emblemes: { demon: idA } }), 'base');
      await refuse('parties/RUNE/joueurs/' + idB, { rang: 1, pret: false, embleme: 'demon' }, 'même emblème qu\'une autre personne');
      await refuse('parties/RUNE/emblemes/demon', idB, 'emblème réattribué sans changer la fiche');
      await refuse('parties/RUNE/emblemes/griffon', idA, 'emblème inconnu');
      await refuse('parties/RUNE/joueurs/' + idA + '/rang', 3, 'rang modifié');
      await refuse('parties/RUNE/nb', 3, 'nb qui saute une arrivée');
      await refuse('parties/RUNE/hote', idB, 'hôte remplacé');
      await refuse('parties/RUNE', base({ hote: idB, joueurs: { [idB]: { rang: 0, pret: false } } }), 'code en cours repris par une autre partie');
      await accepte('parties/RUNE/joueurs/' + idA, { rang: 0, pret: true, prenom: 'Léa', embleme: 'demon' }, 'présence confirmée');
      await refuse('parties/RUNE/joueurs/' + idA + '/pret', false, 'présence retirée');
      await refuse('parties/RUNE/joueurs/' + idA + '/prenom', 'Tom', 'prénom changé après « Je rejoins l\'aventure »');
      await refuse('parties/RUNE/statut', 'partie', 'départ sans l\'ordre des présences');
      await refuse('parties/RUNE', { statut: 'partie', ordre: [idA, idA] }, 'départ avec une seule personne (en double)', 'PATCH');
      await refuse('parties/RUNE', { statut: 'partie', ordre: [idA, idB] }, 'départ avec une personne absente', 'PATCH');
      await refuse('parties/RUNE/ordre', [idA, idA], 'ordre écrit pendant la salle');
      await accepte('parties/RUNE', {
        nb: 2, actif: ts, [`joueurs/${idB}`]: { rang: 1, pret: true, prenom: 'Tom', embleme: 'fee' }, 'emblemes/fee': idB,
      }, 'arrivée et présence d\'une deuxième personne', 'PATCH');
      await accepte('parties/RUNE', { statut: 'partie', ordre: [idA, idB] }, 'partie commencée avec deux présences', 'PATCH');
      await refuse('parties/RUNE/ordre/1', idA, 'ordre modifié après le départ');
      await refuse('parties/RUNE/ordre', undefined, 'ordre effacé après le départ', 'DELETE');
      await refuse('parties/RUNE/ordre/1', undefined, 'personne retirée de l\'ordre', 'DELETE');
      await refuse('parties/RUNE/ordre/2', idA, 'personne ajoutée à l\'ordre');
      await refuse('parties/RUNE/ordre', [idB, idA], 'ordre réécrit');
      await refuse('parties/RUNE', { nb: 3, actif: ts, [`joueurs/${'c'.repeat(32)}`]: { rang: 2, pret: false } }, 'arrivée après le départ', 'PATCH');
      await refuse(`parties/RUNE/joueurs/${idA}`, undefined, 'personne prête retirée', 'DELETE');
      await refuse('parties/RUNE/emblemes/demon', undefined, 'emblème libéré alors que la personne le porte', 'DELETE');

      // Partie expirée : une simple écriture ne la fait pas revivre (seule une nouvelle création la remplace).
      const vieux = Date.now() - S.EXPIRATION_SALLE_MS - 60000;
      await E.rest('PUT', 'parties/ONYX', { ...base(), cree: vieux, actif: vieux }, { admin: true });
      await refuse('parties/ONYX/actif', ts, 'partie expirée ranimée');
      await refuse('parties/ONYX', { nb: 2, actif: ts, [`joueurs/${idB}`]: { rang: 1, pret: false } }, 'arrivée dans une partie expirée', 'PATCH');
      // Une partie expirée n'est plus modifiable du tout, par aucun chemin ; seule sa suppression complète est permise.
      await refuse('parties/ONYX', base({ hote: idB, joueurs: { [idB]: { rang: 0, pret: false } } }), 'remplacement sur place d\'une partie expirée');
      await refuse('parties/ONYX', { cree: ts, actif: ts }, 'horodatages changés seuls', 'PATCH');
      await refuse('parties/ONYX/hote', idA, 'hôte réécrit');
      await refuse('parties/ONYX/statut', 'salle', 'statut réécrit');
      await refuse('parties/ONYX/max', config.joueursMax, 'max réécrit');
      await refuse(`parties/ONYX/joueurs/${idA}/pret`, false, 'fiche réécrite');
      await refuse(`parties/ONYX/joueurs/${idA}`, undefined, 'personne retirée', 'DELETE');
      await refuse('parties/ONYX/emblemes', { demon: idA }, 'emblèmes réécrits');
      await refuse('parties/ONYX/intrus', 1, 'champ inconnu');
      await accepte('parties/ONYX', undefined, 'suppression de la partie expirée', 'DELETE');
      await accepte('parties/ONYX', base({ hote: idB, joueurs: { [idB]: { rang: 0, pret: false } } }), 'nouvelle partie sur l\'emplacement libéré');
      await refuse('parties/RUNE/statut', 'salle', 'retour en salle');
      await accepte('parties/RUNE', undefined, 'suppression', 'DELETE');
    });
  });
});
