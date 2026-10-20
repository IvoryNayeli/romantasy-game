'use strict';

// Phase 2 (itération 2) : parcours dans un vrai navigateur, écrits par le testeur.
//  - remarque 2 : « Créer une partie » (choix du code dans la liste, validation, salle d'attente) ;
//  - remarque 3 : « Rejoindre une partie » (saisie du code, messages d'erreur, salle d'attente) ;
//  - ordre des blocs de la salle : code de la partie (discret), menu emblème + prénom, liste du groupe ;
//  - remarque 1 : plus aucune option « Réduire les animations », plus aucun réglage mémorisé ;
//  - parcours complet de bout en bout.
// Prérequis : `npm install` et Google Chrome (sinon tests sautés). Mesures et serveur : aide-navigateur.js.

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const A = require('./aide-navigateur');

const { config, codes, ECRANS } = A;

describe('navigateur : parcours Créer, Rejoindre, salle d\'attente, réglage des animations retiré', { skip: A.raisonSaut || false }, () => {
  const ctx = A.contexte();
  const { ouvrir, fermer, texteVisible } = ctx;
  const codeDe = (page) => new URL(page.url()).searchParams.get('code');
  const sautVers = async (page, chemin) => {
    await page.goto(ctx.url(chemin).toString());
    await page.waitForSelector('#ecran > *');
  };

  // Position verticale et ordre dans le DOM des quatre blocs de la salle d'attente.
  const blocsSalle = (page) => page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const haut = (el) => el.getBoundingClientRect().top + window.scrollY;
    const code = q('.salle-corps .code-partie');
    const formulaire = q('.salle-corps .formulaire');
    const titre = q('.salle-corps h2.titre-liste');
    const liste = q('.salle-corps .liste-joueurs');
    const suivant = (a, b) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    const vp = getComputedStyle(code.querySelector('.code-valeur'));
    return {
      presents: Boolean(code && formulaire && titre && liste),
      ordreDom: suivant(code, formulaire) && suivant(formulaire, titre) && suivant(titre, liste),
      tops: [haut(code), haut(formulaire), haut(titre), haut(liste)],
      contientPrenom: Boolean(formulaire.querySelector('#champ-prenom')),
      contientEmblemes: formulaire.querySelectorAll('.embleme-choix').length,
      titreTexte: titre.textContent.trim(),
      enfants: [...q('.salle-corps').children].map((e) => e.className || e.tagName.toLowerCase()),
      code: code.querySelector('.code-valeur').textContent.trim(),
      codeTaille: parseFloat(vp.fontSize), codeCouleur: vp.color,
      prenomTaille: parseFloat(getComputedStyle(q('#champ-prenom') || document.body).fontSize),
      codeDansTitre: Boolean(code.closest('h1, h2, h3')),
    };
  });
  const verifierOrdreSalle = (b, contexteTexte) => {
    assert.ok(b.presents, `${contexteTexte} : bloc manquant`);
    assert.ok(b.ordreDom, `${contexteTexte} : ordre du DOM incorrect (code, menu, liste)`);
    assert.ok(b.tops[0] < b.tops[1] && b.tops[1] < b.tops[2] && b.tops[2] < b.tops[3], `${contexteTexte} : ordre visuel incorrect ${b.tops}`);
    assert.ok(b.contientPrenom && b.contientEmblemes === A.emblemes.length, `${contexteTexte} : le menu doit contenir le prénom et les ${A.emblemes.length} emblèmes`);
    assert.equal(b.titreTexte, 'La compagnie');
    // « Discret » : petit, couleur secondaire, pas un titre, plus petit que le texte du menu.
    assert.ok(b.codeTaille <= 18 && b.codeTaille < b.prenomTaille, `${contexteTexte} : code pas discret (${b.codeTaille}px)`);
    assert.equal(b.codeCouleur, 'rgb(143, 166, 200)', `${contexteTexte} : le code doit être en --c-lune-douce`);
    assert.ok(!b.codeDansTitre);
  };

  /* ============ Remarque 2 : Créer une partie ============ */
  it('Créer : la liste propose exactement les codes de codes.json, aucun n\'est choisi, la validation est bloquée sans choix', async () => {
    const page = await ouvrir('index.html?ecran=regles');
    await page.getByRole('link', { name: /Créer une partie/i }).click();
    await page.waitForSelector('.ecran-creer');
    assert.equal(await page.locator('.ecran-creer .titre-ecran').textContent(), 'Choisis le code de la partie');
    const radios = page.locator('.liste-codes input[type=radio]');
    assert.equal(await radios.count(), codes.length);
    const valeurs = await radios.evaluateAll((els) => els.map((e) => e.value));
    assert.deepEqual([...valeurs].sort(), [...codes].sort());
    const noms = (await page.locator('.liste-codes .code-option').allTextContents()).map((t) => t.trim());
    assert.deepEqual([...noms].sort(), [...codes].sort(), 'libellés visibles = codes de codes.json');
    assert.equal(await page.locator('.liste-codes input[type=radio]:checked').count(), 0, 'aucun code pré-choisi');
    assert.ok(await page.locator('button[type=submit]').isDisabled(), 'Valider doit être inactif sans choix');
    assert.equal(await page.locator('#champ-code').count(), 0, 'pas de champ de saisie sur « Créer »');
    // Soumission forcée sans choix (touche Entrée / requestSubmit) : on reste sur l'écran.
    await page.evaluate(() => document.querySelector('form').requestSubmit());
    await page.waitForTimeout(150);
    assert.ok(await page.locator('.ecran-creer').isVisible(), 'la soumission sans choix ne doit pas ouvrir la salle');
    assert.equal(new URL(page.url()).searchParams.get('ecran'), 'creer');
    // Accessibilité : groupe de boutons radio nommé, flèche de retour.
    assert.ok(await page.getByRole('radiogroup').count() >= 1);
    assert.ok(await page.getByRole('link', { name: /Retour aux règles/i }).isVisible());
    await ctx.capture(page, 'creer-vide-360', { fullPage: true });
    await fermer(page);
  });

  it('Créer : choisir un code l\'active, un seul code à la fois, la validation mène à la salle d\'attente avec ce code (les 10 codes)', async () => {
    const page = await ouvrir('index.html?ecran=creer');
    for (const code of codes) {
      await sautVers(page, 'index.html?ecran=creer');
      const option = page.locator('.code-option').filter({ hasText: new RegExp(`^\\s*${code}\\s*$`) });
      assert.equal(await option.count(), 1, `option ${code}`);
      await option.click();
      assert.equal(await page.locator('.liste-codes input[type=radio]:checked').count(), 1);
      assert.equal(await page.locator('.liste-codes input[type=radio]:checked').getAttribute('value'), code);
      assert.ok(await page.locator('button[type=submit]').isEnabled(), `Valider actif après le choix de ${code}`);
      await page.locator('button[type=submit]').click();
      await page.waitForSelector('.ecran-salle');
      assert.equal(codeDe(page), code);
      const b = await blocsSalle(page);
      assert.equal(b.code, code, 'le code affiché dans la salle est celui qui a été choisi');
      verifierOrdreSalle(b, `Créer ${code}`);
    }
    // Changer d'avis : le dernier choix gagne.
    await sautVers(page, 'index.html?ecran=creer');
    await page.locator('.code-option').filter({ hasText: /^\s*RUNE\s*$/ }).click();
    await page.locator('.code-option').filter({ hasText: /^\s*ONYX\s*$/ }).click();
    assert.equal(await page.locator('.liste-codes input[type=radio]:checked').getAttribute('value'), 'ONYX');
    await page.locator('button[type=submit]').click();
    await page.waitForSelector('.ecran-salle');
    assert.equal((await blocsSalle(page)).code, 'ONYX');
    await fermer(page);
  });

  it('Créer : choix au clavier (flèches), contour de focus visible, état choisi en ambre, capture', async () => {
    const page = await ouvrir('index.html?ecran=creer');
    await page.locator('.code-radio').first().focus();
    await page.keyboard.press('ArrowDown');
    const coche = await page.locator('.code-radio:checked').getAttribute('value');
    assert.ok(codes.includes(coche), 'une flèche doit choisir un code');
    assert.ok(await page.locator('button[type=submit]').isEnabled());
    const contour = await page.evaluate(() => {
      const el = document.querySelector('.code-radio:checked + .code-option-nom');
      const s = getComputedStyle(el);
      return { largeur: s.outlineWidth, style: s.outlineStyle, couleur: s.outlineColor, bordure: s.borderTopColor };
    });
    assert.equal(contour.style, 'solid', 'focus clavier visible');
    assert.equal(contour.largeur, '2px');
    assert.equal(contour.couleur, 'rgb(244, 241, 232)');
    assert.equal(contour.bordure, 'rgb(240, 163, 94)', 'le code choisi est signalé en ambre');
    await page.keyboard.press('Enter');
    await page.waitForSelector('.ecran-salle');
    assert.equal(codeDe(page), coche);
    await fermer(page);
    const p2 = await ouvrir('index.html?ecran=creer&code=ONYX');
    await ctx.capture(p2, 'creer-onyx-360', { fullPage: true });
    assert.equal(await p2.locator('.code-radio:checked').getAttribute('value'), 'ONYX');
    await fermer(p2);
  });

  it('Créer : flèche de retour vers les règles, et bouton Précédent depuis la salle', async () => {
    const page = await ouvrir('index.html?ecran=regles');
    await page.getByRole('link', { name: /Créer une partie/i }).click();
    await page.getByRole('link', { name: /Retour aux règles/i }).click();
    assert.ok(await page.locator('.ecran-regles').isVisible());
    await page.getByRole('link', { name: /Créer une partie/i }).click();
    await page.locator('.code-option').first().click();
    await page.locator('button[type=submit]').click();
    await page.waitForSelector('.ecran-salle');
    await page.goBack();
    assert.ok(await page.locator('.ecran-creer').isVisible(), 'Précédent depuis la salle revient au choix du code');
    await fermer(page);
  });

  it('Créer : dans la salle, la personne est hôte (étiquette, bouton « Commencer la quête » présent et inactif seule), prénom et emblème obligatoires', async () => {
    const page = await ouvrir('index.html?ecran=creer');
    await page.locator('.code-option').filter({ hasText: /^\s*AURORE\s*$/ }).click();
    await page.locator('button[type=submit]').click();
    await page.waitForSelector('.ecran-salle');
    assert.equal(await page.locator('.joueur-ligne:not(.joueur-libre)').count(), 2, 'l\'hôte + une personne déjà là');
    assert.match(await page.locator('.joueur-ligne.joueur-soi').first().textContent(), /hôte/i);
    assert.equal(await page.locator('.joueur-ligne.joueur-soi').count(), 1);
    const pret = page.getByRole('button', { name: /Je suis là/i });
    assert.ok(await pret.isDisabled(), 'Je suis là inactif sans prénom ni emblème');
    assert.ok(await page.getByRole('button', { name: /Commencer la quête/i }).isDisabled());
    assert.equal(await page.getByRole('button', { name: /copier|partager/i }).count(), 0);
    await ctx.capture(page, 'salle-apres-creer-360', { fullPage: true });
    await fermer(page);
  });

  /* ============ Remarque 3 : Rejoindre une partie ============ */
  it('Rejoindre : champ de saisie étiqueté, vide, sans erreur ; messages en français pour code vide, espaces, inconnu', async () => {
    const page = await ouvrir('index.html?ecran=regles');
    await page.getByRole('link', { name: /Rejoindre une partie/i }).click();
    await page.waitForSelector('.ecran-rejoindre');
    assert.equal(await page.locator('.ecran-rejoindre .titre-ecran').textContent(), 'Saisis le code de la partie');
    const champ = page.locator('#champ-code');
    assert.ok(await champ.isVisible());
    assert.equal(await champ.inputValue(), '');
    assert.ok(await page.getByLabel(/Code de la partie/i).isVisible(), 'champ relié à son étiquette');
    assert.equal(await page.locator('#erreur-code').textContent(), '', 'aucune erreur au départ');
    assert.equal(await page.locator('.liste-codes').count(), 0, 'pas de liste de codes sur « Rejoindre » (le code est saisi)');
    assert.ok(await page.getByRole('link', { name: /Retour aux règles/i }).isVisible());

    // 1. Code vide
    await page.locator('button[type=submit]').click();
    const vide = (await page.locator('#erreur-code').textContent()).trim();
    assert.equal(vide, 'Saisis le code de la partie.');
    assert.equal(await page.locator('#erreur-code').getAttribute('role'), 'alert');
    assert.equal(await champ.getAttribute('aria-invalid'), 'true');
    assert.ok(await page.locator('.ecran-rejoindre').isVisible(), 'on reste sur la saisie');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'champ-code', 'le focus revient sur le champ');
    await ctx.capture(page, 'rejoindre-erreur-vide-360', { fullPage: true });
    // L'erreur disparaît dès qu'on tape.
    await champ.fill('R');
    assert.equal((await page.locator('#erreur-code').textContent()).trim(), '');
    assert.equal(await champ.getAttribute('aria-invalid'), null);

    // 2. Espaces seulement
    await champ.fill('     ');
    await page.locator('button[type=submit]').click();
    assert.equal((await page.locator('#erreur-code').textContent()).trim(), vide);

    // 3. Codes inconnus (y compris des quasi-codes et du HTML)
    let inconnu = null;
    for (const faux of ['DRAGON', 'ECLIP', 'ECLIPSES', 'ECL IPSE', 'rune!', '<b>x</b>', '0000', 'Élixirs', 'a'.repeat(300)]) {
      await champ.fill(faux);
      await page.locator('button[type=submit]').click();
      const msg = (await page.locator('#erreur-code').textContent()).trim();
      assert.ok(msg.length > 10, `message d'erreur attendu pour « ${faux.slice(0, 20)} »`);
      assert.ok(await page.locator('.ecran-rejoindre').isVisible(), `« ${faux.slice(0, 20)} » ne doit pas ouvrir la salle`);
      if (inconnu === null) inconnu = msg;
      assert.equal(msg, inconnu, 'même message pour tout code inconnu');
    }
    assert.equal(inconnu, 'Ce code ne correspond à aucune partie. Vérifie-le et réessaie.');
    assert.notEqual(inconnu, vide);
    for (const m of [vide, inconnu]) {
      assert.ok(/code/i.test(m) && /[.!]$/.test(m), `message en français, phrase complète : ${m}`);
      assert.ok(!/\b(error|invalid|required|unknown|not found)\b/i.test(m), `message non français : ${m}`);
    }
    assert.equal(await page.evaluate(() => window.__xss), undefined);
    assert.equal(await page.locator('.ecran-rejoindre b').count(), 0, 'pas d\'injection HTML');
    await fermer(page);
  });

  it('Rejoindre : un code valide en minuscules, en majuscules, avec accents, espaces ou accents décomposés ouvre la salle avec le code canonique (les 10 codes)', async () => {
    const page = await ouvrir('index.html?ecran=rejoindre');
    const accentue = (c) => c.toLowerCase().replace('e', 'é');
    const decompose = (c) => c.toLowerCase().replace('e', 'e\u0301');
    for (const code of codes) {
      const variantes = [code.toLowerCase(), code, code[0] + code.slice(1).toLowerCase(), `  ${code.toLowerCase()} `, accentue(code), decompose(code)];
      for (const saisie of variantes) {
        await sautVers(page, 'index.html?ecran=rejoindre');
        await page.locator('#champ-code').fill(saisie);
        await page.locator('#champ-code').press('Enter');
        await page.waitForSelector('.ecran-salle', { timeout: 3000 });
        assert.equal(codeDe(page), code, `saisie « ${saisie} » : code de l'adresse`);
        assert.equal((await blocsSalle(page)).code, code, `saisie « ${saisie} » : code affiché`);
      }
    }
    // Exemples cités par la propriétaire du projet : accents et casse.
    for (const [saisie, attendu] of [['élixir', 'ELIXIR'], ['Sortilège', 'SORTILEGE'], ['ÉCLIPSE', 'ECLIPSE'], ['obsidienne', 'OBSIDIENNE']]) {
      await sautVers(page, 'index.html?ecran=rejoindre');
      await page.locator('#champ-code').fill(saisie);
      await page.locator('button[type=submit]').click();
      await page.waitForSelector('.ecran-salle');
      assert.equal((await blocsSalle(page)).code, attendu);
    }
    await fermer(page);
  });

  it('Rejoindre : la salle d\'attente a le même ordre que pour Créer (code discret, menu, liste), sans bouton « Commencer »', async () => {
    const page = await ouvrir('index.html?ecran=regles');
    await page.getByRole('link', { name: /Créer une partie/i }).click();
    await page.locator('.code-option').filter({ hasText: /^\s*CRYPTE\s*$/ }).click();
    await page.locator('button[type=submit]').click();
    await page.waitForSelector('.ecran-salle');
    const blocsCreer = await blocsSalle(page);
    await sautVers(page, 'index.html?ecran=regles');
    await page.getByRole('link', { name: /Rejoindre une partie/i }).click();
    await page.locator('#champ-code').fill('crypte');
    await page.getByRole('button', { name: /Valider/i }).click();
    await page.waitForSelector('.ecran-salle');
    const blocsRejoindre = await blocsSalle(page);
    verifierOrdreSalle(blocsRejoindre, 'Rejoindre');
    assert.deepEqual(blocsRejoindre.enfants, blocsCreer.enfants, 'même structure de salle après Créer et après Rejoindre');
    assert.equal(blocsRejoindre.code, 'CRYPTE');
    assert.equal(await page.getByRole('button', { name: /Commencer la quête/i }).count(), 0, 'seul(e) l\'hôte voit « Commencer »');
    assert.equal(await page.getByRole('button', { name: /copier|partager/i }).count(), 0);
    // Les autres sont déjà là, la personne qui rejoint arrive en dernier.
    const lignes = await page.locator('.joueur-ligne:not(.joueur-libre)').count();
    assert.equal(lignes, 3);
    assert.equal(await page.locator('.joueur-ligne:not(.joueur-libre)').nth(lignes - 1).evaluate((e) => e.classList.contains('joueur-soi')), true);
    assert.match(await page.locator('.joueur-ligne').first().textContent(), /hôte/i);
    await ctx.capture(page, 'salle-apres-rejoindre-360', { fullPage: true });
    await fermer(page);
  });

  it('Rejoindre : flèche de retour vers les règles, bouton Précédent, aucune écriture de code dans le stockage', async () => {
    const page = await ouvrir('index.html?ecran=regles');
    await page.getByRole('link', { name: /Rejoindre une partie/i }).click();
    await page.getByRole('link', { name: /Retour aux règles/i }).click();
    assert.ok(await page.locator('.ecran-regles').isVisible());
    await page.getByRole('link', { name: /Rejoindre une partie/i }).click();
    await page.locator('#champ-code').fill('onyx');
    await page.locator('#champ-code').press('Enter');
    await page.waitForSelector('.ecran-salle');
    await page.goBack();
    assert.ok(await page.locator('.ecran-rejoindre').isVisible());
    assert.deepEqual(await page.evaluate(() => window.__ecritures), []);
    await fermer(page);
  });

  /* ============ Salle : menu emblème / prénom ============ */
  it('salle : « prêt(e) » exige un prénom ET un emblème, un emblème déjà pris est grisé, cinq places au plus, partie complète', async () => {
    const page = await ouvrir('index.html?ecran=salle&hote=1&autres=1&code=RUNE');
    const pret = page.getByRole('button', { name: /Je suis là/i });
    assert.ok(await pret.isDisabled());
    await page.locator('#champ-prenom').fill('Robin');
    assert.ok(await pret.isDisabled(), 'prêt(e) inactif sans emblème');
    assert.equal(await page.locator('.embleme-choix:disabled').count(), 1, 'l\'emblème pris est grisé');
    await page.getByRole('radio', { name: /Démon/i }).click();
    assert.equal(await page.getByRole('radio', { name: /Démon/i }).getAttribute('aria-checked'), 'true');
    assert.ok(await pret.isEnabled());
    await pret.click();
    assert.ok(await page.getByRole('button', { name: /Commencer la quête/i }).isEnabled(), 'hôte prêt(e) + 1 autre : commencer actif');
    await fermer(page);
    const pleine = await ouvrir('index.html?ecran=salle&complete=1');
    assert.match((await pleine.locator('.avis-complete').textContent()).trim(), /^La partie est complète$/);
    assert.equal(await pleine.getByRole('button').count(), 0);
    assert.equal(await pleine.locator('.joueur-ligne:not(.joueur-libre)').count(), config.joueursMax);
    await fermer(pleine);
    const seule = await ouvrir('index.html?ecran=salle&hote=1&autres=0');
    await seule.locator('#champ-prenom').fill('Ana');
    await seule.getByRole('radio', { name: /Fée/i }).click();
    await seule.getByRole('button', { name: /Je suis là/i }).click();
    assert.ok(await seule.getByRole('button', { name: /Commencer la quête/i }).isDisabled(), 'une seule personne prête : commencer reste inactif');
    await fermer(seule);
  });

  it('salle : après « Je suis là », « C\'est bon » est définitif (bouton inactif, clic sans effet, prénom et emblèmes verrouillés)', async () => {
    const page = await ouvrir('index.html?ecran=salle&hote=1&autres=1&code=RUNE');
    await page.locator('#champ-prenom').fill('Robin');
    await page.getByRole('radio', { name: /Démon/i }).click();
    await page.getByRole('button', { name: /Je suis là/i }).click();
    const bouton = page.getByRole('button', { name: /C'est bon/i });
    assert.ok(await bouton.isDisabled(), 'le bouton est inactif une fois validé');
    await bouton.click({ force: true });
    assert.match(await page.locator('.joueur-soi').textContent(), /C'est bon/i, 'un second clic ne doit pas annuler');
    assert.equal(await page.getByRole('button', { name: /Je suis là/i }).count(), 0);
    assert.ok(await page.locator('#champ-prenom').isDisabled(), 'prénom verrouillé');
    assert.equal(await page.locator('.embleme-choix:not(:disabled)').count(), 0, 'emblèmes verrouillés');
    assert.equal(await page.getByRole('radio', { name: /Démon/i }).getAttribute('aria-checked'), 'true');
    assert.ok(await page.getByRole('button', { name: /Commencer la quête/i }).isEnabled(), 'l\'hôte peut commencer');
    await fermer(page);
  });

  /* ============ Remarque 1 : plus d'option « Réduire les animations » ============ */
  it('aucune option « Réduire les animations » : ni bouton, ni texte, ni attribut, ni stockage, sur tous les écrans', async () => {
    const defauts = [];
    const pages = [...ECRANS.map(([nom, c]) => [nom, `index.html${c}`]), ['demo', 'demo.html']];
    for (const [nom, url] of pages) {
      const page = await ouvrir(url);
      const m = await page.evaluate(() => ({
        interactifs: [...document.querySelectorAll('button, a, [role=button], [role=switch], input, label')]
          .map((e) => `${e.textContent} ${e.getAttribute('aria-label') || ''}`).filter((t) => /animation|mouvement/i.test(t)),
        pressables: document.querySelectorAll('[aria-pressed]:not(.bouton)').length,
        attribut: document.documentElement.hasAttribute('data-animations') || document.body.hasAttribute('data-animations'),
        longueur: localStorage.length + sessionStorage.length,
        ecritures: window.__ecritures,
        texte: document.body.textContent,
      }));
      if (m.interactifs.length) defauts.push(`[${nom}] contrôle lié aux animations : ${m.interactifs}`);
      if (m.pressables) defauts.push(`[${nom}] interrupteur aria-pressed`);
      if (m.attribut) defauts.push(`[${nom}] attribut data-animations présent`);
      if (m.longueur || m.ecritures.length) defauts.push(`[${nom}] stockage utilisé : ${m.ecritures}`);
      if (/réduire les animations/i.test(m.texte)) defauts.push(`[${nom}] texte « Réduire les animations »`);
      await fermer(page);
    }
    assert.deepEqual(defauts, []);
  });

  it('aucune option d\'animation dans le code : pas de localStorage, pas de fichier de réglages, pas de texte dédié, README à jour', () => {
    const lire = (p) => fs.readFileSync(path.join(A.RACINE, p), 'utf8');
    assert.ok(!fs.existsSync(path.join(A.PUBLIC, 'js', 'reglages.js')), 'public/js/reglages.js doit avoir disparu');
    const fichiers = [];
    const parcourir = (dossier) => {
      for (const e of fs.readdirSync(dossier, { withFileTypes: true })) {
        const p = path.join(dossier, e.name);
        if (e.isDirectory()) { if (e.name !== 'fonts') parcourir(p); } else if (/\.(js|html|css)$/.test(e.name)) fichiers.push(p);
      }
    };
    parcourir(A.PUBLIC);
    assert.ok(fichiers.length >= 8);
    for (const f of fichiers) {
      const t = fs.readFileSync(f, 'utf8');
      const nom = path.relative(A.RACINE, f);
      // Phase 4 : seul reseau.js garde une donnée dans l'onglet (sessionStorage) : l'identité de la personne dans
      // la partie en cours, pas un réglage.
      if (nom !== path.join('public', 'js', 'reseau.js')) assert.ok(!/localStorage|sessionStorage|indexedDB/.test(t), `${nom} : stockage local`);
      else assert.ok(!/localStorage|indexedDB/.test(t), `${nom} : stockage local`);
      assert.ok(!/réduire les animations/i.test(t), `${nom} : texte « Réduire les animations »`);
      assert.ok(!/data-animations|dataset\.animations|animations-reduites|reglage/i.test(t), `${nom} : reste du réglage d'animations`);
    }
    const readme = lire('README.md');
    assert.ok(!/bouton .{0,30}réduire les animations|réduire les animations.{0,30}bouton|localStorage/i.test(readme), 'le README ne doit plus parler d\'un bouton ou d\'un réglage mémorisé');
    assert.match(lire('public/css/style.css'), /@media \(prefers-reduced-motion: reduce\)/);
    assert.match(readme, /prefers-reduced-motion|réduire les animations|réduction des animations|animations se coupent/i, 'le README doit mentionner la règle système');
  });

  /* ============ Parcours complets ============ */
  it('parcours complet « Créer » : accueil, règles, choix du code, salle, tous les tours, bouclier, fin, nouvelle quête', async () => {
    const page = await ouvrir('index.html', { largeur: 360 });
    assert.match(await page.locator('.accueil-salut').textContent(), /Bienvenue, voyageur\(se\)\./);
    assert.equal(await page.getByRole('link').count(), 1, 'l\'accueil ne doit contenir qu\'un bouton');
    assert.equal(await page.locator('h1').count(), 0, 'aucun titre h1 sur l\'accueil');
    await page.getByRole('link', { name: /Comment ça marche ?/i }).click();
    assert.ok(await page.getByRole('heading', { name: 'But du jeu' }).isVisible());
    assert.ok(await page.getByRole('link', { name: /Retour à l'accueil/i }).isVisible());
    assert.ok(await page.getByRole('link', { name: /Rejoindre une partie/i }).isVisible());
    await page.getByRole('link', { name: /Créer une partie/i }).click();
    await page.locator('.code-option').filter({ hasText: /^\s*GRIMOIRE\s*$/ }).click();
    await page.locator('button[type=submit]').click();
    assert.equal((await blocsSalle(page)).code, 'GRIMOIRE');
    const bouton = page.getByRole('button', { name: /Je suis là/i });
    const commencer = page.getByRole('button', { name: /Commencer la quête/i });
    assert.ok(await bouton.isDisabled());
    assert.ok(await commencer.isDisabled());
    await page.locator('#champ-prenom').fill('Robin');
    await page.getByRole('radio', { name: /Démon/i }).click();
    await bouton.click();
    assert.ok(await commencer.isEnabled(), 'hôte prêt(e) + 1 autre : commencer doit être actif');
    await ctx.capture(page, 'parcours-salle-360', { fullPage: true });
    await commencer.click();
    for (let tour = 1; tour <= config.tours; tour += 1) {
      assert.equal(await page.locator('.compteur').textContent(), `Tour ${tour} / ${config.tours}`);
      assert.ok(await page.getByRole('heading', { name: 'À toi de jouer !' }).isVisible());
      assert.equal(await page.locator('.dos').count(), 2);
      await page.locator(tour % 2 ? '.dos-epreuve' : '.dos-revelation').click();
      assert.ok(await page.locator('.carte-texte').isVisible());
      if (tour === 2) {
        await page.getByRole('button', { name: /Invoquer un bouclier/i }).click();
        assert.match(await page.locator('dialog[open] .dialogue-texte').textContent(), /Invoquer un bouclier \? Ton tour sera tout de même compté\./);
        await page.getByRole('button', { name: /Annuler/i }).click();
        assert.equal(await page.locator('dialog[open]').count(), 0);
        await page.getByRole('button', { name: /Invoquer un bouclier/i }).click();
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('dialog[open]').count(), 0, 'Échap doit fermer la confirmation');
        await page.getByRole('button', { name: /Invoquer un bouclier/i }).click();
        await page.locator('dialog[open]').getByRole('button', { name: /^Invoquer$/i }).click();
        assert.match(await page.locator('.transition-texte').textContent(), /a invoqué un bouclier\.$/);
      } else {
        await page.getByRole('link', { name: /Le sort est jeté/i }).click();
        assert.match(await page.locator('.transition-texte').textContent(), /^Le sort est jeté pour .+\.$/);
      }
      if (tour < config.tours) await page.waitForSelector('.ecran-choix', { timeout: 4000 });
    }
    await page.waitForSelector('.ecran-fin', { timeout: 4000 });
    assert.match(await page.locator('.accueil-salut').textContent(), /La quête s'achève\./);
    await ctx.capture(page, 'parcours-fin-360', { fullPage: true });
    await page.getByRole('link', { name: /Nouvelle quête/i }).click();
    assert.ok(await page.locator('.ecran-accueil').isVisible());
    await page.goBack();
    assert.ok(await page.locator('.ecran-fin').isVisible(), 'Précédent doit revenir à l\'écran de fin');
    assert.deepEqual(await page.evaluate(() => window.__ecritures), [], 'aucun réglage mémorisé pendant tout le parcours');
    assert.equal(await page.locator('.grain').count(), 1);
    await fermer(page);
  });

  it('parcours complet « Rejoindre » : accueil, règles, saisie du code, salle, prénom, emblème, prêt(e)', async () => {
    const page = await ouvrir('index.html', { largeur: 412 });
    await page.getByRole('link', { name: /Comment ça marche ?/i }).click();
    await page.getByRole('link', { name: /Rejoindre une partie/i }).click();
    await page.locator('#champ-code').fill('Talisman');
    await page.locator('#champ-code').press('Enter');
    await page.waitForSelector('.ecran-salle');
    assert.equal((await blocsSalle(page)).code, 'TALISMAN');
    await page.locator('#champ-prenom').fill('Maé');
    await page.locator('.embleme-choix:not(:disabled)').first().click();
    await page.getByRole('button', { name: /Je suis là/i }).click();
    assert.match(await page.locator('.joueur-soi').textContent(), /Maé/);
    assert.match(await page.locator('.joueur-soi').textContent(), /C'est bon/i);
    assert.equal(await page.getByRole('button', { name: /Commencer la quête/i }).count(), 0);
    await ctx.capture(page, 'parcours-rejoindre-salle-412', { fullPage: true });
    await fermer(page);
  });

  /* ============ Bilan ============ */
  it('aucune erreur de console, aucune requête échouée ni externe sur tous les parcours', () => {
    assert.deepEqual([...new Set(ctx.problemes)], []);
    assert.deepEqual(ctx.requetesExternes, []);
  });
});
