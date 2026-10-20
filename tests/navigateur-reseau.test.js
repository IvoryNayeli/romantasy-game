'use strict';

// Phases 4 et 5 : salle d'attente et partie en réseau dans un vrai navigateur (Chrome), contre l'émulateur Firebase LOCAL.
// Plusieurs pages = plusieurs personnes (chacune son contexte, donc sa propre identité). Vérifie : création,
// jonction, synchronisation de la liste, emblème pris grisé chez les autres, code pris grisé, code introuvable,
// partie complète, « Commencer la quête », écoutes limitées à parties/<CODE>, aucune requête externe,
// et l'absence de tout accès à la base en démonstration.
// Phase 5 (dans ce même fichier, car les tests se partagent la base du jeu et la vident) : partie complète jusqu'à
// l'écran de fin (choix, carte visible par tout le monde, « Le sort est jeté », « Invoquer un bouclier », transition,
// compteur, effets en cours et fin d'un effet par échange, « Nouvelle quête » qui supprime la partie terminée) ;
// seule la personne dont c'est le tour peut agir (aucun bouton chez les autres, action forcée refusée) ;
// personne inscrite sans « Je suis là » écartée.
// Lancer : npm run test:navigateur (démarre l'émulateur). Sans Chrome ou playwright-core : sauté.

