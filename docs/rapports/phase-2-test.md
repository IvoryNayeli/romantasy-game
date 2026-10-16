# Rapport du testeur : phase 2 (écrans et design, sans réseau), itération 1

Date : 2026-10-16. Branche `phase-2`, arbre de travail propre au départ. Statut de départ dans `docs/SUIVI.md` : `en test`.

## Verdict : défauts ouverts (4 défauts mineurs, aucun bloquant)

Le parcours complet, `demo.html`, les 40 cartes, les polices hébergées, l'absence de requête externe, le réglage « réduire les animations » (manuel et `prefers-reduced-motion`), les réglages jamais écrits en dur et les textes validés passent tous. Les 4 échecs restants sont de petits écarts d'accessibilité ou de texte, listés ci-dessous.

## Résultat des tests

Commande : `node --test tests/` (Node 18.19.1, Chrome 145 via `playwright-core` 1.45.3).

```
# tests 72
# pass 68
# fail 4
# skipped 0
```

- 45 tests existants du développeur (contenu, conformité, écrans sans navigateur, réglages en dur) : tous verts.
- 27 tests de navigateur ajoutés par le testeur dans `tests/navigateur.test.js` : 23 verts, 4 rouges (les deux tests d'écrans à 360 et 412 px pour D1, le test de contraste pour D2, le test de textes pour D3).
- Durée des tests de navigateur : environ 5 minutes (Chrome piloté, 23 écrans × 2 largeurs, 40 cartes × 2 écrans × 2 largeurs, contrastes mesurés sur les pixels).
- Sans `playwright-core` ou sans Chrome, les tests de navigateur sont sautés avec le message « playwright-core absent : lancer « npm install »… » (vérifié en retirant `node_modules`).

### Ce que couvrent les tests de navigateur

| Attendu de la phase | Test | Résultat |
|---|---|---|
| Captures à 360 et 412 px, tous les écrans (23 variantes) | « captures + débordement + cibles tactiles » | captures faites ; échec D1 seulement |
| Aucun débordement de texte, 40 cartes (écrans carte et attente, 360 et 412 px) | « les 40 cartes… » | passe |
| Texte des cartes ≥ 20 px | idem + écrans | passe pour `.carte-texte` (22 px) ; D1 pour le bandeau « Effets en cours » |
| Boutons et zones tactiles ≥ 48 px (boutons, retour, dos de carte, emblèmes, champ, réglage) | écrans à 360 et 412 px | passe |
| Contrastes (palette) | tests du développeur + lecture de `style.css` | passe |
| Contrastes (rendu réel, mesuré sur les pixels, 556 textes) | « contrastes mesurés… » | échec D2 ; minimum relevé 4,22:1 |
| Aucune requête externe, aucun Google Fonts | « polices… » et « aucune requête… » (toute adresse non locale est bloquée et signalée) | passe |
| Polices réellement chargées et utilisées | CDP `getPlatformFontsForNode` : Cinzel et Cormorant Garamond hébergées, pas de police de secours | passe |
| Réglage manuel : coupe réellement les animations, se mémorise, se désactive, tient pendant la navigation | 3 tests | passe (aucune animation active dans `document.getAnimations()`) |
| `prefers-reduced-motion` (émulé), avec et sans JavaScript | 1 test | passe |
| Animations complètes par défaut (retournement, lueur, étincelles, pulsation) | 1 test | passe |
| Aucun 4 ni 5 en dur : `config.json` modifié à 6 tours et 7 joueur(se)s, puis 2 tours et 3 joueur(se)s | 1 test | passe (compteurs, règles, salle, fin de partie suivent) |
| Parcours complet (accueil → règles → salle → tous les tours → bouclier → fin → nouvelle quête, bouton Précédent) | 2 tests | passe |
| `demo.html` : se charge, 40 cartes, tous les liens ouvrent un écran sans erreur, lisible à 360 et 412 px | 2 tests | passe |
| Textes de l'accueil, des règles, de la fin, de la salle identiques à `docs/regles.md` | 1 test | passe |
| Écriture inclusive et vocabulaire « butin » dans tous les textes affichés | 1 test | échec D3 (page de démonstration uniquement) |
| Paramètres d'adresse absurdes ou hostiles (`ecran=__proto__`, balise HTML dans `prenom`, `tour=999`…) | 1 test | passe (pas d'injection, valeurs bornées) |
| Aucune erreur ni avertissement de console, aucune requête échouée ni 404 sur toutes les pages visitées | bilan final | passe |

Textes validés non modifiés : `git diff main` ne touche ni `docs/regles.md`, ni `docs/cartes-source.md`, ni `public/data/` (`cartes.json`, `emblemes.json`, `codes.json`, `config.json`).

Le README (« Servir le jeu ») a été vérifié : `python3 -m http.server -d public <port>` sert bien `index.html`, `demo.html`, le JavaScript (type `text/javascript`), le JSON et les polices `woff2` avec les bons types.

## Défauts

### D1 : texte du bandeau « Effets en cours » à 19,2 px (ouvert, mineur)

- Reproduire : ouvrir `index.html?ecran=attente&type=epreuve&tour=2` à 360 ou 412 px. Mesurer la taille de police de `.effets-texte` (le libellé de l'effet, par exemple « Transformé(e) en chat : miaule »).
- Attendu : texte issu des cartes d'au moins 20 px (`docs/PROJET.md`, Design, Accessibilité). Le même libellé fait 20 px dans le bandeau de la carte (`.bandeau-texte`).
- Obtenu : 19,2 px (`font-size: 1.2rem` dans `public/css/style.css`, règle `.effets-texte`). Les durées (« Jusqu'à son prochain tour », 16,8 px) et les légendes en capitales (13,6 à 15,2 px) sont plus petites encore, mais ce sont des libellés secondaires et non du texte de carte.
- Correctif possible : `.effets-texte` à `1.25rem`.
- Test qui le détecte : « captures + débordement + cibles tactiles » (360 et 412 px).

### D2 : contraste insuffisant du mot « Révélation » sur le dos de carte (ouvert, mineur)

- Reproduire : ouvrir `index.html?ecran=choix&tour=1`. Mesurer le contraste du libellé « Révélation » (`.dos-nom`, 16 px, gras) sur le dégradé violet du dos de carte.
- Attendu : au moins 4,5:1 (texte normal), contrastes élevés selon `docs/PROJET.md`.
- Obtenu : 4,33:1 à 360 px et 4,22:1 à 412 px dans la zone la plus claire du dégradé (centre `#8A70E8`). Le libellé « Épreuve » sur le dos rouge passe. Les 556 autres textes mesurés passent.
- Correctif possible : assombrir le centre du dégradé de `.dos-revelation`, ou agrandir le libellé (≥ 18,66 px en gras, seuil 3:1).
- Test qui le détecte : « contrastes mesurés sur les pixels rendus ».

### D3 : forme non inclusive sur la page de démonstration (ouvert, mineur)

- Reproduire : ouvrir `demo.html` et lire le lien « Hôte, prêt(e), prêt à commencer » (groupe « Salle d'attente »).
- Attendu : écriture inclusive partout (`.github/copilot-instructions.md`) : « prêt(e) à commencer ».
- Obtenu : « prêt » sans « (e) » le deuxième coup. Le texte est dans `public/js/demo.js`. Page de travail, d'où la gravité mineure.
- Test qui le détecte : « textes affichés : écriture inclusive et vocabulaire « butin » ».

### D4 : le README ne dit pas que les tests de navigateur demandent `npm install` (ouvert, mineur)

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
