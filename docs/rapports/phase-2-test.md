# Rapport du testeur : phase 2 (écrans et design, sans réseau), deuxième passage

> **Itération 2** (remarques de la propriétaire : parcours Créer et Rejoindre, option d'animations retirée, nouvelle charte graphique) : voir la section « Itération 2 » en fin de document. Le texte ci-dessous est le rapport de l'itération 1, conservé tel quel.

Date : 2026-10-16. Branche `phase-2`, arbre de travail propre au départ (dernier commit du développeur : `dad70a1`). Statut de départ dans `docs/SUIVI.md` : `en test`.

## Verdict du deuxième passage : tout passe (D1 à D4 corrigés, aucun défaut ouvert)

Retest complet de la phase, pas seulement des correctifs : 72 tests sur 72 verts, captures revues à la vue (choix, attente avec effets durables, prénom très long), aucune régression constatée. Les quatre défauts du premier passage sont corrigés et vérifiés (voir « Défauts »). Reste à faire par la propriétaire : la validation humaine (téléphone, avis sur le design), que je ne peux pas faire.

Vérifié à nouveau ce passage :

- `git diff 4c3c061..HEAD` ne touche que `public/css/style.css` (2 lignes), `public/js/demo.js` (1 ligne), `README.md` et `docs/SUIVI.md` : pas de régression possible ailleurs, et les tests complets le confirment.
- `docs/regles.md`, `docs/cartes-source.md` et `public/data/` ne diffèrent pas de `main` (textes validés non modifiés).
- Contraste réel minimal sur 556 textes rendus : **4,73:1** (contre 4,22:1 au premier passage). Dos « Révélation » corrigé, dos « Épreuve » inchangé et conforme.
- Taille du texte du bandeau « Effets en cours » : 20 px (`1.25rem`), comme le bandeau de la carte. Capture revue : aucun débordement à 360 ni à 412 px, y compris avec le prénom de 40 « M ».
- README : `npm install` puis `node --test tests/`, deux familles de tests, Chrome requis pour les tests de navigateur, durée annoncée « environ 5 minutes » (mesurée : 282 s), tests sautés proprement sans Chrome. Exact.

## Résultat des tests

Commande : `node --test tests/` (Node 18.19.1, Chrome 145 via `playwright-core` 1.45.3).

```
# tests 72
# pass 72
# fail 0
# skipped 0
```

- 45 tests existants du développeur (contenu, conformité, écrans sans navigateur, réglages en dur) : tous verts.
- 27 tests de navigateur ajoutés par le testeur dans `tests/navigateur.test.js` : tous verts (au premier passage : 23 verts, 4 rouges pour D1, D2 et D3).
- Durée des tests de navigateur : environ 5 minutes (Chrome piloté, 23 écrans × 2 largeurs, 40 cartes × 2 écrans × 2 largeurs, contrastes mesurés sur les pixels).
- Sans `playwright-core` ou sans Chrome, les tests de navigateur sont sautés avec le message « playwright-core absent : lancer « npm install »… » (vérifié en retirant `node_modules`).

### Ce que couvrent les tests de navigateur

| Attendu de la phase | Test | Résultat |
|---|---|---|
| Captures à 360 et 412 px, tous les écrans (23 variantes) | « captures + débordement + cibles tactiles » | passe (D1 corrigé) |
| Aucun débordement de texte, 40 cartes (écrans carte et attente, 360 et 412 px) | « les 40 cartes… » | passe |
| Texte des cartes ≥ 20 px | idem + écrans | passe pour `.carte-texte` (22 px) ; D1 pour le bandeau « Effets en cours » |
| Boutons et zones tactiles ≥ 48 px (boutons, retour, dos de carte, emblèmes, champ, réglage) | écrans à 360 et 412 px | passe |
| Contrastes (palette) | tests du développeur + lecture de `style.css` | passe |
| Contrastes (rendu réel, mesuré sur les pixels, 556 textes) | « contrastes mesurés… » | passe (D2 corrigé) ; minimum relevé 4,73:1 |
| Aucune requête externe, aucun Google Fonts | « polices… » et « aucune requête… » (toute adresse non locale est bloquée et signalée) | passe |
| Polices réellement chargées et utilisées | CDP `getPlatformFontsForNode` : Cinzel et Cormorant Garamond hébergées, pas de police de secours | passe |
| Réglage manuel : coupe réellement les animations, se mémorise, se désactive, tient pendant la navigation | 3 tests | passe (aucune animation active dans `document.getAnimations()`) |
| `prefers-reduced-motion` (émulé), avec et sans JavaScript | 1 test | passe |
| Animations complètes par défaut (retournement, lueur, étincelles, pulsation) | 1 test | passe |
| Aucun 4 ni 5 en dur : `config.json` modifié à 6 tours et 7 joueur(se)s, puis 2 tours et 3 joueur(se)s | 1 test | passe (compteurs, règles, salle, fin de partie suivent) |
| Parcours complet (accueil → règles → salle → tous les tours → bouclier → fin → nouvelle quête, bouton Précédent) | 2 tests | passe |
| `demo.html` : se charge, 40 cartes, tous les liens ouvrent un écran sans erreur, lisible à 360 et 412 px | 2 tests | passe |
| Textes de l'accueil, des règles, de la fin, de la salle identiques à `docs/regles.md` | 1 test | passe |
| Écriture inclusive et vocabulaire « butin » dans tous les textes affichés | 1 test | passe (D3 corrigé) |
| Paramètres d'adresse absurdes ou hostiles (`ecran=__proto__`, balise HTML dans `prenom`, `tour=999`…) | 1 test | passe (pas d'injection, valeurs bornées) |
| Aucune erreur ni avertissement de console, aucune requête échouée ni 404 sur toutes les pages visitées | bilan final | passe |