const { describe, it, before, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const A = require('./aide-navigateur');
const E = require('./aide-emulateur');

const { config, cartes } = A;
const CODE = 'GRIMOIRE';
const DELAI = 10000;
const T = {
  inconnu: 'Ce code ne correspond à aucune partie. Vérifie-le et réessaie.',
  complete: 'La partie est complète',
};

describe('navigateur : salle d\'attente en réseau (émulateur local)', { skip: A.raisonSaut || false }, () => {
  const ctx = A.contexte();
  const { ouvrir, fermer } = ctx;
  const trames = new Map(); // page -> trames WebSocket envoyées vers l'émulateur

  before(async () => { E.adresseEmulateur(); await E.chargerRegles(); });
  beforeEach(async () => { await E.viderBase(); });

  async function personne(chemin, { config: cfg = null } = {}) {
    const page = await ouvrir(chemin, { reseau: true, config: cfg });
    const envoyees = [];
    trames.set(page, envoyees);
    page.on('websocket', (ws) => {
      assert.equal(new URL(ws.url()).hostname, '127.0.0.1', `WebSocket non locale : ${ws.url()}`);
      ws.on('framesent', (f) => envoyees.push(String(f.payload)));
    });
    return page;
  }
  // Chemins écoutés par la page (action « q » du protocole de la Realtime Database).
  const ecoutes = (page) => trames.get(page)
    .map((t) => { try { return JSON.parse(t); } catch { return null; } })
    .filter((m) => m && m.d && m.d.a === 'q')
    .map((m) => m.d.b.p);

  const lignes = (page) => page.locator('.liste-joueurs .joueur-ligne:not(.joueur-libre)');
  const attendreLignes = (page, n) => page.waitForFunction(
    (nb) => document.querySelectorAll('.liste-joueurs .joueur-ligne:not(.joueur-libre)').length === nb, n, { timeout: 8000 });

  const ecran = (page) => page.evaluate(() => document.body.dataset.ecran);
  const attendreEcran = (page, nom) => page.waitForFunction((n) => document.body.dataset.ecran === n, nom, { timeout: DELAI });
  // Action forcée depuis la page, par le module du jeu lui-même (comme une personne qui contournerait l'interface).
  const forcer = (page, action, extra) => page.evaluate(async ([code, a, x]) => {
    const reseau = await import('./js/reseau.js');
    return reseau.jouer(code, a, x);
  }, [CODE, action, extra]);

  async function creer(code) {
    const page = await personne('index.html?ecran=creer');
    await page.locator('.code-option', { hasText: code }).click();
    await page.locator('.ecran-creer button[type=submit]').click();
    await page.waitForSelector('.ecran-salle .code-valeur', { timeout: 8000 });
    await attendreLignes(page, 1);
    return page;
  }
  async function rejoindre(saisie) {
    const page = await personne('index.html?ecran=rejoindre');
    await page.fill('#champ-code', saisie);
    await page.locator('.ecran-rejoindre button[type=submit]').click();
    return page;
  }

  it('parcours à deux : créer, rejoindre, liste synchronisée, emblème pris grisé, « Je suis là », commencer', async () => {
    const hote = await creer('RUNE');
    assert.equal(await hote.locator('.code-valeur').textContent(), 'RUNE');
    assert.equal(new URL(hote.url()).searchParams.get('demo'), null, 'parcours réel, hors démonstration');
    assert.ok(await hote.locator('button', { hasText: 'Commencer la quête' }).isVisible(), 'l\'hôte voit « Commencer la quête »');
    assert.ok(await hote.locator('button', { hasText: 'Commencer la quête' }).isDisabled());

    const invite = await rejoindre('rune');
    await invite.waitForSelector('.ecran-salle .code-valeur', { timeout: 8000 });
    await attendreLignes(invite, 2);
    await attendreLignes(hote, 2);
    assert.equal(await invite.locator('button', { hasText: 'Commencer la quête' }).isVisible(), false, 'seul l\'hôte voit le bouton');
    assert.match(await lignes(invite).nth(0).textContent(), /hôte/);
    assert.match(await lignes(invite).nth(1).textContent(), /toi/);

    // L'invité prend le démon : grisé chez l'hôte.
    await invite.locator('.embleme-choix', { hasText: 'Démon' }).click();
    await hote.waitForSelector('.embleme-choix.embleme-pris:has-text("Démon")', { timeout: 8000 });
    assert.ok(await hote.locator('.embleme-choix', { hasText: 'Démon' }).isDisabled());
    await invite.waitForSelector('.embleme-choix[aria-checked="true"]:has-text("Démon")');

    await hote.fill('#champ-prenom', 'Léa');
    await hote.locator('.embleme-choix', { hasText: 'Fée' }).click();
    await hote.waitForSelector('.embleme-choix[aria-checked="true"]:has-text("Fée")');
    await hote.locator('button', { hasText: 'Je suis là' }).click();
    await invite.waitForFunction(() => /Léa/.test(document.querySelector('.liste-joueurs').textContent), null, { timeout: 8000 });
    assert.ok(await hote.locator('button', { hasText: 'Commencer la quête' }).isDisabled(), 'une seule présence confirmée');

    await invite.fill('#champ-prenom', 'Tom');
    await invite.locator('button', { hasText: 'Je suis là' }).click();
    await hote.waitForSelector('button:has-text("Commencer la quête"):not([disabled])', { timeout: 8000 });
    await ctx.capture(hote, 'reseau-salle-hote-360', { fullPage: true });
    await hote.locator('button', { hasText: 'Commencer la quête' }).click();

    // Tout le monde passe au jeu (phase 5) : l'hôte, arrivé en premier, commence ; l'invité attend son tour.
    await hote.waitForSelector('.ecran-choix', { timeout: 8000 });
    await invite.waitForSelector('.ecran-attente', { timeout: 8000 });
    const partie = (await E.rest('GET', 'parties/RUNE', undefined, { admin: true })).corps;
    assert.equal(partie.statut, 'partie');

    // Écoutes : uniquement la partie en cours, jamais la racine.
    for (const page of [hote, invite]) {
      const chemins = ecoutes(page);
      assert.ok(chemins.length >= 1, 'au moins une écoute');
      for (const c of chemins) assert.equal(c, '/parties/RUNE');
    }
    await fermer(hote);
    await fermer(invite);
  });

  it('Créer : un code déjà pris par une partie en cours est grisé et ne peut pas être choisi', async () => {
    const hote = await creer('ONYX');
    const autre = await personne('index.html?ecran=creer');
    await autre.waitForSelector('.code-option.code-pris:has-text("ONYX")', { timeout: 8000 });
    assert.ok(await autre.locator('.code-option', { hasText: 'ONYX' }).locator('input').isDisabled());
    assert.equal(await autre.locator('.code-option.code-pris').count(), 1);
    await ctx.capture(autre, 'reseau-creer-code-pris-360', { fullPage: true });
    await fermer(hote);
    await fermer(autre);
  });

  it('Rejoindre : un code du thème sans partie en cours affiche le message « code inconnu »', async () => {
    const page = await rejoindre('élixir');
    await page.waitForFunction((t) => document.querySelector('#erreur-code')?.textContent === t, T.inconnu, { timeout: 8000 });
    assert.ok(await page.locator('.ecran-rejoindre').isVisible());
    await fermer(page);
  });

  it('partie complète : la personne de trop voit « La partie est complète », sans formulaire', async () => {
    const joueurs = {};
    for (let i = 0; i < config.joueursMax; i += 1) joueurs[`p${String(i).repeat(19)}`] = { rang: i, pret: false };
    await E.rest('PUT', 'parties/CRYPTE', {
      cree: Date.now(), actif: Date.now(), hote: `p${'0'.repeat(19)}`, max: config.joueursMax, nb: config.joueursMax, statut: 'salle', joueurs,
    }, { admin: true });
    const page = await rejoindre('crypte');
    await page.waitForSelector('.avis-complete:not([hidden])', { timeout: 8000 });
    assert.equal((await page.locator('.avis-complete').textContent()).trim(), T.complete);
    assert.equal(await page.locator('.formulaire').isVisible(), false);
    assert.equal(await page.locator('.barre-bas').isVisible(), false);
    await attendreLignes(page, config.joueursMax);
    await ctx.capture(page, 'reseau-salle-complete-360', { fullPage: true });
    await fermer(page);
  });

  it('démonstration (?demo=1) : aucun accès à la base, aucun SDK chargé', async () => {
    const page = await ouvrir('index.html?demo=1&ecran=creer');
    let ws = 0;
    let sdk = 0;
    page.on('websocket', () => { ws += 1; });
    page.on('request', (r) => { if (/firebasejs/.test(r.url())) sdk += 1; });
    await page.locator('.code-option', { hasText: 'RUNE' }).click();
    await page.locator('.ecran-creer button[type=submit]').click();
    await page.waitForSelector('.ecran-salle');
    await page.waitForTimeout(300);
    assert.equal(ws, 0);
    assert.equal(sdk, 0);
    assert.equal(new URL(page.url()).searchParams.get('demo'), '1', 'le mode démonstration suit la navigation');
    assert.equal((await E.rest('GET', 'parties/RUNE', undefined, { admin: true })).corps, null);
    await fermer(page);
  });

  it('partie complète à deux, plus une personne inscrite sans « Je suis là »', async () => {
    // Hôte : pile Épreuve faite uniquement de cartes durables (pour voir le bandeau des effets à coup sûr).
    const hote = await personne('index.html?ecran=creer');
    const durables = cartes.filter((c) => c.duree);
    assert.ok(durables.length >= 2 * config.tours, 'assez de cartes durables pour deux personnes');
    await hote.context().route('**/data/cartes.json', (route) => route.fulfill({
      contentType: 'application/json', body: JSON.stringify(durables.concat(cartes.filter((c) => c.type === 'revelation'))),
    }));
    await hote.reload();
    await hote.locator('.code-option', { hasText: CODE }).click();
    await hote.locator('.ecran-creer button[type=submit]').click();
    await attendreLignes(hote, 1);

    const rejoindre = async () => {
      const page = await personne('index.html?ecran=rejoindre');
      await page.fill('#champ-code', CODE.toLowerCase());
      await page.locator('.ecran-rejoindre button[type=submit]').click();
      await page.waitForSelector('.ecran-salle .code-valeur', { timeout: DELAI });
      return page;
    };
    const invite = await rejoindre();
    const sansPresence = await rejoindre();
    await attendreLignes(hote, 3);

    const presence = async (page, prenom, embleme) => {
      await page.fill('#champ-prenom', prenom);
      await page.locator('.embleme-choix', { hasText: embleme }).click();
      await page.waitForSelector(`.embleme-choix[aria-checked="true"]:has-text("${embleme}")`, { timeout: DELAI });
      await page.locator('button', { hasText: 'Je suis là' }).click();
      await page.waitForSelector('button[aria-pressed="true"]', { timeout: DELAI });
    };
    await presence(hote, 'Léa', 'Fée');
    await presence(invite, 'Tom', 'Démon');
    await sansPresence.fill('#champ-prenom', 'Noa');
    await sansPresence.locator('.embleme-choix', { hasText: 'Sirène' }).click();
    await hote.waitForSelector('button:has-text("Commencer la quête"):not([disabled])', { timeout: DELAI });
    await hote.locator('button', { hasText: 'Commencer la quête' }).click();

    // La personne inscrite sans « Je suis là » ne joue pas : elle voit « La quête a déjà commencé ».
    await sansPresence.waitForSelector('.avis-complete:not([hidden])', { timeout: DELAI });
    assert.equal((await sansPresence.locator('.avis-complete').textContent()).trim(), 'La quête a déjà commencé');
    assert.equal(await sansPresence.locator('.formulaire').isVisible(), false);
    assert.equal(await forcer(sansPresence, 'choisir', { type: 'epreuve' }), 'refuse');

    const joueurs = [{ page: hote, prenom: 'Léa' }, { page: invite, prenom: 'Tom' }];
    await attendreEcran(hote, 'choix');
    await attendreEcran(invite, 'attente');
    assert.equal(new URL(hote.url()).searchParams.get('ecran'), 'jeu');

    const total = joueurs.length * config.tours;
    for (let n = 0; n < total; n += 1) {
      const tour = Math.floor(n / joueurs.length) + 1;
      const actif = joueurs[n % joueurs.length];
      const autre = joueurs[(n + 1) % joueurs.length];
      await attendreEcran(actif.page, 'choix');
      await attendreEcran(autre.page, 'attente');
      for (const j of joueurs) assert.equal(await j.page.locator('.compteur').textContent(), `Tour ${tour} / ${config.tours}`);
      assert.equal(await actif.page.locator('.titre-tour').textContent(), 'À toi de jouer !');
      assert.match(await autre.page.locator('.titre-tour').textContent(), new RegExp(`^Au tour de .*${actif.prenom}$`));
      assert.equal(await autre.page.locator('.attente-message').textContent(), `En attente de ${actif.prenom}…`);
      // Seule la personne dont c'est le tour peut agir : aucun dos de carte ni bouton de tour chez l'autre,
      // et une action forcée est refusée.
      assert.equal(await autre.page.locator('.dos, .barre-bas:visible').count(), 0);
      assert.equal(await forcer(autre.page, 'choisir', { type: 'revelation' }), 'refuse');

      const type = n < joueurs.length ? 'epreuve' : (n % 3 === 0 ? 'epreuve' : 'revelation');
      if (n === 0) await ctx.capture(actif.page, 'partie-choix-360', { fullPage: true });
      await actif.page.locator(`.dos-${type}`).click();
      await attendreEcran(actif.page, 'carte');
      const idCarte = await actif.page.locator('.carte').getAttribute('data-carte');
      assert.equal(cartes.find((c) => c.id === idCarte).type, type, 'carte du type choisi');
      // La même carte est visible par tout le monde, sans boutons chez l'autre.
      await autre.page.waitForSelector(`.ecran-attente .carte[data-carte="${idCarte}"]`, { timeout: DELAI });
      assert.equal(await autre.page.locator('button:has-text("Le sort est jeté"), button:has-text("Invoquer un bouclier")').count(), 0);
      assert.equal(await forcer(autre.page, 'sort'), 'refuse');
      if (n === 0) {
        await ctx.capture(actif.page, 'partie-carte-360', { fullPage: true });
        await ctx.capture(autre.page, 'partie-attente-360', { fullPage: true });
      }

      const bouclier = n % 3 === 2;
      if (bouclier) {
        await actif.page.getByRole('button', { name: /Invoquer un bouclier/i }).click();
        await actif.page.waitForSelector('dialog[open]');
        await actif.page.locator('dialog[open] button', { hasText: /^Invoquer$/ }).click();
      } else {
        await actif.page.getByRole('button', { name: /Le sort est jeté/i }).click();
      }
      // Transition de 2 secondes pour tout le monde.
      const attendu = bouclier ? `${actif.prenom} a invoqué un bouclier.` : `Le sort est jeté pour ${actif.prenom}.`;
      for (const j of joueurs) {
        await attendreEcran(j.page, 'transition');
        assert.equal(await j.page.locator('.transition-texte').textContent(), attendu);
        assert.equal(await j.page.locator('.compteur').textContent(), `Tour ${tour} / ${config.tours}`);
      }

      if (n === 0) {
        // Carte durable, sort jeté : l'effet est affiché à tout le monde après la transition.
        const effet = durables.find((c) => c.id === idCarte).effet;
        for (const j of joueurs) {
          await j.page.waitForSelector('.effets-en-cours', { timeout: DELAI });
          assert.match(await j.page.locator('.effets-en-cours').textContent(), new RegExp(`Léa.*${effet.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
        }
        await ctx.capture(hote, 'partie-attente-effet-360', { fullPage: true });
        const debordements = await hote.evaluate(A.mesurerDebordements);
        assert.deepEqual(debordements, [], 'écran d\'attente avec effet : aucun débordement');
        // L'échange de butins est signalé par une personne dont ce n'est pas le tour : l'effet disparaît partout.
        await hote.locator('.bouton-echange', { hasText: 'Échange de butins fait' }).click();
        for (const j of joueurs) await j.page.waitForSelector('.effets-en-cours', { state: 'detached', timeout: DELAI });
      }
    }

    // Écran de fin pour tout le monde.
    for (const j of joueurs) {
      await attendreEcran(j.page, 'fin');
      assert.match(await j.page.locator('.ecran-fin').textContent(), /La quête s'achève\./);
    }
    const finale = (await E.rest('GET', `parties/${CODE}`, undefined, { admin: true })).corps;
    assert.equal(finale.jeu.etape, 'fin');
    assert.equal(finale.jeu.jouees.length, total);
    await ctx.capture(invite, 'partie-fin-360', { fullPage: true });

    // Écoutes : uniquement la partie en cours, jamais la racine.
    for (const page of [hote, invite, sansPresence]) {
      for (const c of ecoutes(page)) assert.equal(c, `/parties/${CODE}`);
    }

    // « Nouvelle quête » : retour à l'accueil et suppression de la partie terminée.
    await invite.locator('a', { hasText: 'Nouvelle quête' }).click();
    assert.equal(await ecran(invite), 'accueil');
    for (let i = 0; i < 50 && (await E.rest('GET', `parties/${CODE}`, undefined, { admin: true })).corps !== null; i += 1) await invite.waitForTimeout(100);
    assert.equal((await E.rest('GET', `parties/${CODE}`, undefined, { admin: true })).corps, null, 'partie terminée supprimée');
    assert.equal(await ecran(hote), 'fin', 'l\'autre personne reste sur l\'écran de fin');

    await fermer(hote);
    await fermer(invite);
    await fermer(sansPresence);
  });

  it('phase 6 : coupure réseau simulée, rechargement en pleine partie, absence prolongée et tour passé', async () => {
    // Relevé des problèmes de console : seuls ceux de ce test sont examinés (le relevé est partagé par tout le describe).
    const debut = ctx.problemes.length;
    // Délai d'absence ramené à 1 seconde (config.json servi modifié) pour ne pas allonger le test.
    const cfg = { ...config, delaiAbsenceSecondes: 1 };
    const code = 'AURORE';
    const hote = await personne('index.html?ecran=creer', { config: cfg });
    await hote.locator('.code-option', { hasText: code }).click();
    await hote.locator('.ecran-creer button[type=submit]').click();
    await attendreLignes(hote, 1);
    const invite = await personne('index.html?ecran=rejoindre', { config: cfg });
    await invite.fill('#champ-code', code.toLowerCase());
    await invite.locator('.ecran-rejoindre button[type=submit]').click();
    await invite.waitForSelector('.ecran-salle .code-valeur', { timeout: DELAI });
    await attendreLignes(hote, 2);
    for (const [page, prenom, embleme] of [[hote, 'Léa', 'Fée'], [invite, 'Tom', 'Démon']]) {
      await page.fill('#champ-prenom', prenom);
      await page.locator('.embleme-choix', { hasText: embleme }).click();
      await page.waitForSelector(`.embleme-choix[aria-checked="true"]:has-text("${embleme}")`, { timeout: DELAI });
      await page.locator('button', { hasText: 'Je suis là' }).click();
      await page.waitForSelector('button[aria-pressed="true"]', { timeout: DELAI });
    }
    const horsLigne = (page) => page.locator('.liste-joueurs .etiquette-absent');
    assert.equal(await horsLigne(hote).count(), 0, 'personne hors ligne avant la coupure');

    // Coupure réseau simulée dans la salle : « hors ligne » chez l'hôte, puis plus rien au retour du réseau.
    await invite.context().setOffline(true);
    await hote.waitForSelector('.liste-joueurs .joueur-ligne:has-text("Tom") .etiquette-absent', { timeout: DELAI });
    assert.equal((await horsLigne(hote).textContent()).trim(), 'hors ligne');
    await ctx.capture(hote, 'robustesse-salle-hors-ligne-360', { fullPage: true });
    await invite.context().setOffline(false);
    await hote.waitForSelector('.liste-joueurs .etiquette-absent', { state: 'detached', timeout: DELAI });

    await hote.waitForSelector('button:has-text("Commencer la quête"):not([disabled])', { timeout: DELAI });
    const connexions = async () => {
      const p = (await E.rest('GET', `parties/${code}`, undefined, { admin: true })).corps;
      return Object.keys(p.presents?.[p.hote] || {});
    };
    const avantDepart = await connexions();
    assert.equal(avantDepart.length, 1);
    await hote.locator('button', { hasText: 'Commencer la quête' }).click();
    await attendreEcran(hote, 'choix');
    await attendreEcran(invite, 'attente');
    await hote.waitForTimeout(300);
    assert.deepEqual(await connexions(), avantDepart, 'présence gardée sans interruption entre la salle et la partie');

    // Rechargement en pleine partie : la personne retrouve son tour (même identité, gardée dans l'onglet).
    await hote.reload();
    await attendreEcran(hote, 'choix');
    assert.equal(await hote.locator('.titre-tour').textContent(), 'À toi de jouer !');
    // Après le rechargement, l'hôte est de nouveau présent : aucun bloc d'absence chez l'invité.
    await invite.waitForSelector('.absence', { state: 'hidden', timeout: DELAI });
    await hote.locator('.dos-epreuve').click();
    await attendreEcran(hote, 'carte');
    const idCarte = await hote.locator('.carte').getAttribute('data-carte');
    await hote.reload();
    await attendreEcran(hote, 'carte');
    assert.equal(await hote.locator('.carte').getAttribute('data-carte'), idCarte, 'même carte après le rechargement');
    await hote.getByRole('button', { name: /Le sort est jeté/i }).click();
    await attendreEcran(invite, 'choix');
    await attendreEcran(hote, 'attente');

    // Au tour de Tom, coupure : « Tom est hors ligne. », puis « Passer son tour » après le délai ; rien de tout cela
    // si Tom revient avant.
    await invite.locator('.dos-revelation').click();
    await attendreEcran(invite, 'carte');
    await invite.context().setOffline(true);
    await hote.waitForSelector('.absence-message:has-text("Tom est hors ligne.")', { timeout: DELAI });
    await hote.waitForSelector('button:has-text("Passer son tour")', { state: 'visible', timeout: DELAI });
    await ctx.capture(hote, 'robustesse-attente-hors-ligne-360', { fullPage: true });
    assert.deepEqual(await hote.evaluate(A.mesurerDebordements), [], 'écran d\'attente avec absence : aucun débordement');
    await invite.context().setOffline(false);
    await hote.waitForSelector('.absence', { state: 'hidden', timeout: DELAI });
    assert.equal(await ecran(invite), 'carte', 'Tom retrouve sa carte au retour du réseau');

    // Nouvelle coupure, cette fois le tour est passé par l'hôte : transition pour l'hôte, puis Tom, revenu, suit.
    await invite.context().setOffline(true);
    await hote.locator('button:has-text("Passer son tour")').click({ timeout: DELAI });
    await attendreEcran(hote, 'transition');
    assert.equal(await hote.locator('.transition-texte').textContent(), 'Le tour de Tom est passé.');
    await ctx.capture(hote, 'robustesse-transition-passe-360', { fullPage: true });
    await attendreEcran(hote, 'choix');
    assert.equal(await hote.locator('.compteur').textContent(), `Tour 2 / ${config.tours}`);
    await invite.context().setOffline(false);
    await attendreEcran(invite, 'attente');
    let partie = (await E.rest('GET', `parties/${code}`, undefined, { admin: true })).corps;
    assert.deepEqual(partie.jeu.jouees[1], { carte: partie.jeu.jouees[1].carte, joueur: partie.ordre[1], tour: 1, issue: 'passe' });
    assert.ok(partie.jeu.jouees[1].carte, 'la carte tirée par Tom est consumée');

    // Absence prolongée : Tom ferme sa page. L'hôte joue chacun de ses tours et passe ceux de Tom jusqu'à la fin.
    await fermer(invite);
    for (let tour = 2; tour <= config.tours; tour += 1) {
      await attendreEcran(hote, 'choix');
      await hote.locator('.dos-revelation').click();
      await attendreEcran(hote, 'carte');
      await hote.getByRole('button', { name: /Le sort est jeté/i }).click();
      await attendreEcran(hote, 'attente');
      await hote.locator('button:has-text("Passer son tour")').click({ timeout: DELAI });
    }
    await attendreEcran(hote, 'fin');
    partie = (await E.rest('GET', `parties/${code}`, undefined, { admin: true })).corps;
    assert.equal(partie.jeu.etape, 'fin');
    assert.equal(partie.jeu.jouees.filter((j) => j.issue === 'passe').length, config.tours);
    // Écran de fin : la présence de l'hôte est retirée, il n'y a plus de tour à passer.
    for (let i = 0; i < 50 && (await E.rest('GET', `parties/${code}/presents`, undefined, { admin: true })).corps !== null; i += 1) await hote.waitForTimeout(100);
    assert.equal((await E.rest('GET', `parties/${code}/presents`, undefined, { admin: true })).corps, null, 'plus aucune présence à la fin');
    for (const c of ecoutes(hote)) assert.equal(c, `/parties/${code}`);
    await fermer(hote);
    // Les essais de reconnexion du SDK pendant la coupure simulée échouent, comme prévu : le navigateur les note en
    // console (ERR_INTERNET_DISCONNECTED). Seuls ceux-là sont retirés du relevé des problèmes ; tout le reste compte.
    // Seuls les problèmes relevés pendant ce test sont examinés ; ceux des tests précédents restent tels quels.
    const pendant = ctx.problemes.splice(debut);
    const coupure = (p) => /net::ERR_INTERNET_DISCONNECTED/.test(p);
    assert.ok(pendant.some(coupure), 'la coupure a bien été simulée');
    ctx.problemes.push(...pendant.filter((p) => !coupure(p)));
  });

  it('phase 6 : Wake Lock demandé sur la salle et la partie, redemandé au retour de la page, silencieux sans l\'API', async () => {
    // Faux Wake Lock (Chrome sans écran ne l'accorde pas) : on compte les demandes et les libérations.
    const faux = () => {
      window.__wakelock = { demandes: 0, liberations: 0 };
      const verrou = () => {
        const cibles = new EventTarget();
        const v = {
          released: false,
          addEventListener: (...a) => cibles.addEventListener(...a),
          release: async () => { if (!v.released) { v.released = true; window.__wakelock.liberations += 1; cibles.dispatchEvent(new Event('release')); } },
        };
        window.__wakelock.dernier = v;
        return v;
      };
      Object.defineProperty(navigator, 'wakeLock', { value: { request: async () => { window.__wakelock.demandes += 1; return verrou(); } } });
    };
    const page = await ouvrir('index.html?ecran=creer', { reseau: true, init: faux });
    await page.locator('.code-option', { hasText: 'ECLIPSE' }).click();
    await page.locator('.ecran-creer button[type=submit]').click();
    await page.waitForSelector('.ecran-salle .code-valeur', { timeout: DELAI });
    await page.waitForFunction(() => window.__wakelock.demandes === 1, null, { timeout: DELAI });
    // Le navigateur relâche le verrou quand la page est cachée ; il est redemandé à son retour.
    await page.evaluate(() => window.__wakelock.dernier.release());
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    await page.waitForFunction(() => window.__wakelock.demandes === 2, null, { timeout: DELAI });
    // Retour aux règles : le verrou est libéré.
    await page.evaluate(() => window.history.back());
    await page.waitForFunction(() => document.body.dataset.ecran !== 'salle', null, { timeout: DELAI });
    await page.waitForFunction(() => window.__wakelock.liberations === 2, null, { timeout: DELAI });
    await fermer(page);

    // Sans l'API (page hors HTTPS, navigateur ancien) : aucune erreur, la salle fonctionne.
    const sans = await ouvrir('index.html?ecran=creer', {
      reseau: true, init: () => { Object.defineProperty(navigator, 'wakeLock', { value: undefined }); },
    });
    await sans.locator('.code-option', { hasText: 'ELIXIR' }).click();
    await sans.locator('.ecran-creer button[type=submit]').click();
    await sans.waitForSelector('.ecran-salle .code-valeur', { timeout: DELAI });
    await attendreLignes(sans, 1);
    // Refusé par le navigateur : aucun message non plus.
    const refuse = await ouvrir('index.html?ecran=creer', {
      reseau: true,
      init: () => { Object.defineProperty(navigator, 'wakeLock', { value: { request: () => Promise.reject(new DOMException('refus', 'NotAllowedError')) } }); },
    });
    await refuse.locator('.code-option', { hasText: 'TALISMAN' }).click();
    await refuse.locator('.ecran-creer button[type=submit]').click();
    await refuse.waitForSelector('.ecran-salle .code-valeur', { timeout: DELAI });
    await attendreLignes(refuse, 1);
    await fermer(sans);
    await fermer(refuse);
  });

  it('aucune requête externe, aucune erreur de console', () => {
    assert.deepEqual(ctx.requetesExternes, []);
    assert.deepEqual(ctx.problemes, []);
  });
});
