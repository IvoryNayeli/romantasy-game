'use strict';

// Phase 6 : robustesse, sur l'émulateur Firebase LOCAL uniquement (voir aide-emulateur.js).
// Présence (une entrée par connexion, retirée par le serveur à la coupure), coupure réseau simulée et retour,
// absence prolongée et passage du tour d'une personne absente (par salon.js puis par écriture directe, règles
// de database.rules.json), et horloge du téléphone déréglée (expiration jugée à l'heure du serveur).
// Lancer : npm test (ou node scripts/avec-emulateur.js node --test tests/emulateur-robustesse.test.js).

const { describe, it, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const E = require('./aide-emulateur.js');

// Base propre à ce fichier : les autres fichiers de tests, lancés en parallèle, n'en sont pas dérangés.
E.utiliserBase('demo-romantasy-tests-robustesse');

const config = E.lireJson('config.json');
const cartes = E.lireJson('cartes.json');
const emblemes = E.lireJson('emblemes.json').map((e) => e.id);
const attendre = (ms) => new Promise((ok) => setTimeout(ok, ms));

describe('émulateur : robustesse (présence, coupure, absence, horloge)', () => {
  let S;
  let G;
  const ouverts = [];
  const nouveauClient = () => { const c = E.client(); ouverts.push(c); return c; };

  before(async () => {
    E.adresseEmulateur(); // échoue avec un message clair si l'émulateur n'a pas été démarré
    await E.chargerRegles();
    ({ salon: S, jeu: G } = await E.chargerModules());
  });
  beforeEach(async () => { await E.viderBase(); });
  after(async () => {
    await Promise.all(ouverts.map((c) => c.fermer()));
    await E.viderBase();
  });

  const lire = async (code) => (await E.rest('GET', `parties/${code}`, undefined, { admin: true })).corps;
  const courant = (partie) => partie.jeu.joueurs[partie.jeu.indexJoueur];
  // Attend qu'une condition sur la partie (lue en administrateur) soit vraie ; renvoie la partie.
  async function attendrePartie(code, condition, message) {
    let partie = null;
    for (let essai = 0; essai < 150; essai += 1) {
      partie = await lire(code);
      if (condition(partie)) return partie;
      await attendre(40);
    }
    assert.fail(`${message} (état : ${JSON.stringify(partie?.presents ?? null)})`);
    return partie;
  }

  // Partie commencée à `nombre`, chaque personne signalant sa présence (comme les écrans de la salle et du jeu).
  async function partieCommencee(code, nombre) {
    const membres = [];
    for (let i = 0; i < nombre; i += 1) {
      const m = { c: nouveauClient(), id: S.nouvelIdentifiant(), prenom: `P${i}` };
      if (i === 0) assert.equal((await S.creerPartie(m.c.fb, { code, id: m.id, config })).issue, S.ISSUES.OK);
      else assert.equal((await S.rejoindrePartie(m.c.fb, { code, id: m.id })).issue, S.ISSUES.OK);
      m.arreterPresence = S.signalerPresence(m.c.fb, code, m.id);
      membres.push(m);
    }
    for (const [i, m] of membres.entries()) {
      await S.choisirEmbleme(m.c.fb, { code, id: m.id, embleme: emblemes[i] });
      assert.equal((await S.confirmerPresence(m.c.fb, { code, id: m.id, prenom: m.prenom })).issue, S.ISSUES.OK);
    }
    assert.equal((await S.commencerPartie(membres[0].c.fb, { code, id: membres[0].id, cartes, config })).issue, S.ISSUES.OK);
    const partie = await attendrePartie(code, (p) => membres.every((m) => !S.estAbsent(p, m.id)), 'tout le monde présent');
    return { membres, partie };
  }

  it('présence : une entrée par connexion, retirée par le serveur à la coupure, rétablie au retour du réseau', async () => {
    const code = 'RUNE';
    const { membres: [a, b] } = await partieCommencee(code, 2);
    let partie = await lire(code);
    assert.equal(Object.keys(partie.presents[a.id]).length, 1, 'une seule connexion pour A');
    assert.match(Object.keys(partie.presents[a.id])[0], /^[-_A-Za-z0-9]{20}$/);

    // Coupure réseau simulée chez A : le serveur retire son entrée, A est absent pour tout le monde ; B reste présent.
    a.c.couper();
    partie = await attendrePartie(code, (p) => S.estAbsent(p, a.id), 'A absent après la coupure');
    assert.equal(S.estAbsent(partie, b.id), false);
    assert.equal(partie.statut, 'partie', 'la personne absente n\'est pas retirée de la partie');
    assert.ok(partie.joueurs[a.id] && partie.jeu.joueurs.includes(a.id));

    // Retour du réseau : reconnexion automatique du SDK, nouvelle entrée de présence, sans rien faire d'autre.
    a.c.retablir();
    partie = await attendrePartie(code, (p) => !S.estAbsent(p, a.id), 'A de retour après la reconnexion');
    assert.equal(Object.keys(partie.presents[a.id]).length, 1);

    // Fin de la présence (écran quitté) : l'entrée est retirée tout de suite, et plus rien ne revient à la coupure.
    a.arreterPresence();
    await attendrePartie(code, (p) => S.estAbsent(p, a.id), 'A absent après l\'arrêt de sa présence');
    a.c.couper();
    a.c.retablir();
    await attendre(500);
    assert.equal(S.estAbsent(await lire(code), a.id), true, 'aucune présence signalée après l\'arrêt');
  });

  it('présence : deux connexions de la même personne (changement de réseau) : la coupure de l\'ancienne n\'efface pas la nouvelle', async () => {
    const code = 'ONYX';
    const { membres: [a] } = await partieCommencee(code, 2);
    // Même identité, deuxième téléphone ou nouvel onglet après un rechargement, avant que l'ancien ne soit coupé.
    const c2 = nouveauClient();
    const arreter2 = S.signalerPresence(c2.fb, code, a.id);
    await attendrePartie(code, (p) => Object.keys(p.presents?.[a.id] || {}).length === 2, 'deux connexions');
    a.c.couper();
    const partie = await attendrePartie(code, (p) => Object.keys(p.presents?.[a.id] || {}).length === 1, 'ancienne connexion retirée');
    assert.equal(S.estAbsent(partie, a.id), false, 'toujours présent par la nouvelle connexion');
    arreter2();
    a.c.retablir();
  });

  it('présence : refusée pour une personne qui ne fait pas partie de la partie, et aucune trace après la suppression de la partie', async () => {
    const code = 'AURORE';
    const { membres: [a, b] } = await partieCommencee(code, 2);
    const inconnu = 'f'.repeat(32);
    const r = await E.rest('PUT', `parties/${code}/presents/${inconnu}/-AAAAAAAAAAAAAAAAAAA`, true);
    assert.equal(r.statut, 401, 'présence d\'une personne inconnue acceptée');
    const r2 = await E.rest('PUT', `parties/${code}/presents/${a.id}/-AAAAAAAAAAAAAAAAAAA`, 'oui');
    assert.equal(r2.statut, 401, 'présence autre que « true » acceptée');
    // « Nouvelle quête » : la partie est supprimée ; les retraits programmés à la coupure ne recréent rien.
    await S.supprimerPartie(b.c.fb, code);
    a.c.couper();
    b.c.couper();
    await attendre(500);
    assert.equal(await lire(code), null, 'aucune partie recréée par une présence');
    a.c.retablir();
    b.c.retablir();
    await attendre(300);
    assert.equal(await lire(code), null, 'la reconnexion n\'écrit rien dans une partie supprimée');
    a.arreterPresence();
    b.arreterPresence();
  });

  it('absence prolongée : le tour d\'une personne absente est passé par une autre, tour après tour, jusqu\'à la fin', async () => {
    const code = 'CRYPTE';
    const { membres } = await partieCommencee(code, 3);
    const [a, b, c] = membres;
    const parId = new Map(membres.map((m) => [m.id, m]));
    const passer = (qui, cible) => S.jouer(qui.c.fb, { code, id: qui.id, action: S.ACTIONS.PASSER, cible: cible.id });

    // Tant que A est présent, personne ne peut passer son tour.
    assert.equal((await passer(b, a)).issue, S.ISSUES.REFUSE, 'tour d\'une personne présente passé');

    // A part longtemps (coupure prolongée) : B passe son tour (aucune carte tirée).
    a.c.couper();
    await attendrePartie(code, (p) => S.estAbsent(p, a.id), 'A absent');
    assert.equal((await passer(b, b)).issue, S.ISSUES.REFUSE, 'son propre tour : refusé (le bouclier existe pour ça)');
    assert.equal((await passer(c, b)).issue, S.ISSUES.REFUSE, 'mauvaise cible : refusé');
    let r = await passer(b, a);
    assert.equal(r.issue, S.ISSUES.OK);
    assert.equal(r.partie.jeu.derniere.issue, G.ISSUES.PASSE);
    assert.equal(r.partie.jeu.derniere.joueur, a.id);
    assert.equal(r.partie.jeu.derniere.carte, undefined, 'aucune carte tirée');
    assert.equal(courant(r.partie), b.id);
    assert.equal((await passer(c, a)).issue, S.ISSUES.REFUSE, 'un tour n\'est jamais passé deux fois');

    // Le reste de la partie : B et C jouent, le tour de A est passé à chaque fois (une carte tirée juste avant la
    // coupure est aussi consumée).
    let partie = r.partie;
    let n = 1;
    while (partie.jeu.etape !== G.ETAPES.FIN) {
      const actif = parId.get(courant(partie));
      if (actif === a) {
        r = await passer(n % 2 ? c : b, a);
      } else {
        await S.jouer(actif.c.fb, { code, id: actif.id, action: S.ACTIONS.CHOISIR, type: n % 2 ? 'revelation' : 'epreuve' });
        r = await S.jouer(actif.c.fb, { code, id: actif.id, action: S.ACTIONS.SORT });
      }
      assert.equal(r.issue, S.ISSUES.OK);
      partie = r.partie;
      n += 1;
    }
    assert.equal(partie.jeu.jouees.length, membres.length * config.tours, 'chaque tour est compté, passé ou joué');
    assert.equal(partie.jeu.jouees.filter((j) => j.issue === G.ISSUES.PASSE).length, config.tours, 'les tours de A ont tous été passés');
    a.c.retablir();
  });

  it('carte tirée puis coupure : le tour passé consume la carte, sans effet durable ; la personne revenue retrouve la partie', async () => {
    const code = 'GRIMOIRE';
    const { membres: [a, b] } = await partieCommencee(code, 2);
    const tirage = await S.jouer(a.c.fb, { code, id: a.id, action: S.ACTIONS.CHOISIR, type: 'epreuve' });
    const carte = tirage.partie.jeu.carte;
    a.c.couper();
    await attendrePartie(code, (p) => S.estAbsent(p, a.id), 'A absent');
    const r = await S.jouer(b.c.fb, { code, id: b.id, action: S.ACTIONS.PASSER, cible: a.id });
    assert.equal(r.issue, S.ISSUES.OK);
    assert.deepEqual(r.partie.jeu.derniere, { carte, joueur: a.id, issue: G.ISSUES.PASSE });
    assert.equal(r.partie.jeu.effets, undefined, 'aucun effet durable');
    assert.ok(!Object.values(r.partie.jeu.piles).flat().includes(carte), 'la carte ne ressort pas');

    // Retour de A (reconnexion) : il voit la partie au tour de B et peut jouer à son tour suivant.
    a.c.retablir();
    let vue = null;
    const arreter = S.ecouterPartie(a.c.fb, code, (v) => { vue = v; });
    for (let i = 0; i < 100 && vue?.jeu?.indexJoueur !== 1; i += 1) await attendre(30);
    assert.equal(courant(vue), b.id);
    await S.jouer(b.c.fb, { code, id: b.id, action: S.ACTIONS.CHOISIR, type: 'revelation' });
    assert.equal((await S.jouer(b.c.fb, { code, id: b.id, action: S.ACTIONS.SORT })).issue, S.ISSUES.OK);
    assert.equal((await S.jouer(a.c.fb, { code, id: a.id, action: S.ACTIONS.CHOISIR, type: 'revelation' })).issue, S.ISSUES.OK);
    arreter();
  });

  describe('règles : passage de tour par écriture directe', () => {
    const refuse = async (methode, chemin, valeur, message) => {
      const r = await E.rest(methode, chemin, valeur);
      assert.equal(r.statut, 401, `${message} : accepté par la base (${JSON.stringify(r.corps)})`);
    };
    const passeSansCarte = (id, suite = {}) => ({
      etape: 'choix', indexJoueur: 1, 'jouees/0': { joueur: id, tour: 1, issue: 'passe' }, derniere: { joueur: id, issue: 'passe' }, ...suite,
    });

    it('passer le tour d\'une personne présente est refusé ; sans connexion, accepté ; les autres enchaînements restent refusés', async () => {
      const code = 'TALISMAN';
      const { membres: [a, b] } = await partieCommencee(code, 2);
      const chemin = `parties/${code}/jeu`;
      await refuse('PATCH', chemin, passeSansCarte(a.id), 'tour d\'une personne présente passé');

      a.c.couper();
      await attendrePartie(code, (p) => S.estAbsent(p, a.id), 'A absent');
      await refuse('PATCH', chemin, passeSansCarte(b.id), 'tour attribué à une autre personne');
      await refuse('PATCH', chemin, passeSansCarte(a.id, { indexJoueur: 0, tour: 2 }), 'tour sauté');
      await refuse('PATCH', chemin, passeSansCarte(a.id, { etape: 'fin' }), 'fin de partie au premier tour');
      await refuse('PATCH', chemin, {
        etape: 'choix', indexJoueur: 1, 'jouees/0': { joueur: a.id, tour: 1, issue: 'sort' }, derniere: { joueur: a.id, issue: 'sort' },
      }, 'sort jeté sans carte tirée');
      await refuse('PATCH', chemin, passeSansCarte(a.id, {
        'jouees/0': { carte: 'rev-01', joueur: a.id, tour: 1, issue: 'passe' }, derniere: { carte: 'rev-01', joueur: a.id, issue: 'passe' },
      }), 'carte inventée pour un tour passé sans carte tirée');
      const ok = await E.rest('PATCH', chemin, passeSansCarte(a.id));
      assert.ok(ok.ok, `passage légitime refusé (${JSON.stringify(ok.corps)})`);
      await refuse('PUT', `${chemin}/jouees/0/issue`, 'sort', 'issue d\'un tour passé réécrite');

      // B est présent : son tour (carte tirée) ne peut pas être passé.
      const tirage = await S.jouer(b.c.fb, { code, id: b.id, action: S.ACTIONS.CHOISIR, type: 'epreuve' });
      const carte = tirage.partie.jeu.carte;
      await refuse('PATCH', chemin, {
        etape: 'choix', indexJoueur: 0, tour: 2, carte: null,
        'jouees/1': { carte, joueur: b.id, tour: 1, issue: 'passe' }, derniere: { carte, joueur: b.id, issue: 'passe' },
      }, 'tour d\'une personne présente passé, carte tirée');
      a.c.retablir();
    });
  });

  it('horloge du téléphone en avance de 40 minutes : une salle active n\'est ni vue comme libre, ni supprimée', async () => {
    const code = 'SORTILEGE';
    const hote = nouveauClient();
    assert.equal((await S.creerPartie(hote.fb, { code, id: S.nouvelIdentifiant(), config })).issue, S.ISSUES.OK);
    // Horloge déréglée pour tout ce processus (Date.now et new Date(), comme sur un vrai téléphone).
    const VraieDate = Date;
    const vraiNow = () => VraieDate.now();
    const avance = 40 * 60 * 1000;
    globalThis.Date = class extends VraieDate {
      constructor(...args) { if (args.length) super(...args); else super(VraieDate.now() + avance); }
      static now() { return VraieDate.now() + avance; }
    };
    try {
      // Nouveau téléphone, dont l'horloge avance : le SDK mesure le décalage avec le serveur à la connexion.
      const autre = nouveauClient();
      for (let i = 0; i < 100 && Math.abs(autre.fb.maintenant() - vraiNow()) > 60000; i += 1) await attendre(30);
      assert.ok(Math.abs(autre.fb.maintenant() - vraiNow()) < 60000, 'heure du serveur estimée malgré l\'horloge déréglée');
      const pris = await S.codesPris(autre.fb, [code]);
      assert.ok(pris.has(code), 'salle active vue comme prise');
      assert.equal((await S.rejoindrePartie(autre.fb, { code, id: S.nouvelIdentifiant() })).issue, S.ISSUES.OK, 'salle active rejointe');
      assert.equal((await S.creerPartie(autre.fb, { code, id: S.nouvelIdentifiant(), config })).issue, S.ISSUES.PRIS);
    } finally {
      globalThis.Date = VraieDate;
    }
    assert.notEqual(await lire(code), null, 'salle toujours là');
  });
});
