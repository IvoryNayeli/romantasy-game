'use strict';

// Phase 5 : partie jouable en réseau, sur l'émulateur Firebase LOCAL uniquement (voir aide-emulateur.js).
// Plusieurs clients (un par personne) jouent une partie complète par salon.js : seule la personne dont c'est le tour
// peut agir, tout le monde reçoit le même état, une écriture par action, les effets durables et leur fin par échange,
// l'écran de fin et la suppression de la partie terminée. Puis les règles de database.rules.json face aux écritures
// directes (sans passer par le jeu).
// Lancer : npm test (ou node scripts/avec-emulateur.js node --test tests/emulateur-partie.test.js).

const { describe, it, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const E = require('./aide-emulateur.js');

// Base propre à ce fichier : les autres fichiers de tests, lancés en parallèle, n'en sont pas dérangés.
E.utiliserBase('demo-romantasy-tests-partie');

const config = E.lireJson('config.json');
const cartes = E.lireJson('cartes.json');
const emblemes = E.lireJson('emblemes.json').map((e) => e.id);
const attendre = (ms) => new Promise((ok) => setTimeout(ok, ms));

describe('émulateur : partie jouable en réseau', () => {
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

  // Salle de `nombre` personnes présentes (plus `sansPresence` inscrites sans « Je suis là »), puis départ.
  async function partieCommencee(code, nombre, { sansPresence = 0, jeuDeCartes = cartes } = {}) {
    const membres = [];
    for (let i = 0; i < nombre + sansPresence; i += 1) {
      const m = { c: nouveauClient(), id: S.nouvelIdentifiant(), prenom: `P${i}` };
      if (i === 0) assert.equal((await S.creerPartie(m.c.fb, { code, id: m.id, config })).issue, S.ISSUES.OK);
      else assert.equal((await S.rejoindrePartie(m.c.fb, { code, id: m.id })).issue, S.ISSUES.OK);
      membres.push(m);
    }
    for (const [i, m] of membres.entries()) {
      await S.choisirEmbleme(m.c.fb, { code, id: m.id, embleme: emblemes[i] });
      if (i < nombre) assert.equal((await S.confirmerPresence(m.c.fb, { code, id: m.id, prenom: m.prenom })).issue, S.ISSUES.OK);
    }
    const r = await S.commencerPartie(membres[0].c.fb, { code, id: membres[0].id, cartes: jeuDeCartes, config });
    assert.equal(r.issue, S.ISSUES.OK);
    return { membres, partie: r.partie };
  }

  const lire = async (code) => (await E.rest('GET', `parties/${code}`, undefined, { admin: true })).corps;
  const courant = (partie) => partie.jeu.joueurs[partie.jeu.indexJoueur];

  it('départ : l\'état du jeu est créé dans la même écriture (ordre des tours, tour 1, piles complètes)', async () => {
    const { membres, partie } = await partieCommencee('RUNE', 3);
    const jeu = partie.jeu;
    assert.deepEqual(jeu.joueurs, membres.map((m) => m.id));
    assert.deepEqual(jeu.joueurs, partie.ordre);
    assert.equal(jeu.tours, config.tours, 'nombre de tours lu dans config.json');
    assert.equal(jeu.tour, 1);
    assert.equal(jeu.indexJoueur, 0);
    assert.equal(jeu.etape, G.ETAPES.CHOIX);
    for (const type of jeu.types) {
      assert.equal(jeu.piles[type].length, cartes.filter((c) => c.type === type).length, `pile ${type} complète`);
    }
  });

  it('partie complète à trois : chacun son tour, les autres refusés, même état partout, une écriture par action, fin', async () => {
    const code = 'ONYX';
    const { membres } = await partieCommencee(code, 3);
    const vus = membres.map(() => null);
    const arrets = membres.map((m, i) => S.ecouterPartie(m.c.fb, code, (v) => { vus[i] = v; }));
    await attendre(300);
    for (const m of membres) { m.c.espion.transactions.length = 0; m.c.espion.suppressions.length = 0; }

    let actions = 0;
    let partie = await lire(code);
    const parId = new Map(membres.map((m) => [m.id, m]));
    let n = 0;
    // Comme à l'écran, on n'agit qu'après avoir reçu l'état courant par l'écoute (les boutons n'apparaissent qu'alors).
    const synchro = async (attendu) => {
      for (let essai = 0; essai < 100 && !vus.every((v) => JSON.stringify(v?.jeu) === JSON.stringify(attendu.jeu)); essai += 1) await attendre(30);
      for (const v of vus) assert.deepEqual(v.jeu, attendu.jeu, 'toutes les personnes voient le même état');
    };
    while (partie.jeu.etape !== G.ETAPES.FIN) {
      await synchro(partie);
      const actif = parId.get(courant(partie));
      const autres = membres.filter((m) => m !== actif);
      // Une personne dont ce n'est pas le tour ne peut ni tirer, ni jeter le sort, ni invoquer un bouclier.
      for (const autre of autres) {
        assert.equal((await S.jouer(autre.c.fb, { code, id: autre.id, action: S.ACTIONS.CHOISIR, type: 'epreuve' })).issue, S.ISSUES.REFUSE);
      }
      actions += autres.length;
      const type = n % 2 ? 'revelation' : 'epreuve';
      const tirage = await S.jouer(actif.c.fb, { code, id: actif.id, action: S.ACTIONS.CHOISIR, type });
      assert.equal(tirage.issue, S.ISSUES.OK);
      assert.equal(tirage.partie.jeu.etape, G.ETAPES.CARTE);
      assert.equal(cartes.find((c) => c.id === tirage.partie.jeu.carte).type, type, 'carte du type choisi');
      assert.equal((await S.jouer(actif.c.fb, { code, id: actif.id, action: S.ACTIONS.CHOISIR, type })).issue, S.ISSUES.REFUSE, 'une seule carte par tour');
      await synchro(tirage.partie); // la carte tirée est visible par tout le monde
      for (const autre of autres) {
        assert.equal((await S.jouer(autre.c.fb, { code, id: autre.id, action: S.ACTIONS.SORT })).issue, S.ISSUES.REFUSE);
        assert.equal((await S.jouer(autre.c.fb, { code, id: autre.id, action: S.ACTIONS.BOUCLIER })).issue, S.ISSUES.REFUSE);
      }
      actions += 2 + autres.length * 2;
      const action = n % 3 === 2 ? S.ACTIONS.BOUCLIER : S.ACTIONS.SORT;
      const fin = await S.jouer(actif.c.fb, { code, id: actif.id, action });
      assert.equal(fin.issue, S.ISSUES.OK);
      assert.equal(fin.partie.jeu.derniere.issue, action);
      assert.equal(fin.partie.jeu.derniere.joueur, actif.id);
      actions += 1;
      partie = fin.partie;
      n += 1;
    }
    assert.equal(n, membres.length * config.tours, 'chaque personne a joué autant de fois que de tours');
    assert.equal(partie.jeu.jouees.length, n);
    assert.equal(partie.jeu.tour, config.tours);
    const cartesJouees = partie.jeu.jouees.map((j) => j.carte);
    assert.equal(new Set(cartesJouees).size, cartesJouees.length, 'une carte ne sort qu\'une fois');
    // L'ordre des tours est respecté : tour par tour, dans l'ordre d'arrivée.
    partie.jeu.jouees.forEach((j, i) => {
      assert.equal(j.joueur, membres[i % membres.length].id);
      assert.equal(j.tour, Math.floor(i / membres.length) + 1);
    });
    // Après la fin, plus aucune action.
    assert.equal((await S.jouer(membres[0].c.fb, { code, id: membres[0].id, action: S.ACTIONS.CHOISIR, type: 'epreuve' })).issue, S.ISSUES.REFUSE);
    actions += 1;

    // Tout le monde a reçu le même état final ; une transaction par action, aucune écriture des écoutes.
    await attendre(500);
    const finale = await lire(code);
    assert.deepEqual(finale.jeu, partie.jeu);
    for (const v of vus) assert.deepEqual(v, finale);
    const transactions = membres.reduce((t, m) => t + m.c.espion.transactions.length, 0);
    assert.equal(transactions, actions, 'une transaction par action, aucune de plus');
    for (const m of membres) assert.deepEqual([...new Set(m.c.espion.transactions)], [`parties/${code}`]);
    assert.ok(JSON.stringify(partie).length < 8000, `état de partie borné (${JSON.stringify(partie).length} octets)`);

    // Partie terminée : supprimée sur demande (« Nouvelle quête »).
    arrets.forEach((a) => a());
    await S.supprimerPartie(membres[1].c.fb, code);
    assert.equal(await lire(code), null);
  });

  it('partie complète à cinq (maximum de config.json) : chacun joue autant de fois que de tours, même état partout, fin', async () => {
    const code = 'CRYPTE';
    const { membres } = await partieCommencee(code, config.joueursMax);
    const vus = membres.map(() => null);
    const arrets = membres.map((m, i) => S.ecouterPartie(m.c.fb, code, (v) => { vus[i] = v; }));
    await attendre(300);
    let partie = await lire(code);
    assert.equal(partie.jeu.joueurs.length, config.joueursMax, 'cinq personnes dans l\'ordre des tours');
    const parId = new Map(membres.map((m) => [m.id, m]));
    let n = 0;
    // Comme à l'écran : on n'agit qu'une fois l'état courant reçu par l'écoute (les boutons n'apparaissent qu'alors).
    const synchro = async (attendu) => {
      for (let essai = 0; essai < 100 && !vus.every((v) => JSON.stringify(v?.jeu) === JSON.stringify(attendu.jeu)); essai += 1) await attendre(30);
      for (const v of vus) assert.deepEqual(v.jeu, attendu.jeu, 'toutes les personnes voient le même état');
    };
    while (partie.jeu.etape !== G.ETAPES.FIN) {
      await synchro(partie);
      const actif = parId.get(courant(partie));
      const tirage = await S.jouer(actif.c.fb, { code, id: actif.id, action: S.ACTIONS.CHOISIR, type: n % 2 ? 'revelation' : 'epreuve' });
      assert.equal(tirage.issue, S.ISSUES.OK);
      await synchro(tirage.partie);
      const fin = await S.jouer(actif.c.fb, { code, id: actif.id, action: n % 3 === 2 ? S.ACTIONS.BOUCLIER : S.ACTIONS.SORT });
      assert.equal(fin.issue, S.ISSUES.OK);
      partie = fin.partie;
      n += 1;
    }
    await synchro(partie);
    assert.equal(n, config.joueursMax * config.tours, 'chaque personne a joué autant de fois que de tours');
    assert.equal(partie.jeu.tour, config.tours);
    partie.jeu.jouees.forEach((j, i) => {
      assert.equal(j.joueur, membres[i % membres.length].id, 'ordre des tours : ordre d\'arrivée, tour après tour');
      assert.equal(j.tour, Math.floor(i / membres.length) + 1);
    });
    await attendre(500);
    const finale = await lire(code);
    assert.deepEqual(finale.jeu, partie.jeu);
    for (const v of vus) assert.deepEqual(v.jeu, finale.jeu, 'chaque personne a reçu le même état final (écran de fin)');
    arrets.forEach((a) => a());
  });

  it('personnes inscrites sans « Je suis là » au départ : hors de l\'ordre des tours, aucune action possible', async () => {
    const code = 'AURORE';
    const { membres, partie } = await partieCommencee(code, 2, { sansPresence: 1 });
    const absente = membres[2];
    assert.equal(partie.jeu.joueurs.includes(absente.id), false);
    assert.equal(partie.ordre.includes(absente.id), false);
    assert.equal((await S.jouer(absente.c.fb, { code, id: absente.id, action: S.ACTIONS.CHOISIR, type: 'epreuve' })).issue, S.ISSUES.REFUSE);
    assert.equal((await S.jouer(absente.c.fb, { code, id: absente.id, action: S.ACTIONS.ECHANGE, carte: 'epr-06' })).issue, S.ISSUES.REFUSE);
  });

  it('effets durables : un sort jeté sur une carte durable crée l\'effet ; n\'importe qui signale l\'échange ; le bouclier l\'annule', async () => {
    const code = 'CRYPTE';
    // Pile Épreuve faite uniquement de cartes durables (elle doit suffire à deux personnes pendant tous les tours).
    const durables = cartes.filter((c) => c.duree);
    const jeuDeCartes = durables.concat(cartes.filter((c) => c.type === 'revelation'));
    assert.ok(durables.length >= 2 * config.tours);
    const { membres: [a, b] } = await partieCommencee(code, 2, { jeuDeCartes });

    await S.jouer(a.c.fb, { code, id: a.id, action: S.ACTIONS.CHOISIR, type: 'epreuve' });
    let r = await S.jouer(a.c.fb, { code, id: a.id, action: S.ACTIONS.SORT });
    assert.equal(r.partie.jeu.effets.length, 1);
    const effet = r.partie.jeu.effets[0];
    assert.equal(effet.joueur, a.id);
    assert.equal(effet.effet, durables.find((c) => c.id === effet.carte).effet, 'libellé du bandeau : champ « effet » de la carte');

    // C'est le tour de B : A signale l'échange (pas besoin que ce soit son tour), puis B essaie à son tour : refusé, l'effet
    // ne prend fin qu'une fois.
    r = await S.jouer(a.c.fb, { code, id: a.id, action: S.ACTIONS.ECHANGE, carte: effet.carte });
    assert.equal(r.issue, S.ISSUES.OK);
    assert.equal((r.partie.jeu.effets || []).length, 0);
    assert.equal((await S.jouer(b.c.fb, { code, id: b.id, action: S.ACTIONS.ECHANGE, carte: effet.carte })).issue, S.ISSUES.REFUSE, 'effet déjà fini');

    // B jette le sort sur une carte durable.
    await S.jouer(b.c.fb, { code, id: b.id, action: S.ACTIONS.CHOISIR, type: 'epreuve' });
    r = await S.jouer(b.c.fb, { code, id: b.id, action: S.ACTIONS.SORT });
    const effetB = r.partie.jeu.effets[0];
    assert.equal(effetB.joueur, b.id);
    // A invoque un bouclier sur une carte durable : aucun effet de plus.
    await S.jouer(a.c.fb, { code, id: a.id, action: S.ACTIONS.CHOISIR, type: 'epreuve' });
    r = await S.jouer(a.c.fb, { code, id: a.id, action: S.ACTIONS.BOUCLIER });
    assert.ok((r.partie.jeu.effets || []).every((e) => e.joueur === b.id), 'le bouclier annule l\'effet');
    // C'est de nouveau le tour de B : un effet « jusqu'à son prochain tour » vient de finir ; sinon A signale l'échange.
    if ((r.partie.jeu.effets || []).length) {
      r = await S.jouer(a.c.fb, { code, id: a.id, action: S.ACTIONS.ECHANGE, carte: effetB.carte });
      assert.equal(r.issue, S.ISSUES.OK, 'échange signalé par une personne dont ce n\'est pas le tour');
    }
    assert.equal((r.partie.jeu.effets || []).length, 0);
  });

  describe('règles : écritures directes sur l\'état du jeu (sans passer par salon.js)', () => {
    const ts = { '.sv': 'timestamp' };
    const refuse = async (methode, chemin, valeur, message) => {
      const r = await E.rest(methode, chemin, valeur);
      assert.equal(r.statut, 401, `${message} : accepté par la base (${JSON.stringify(r.corps)})`);
    };

    it('le jeu ne se crée qu\'au départ, ne s\'efface pas, et ses personnes et son nombre de tours ne changent pas', async () => {
      const code = 'GRIMOIRE';
      const { membres, partie } = await partieCommencee(code, 2);
      const jeu = partie.jeu;
      await refuse('DELETE', `parties/${code}/jeu`, undefined, 'jeu effacé');
      await refuse('PUT', `parties/${code}/jeu/joueurs/1`, membres[0].id, 'personne remplacée dans l\'ordre du jeu');
      await refuse('PUT', `parties/${code}/jeu/joueurs/2`, membres[0].id, 'personne ajoutée au jeu');
      await refuse('PUT', `parties/${code}/jeu/tours`, jeu.tours + 1, 'nombre de tours changé');
      await refuse('PATCH', `parties/${code}/jeu`, { tour: 1, indexJoueur: 0, etape: 'choix', jouees: null, actif: ts }, 'champ inconnu dans le jeu');
      // Un nouveau jeu ne peut pas remplacer celui en cours (retour au tour 1 après quelques actions).
      const a = membres[0];
      await S.jouer(a.c.fb, { code, id: a.id, action: S.ACTIONS.CHOISIR, type: 'epreuve' });
      await S.jouer(a.c.fb, { code, id: a.id, action: S.ACTIONS.SORT });
      await refuse('PUT', `parties/${code}/jeu`, jeu, 'jeu remis au départ');

      // Une salle (pas encore commencée) ne peut pas recevoir de jeu.
      const salle = { c: nouveauClient(), id: S.nouvelIdentifiant() };
      await S.creerPartie(salle.c.fb, { code: 'ELIXIR', id: salle.id, config });
      await refuse('PUT', 'parties/ELIXIR/jeu', { ...jeu, joueurs: [salle.id] }, 'jeu dans une salle d\'attente');
    });

    it('enchaînement : impossible de sauter une personne, de passer à la fin, de réécrire une carte jouée ou d\'en changer l\'autrice ou l\'auteur', async () => {
      const code = 'TALISMAN';
      const { membres: [a, b] } = await partieCommencee(code, 2);
      const chemin = `parties/${code}/jeu`;
      await refuse('PATCH', chemin, { indexJoueur: 1 }, 'tour de A sauté');
      await refuse('PATCH', chemin, { etape: 'fin' }, 'fin de partie directe');
      await refuse('PATCH', chemin, { tour: 2 }, 'tour suivant sans avoir joué');

      const tirage = await S.jouer(a.c.fb, { code, id: a.id, action: S.ACTIONS.CHOISIR, type: 'epreuve' });
      const carte = tirage.partie.jeu.carte;
      await refuse('PATCH', chemin, { carte: 'rev-01' }, 'carte tirée remplacée');
      // Fin du tour de A écrite comme si B avait joué la carte.
      await refuse('PATCH', chemin, {
        etape: 'choix', indexJoueur: 1, carte: null,
        'jouees/0': { carte, joueur: b.id, tour: 1, issue: 'sort' }, derniere: { carte, joueur: b.id, issue: 'sort' },
      }, 'carte jouée attribuée à une autre personne');
      await refuse('PATCH', chemin, {
        etape: 'choix', indexJoueur: 1, carte: null,
        'jouees/0': { carte: 'rev-02', joueur: a.id, tour: 1, issue: 'sort' }, derniere: { carte: 'rev-02', joueur: a.id, issue: 'sort' },
      }, 'carte jouée différente de la carte tirée');
      await refuse('PATCH', chemin, {
        etape: 'fin', carte: null,
        'jouees/0': { carte, joueur: a.id, tour: 1, issue: 'sort' }, derniere: { carte, joueur: a.id, issue: 'sort' },
      }, 'fin de partie au premier tour');

      // Contrôle : la fin du tour de A, écrite correctement, est acceptée. Sans authentification, la base ne peut pas
      // savoir qui écrit (risque D2 accepté) : elle vérifie seulement que l'état suit un enchaînement possible.
      const correct = await E.rest('PATCH', chemin, {
        etape: 'choix', indexJoueur: 1, carte: null,
        'jouees/0': { carte, joueur: a.id, tour: 1, issue: 'sort' }, derniere: { carte, joueur: a.id, issue: 'sort' },
      });
      assert.ok(correct.ok, `fin de tour légitime refusée (${JSON.stringify(correct.corps)})`);
      await refuse('PUT', `${chemin}/jouees/0/issue`, 'bouclier', 'issue d\'une carte jouée réécrite');
      await refuse('PUT', `${chemin}/jouees/0/joueur`, b.id, 'personne d\'une carte jouée réécrite');
      await refuse('DELETE', `${chemin}/jouees/0`, undefined, 'carte jouée effacée en cours de partie (D9)');
      await refuse('DELETE', `${chemin}/jouees`, undefined, 'cartes jouées effacées en cours de partie (D9)');
      // Le jeu continue normalement par salon.js après cette écriture.
      assert.equal((await S.jouer(b.c.fb, { code, id: b.id, action: S.ACTIONS.CHOISIR, type: 'revelation' })).issue, S.ISSUES.OK);
    });

    it('fin : une partie terminée reste terminée', async () => {
      const code = 'SORTILEGE';
      const { membres } = await partieCommencee(code, 2);
      let partie = await lire(code);
      while (partie.jeu.etape !== G.ETAPES.FIN) {
        const m = membres.find((x) => x.id === courant(partie));
        await S.jouer(m.c.fb, { code, id: m.id, action: S.ACTIONS.CHOISIR, type: 'revelation' });
        partie = (await S.jouer(m.c.fb, { code, id: m.id, action: S.ACTIONS.SORT })).partie;
      }
      await refuse('PATCH', `parties/${code}/jeu`, { etape: 'choix', tour: 1 }, 'partie terminée relancée');
      await refuse('PATCH', `parties/${code}/jeu`, { etape: 'carte', carte: 'rev-01' }, 'carte tirée après la fin');
    });

    it('D9 : une carte jouée ne peut pas être effacée, et une partie terminée reste figée (dernière carte, piles)', async () => {
      const code = 'OBSIDIENNE';
      const { membres } = await partieCommencee(code, 2);
      let partie = await lire(code);
      while (partie.jeu.etape !== G.ETAPES.FIN) {
        const m = membres.find((x) => x.id === courant(partie));
        await S.jouer(m.c.fb, { code, id: m.id, action: S.ACTIONS.CHOISIR, type: 'revelation' });
        partie = (await S.jouer(m.c.fb, { code, id: m.id, action: S.ACTIONS.SORT })).partie;
      }
      await refuse('DELETE', `parties/${code}/jeu/jouees/0`, undefined, 'carte jouée effacée');
      await refuse('DELETE', `parties/${code}/jeu/jouees`, undefined, 'historique des cartes jouées effacé');
      await refuse('PUT', `parties/${code}/jeu/derniere`, { carte: 'rev-01', joueur: membres[0].id, issue: 'sort' }, 'dernière carte réécrite après la fin');
      await refuse('PUT', `parties/${code}/jeu/piles/revelation/0`, 'rev-02', 'pile réécrite après la fin');
    });
  });
});
