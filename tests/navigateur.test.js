'use strict';

// Phase 2 (itération 2) : tests dans un vrai navigateur (Chrome piloté par playwright-core), écrits par le testeur.
// Ce fichier : écrans, débordements, tailles, contrastes réels, polices, requêtes externes, animations
// (prefers-reduced-motion), textes, page de démonstration. Les parcours « Créer » / « Rejoindre » et la
// suppression de l'option « Réduire les animations » sont dans navigateur-parcours.test.js ; la conformité à la
// charte graphique (docs/charte-graphique.md) est dans navigateur-charte.test.js. Mesures : aide-navigateur.js.
//
// Prérequis : `npm install` (playwright-core) et Google Chrome. Sans eux, tous ces tests sont SAUTÉS avec un message.
// Les textes sont affichés en capitales par `text-transform: uppercase` : les comparaisons de texte utilisent
// `textContent` (jamais `innerText`).

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const A = require('./aide-navigateur');

const { config, cartes, LARGEURS, ECRANS, plusLongue, durable } = A;

describe('navigateur : écrans, design et textes (Chrome local)', { skip: A.raisonSaut || false }, () => {
  const ctx = A.contexte();
  const { ouvrir, fermer, finAnimations, texteVisible } = ctx;
  const nomFichier = (s) => s.replace(/[^\w-]+/g, '_');

  /* ============ 1. Captures d'écran, débordement, boutons, tailles ============ */
  for (const largeur of LARGEURS) {
    it(`captures + débordement + cibles tactiles + tailles de texte : ${ECRANS.length} écrans à ${largeur} px`, async () => {
      const defauts = [];
      for (const [nom, chemin] of ECRANS) {
        const page = await ouvrir(`index.html${chemin}`, { largeur, hauteur: 800 });
        await finAnimations(page);
        await ctx.capture(page, `${nomFichier(nom)}-${largeur}`, { fullPage: true });
        for (const p of await page.evaluate(A.mesurerDebordements)) defauts.push(`[${nom} ${largeur}] ${p}`);
        const cibles = await page.evaluate(A.mesurerCibles);
        for (const c of cibles) {
          if (c.h < 47.5 || c.l < 47.5) defauts.push(`[${nom} ${largeur}] cible trop petite : ${c.nom} « ${c.texte} » ${c.l.toFixed(1)}x${c.h.toFixed(1)}`);
        }
        // Espace d'au moins 8 px entre deux cibles tactiles (charte, section 7)
        for (let i = 0; i < cibles.length; i += 1) {
          for (let j = i + 1; j < cibles.length; j += 1) {
            const a = cibles[i]; const b = cibles[j];
            const dx = Math.max(a.g - b.d, b.g - a.d); const dy = Math.max(a.t - b.b, b.t - a.b);
            const distance = Math.hypot(Math.max(dx, 0), Math.max(dy, 0));
            if (distance < 7.5) defauts.push(`[${nom} ${largeur}] cibles à ${distance.toFixed(1)} px l'une de l'autre (< 8) : « ${a.texte} » et « ${b.texte} »`);
          }
        }
        const pol = await page.evaluate(A.mesurerPolices);
        for (const t of pol.carte) if (t < 20) defauts.push(`[${nom} ${largeur}] texte de carte ${t}px < 20px`);
        for (const t of pol.corps) if (t < 20) defauts.push(`[${nom} ${largeur}] texte de lecture ${t}px < 20px`);
        // Charte, section 4 : légendes >= 12 px (capitales), texte courant >= 15 px.
        for (const p of pol.petits) {
          if (p.px < 12) defauts.push(`[${nom} ${largeur}] texte < 12 px : ${p.extrait}`);
          // Plus aucune exception : les noms d'emblème de la salle font 15 px depuis le deuxième passage de l'itération 2 (remarque R1 réglée).
          else if (!p.capitales && p.px < 15) defauts.push(`[${nom} ${largeur}] texte courant < 15 px (hors capitales) : ${p.extrait}`);
        }
        await fermer(page);
      }
      assert.deepEqual(defauts, []);
    });
  }

  for (const largeur of LARGEURS) {
    it(`les 40 cartes : écrans « carte » et « attente » sans débordement à ${largeur} px, texte >= 20 px, texte dans le filet de la carte`, async () => {
      const defauts = [];
      let vues = 0;
      let page = null;
      for (const c of cartes) {
        for (const ecran of ['carte', 'attente']) {
          const adresseCarte = `index.html?ecran=${ecran}&carte=${c.id}&tour=2`;
          if (!page) page = await ouvrir(adresseCarte, { largeur, hauteur: 740, reduit: true });
          else { await page.goto(new URL(adresseCarte, `${ctx.base}/`).toString()); await page.waitForSelector('#ecran > *'); }
          await finAnimations(page);
          const texteAffiche = await page.locator('.carte-texte').textContent();
          if (texteAffiche.replace(/\s+/g, ' ').trim() !== c.texte.replace(/\s+/g, ' ').trim()) {
            defauts.push(`[${c.id} ${ecran}] texte affiché différent de cartes.json`);
          }
          for (const p of await page.evaluate(A.mesurerDebordements)) defauts.push(`[${c.id} ${ecran} ${largeur}] ${p}`);
          for (const p of await page.evaluate(A.mesurerCarte)) defauts.push(`[${c.id} ${ecran} ${largeur}] ${p}`);
          const pol = await page.evaluate(A.mesurerPolices);
          if (!pol.carte.length || pol.carte.some((t) => t < 20)) defauts.push(`[${c.id} ${ecran}] texte de carte < 20px (${pol.carte})`);
          for (const t of pol.corps) if (t < 20) defauts.push(`[${c.id} ${ecran} ${largeur}] texte de lecture ${t}px < 20px`);
          if (c.effet) {
            const bandeau = await page.locator('.bandeau-texte, .effets-texte').allTextContents();
            if (!bandeau.some((t) => t.includes(c.effet))) defauts.push(`[${c.id} ${ecran}] effet durable « ${c.effet} » absent`);
          }
          if (ecran === 'carte') {
            // Les deux boutons sont atteignables : en bas de page, ils ne masquent pas le texte de la carte.
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            const geo = await page.evaluate(() => {
              const barre = document.querySelector('.barre-bas').getBoundingClientRect();
              const carte = document.querySelector('.carte-face').getBoundingClientRect();
              const boutons = [...document.querySelectorAll('.barre-bas .bouton')].map((b) => b.getBoundingClientRect());
              return { barreHaut: barre.top, carteBas: carte.bottom, boutons: boutons.map((b) => [b.top, b.bottom]), H: innerHeight };
            });
            if (geo.carteBas > geo.barreHaut + 1) defauts.push(`[${c.id} ${largeur}] bas de carte masqué par la barre de boutons en fin de défilement (${geo.carteBas.toFixed(0)} > ${geo.barreHaut.toFixed(0)})`);
            if (geo.boutons.some(([t, b]) => t < 0 || b > geo.H + 0.5)) defauts.push(`[${c.id} ${largeur}] bouton hors de la fenêtre en fin de défilement`);
          }
          vues += 1;
          if (c.id === plusLongue.id || c.id === 'epr-06' || c.id === 'rev-01') {
            await ctx.capture(page, `carte-${ecran}-${c.id}-${largeur}`, { fullPage: true });
          }
        }
      }
      await fermer(page);
      assert.equal(vues, cartes.length * 2);
      assert.deepEqual(defauts, []);
    });
  }

  it('petit téléphone (360 x 640) : la carte la plus longue reste lisible et les boutons restent atteignables', async () => {
    const page = await ouvrir(`index.html?ecran=carte&carte=${plusLongue.id}`, { largeur: 360, hauteur: 640 });
    await finAnimations(page);
    await ctx.capture(page, 'carte-longue-360x640', { fullPage: false });
    const defauts = await page.evaluate(A.mesurerDebordements);
    await page.locator('.barre-bas .bouton-principal').scrollIntoViewIfNeeded();
    const b = await page.locator('.barre-bas .bouton').first().boundingBox();
    assert.ok(b && b.y >= 0 && b.y + b.height <= 640, 'bouton principal hors fenêtre');
    assert.deepEqual(defauts, []);
    await fermer(page);
  });

  /* ============ 2. Contrastes réels ============ */
  it('contrastes mesurés sur les pixels rendus (étoiles, grain et lettrine neutralisés) : texte >= 4,5:1 (3:1 grand texte), 360 et 412 px', async () => {
    const defauts = []; const resume = [];
    for (const largeur of LARGEURS) {
      for (const [nom, chemin] of ECRANS) {
        const page = await ouvrir(`index.html${chemin}`, { largeur, hauteur: 800, reduit: true });
        for (const r of await ctx.contrastes(page)) {
          if (r.desactive || !Number.isFinite(r.ratio)) continue;
          const grand = r.taille >= 24 || (r.taille >= 18.66 && r.gras);
          const seuil = grand ? 3 : 4.5;
          resume.push(r.ratio);
          if (r.ratio < seuil) defauts.push(`[${nom} ${largeur}] contraste ${r.ratio.toFixed(2)} < ${seuil} : « ${r.texte} » (${r.classe}, ${r.taille}px)`);
        }
        await fermer(page);
      }
    }
    console.log(`# contraste réel minimal relevé : ${Math.min(...resume).toFixed(2)}:1 sur ${resume.length} textes`);
    assert.deepEqual(defauts, []);
  });

  it('contrastes : textes de la fenêtre de confirmation du bouclier', async () => {
    const page = await ouvrir('index.html?ecran=carte&type=epreuve', { reduit: true });
    await page.getByRole('button', { name: /Invoquer un bouclier/i }).click();
    assert.ok(await page.locator('dialog[open]').count(), 'la fenêtre de confirmation ne s\'ouvre pas');
    const cibles = await page.evaluate(A.mesurerCibles);
    const dansDialogue = cibles.filter((c) => /Invoquer|Annuler/i.test(c.texte));
    assert.ok(dansDialogue.length >= 2);
    for (const c of dansDialogue) assert.ok(c.h >= 47.5, `bouton ${c.texte} ${c.h}px`);
    const textes = await page.evaluate(A.collecterTextes);
    const dlg = textes.filter((t) => /Invoquer un bouclier \?|Annuler|^Invoquer$/i.test(t.texte));
    await page.addStyleTag({ content: '* { color: transparent !important; text-shadow: none !important; } .grain, .etoile { display: none !important; }' });
    const png = await page.screenshot();
    const res = await ctx.pageCalcul.evaluate(A.calculerContrastes, { base64: png.toString('base64'), textes: dlg });
    await fermer(page);
    assert.ok(res.length >= 3);
    for (const r of res) assert.ok(r.ratio >= 4.5, `contraste ${r.ratio.toFixed(2)} pour « ${r.texte} »`);
  });

  /* ============ 3. Polices, requêtes externes ============ */
  it('polices hébergées réellement chargées et utilisées (Cormorant Garamond et Jost), aucune police de secours ni requête externe', async () => {
    const facesChargees = async (page) => page.evaluate(async () => {
      await document.fonts.ready;
      return [...document.fonts].filter((f) => f.status === 'loaded').map((f) => `${f.family.replace(/"/g, '')}|${f.weight}|${f.style}`);
    });
    const policesDe = async (page, sels) => {
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
      const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
      const sortie = {};
      for (const sel of sels) {
        const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: sel });
        assert.ok(nodeId, `sélecteur introuvable : ${sel}`);
        const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
        sortie[sel] = fonts.map((f) => `${f.familyName}${f.isCustomFont ? ' (hébergée)' : ' (système)'}`);
      }
      return sortie;
    };
    const jost = /^Jost.*\(hébergée\)/; const cormorant = /^Cormorant Garamond.*\(hébergée\)/;
    const page = await ouvrir('index.html?ecran=carte&type=epreuve', { largeur: 412 });
    await finAnimations(page);
    const etat = await page.evaluate(async () => { await document.fonts.ready; return [...document.fonts].map((f) => `${f.family}|${f.weight}|${f.style}|${f.status}`); });
    const rendu = await policesDe(page, ['.barre-bas .bouton', '.carte-texte', '.carte-entete span', '.compteur']);
    for (const [sel, f] of Object.entries(rendu)) {
      // La lettrine (::first-letter) du texte de carte est en Cormorant Garamond : le nœud affiche donc les deux polices hébergées.
      const attendues = sel === '.carte-texte' ? (x) => jost.test(x) || cormorant.test(x) : (x) => jost.test(x);
      assert.ok(f.length && f.some((x) => jost.test(x)) && f.every(attendues), `${sel} : polices hébergées attendues (Jost), obtenu ${f}`);
    }
    assert.ok(etat.length >= 6 && etat.every((e) => !/\|error$/.test(e)), `FontFace : ${etat}`);
    const chargees = new Set(await facesChargees(page));
    await fermer(page);
    // Titres et logo : Cormorant Garamond hébergée.
    const accueil = await ouvrir('index.html?ecran=accueil');
    await finAnimations(accueil);
    const titres = await policesDe(accueil, ['.accueil-salut']);
    for (const [sel, f] of Object.entries(titres)) assert.ok(f.length && f.every((x) => cormorant.test(x)), `${sel} : Cormorant Garamond hébergée attendue, obtenu ${f}`);
    for (const f of await facesChargees(accueil)) chargees.add(f);
    await fermer(accueil);
    const regles = await ouvrir('index.html?ecran=regles');
    const h2 = await policesDe(regles, ['h2']);
    assert.ok(h2.h2.every((x) => cormorant.test(x)), `h2 : ${h2.h2}`);
    await fermer(regles);
    for (const url of ['index.html?ecran=regles', 'index.html?ecran=creer', 'index.html?ecran=rejoindre', 'index.html?ecran=salle&autres=2',
      'index.html?ecran=attente&type=revelation&tour=2', `index.html?ecran=carte&carte=${durable.id}`, 'index.html?ecran=transition']) {
      const p = await ouvrir(url); await finAnimations(p);
      for (const f of await facesChargees(p)) chargees.add(f);
      await fermer(p);
    }
    // Chaque graisse réellement utilisée par un écran est bien chargée (italique des titres, lettrine en 600, Jost 300/400/500).
    for (const attendue of ['Cormorant Garamond|600|normal', 'Cormorant Garamond|500|italic', 'Jost|300|normal', 'Jost|400|normal', 'Jost|500|normal']) {
      assert.ok(chargees.has(attendue), `police ${attendue} jamais chargée : ${[...chargees]}`);
    }
    const demandes = [...ctx.polices];
    assert.ok(demandes.length >= 5 && demandes.every((p) => /^(CormorantGaramond|Jost)-/.test(p)), `fichiers de police demandés : ${demandes}`);
    assert.deepEqual(ctx.requetesExternes, [], 'requêtes vers des adresses non locales');
  });

  it('aucune requête vers une adresse non locale sur le parcours et la page de démonstration', async () => {
    const avant = ctx.requetesExternes.length;
    const page = await ouvrir('demo.html');
    await finAnimations(page);
    await fermer(page);
    const page2 = await ouvrir('index.html');
    await page2.getByRole('link', { name: /Comment ça marche ?/i }).click();
    await fermer(page2);
    assert.deepEqual(ctx.requetesExternes.slice(avant), []);
    assert.deepEqual(ctx.requetesExternes, []);
  });

  /* ============ 4. Animations : seule la règle système prefers-reduced-motion agit ============ */
  const ANIMATIONS_PAR_ECRAN = [
    ['accueil', 'index.html?ecran=accueil', ['.etoile', '.ecran']],
    ['choix', 'index.html?ecran=choix', ['.ecran']],
    ['carte', 'index.html?ecran=carte&type=epreuve', ['.carte-3d', '.ecran']],
    ['transition', 'index.html?ecran=transition', ['.transition-icone', '.ecran']],
  ];
  const nomsAnimation = (page, sel) => page.evaluate((s) => {
    const e = document.querySelector(s);
    const anims = document.getAnimations().filter((a) => a.effect && a.effect.target === e);
    return anims.length ? anims.map((a) => a.animationName).join(',') : 'none';
  }, sel);

  it('animations complètes par défaut : étoiles (5 et 7 s), fondu des écrans (300 ms), retournement de carte (600 ms), pulsation', async () => {
    for (const [nom, url, sels] of ANIMATIONS_PAR_ECRAN) {
      const page = await ouvrir(url);
      for (const s of sels) assert.notEqual(await nomsAnimation(page, s), 'none', `${nom} ${s} : animation attendue`);
      assert.ok(await page.evaluate(() => document.getAnimations().length) > 0, `${nom} : aucune animation en cours`);
      await fermer(page);
    }
    const page = await ouvrir('index.html?ecran=accueil');
    const durees = await page.evaluate(() => {
      const d = (s) => getComputedStyle(document.querySelector(s)).animationDuration;
      return { ecran: d('.ecran'), etoile1: d('.etoile:nth-child(1)'), etoile2: d('.etoile:nth-child(2)') };
    });
    assert.equal(durees.ecran, '0.3s', 'fondu des écrans : 300 ms');
    assert.equal(durees.etoile1, '5s', 'scintillement : 5 s');
    assert.equal(durees.etoile2, '7s', 'scintillement : 7 s');
    await fermer(page);
    const carte = await ouvrir('index.html?ecran=carte&type=epreuve');
    assert.equal(await carte.evaluate(() => getComputedStyle(document.querySelector('.carte-3d')).animationDuration), '0.6s');
    await fermer(carte);
  });

  it('prefers-reduced-motion du système : toutes les animations et transitions sont réellement coupées sur tous les écrans', async () => {
    for (const [nom, url, sels] of ANIMATIONS_PAR_ECRAN) {
      const page = await ouvrir(url, { reduit: true });
      for (const s of sels) assert.equal(await nomsAnimation(page, s), 'none', `${nom} ${s}`);
      await page.waitForTimeout(150);
      assert.equal(await page.evaluate(() => document.getAnimations().length), 0, `${nom} : animations actives malgré prefers-reduced-motion`);
      const noms = await page.evaluate(() => [...document.querySelectorAll('body *')].map((e) => getComputedStyle(e).animationName).filter((n) => n !== 'none'));
      assert.deepEqual(noms, [], `${nom} : animation-name non nul`);
      const trans = await page.evaluate(() => [...document.querySelectorAll('body *')]
        .flatMap((e) => getComputedStyle(e).transitionDuration.split(',').map((x) => parseFloat(x))).filter((x) => x > 0.001));
      assert.deepEqual(trans, [], `${nom} : transitions encore actives`);
      await fermer(page);
    }
    const page = await ouvrir('index.html?ecran=carte&type=epreuve', { reduit: true });
    const t = await page.evaluate(() => getComputedStyle(document.querySelector('.carte-3d')).transform);
    assert.ok(t === 'none' || /^matrix\(1, 0, 0, 1/.test(t), `carte non remise à plat : ${t}`);
    await fermer(page);
  });

  it('transition automatique de 2 secondes conservée même sans animation', async () => {
    const page = await ouvrir('index.html?ecran=transition&auto=1&tour=1', { reduit: true });
    const t0 = Date.now();
    await page.waitForSelector('.ecran-choix', { timeout: 4000 });
    const duree = Date.now() - t0;
    assert.ok(duree >= 1700 && duree <= 2800, `durée de la transition : ${duree} ms`);
    assert.equal(await page.locator('.compteur').textContent(), `Tour 2 / ${config.tours}`);
    await fermer(page);
  });

  /* ============ 5. Réglages : config.json pilote tout ============ */
  it('config.json pilote tout : 6 tours et 7 joueur(se)s maximum modifient l\'affichage partout (aucun 4 ni 5 en dur)', async () => {
    const cfg = { tours: 6, joueursMax: 7 };
    const choix = await ouvrir('index.html?ecran=choix&tour=6', { config: cfg });
    assert.equal(await choix.locator('.compteur').textContent(), 'Tour 6 / 6');
    await fermer(choix);
    const regles = await ouvrir('index.html?ecran=regles', { config: cfg });
    const t = await regles.locator('.ecran-regles').textContent();
    assert.match(t, /joué 6 fois/);
    assert.ok(!/joué 4 fois/.test(t));
    await fermer(regles);
    const salle = await ouvrir('index.html?ecran=salle&autres=6', { config: cfg });
    assert.equal(await salle.locator('.joueur-ligne').count(), 7);
    assert.equal(await salle.locator('.embleme-choix:disabled').count(), 6);
    await fermer(salle);
    const complete = await ouvrir('index.html?ecran=salle&complete=1', { config: cfg });
    assert.equal(await complete.locator('.joueur-ligne:not(.joueur-libre)').count(), 7);
    await fermer(complete);
    // Les nouveaux écrans « Créer » et « Rejoindre » ne dépendent pas de ces réglages mais doivent rester sains.
    const creer = await ouvrir('index.html?ecran=creer', { config: cfg });
    assert.equal(await creer.locator('.liste-codes input[type=radio]').count(), A.codes.length);
    await fermer(creer);
    // Parcours entier avec 2 tours : la fin arrive après le 2e tour.
    const court = await ouvrir('index.html?ecran=choix&tour=1', { config: { tours: 2, joueursMax: 3 } });
    await court.locator('.dos-epreuve').click();
    await court.getByRole('link', { name: /Le sort est jeté/i }).click();
    await court.waitForSelector('.ecran-choix', { timeout: 4000 });
    assert.equal(await court.locator('.compteur').textContent(), 'Tour 2 / 2');
    await court.locator('.dos-epreuve').click();
    await court.getByRole('link', { name: /Le sort est jeté/i }).click();
    await court.waitForSelector('.ecran-fin', { timeout: 4000 });
    await fermer(court);
    const trois = await ouvrir('index.html?ecran=salle&autres=2', { config: { tours: 2, joueursMax: 3 } });
    assert.equal(await trois.locator('.joueur-ligne').count(), 3);
    await fermer(trois);
  });

  /* ============ 6. Textes affichés ============ */
  const FEMININ_INTERDIT = [
    [/\bjoueuses?\b/i, 'joueuse'], [/\belles?\b/i, 'elle'], [/\bcelles?\b/i, 'celle'],
    [/\bprêtes?\b/i, 'prête'], [/\bprêts?\b(?!\(e\))/i, 'prêt sans (e)'],
    [/\bchacune?\b(?!\()/i, 'chacun(e) sans parenthèse'], [/\bvoyageuses?\b/i, 'voyageuse'], [/\btoutes\b/i, 'toutes'],
    [/\bseule?s?\b(?!\()/i, 'seul(e) sans parenthèse'],
    [/\bparticipantes\b/i, 'participantes (forme exclusivement féminine)'], [/\bparticipants\b/i, 'participants (forme exclusivement masculine)'],
    [/\bamies?\b/i, 'amie'], [/\bhôtesses?\b/i, 'hôtesse'], [/\binvitées?\b/i, 'invitée'],
  ];
  it('textes affichés : écriture inclusive et vocabulaire « butin » (tous les écrans, y compris Créer et Rejoindre)', async () => {
    const defauts = [];
    const pages = [...ECRANS.map(([nom, c]) => [nom, `index.html${c}`]), ['demo', 'demo.html']];
    for (const [nom, url] of pages) {
      const page = await ouvrir(url);
      // On vérifie le texte de l'interface sans le texte des cartes (validées en phase 1, vérifiées ailleurs).
      const interface_ = await page.evaluate(() => {
        const copie = document.body.cloneNode(true);
        copie.querySelectorAll('.carte-texte, .demo-carte, script, style, noscript').forEach((e) => e.remove());
        return copie.textContent;
      });
      for (const [re, lib] of FEMININ_INTERDIT) {
        if (re.test(interface_)) defauts.push(`[${nom}] forme non inclusive « ${lib} » : ${interface_.match(re)[0]}`);
      }
      if (/\b(poches?|sacs?)\b/i.test(interface_)) defauts.push(`[${nom}] vocabulaire « poche/sac » dans l'interface`);
      await fermer(page);
    }
    const accueil = await ouvrir('index.html?ecran=accueil');
    assert.match(await texteVisible(accueil), /Récupérez votre butin/);
    await fermer(accueil);
    const regles = await ouvrir('index.html?ecran=regles');
    assert.match(await texteVisible(regles), /butin mystère/);
    await fermer(regles);
    assert.deepEqual(defauts, []);
  });

  it('textes affichés : accueil, règles et fin identiques à docs/regles.md (mot pour mot, casse d\'origine)', async () => {
    const regles = fs.readFileSync(path.join(A.RACINE, 'docs', 'regles.md'), 'utf8');
    const norm = (s) => s.replace(/\*+/g, '').replace(/\s+/g, ' ').trim();
    const source = norm(regles);
    const pages = { accueil: '?ecran=accueil', regles: '?ecran=regles', fin: '?ecran=fin', salle: '?ecran=salle&hote=1&autres=1' };
    const attendus = {
      accueil: ['Bienvenue, voyageur(se).', 'Les Cours s\'agitent, les dragons s\'éveillent et le destin s\'apprête à battre ses cartes.',
        'Récupérez votre butin, choisissez votre emblème et laissez le sort décider du trésor qui sera le vôtre.', 'Comment ça marche ?'],
      regles: ['But du jeu', 'Déroulement', 'Invoquer un bouclier', 'Fin de la partie', 'Créer une partie', 'Rejoindre une partie'],
      fin: ['La quête s\'achève.', 'Le destin a rendu son verdict. Chaque personne tient désormais entre ses mains le butin que le sort lui a réservé. Le moment est venu de le découvrir !', 'Nouvelle quête'],
      salle: ['Rassemblez votre troupe. La quête commencera quand l\'hôte donnera le signal.', 'Commencer la quête'],
    };
    for (const [nom, q] of Object.entries(pages)) {
      const page = await ouvrir(`index.html${q}`);
      const t = norm(await texteVisible(page));
      for (const phrase of attendus[nom]) {
        assert.ok(t.includes(norm(phrase)), `[${nom}] phrase absente de l'écran : ${phrase}`);
        assert.ok(source.includes(norm(phrase)) || ['Créer une partie', 'Rejoindre une partie'].includes(phrase), `[${nom}] phrase absente de regles.md : ${phrase}`);
      }
      await fermer(page);
    }
    const page = await ouvrir('index.html?ecran=regles');
    const ecran = norm(await texteVisible(page));
    const sectionDebut = regles.indexOf('## Écran « Comment ça marche ? »');
    const section = regles.slice(sectionDebut, regles.indexOf('## Cartes'));
    const paragraphes = section.split('\n').filter((l) => /^>|^- /.test(l.trim())).map((l) => norm(l.replace(/^>\s?/, '').replace(/^- /, '')))
      .filter((l) => l.length > 15);
    assert.ok(paragraphes.length >= 8);
    for (const p of paragraphes) {
      const attendu = p.replace('4 fois', `${config.tours} fois`);
      assert.ok(ecran.includes(attendu), `paragraphe de regles.md absent ou modifié à l'écran : ${p.slice(0, 70)}…`);
    }
    const effets = 'Certaines cartes Épreuve produisent un effet qui dure. Il prend fin dès qu\'il a provoqué un échange de butins.';
    assert.ok(ecran.indexOf(effets) > ecran.indexOf('Carte Épreuve (action)') && ecran.indexOf(effets) < ecran.indexOf('Invoquer un bouclier'));
    assert.ok(!/Terminez les échanges/.test(ecran));
    await fermer(page);
  });

  it('textes affichés : écrans de tour conformes (compteur, attente, transition, confirmation du bouclier, type en légende)', async () => {
    const att = await ouvrir('index.html?ecran=attente&type=epreuve&tour=2');
    const t = await texteVisible(att);
    assert.match(t, /Tour 2 \/ \d+/);
    assert.match(t, /Au tour de\s+\S+/);
    assert.match(t, /En attente de Léa…/);
    assert.equal(await att.locator('.ecran-attente button, .ecran-attente a').count(), 0, 'l\'écran d\'attente ne doit avoir aucun bouton d\'action');
    assert.match(t, /Effets en cours/i);
    await fermer(att);
    const tr = await ouvrir('index.html?ecran=transition');
    assert.match(await texteVisible(tr), /Le sort est jeté pour Léa\./);
    await fermer(tr);
    const bo = await ouvrir('index.html?ecran=transition&bouclier=1');
    assert.match(await texteVisible(bo), /Léa a invoqué un bouclier\./);
    await fermer(bo);
    const carte = await ouvrir('index.html?ecran=carte&type=revelation');
    assert.match(await carte.locator('.carte-entete').textContent(), /Révélation/);
    assert.equal(await carte.locator('.carte-entete svg use').getAttribute('href'), '#i-etoile');
    await fermer(carte);
    const ep = await ouvrir('index.html?ecran=carte&type=epreuve');
    assert.match(await ep.locator('.carte-entete').textContent(), /Épreuve/);
    assert.equal(await ep.locator('.carte-entete svg use').getAttribute('href'), '#i-epee');
    await fermer(ep);
  });

  it('paramètres d\'adresse hostiles ou absurdes : pas d\'erreur, pas d\'injection HTML, valeurs bornées (nouveaux écrans compris)', async () => {
    const hostile = encodeURIComponent('<img src=x onerror="window.__xss=1">');
    for (const url of [
      `index.html?ecran=salle&prenom=${hostile}&embleme=sirene&autres=2`,
      `index.html?ecran=attente&prenom=${hostile}`,
      `index.html?ecran=transition&prenom=${hostile}`,
      `index.html?ecran=rejoindre&code=${hostile}`,
      `index.html?ecran=creer&code=${hostile}`,
      `index.html?ecran=salle&code=${hostile}`,
      'index.html?ecran=inconnu', 'index.html?ecran=__proto__', 'index.html?ecran=constructor',
      'index.html?ecran=carte&carte=nexistepas&tour=999', 'index.html?ecran=choix&tour=-3', 'index.html?ecran=choix&tour=abc',
      'index.html?ecran=salle&autres=99', 'index.html?ecran=salle&autres=-4', 'index.html?ecran=salle&code=PIRATE&embleme=inconnu',
      'index.html?ecran=creer&code=PIRATE', 'index.html?ecran=rejoindre&erreur=nimportequoi',
    ]) {
      const page = await ouvrir(url);
      assert.equal(await page.evaluate(() => window.__xss), undefined, `injection via ${url}`);
      assert.equal(await page.locator('img[src="x"]').count(), 0);
      const t = await texteVisible(page);
      assert.ok(t.length > 10, `écran vide pour ${url}`);
      assert.ok(!/undefined|NaN|\[object/.test(t), `texte douteux pour ${url} : ${t.slice(0, 80)}`);
      await fermer(page);
    }
    const p = await ouvrir('index.html?ecran=choix&tour=999');
    assert.equal(await p.locator('.compteur').textContent(), `Tour ${config.tours} / ${config.tours}`);
    await fermer(p);
    const q = await ouvrir('index.html?ecran=salle&autres=99');
    assert.equal(await q.locator('.joueur-ligne').count(), config.joueursMax);
    await fermer(q);
  });

  /* ============ 7. demo.html ============ */
  it('demo.html : se charge, 40 cartes, tous les liens (dont Créer et Rejoindre) ouvrent un écran sain', async () => {
    const page = await ouvrir('demo.html', { largeur: 360 });
    await ctx.capture(page, 'demo-360', { fullPage: true });
    const debord = await page.evaluate(A.mesurerDebordements);
    const liens = await page.evaluate(() => [...document.querySelectorAll('#demo-liste a.demo-lien')].map((a) => a.getAttribute('href')));
    const parcours = await page.evaluate(() => document.querySelector('a[href="index.html"]')?.textContent);
    assert.match(parcours, /Parcours complet/);
    assert.ok(liens.length >= 40 * 2 + 20, `trop peu de liens : ${liens.length}`);
    assert.equal(await page.locator('.demo-carte').count(), cartes.length);
    await fermer(page);
    assert.deepEqual(debord, []);
    const ecransVus = new Set(); const defauts = [];
    const ctxPage = await ouvrir('index.html', { largeur: 360 });
    for (const lien of [...new Set(liens)]) {
      await ctxPage.goto(new URL(lien, `${ctx.base}/`).toString());
      await ctxPage.waitForSelector('#ecran > *');
      ecransVus.add(await ctxPage.evaluate(() => document.body.dataset.ecran));
      const t = await texteVisible(ctxPage);
      if (t.trim().length < 15) defauts.push(`écran vide : ${lien}`);
      if (/undefined|NaN|\[object|Impossible de charger/.test(t)) defauts.push(`texte douteux : ${lien}`);
    }
    await fermer(ctxPage);
    for (const e of ['accueil', 'regles', 'creer', 'rejoindre', 'salle', 'choix', 'carte', 'attente', 'transition', 'fin']) {
      assert.ok(ecransVus.has(e), `demo.html n'ouvre jamais l'écran « ${e} »`);
    }
    assert.deepEqual(defauts, []);
  });

  it('demo.html : lisible sur 412 px, sans défilement horizontal, cibles tactiles >= 48 px', async () => {
    const page = await ouvrir('demo.html', { largeur: 412 });
    const debord = await page.evaluate(A.mesurerDebordements);
    const petites = (await page.evaluate(A.mesurerCibles)).filter((c) => c.h < 47.5 || c.l < 47.5).map((c) => `${c.nom} « ${c.texte} » ${c.l.toFixed(0)}x${c.h.toFixed(0)}`);
    await ctx.capture(page, 'demo-412', { fullPage: false });
    await fermer(page);
    assert.deepEqual(debord, []);
    assert.deepEqual(petites, []);
  });

  /* ============ 8. Carte révélée, accueil, règles ============ */
  it('carte révélée : retournement 3D terminé, carte face visible et bandeau d\'effet pour les cartes durables', async () => {
    const page = await ouvrir(`index.html?ecran=carte&carte=${durable.id}&tour=2`, { largeur: 412 });
    await finAnimations(page);
    const m = await page.evaluate(() => {
      const f = document.querySelector('.carte-face').getBoundingClientRect();
      const d = getComputedStyle(document.querySelector('.carte-3d')).transform;
      return { w: f.width, h: f.height, transform: d, bandeau: document.querySelector('.bandeau-effet')?.textContent };
    });
    assert.ok(m.w > 300 && m.h > 450, `carte ${m.w}x${m.h}`);
    assert.ok(m.transform === 'none' || /matrix3d\(1, 0, 0, 0, 0, 1, 0, 0|matrix\(1, 0, 0, 1/.test(m.transform), `rotation finale : ${m.transform}`);
    assert.ok(m.bandeau.includes(durable.effet), m.bandeau);
    await ctx.capture(page, 'carte-durable-412', { fullPage: true });
    await fermer(page);
    const p2 = await ouvrir('index.html?ecran=carte&type=epreuve', { largeur: 412 });
    assert.equal(await p2.evaluate(() => getComputedStyle(document.querySelector('.carte-3d')).animationName), 'retournement');
    await fermer(p2);
  });

  // Itération 5, remarque 3 : le texte ne doit jamais être lisible avant la mi-rotation.
  it('carte révélée : le texte de la face est invisible avant la mi-rotation, visible après', async () => {
    const page = await ouvrir('index.html?ecran=carte&type=epreuve', { largeur: 412 });
    const mesures = await page.evaluate(() => {
      const tdr = document.querySelector('.carte-3d');
      const anims = document.getAnimations().filter((a) => ['retournement', 'face-apparait', 'dos-disparait'].includes(a.animationName));
      const resultat = [];
      for (const pc of [0, 25, 49, 51, 75, 100]) {
        for (const a of anims) {
          const t = a.effect.getComputedTiming();
          a.pause();
          a.currentTime = t.delay + (t.duration * pc) / 100;
        }
        resultat.push({
          pc,
          face: Number(getComputedStyle(document.querySelector('.carte-face')).opacity),
          dos: Number(getComputedStyle(document.querySelector('.carte-dos')).opacity),
          rot: getComputedStyle(tdr).transform,
        });
      }
      return resultat;
    });
    for (const m of mesures) {
      if (m.pc < 50) assert.ok(m.face === 0 && m.dos === 1, `à ${m.pc} % la face doit être masquée : ${JSON.stringify(m)}`);
      else assert.ok(m.face === 1 && m.dos === 0, `à ${m.pc} % la face doit être visible : ${JSON.stringify(m)}`);
    }
    await fermer(page);
  });

  // Itération 5, remarque 7 : le halo (inset -22 %, pulsation de 8 % comprise) ne touche ni l'emblème ni le texte.
  it('transition : le halo de la forme ne chevauche ni l\'emblème ni le texte (sort et bouclier, 360 et 412 px)', async () => {
    for (const largeur of [360, 412]) {
      for (const bouclier of [0, 1]) {
        const page = await ouvrir(`index.html?ecran=transition&bouclier=${bouclier}`, { largeur });
        const m = await page.evaluate(() => {
          const r = document.querySelector('.transition-icone').getBoundingClientRect();
          const bas = r.bottom + r.height * (0.22 + 0.04); // 0,22 de halo + moitié de 8 % d'agrandissement
          return { bas, emb: document.querySelector('.transition-corps .embleme').getBoundingClientRect().top,
            texte: document.querySelector('.transition-texte').getBoundingClientRect().top };
        });
        assert.ok(m.emb - m.bas >= 8, `${largeur} px bouclier=${bouclier} : halo (${m.bas.toFixed(0)}) trop près de l'emblème (${m.emb.toFixed(0)})`);
        assert.ok(m.texte > m.emb, 'le texte reste sous l\'emblème');
        await fermer(page);
      }
    }
  });

  // Itération 1 : « aucun défilement sur 360 x 640 ». Avec le logo complet de la charte, l'accueil dépasse de quelques
  // dizaines de pixels : l'exigence devient « bouton toujours visible, texte atteignable et jamais masqué par la barre,
  // dépassement <= 100 px » (voir le rapport, remarque R2).
  it('accueil et fin : sur 360 x 640 le bouton reste visible, tout le texte est atteignable sans être masqué par la barre, dépassement <= 100 px', async () => {
    for (const ecran of ['accueil', 'fin']) {
      const page = await ouvrir(`index.html?ecran=${ecran}`, { largeur: 360, hauteur: 640 });
      await finAnimations(page);
      const m = await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
        const barre = document.querySelector('.barre-bas').getBoundingClientRect();
        const textes = [...document.querySelectorAll('.accueil-corps .texte, .fin-corps .texte')];
        const dernier = textes[textes.length - 1].getBoundingClientRect();
        const bouton = document.querySelector('.bouton').getBoundingClientRect();
        return { depassement: document.documentElement.scrollHeight - innerHeight, barreHaut: barre.top, dernierBas: dernier.bottom, boutonBas: bouton.bottom, boutonHaut: bouton.top, h: innerHeight };
      });
      console.log(`# ${ecran} 360x640 : dépassement ${m.depassement} px`);
      assert.ok(m.depassement <= 100, `${ecran} : défile de ${m.depassement} px`);
      assert.ok(m.boutonHaut >= 0 && m.boutonBas <= m.h, `${ecran} : bouton hors de la fenêtre`);
      assert.ok(m.dernierBas <= m.barreHaut + 1, `${ecran} : dernier paragraphe masqué par la barre (${m.dernierBas} > ${m.barreHaut})`);
      await page.evaluate(() => window.scrollTo(0, 0));
      await ctx.capture(page, `${ecran}-360x640`);
      await fermer(page);
    }
  });

  it('règles : le dernier paragraphe n\'est jamais masqué par la barre de boutons fixée en bas, boutons toujours visibles', async () => {
    for (const largeur of LARGEURS) {
      const page = await ouvrir('index.html?ecran=regles', { largeur, hauteur: 640 });
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      const m = await page.evaluate(() => {
        const barre = document.querySelector('.barre-bas').getBoundingClientRect();
        const derniers = [...document.querySelectorAll('.regles-corps .texte')].pop().getBoundingClientRect();
        const b = [...document.querySelectorAll('.barre-bas .bouton')].map((x) => x.getBoundingClientRect());
        return { barre: barre.top, dernier: derniers.bottom, b: b.map((x) => [x.top, x.bottom]), H: innerHeight };
      });
      assert.ok(m.dernier <= m.barre + 1, `${largeur} : dernier paragraphe masqué (${m.dernier} > ${m.barre})`);
      assert.ok(m.b.every(([t, bt]) => t >= 0 && bt <= m.H), `${largeur} : boutons hors fenêtre`);
      await page.evaluate(() => window.scrollTo(0, 0));
      const haut = await page.evaluate(() => document.querySelector('.barre-bas .bouton').getBoundingClientRect().bottom);
      assert.ok(haut <= 640, `${largeur} : boutons non fixés en bas au début`);
      await ctx.capture(page, `regles-bas-${largeur}x640`);
      await fermer(page);
    }
  });

  /* ============ 9. Bilan : aucune erreur de console ============ */
  it('aucune erreur ni avertissement de console, aucune requête échouée ni 404, aucune requête externe sur toutes les pages visitées', () => {
    assert.deepEqual([...new Set(ctx.problemes)], []);
    assert.deepEqual(ctx.requetesExternes, []);
  });
});
