'use strict';

// Phase 4 : salle d'attente en réseau dans un vrai navigateur (Chrome), contre l'émulateur Firebase LOCAL.
// Plusieurs pages = plusieurs personnes (chacune son contexte, donc sa propre identité). Vérifie : création,
// jonction, synchronisation de la liste, emblème pris grisé chez les autres, code pris grisé, code introuvable,
// partie complète, « Commencer la quête », écoutes limitées à parties/<CODE>, aucune requête externe,
// et l'absence de tout accès à la base en démonstration.
// Lancer : npm run test:navigateur (démarre l'émulateur). Sans Chrome ou playwright-core : sauté.

const { describe, it, before, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const A = require('./aide-navigateur');
const E = require('./aide-emulateur');

const { config } = A;
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

    // Tout le monde passe au jeu (écrans de tour encore fictifs : phase 5).
    await hote.waitForSelector('.ecran-choix', { timeout: 8000 });
    await invite.waitForSelector('.ecran-choix', { timeout: 8000 });
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

  it('aucune requête externe, aucune erreur de console', () => {
    assert.deepEqual(ctx.requetesExternes, []);
    assert.deepEqual(ctx.problemes, []);
  });
});