Textes validés non modifiés : `git diff main` ne touche ni `docs/regles.md`, ni `docs/cartes-source.md`, ni `public/data/` (`cartes.json`, `emblemes.json`, `codes.json`, `config.json`).

Le README (« Servir le jeu ») a été vérifié : `python3 -m http.server -d public <port>` sert bien `index.html`, `demo.html`, le JavaScript (type `text/javascript`), le JSON et les polices `woff2` avec les bons types.

## Défauts

### D1 : texte du bandeau « Effets en cours » à 19,2 px (corrigé, vérifié au deuxième passage ; mineur)

- **Deuxième passage** : `.effets-texte` à `1.25rem` = 20 px, mesuré par les tests à 360 et 412 px (verts), capture revue. Corrigé.
- Reproduire : ouvrir `index.html?ecran=attente&type=epreuve&tour=2` à 360 ou 412 px. Mesurer la taille de police de `.effets-texte` (le libellé de l'effet, par exemple « Transformé(e) en chat : miaule »).
- Attendu : texte issu des cartes d'au moins 20 px (`docs/PROJET.md`, Design, Accessibilité). Le même libellé fait 20 px dans le bandeau de la carte (`.bandeau-texte`).
- Obtenu : 19,2 px (`font-size: 1.2rem` dans `public/css/style.css`, règle `.effets-texte`). Les durées (« Jusqu'à son prochain tour », 16,8 px) et les légendes en capitales (13,6 à 15,2 px) sont plus petites encore, mais ce sont des libellés secondaires et non du texte de carte.
- Correctif possible : `.effets-texte` à `1.25rem`.
- Test qui le détecte : « captures + débordement + cibles tactiles » (360 et 412 px).

### D2 : contraste insuffisant du mot « Révélation » sur le dos de carte (corrigé, vérifié au deuxième passage ; mineur)

- **Deuxième passage** : dégradé de `.dos-revelation` assombri (centre `#7B60DB`, palier à 30 %). Contraste minimal mesuré sur les 556 textes : 4,73:1 (≥ 4,5:1), test vert. Capture du choix revue : dos toujours lisible et distinct du dos « Épreuve ». Corrigé.
- Reproduire : ouvrir `index.html?ecran=choix&tour=1`. Mesurer le contraste du libellé « Révélation » (`.dos-nom`, 16 px, gras) sur le dégradé violet du dos de carte.
- Attendu : au moins 4,5:1 (texte normal), contrastes élevés selon `docs/PROJET.md`.
- Obtenu : 4,33:1 à 360 px et 4,22:1 à 412 px dans la zone la plus claire du dégradé (centre `#8A70E8`). Le libellé « Épreuve » sur le dos rouge passe. Les 556 autres textes mesurés passent.
- Correctif possible : assombrir le centre du dégradé de `.dos-revelation`, ou agrandir le libellé (≥ 18,66 px en gras, seuil 3:1).
- Test qui le détecte : « contrastes mesurés sur les pixels rendus ».

### D3 : forme non inclusive sur la page de démonstration (corrigé, vérifié au deuxième passage ; mineur)

- **Deuxième passage** : le lien lit « Hôte, prêt(e), prêt(e) à commencer » ; test d'écriture inclusive vert. Corrigé.
- Reproduire : ouvrir `demo.html` et lire le lien « Hôte, prêt(e), prêt à commencer » (groupe « Salle d'attente »).
- Attendu : écriture inclusive partout (`.github/copilot-instructions.md`) : « prêt(e) à commencer ».
- Obtenu : « prêt » sans « (e) » le deuxième coup. Le texte est dans `public/js/demo.js`. Page de travail, d'où la gravité mineure.
- Test qui le détecte : « textes affichés : écriture inclusive et vocabulaire « butin » ».

### D4 : le README ne dit pas que les tests de navigateur demandent `npm install` (corrigé, vérifié au deuxième passage ; mineur)

- **Deuxième passage** : le README donne `npm install` puis `node --test tests/`, distingue tests sans navigateur et tests de navigateur (Chrome requis, environ 5 minutes, sautés sans Chrome). Conforme à ce qui a été constaté (282 s). Corrigé. (Le texte « Obtenu » ci-dessous est celui du premier passage.)
- Reproduire : lire la section « Lancer les tests automatiques » du README : « Aucune installation de paquet n'est requise ».
- Attendu : README exact et à jour pour la phase (consigne du testeur). Les tests de navigateur ajoutés par le testeur ont besoin de `playwright-core` (devDependency, `package.json`) et de Google Chrome ; sans cela ils sont sautés avec un message.
- Obtenu : la phrase est fausse pour ces tests. À corriger par le développeur : ajouter `npm install` (et Chrome) avant `node --test tests/`, dire que les tests de navigateur durent environ 5 minutes et qu'ils sont sautés sans Chrome. Le testeur n'a pas le droit de modifier le README.
- Note : `package.json` et `package-lock.json` ont été ajoutés à la racine à la demande de la cheffe de phase (`playwright-core` 1.45.3, compatible Node 18). `node_modules/` est déjà ignoré par `.gitignore`.

## Remarques (pas des défauts, à l'appréciation de la propriétaire)

- Le chiffre « 1 » en Cinzel ressemble à un « I » capital (« TOUR 1 / 4 » se lit presque « TOUR I / 4 »). Visible sur les captures des écrans de choix et de transition.
- Sur la salle d'attente, la barre de boutons fixée en bas occupe environ le quart d'un écran de 640 px de haut pour l'hôte (deux boutons). Avec le clavier à l'écran ouvert sur un petit téléphone, la zone de saisie du prénom pourrait devenir étroite. Non vérifiable sans vrai téléphone.
- Le réglage « réduire les animations » met `animation: none 0s … both` : Chrome lit le mot `both` comme nom d'animation inexistant, ce qui revient bien à aucune animation (vérifié par `getAnimations()`), mais l'écriture dépend de la lecture du navigateur. Non testé sous Firefox ni Safari.
- `demo.html` n'a pas le bouton « réduire les animations » (il suit seulement `prefers-reduced-motion`). Acceptable pour une page de travail.
- Le long prénom (40 caractères sans espace) passe à la ligne et ne déborde nulle part, aux deux largeurs ; le champ de saisie défile en interne (comportement normal d'un champ).

## Captures d'écran (hors dépôt)

Dossier : `/tmp/romantasy-captures/` (ou `CAPTURES_DIR`), non versionné. Fichiers par écran et par largeur, par exemple `accueil-360.png`, `choix-tour-1-412.png`, `carte-la-plus-longue-360.png`, `attente-durable-360.png`, `salle-code-long-prenom-long-360.png`, `regles-bas-360x640.png`, `demo-360.png`.

Regardées à la vue : accueil, règles, salle (code long, prénom long), choix, carte Épreuve, carte à effet durable, attente avec prénom très long, transition bouclier, démonstration. Rendu cohérent avec l'ambiance annoncée : fond nuit, dorures, polices Cinzel et Cormorant bien appliquées, symboles épée et étoile en plus de la couleur, aucun texte coupé. Sur les captures pleine page, la barre de boutons fixée en bas apparaît au milieu de la page : c'est un effet de la capture (barre « collante »), pas de l'écran réel ; vérifié séparément (`regles-bas-360x640.png` et test sur le défilement).

## Non vérifié

- Rendu sur un vrai téléphone (tactile, clavier à l'écran, barre d'adresse mobile, zones sûres) : validation humaine prévue par le plan.
- Plaisir de jeu, goût du design (ambiance, lisibilité en soirée, plus petit téléphone).
- Autres navigateurs que Chrome (Firefox, Safari iOS) : retournement 3D, `dialog`, `dvh`, `backface-visibility`.
- Emojis des emblèmes : rendus avec la police emoji du système (ici Noto Color Emoji) ; l'apparence variera selon le téléphone (prévu : icônes en phase 7).
- Écrans plus étroits que 360 px.
- Aucun quota Firebase à vérifier : aucune connexion Firebase dans cette phase.

---

# Itération 2

Date : 2026-10-16. Branche `phase-2`, arbre de travail propre au départ (dernier commit du développeur : `ab01898`). Statut de départ dans `docs/SUIVI.md` : `en test` (itération 2). Lus avant de tester : `.github/copilot-instructions.md`, `docs/SUIVI.md`, `docs/PLAN.md` (phase 2), `docs/PROJET.md` (section Design), `docs/regles.md`, `README.md`, `docs/remarques/phase-2.md`, `docs/charte-graphique.md` (en entier) et le rapport de l'itération 1 ci-dessus.

## Verdict du deuxième passage de l'itération 2 : tout passe (D5 corrigé et vérifié, aucun défaut ouvert)

Date : 2026-10-16, dernier commit du développeur : `ab522c0`, branche `phase-2`, arbre propre.

Résultat : `node --test tests/` complet, **112 tests, 112 verts, 0 rouge** (sortie réelle ci-dessous). Le test de lisibilité qui échouait au premier passage (D5) est vert.

```
# tests 112
# suites 3
# pass 112
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 248960.953451
```

Durée mesurée : 4 min 9 s (le README annonce « environ 4 à 5 minutes » : exact). Nombre de tests du README : 54 sans navigateur + 58 de navigateur = 112 : exact. Fichiers de tests cités par le README : exacts. Commandes (`npm install`, `node --test tests/`, serveur Python) : inchangées et exactes.

- **D5 : corrigé, vérifié.** Les neuf étoiles de `.ciel` sont maintenant dans les marges latérales (x de 2 à 3 % et de 97 à 98 %), et les étincelles de l'accueil dans des colonnes de 16 px de chaque côté. Preuves : test de lisibilité vert sur 360 x 800, 360 x 640 et 412 x 800 ; captures regardées à la vue (accueil, règles, Créer, Rejoindre, salle, choix, cartes, attente) : plus aucune étoile sur un titre ni sur un mot de texte.
- **R1 réglée** : noms d'emblème à 15 px. J'ai retiré l'exception à 14 px de mon test (`tests/navigateur.test.js`) : il exige maintenant 15 px partout (23 tests verts après ce changement). Sur la salle à 360 px, « Loup-garou » passe sur deux lignes (« Loup- / garou ») ; rien n'est coupé.
- **Non-régression** : remarques 1, 2, 3 (tests des parcours verts) et conformité à la charte (tests de la charte verts) ; textes validés intacts (`git diff main` ne touche ni `docs/regles.md`, ni `docs/cartes-source.md`, ni `public/data/`, ni `firebase.json`, ni `database.rules.json`) ; PLAN : la ligne de la phase 2 parle bien de `prefers-reduced-motion` ; README : tests, nombre et durée à jour.
- **Remarques nouvelles (pas des défauts)** :
  - **R11 : les étoiles en marge forment deux colonnes de points** à 8 à 13 px du bord ; à côté d'un début de ligne (par exemple « À tour de rôle » ou « a réservé ! » sur l'écran des règles à 360 px), un point blanc peut se lire comme une puce ou un point égaré. Aucun chevauchement, rendu plus sage que le ciel de la charte (étoiles réparties sur toute la page). À juger par la propriétaire sur téléphone.
  - **R12 : la charte n'est pas reproduite à l'identique** : le bloc `.ciel` de `docs/charte-graphique.md` diffère maintenant de `public/css/style.css` (étoiles en marge). L'écart est déclaré dans `docs/PROJET.md` (ligne « Fond »), mais à faire confirmer par la propriétaire, car la charte demande de reproduire ce bloc.
  - Le fichier `docs/PROJET.md` a été modifié par le développeur (une phrase d'adaptation ajoutée) : c'est un texte de décision du projet, à valider avec la propriétaire.
- **Non vérifié** : inchangé (voir « Non vérifié » en bas) : vrai téléphone, plaisir de jeu, goût du design (notamment l'équilibre des colonnes d'étoiles), Firefox et Safari, écrans de moins de 360 px, fluidité du grain. Aucun quota Firebase à vérifier.

## Rappel : verdict du premier passage de l'itération 2 (défauts ouverts, D5)

Retest complet de la phase : 112 tests, 111 verts, 1 rouge. Le rouge est le test qui détecte **D5** (étoiles du fond qui passent derrière des lignes de texte). Tout le reste passe : les trois remarques fonctionnelles de la propriétaire (1, 2 et 3) et la conformité mesurable à la charte (remarque 4). Les quatre défauts de l'itération 1 (D1 à D4) restent corrigés (voir « Défauts connus »). Reste à faire par la propriétaire : la validation humaine (téléphone, avis sur le design), que je ne peux pas faire.

### Résultat des tests (sortie réelle)

Commande : `node --test tests/` (Node 18.19.1, Chrome 145 via `playwright-core` 1.45.3), exécutée deux fois de suite avec le même résultat ; durée 4 min 11 s.

```
# tests 112
# suites 3
# pass 111
# fail 1
# cancelled 0
# skipped 0
# todo 0
# duration_ms 251524.813367
    not ok 11 - §8 lisibilité : aucune étoile du fond ni étincelle d'accueil ne passe derrière une ligne de texte (360 x 800, 360 x 640, 412 x 800)
```

- 54 tests sans navigateur (développeur, inchangés) : tous verts.
- 58 tests de navigateur (testeur) : 57 verts, 1 rouge (D5).
  - `tests/navigateur.test.js` : 23 tests, réécrit pour le nouveau design (les 27 anciens tests visaient l'ancien design : 17 étaient rouges chez le développeur ; aucune exigence de l'itération 1 n'a été abandonnée, voir R2 pour la seule adaptation).
  - `tests/navigateur-parcours.test.js` : 15 tests, nouveau (remarques 1, 2, 3, parcours complets).
  - `tests/navigateur-charte.test.js` : 20 tests, nouveau (conformité machine à la charte).
  - `tests/aide-navigateur.js` : outils communs (serveur local 127.0.0.1, pilotage de Chrome, mesures dans la page). Ce fichier ne contient aucun test.
- Les tests de navigateur refusent toute adresse non locale et signalent toute requête externe. Sans `playwright-core` ou sans Chrome, ils sont sautés avec un message.

### Ce que couvrent les tests, par demande

| Demande | Tests | Résultat |
|---|---|---|
| Captures aux largeurs 360 et 412 px (29 écrans, dont `creer` et `rejoindre` avec leurs 4 variantes), débordement, cibles tactiles >= 48 px et espacement >= 8 px entre cibles, texte de lecture >= 20 px, texte < 12 px interdit, texte courant >= 15 px | `navigateur.test.js` n° 1 et 2 | passe |
| Aucun débordement sur les 40 cartes (écrans carte et attente, 360 et 412 px), texte de carte >= 20 px, tout le texte reste dans le double filet de la carte, bandeau d'effet sans chevauchement, boutons atteignables | n° 3 et 4, n° 5 (360 x 640) | passe |
| Contrastes réels sur les pixels (étoiles, grain et lettrine neutralisés ; lettrine mesurée à part) : >= 4,5:1 (3:1 grand texte) | n° 6 et 7 | passe, minimum relevé **4,68:1** sur 648 textes |
| Polices Cormorant Garamond et Jost réellement chargées (CDP : `isCustomFont`, aucune police de secours pour le texte), cinq graisses utilisées chargées, seuls fichiers `CormorantGaramond-*` et `Jost-*` demandés | n° 8 | passe |
| Aucune requête externe, aucune erreur ni avertissement de console, aucun 404 | n° 9 et 23, bilans des trois fichiers | passe |
| `prefers-reduced-motion` coupe réellement animations (`getAnimations()` vide, `animation-name` nul partout) et transitions (<= 1 ms) sur tous les écrans ; animations complètes sinon (fondu 300 ms, retournement 600 ms, étoiles 5 et 7 s) ; transition de 2 s conservée | n° 10, 11, 12 | passe |
| Aucun 4 ni 5 en dur (`config.json` modifié : 6 tours / 7 joueur(se)s, puis 2 / 3) | n° 13 | passe |
| Textes identiques à `docs/regles.md` (casse d'origine via `textContent`), écriture inclusive (« Participant(e)s », jamais « participantes »), « butin » | n° 14, 15, 16 | passe |
| Remarque 1 : aucun bouton, texte, attribut, `localStorage` ni `sessionStorage` lié aux animations (tous les écrans, `demo.html`, code, README, fichier `reglages.js` disparu) | `navigateur-parcours.test.js` n° 11 et 12 | passe |
| Remarque 2 : Créer (10 codes exactement ceux de `codes.json`, aucun pré-choisi, « Valider » bloqué sans choix y compris soumission forcée, un seul choix à la fois, clavier, focus visible, arrivée en salle avec le code choisi pour les 10 codes, ordre code / menu / liste, hôte) | n° 1 à 5 | passe |
| Remarque 3 : Rejoindre (champ étiqueté, code vide, espaces, 9 codes inconnus dont HTML et 300 caractères : messages en français, focus, `role="alert"`, `aria-invalid` ; 10 codes x 6 variantes de saisie : minuscules, majuscules, accents, accents décomposés, espaces ; salle avec le même ordre que Créer, sans « Commencer ») | n° 6 à 9 | passe |
| Charte §2 : bloc `:root` identique à celui de la charte (variables, valeurs, aucune en plus ; `--haut` et `--bas` résolus en `0px` par le navigateur) | `navigateur-charte.test.js` n° 1 | passe |
| Charte §3 et §12 : aucune couleur hors des huit variables, aucun violet, rose, vert vif, blanc ou noir pur, aucune ombre noire (styles calculés de tous les éléments et pseudo-éléments, fenêtre ouverte et son fond, `demo.html`) ; feuille de style sans nom de couleur ni `rgb()` ; aucun texte en `--c-brume` ; texte courant en lune ou étoile | n° 2 à 5 | passe |
| Charte §5 : aucune pilule ni arche (rayons <= 8 px), cartes 8 px, boutons et champs 4 px, panneau (brume, double filet, quatre étincelles) | n° 6 | passe |
| Charte §7 et §12 : boutons principal et secondaire (couleurs, 14 px, capitales .2em, double filet, lueur, >= 48 px), désactivé (40 %, sans lueur), appui (`scale(.97)`, lueur renforcée, 150 ms), focus clavier (2 px étoile, décalage 3 px), **aucun `:hover`** (CSSOM et changement de style au survol) | n° 7, 8, 9 | passe |
| Charte §8 : fond `.ciel` sans `background-attachment: fixed`, **un seul** calque de grain (`feTurbulence`, 1 octave, non interactif) sur chaque écran et après navigation interne | n° 10 | passe |
| Charte §9 : animations et transitions limitées à `opacity` et `transform`, aucune animation < 300 ms, pas de rebond | n° 12 | passe |
| Charte §4 : titres 32 à 40 px en Cormorant Garamond, logo en capitales .18em, pas de texte justifié, lignes de 60 caractères au plus, légendes en capitales espacées | n° 13 | passe |
| Charte §6 : cartes 2:3 (allongées si besoin), `cqw`, marge 6cqw, double filet 2,2cqw, quatre étincelles dans les quatre coins, lettrine, légende de type (couleur + symbole + mot), filigrane, ni coût ni nom ni image ; dos de carte (bordure ambre, dégradé radial, filets, logo à 52 %) | n° 14 à 17 | passe |
| Charte §5 et §11 : logo complet (96 px) et compact (40 px, `role="img"`), ornements `aria-hidden`, champs étiquetés ; §7 barre d'actions (fond nuit à 90 %, filet brume, collée en bas) | n° 18 et 19 | passe |
| Charte §8 (lisibilité) : aucune étoile du fond derrière une ligne de texte | n° 11 de la charte | **échoue (D5)** |

Textes validés non modifiés : `git diff main` ne touche ni `docs/regles.md`, ni `docs/cartes-source.md`, ni `public/data/` (40 cartes, emblèmes, codes, config).

## Défauts

### D5 : des étoiles du fond passent derrière des titres et des paragraphes (statut : vérifié au deuxième passage ; mineur, visuel)

*Description du premier passage, conservée ci-dessous ; le correctif est vérifié (voir le verdict du deuxième passage).*

- **Reproduire** : ouvrir `index.html?ecran=rejoindre` (ou `?ecran=creer`) à 360 x 800 px. Le point lumineux situé à 52 % de la largeur et 10 % de la hauteur tombe sur le « d » de « code » dans le titre : il se lit comme un accent ou une faute de frappe (capture `rejoindre-360.png` ou `creer-360.png` dans le dossier des captures, voir plus bas). Autres cas : `?ecran=regles` à 360 px (étoiles sur « But du jeu », « Chaque joueur(se) » et au milieu de « butin mystère »), `?ecran=choix`, `?ecran=carte` et `?ecran=transition` à 360 x 640 (étoile sur « Tour 1 / 4 »), `?ecran=attente&type=epreuve` (étoile sur « Au tour de »), `?ecran=accueil` à 360 x 640 (étincelle sur « Récupérez votre butin »). Commande : `node --test --test-name-pattern="lisibilité" tests/navigateur-charte.test.js` (liste complète des positions dans la sortie).
- **Cause** : les neuf étoiles de `.ciel` sont des dégradés placés en pourcentage de la hauteur de la **page** (`6% 8%`, `52% 10%`, `29% 5%`, etc.). Sur un écran long (règles : environ 1 450 px), « 10 % » descend dans le texte ; sur un écran court, les mêmes pourcentages tombent sur les titres.
- **Attendu** : le fond étoilé n'altère jamais la lecture ; la charte prévoit des étoiles « derrière » sans gêne (principe 5, §8, §11 : texte lisible). Ici le contraste mesuré reste bon (étoiles de 2 px) : c'est une gêne visuelle, pas un échec de contraste.
- **Obtenu** : plus de cinquante chevauchements relevés sur une vingtaine d'écrans aux trois formats testés (360 x 800, 360 x 640, 412 x 800), reproductibles.
- **Correctif possible** (laissé au développeur) : placer les étoiles sur un calque de la hauteur de la fenêtre et non de la page, ou les écarter des zones de titre ; la charte reproduit le bloc `.ciel` à l'identique, donc à arbitrer avec la propriétaire.
- **Test qui le détecte** : « §8 lisibilité : aucune étoile du fond ni étincelle d'accueil ne passe derrière une ligne de texte ».

## Défauts connus de l'itération 1 (revérifiés)

| Id | Sujet | Statut | Preuve à l'itération 2 |
|---|---|---|---|
| D1 | Bandeau « Effets en cours » à 20 px | vérifié | texte de lecture >= 20 px sur `.effets-texte`, `.bandeau-texte`, `.carte-texte` (29 écrans et 40 cartes x 2 écrans x 2 largeurs, tests verts) |
| D2 | Contraste du dos « Révélation » | vérifié | contraste minimal mesuré 4,68:1 sur 648 textes, dos compris (le dos a changé avec la nouvelle charte) |
| D3 | « prêt » sans (e) dans `demo.html` | vérifié | écriture inclusive vérifiée sur `demo.html` et les 29 écrans ; la forme « participantes » est aussi recherchée |
| D4 | README : `npm install` et Chrome | vérifié | le README donne toujours `npm install`, Chrome et la durée (mesurée 4 min 11 s pour « environ 5 minutes ») ; voir R9 pour la liste des fichiers |

## Remarques (pas des défauts, à l'appréciation de la propriétaire ou du chef de phase)

- **R1 (réglée au deuxième passage : 15 px, exception retirée du test) : noms d'emblème à 14 px, non capitales** (`.embleme-nom` dans la salle). La charte demande 15 à 16 px pour le texte courant et 12 px en capitales pour les légendes ; 14 px est la taille des boutons. Le test accepte cette seule exception, nommée dans le code, et exige tout le reste à 15 px au moins (légendes en capitales à 12 px au moins).
- **R2 : l'accueil défile de 48 px à 360 x 640** (le logo complet de 96 px et son nom ont pris la place). Le bouton reste visible (barre collante), tout le texte est atteignable et jamais masqué. L'exigence de l'itération 1 « aucun défilement » devient « bouton visible, texte non masqué, dépassement <= 100 px » ; l'écran de fin ne défile pas. Sur un vrai téléphone, dont la fenêtre est plus basse à cause de la barre du navigateur, le défilement sera un peu plus long.
- **R3 : documents à mettre à jour par la propriétaire ou le chef de phase** : `docs/regles.md` écrit toujours « Code de partie : un mot du thème, affiché **en grand** » alors que la remarque 2 demande qu'il soit affiché **discrètement** (l'application suit la remarque) ; `docs/PLAN.md` (phase 2) cite toujours le réglage « réduire les animations », retiré par la remarque 1. Je n'ai pas le droit de modifier ces fichiers.
- **R4 : textes nouveaux non validés**, créés par le développeur pour les nouveaux écrans, à faire valider : « Choisis le code de la partie », « Les autres joueur(se)s le saisiront pour te rejoindre. », « Codes de partie », « Valider », « Retour aux règles », « Saisis le code de la partie », « Code de la partie », « Majuscules, minuscules et accents n'ont pas d'importance. », « Saisis le code de la partie. » (erreur, code vide), « Ce code ne correspond à aucune partie. Vérifie-le et réessaie. » (erreur, code inconnu), « Participant(e)s » (la propriétaire écrit « participantes » dans sa remarque : la forme inclusive est conforme aux règles du projet).
- **R5 : l'accueil affiche le nom « ROMANTASY »** (logo complet, version voulue par la charte), alors que `docs/regles.md` dit « Aucun titre » pour l'accueil. Il n'y a pas de `h1` et le test de l'itération 1 reste vert ; à confirmer par la propriétaire.
- **R6 : barre d'actions à 90 %** (valeur de la charte) : le texte qui défile derrière la barre reste lisible en filigrane entre les deux boutons (visible sur `regles-bas-360x640.png`). Conforme à la charte ; à juger sur téléphone.
- **R7 : nom du type sur les dos de carte à 12 px** (écran de choix), plancher de la charte. Le texte des cartes révélées fait au moins 20 px (20,1 px à 360 px de large, 22 px à 412 px). Lisibilité en soirée à juger sur téléphone.
- **R8 : bordure de 1,5 px** (`--bordure`) : Chrome 145 la calcule à 1 px, même à 2x et 3x ; la valeur 1,5 px est vérifiée sur la déclaration (`var(--bordure)` et variable = `1.5px`), pas sur le rendu. À regarder sur un vrai téléphone.
- **R9 (réglée au deuxième passage : README à jour, 112 tests, quatre fichiers, 4 à 5 minutes) : README** : la section « Lancer les tests automatiques » ne cite que `tests/navigateur.test.js` ; il y a maintenant aussi `tests/navigateur-parcours.test.js`, `tests/navigateur-charte.test.js` et `tests/aide-navigateur.js` (outils, sans test). Durée mesurée : 4 min 11 s. La section « Lancer le jeu » est exacte (serveur Python, `demo.html`, paramètres `creer`, `rejoindre`, `code`, `erreur` ; vérifiée par requêtes : pages, JavaScript, JSON et `.woff2` servis avec les bons types).
- **R10 : police Cormorant Garamond 500 (droite)** déclarée et jamais utilisée (aucun texte ne la demande ; seules 600 et 500 italique le sont). Sans effet sur le rendu ; fichier inutile dans `public/fonts/` (environ 23 Ko).
- Sous `prefers-reduced-motion`, la règle de la charte met toute transition à 1 ms : un contour de focus peut être lu en cours d'apparition pendant une milliseconde (corrigé dans les tests par une attente de 80 ms) ; sans effet pour la personne.

## Captures d'écran (hors dépôt)

Dossier : `/tmp/romantasy-captures/` (ou `CAPTURES_DIR`), non versionné. Un fichier par écran et par largeur (`creer-360.png`, `rejoindre-erreur-inconnu-412.png`, `salle-hote-pret-360.png`, `carte-revelation-412.png`, `attente-durable-360.png`…), plus les parcours (`parcours-salle-360.png`, `salle-apres-rejoindre-360.png`).

Regardées à la vue (360 px, et 412 px pour les cartes et la salle) : accueil (logo, nom, ornement, deux paragraphes), règles (haut et barre fixée en bas), Créer (vide et avec un code choisi), Rejoindre (code saisi, code inconnu), salle (hôte prêt(e), code long et prénom de 40 « W », partie complète, 640 px de haut), choix (deux dos), carte Épreuve, carte Révélation, carte à effet durable, carte la plus longue, attente avec effets en cours, transition « bouclier », fin, fenêtre de confirmation du bouclier.

Jugement : rendu cohérent avec la charte et lisible. Fond nuit, halo bleu et lueur de braise discrète ; boutons ambre à double filet, secondaires au filet clair de lune ; cartes 2:3 avec lettrine, légende « symbole + mot » en braise (Épreuve) ou en lune (Révélation), séparateur filigrane, étincelles aux quatre coins ; dos de carte distincts par la couleur du symbole et du mot ; logo (cercle de lune, aile ambre, étoile) net à 96 px et reconnaissable à 40 px ; aucun texte coupé ni débordement ; le code de la partie est bien discret et placé avant le menu, la liste « Participant(e)s » en dessous. Seul problème visuel relevé : D5 (étoiles derrière le texte). Les emojis des emblèmes gardent leurs couleurs propres (police du système) : ce ne sont pas des couleurs de l'interface.

## Non vérifié

- Rendu sur un vrai téléphone (tactile, clavier à l'écran, barre d'adresse mobile, zones sûres `env(safe-area-inset-*)`, rendu réel des bordures de 1,5 px), plaisir de jeu, goût du design, lisibilité en soirée.
- Autres navigateurs que Chrome (Firefox, Safari iOS) : unités `cqw` et `container-type`, `color-mix()`, lettrine flottante `::first-letter`, `dvh`, `dialog`, retournement 3D.
- Fluidité du grain (`feTurbulence`) et des étoiles sur un téléphone d'entrée de gamme (batterie, saccades) : la charte le signale comme risque.
- Apparence des emojis d'emblèmes selon le téléphone (remplacés par des icônes en phase 7).
- Écrans plus étroits que 360 px.
- Aucun quota Firebase à vérifier : aucune connexion Firebase dans cette phase.
