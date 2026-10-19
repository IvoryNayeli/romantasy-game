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

  async function personne(chemin) {
    const page = await ouvrir(chemin, { reseau: true });
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

    // L'invité prend le dragon : grisé chez l'hôte.
    await invite.locator('.embleme-choix', { hasText: 'Dragon' }).click();
    await hote.waitForSelector('.embleme-choix.embleme-pris:has-text("Dragon")', { timeout: 8000 });
    assert.ok(await hote.locator('.embleme-choix', { hasText: 'Dragon' }).isDisabled());
    await invite.waitForSelector('.embleme-choix[aria-checked="true"]:has-text("Dragon")');

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
    const absente = await rejoindre();
    await attendreLignes(hote, 3);

    const presence = async (page, prenom, embleme) => {
      await page.fill('#champ-prenom', prenom);
      await page.locator('.embleme-choix', { hasText: embleme }).click();
      await page.waitForSelector(`.embleme-choix[aria-checked="true"]:has-text("${embleme}")`, { timeout: DELAI });
      await page.locator('button', { hasText: 'Je suis là' }).click();
      await page.waitForSelector('button[aria-pressed="true"]', { timeout: DELAI });
    };
    await presence(hote, 'Léa', 'Fée');
    await presence(invite, 'Tom', 'Dragon');
    await absente.fill('#champ-prenom', 'Noa');
    await absente.locator('.embleme-choix', { hasText: 'Sirène' }).click();
    await hote.waitForSelector('button:has-text("Commencer la quête"):not([disabled])', { timeout: DELAI });
    await hote.locator('button', { hasText: 'Commencer la quête' }).click();

    // La personne inscrite sans « Je suis là » ne joue pas : elle voit « La quête a déjà commencé ».
    await absente.waitForSelector('.avis-complete:not([hidden])', { timeout: DELAI });
    assert.equal((await absente.locator('.avis-complete').textContent()).trim(), 'La quête a déjà commencé');
    assert.equal(await absente.locator('.formulaire').isVisible(), false);
    assert.equal(await forcer(absente, 'choisir', { type: 'epreuve' }), 'refuse');

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
      assert.equal(await autre.page.locator('.dos, .barre-bas').count(), 0);
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
    for (const page of [hote, invite, absente]) {
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
    await fermer(absente);
  });

  it('aucune requête externe, aucune erreur de console', () => {
    assert.deepEqual(ctx.requetesExternes, []);
    assert.deepEqual(ctx.problemes, []);
  });
});
