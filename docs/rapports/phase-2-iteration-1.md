# Phase 2, itération 1 : écrans et design

**État** : prête pour relecture. **Attendu de toi** : ouvrir les écrans sur ton téléphone, donner ton avis sur le design, trancher les décisions de la section 7, puis répondre « Phase 2 validée » ou « Phase 2, remarques : … ».

## 1. En bref
- Les huit écrans existent, alimentés par des données fictives (aucun réseau, aucune règle de jeu) : accueil, règles, salle d'attente, choix de carte, carte révélée, attente, fin de partie, plus la transition de 2 secondes.
- Design nuit de conte (palette du projet, polices hébergées, retournement de carte, étincelles dorées, réglage « Réduire les animations »).
- 72 tests sur 72 passent (relancés par le chef de phase). Le rendu sur un vrai téléphone n'a pas été vérifié : c'est ta validation.

## 2. Ce qui a été fait
- **Écrans** : accueil, règles, salle d'attente, choix de carte (Révélation ou Épreuve), carte révélée (avec bandeau d'effet durable et bouclier), attente, transition, fin de partie. Les textes de règles viennent de `docs/regles.md`.
- **Design** : palette exacte de `docs/PROJET.md`, Cinzel et Cormorant Garamond hébergées dans `public/fonts/` (licences OFL conservées, aucune police chargée depuis Internet), boutons de 56 px, texte des cartes à 22 px, couleur et symbole (épée, étoile) pour chaque type de carte, 10 emblèmes depuis `emblemes.json`.
- **Animations** : retournement 3D, fondu, lueur, étincelles dorées sur l'accueil. Bouton « Réduire les animations » (mémorisé sur l'appareil), suivi aussi du réglage du système.
- **Données** : le nombre de tours et de places vient uniquement de `public/data/config.json`. Un test échoue si un 4 ou un 5 apparaît en dur dans `public/`.
- **Outils de démonstration** : `public/demo.html` (liens vers chaque écran et les 40 cartes) et paramètres d'adresse `?ecran=…`.
- **README** : section « Lancer le jeu » mise à jour (servir, ouvrir les écrans, ouvrir sur téléphone, réduire les animations) ; lancement des tests expliqué dans la partie développement.

## 3. Où le voir, comment le vérifier
| Élément | Comment | Ce que tu dois constater |
|---|---|---|
| Parcours complet | Dans le dossier du projet : `python3 -m http.server -d public 8000`, puis ouvrir `http://localhost:8000/` | Accueil avec étincelles, puis règles, salle d'attente, choix, carte qui se retourne, transition, tour suivant ou fin |
| Tous les écrans et variantes | `http://localhost:8000/demo.html` | Un lien par écran, des variantes (salle complète, effet durable, carte la plus longue) et les 40 cartes en vue « carte » et « attente » |
| Sur ton téléphone | Même Wi-Fi que l'ordinateur ; `hostname -I` donne l'adresse ; ouvrir `http://<adresse>:8000/demo.html` | Rendu lisible, boutons faciles à toucher, aucun texte coupé, y compris sur les cartes longues |
| Animations réduites | Bouton « Réduire les animations » en haut de chaque écran | Plus de retournement, de lueur ni d'étincelles |
| Aucune police externe | Ouvrir `public/fonts/` | 6 fichiers `.woff2` et 2 licences ; `public/css/style.css` ne contient aucune adresse `http` |
| Tests | `npm install` puis `node --test tests/` (Node.js ; Chrome pour les tests de navigateur) | 72 tests, tous verts, environ 5 minutes |
| README | Ouvrir `README.md`, section « Lancer le jeu » | Les commandes ci-dessus y figurent à l'identique |

Ce que tu peux vérifier seule : tout, avec un seul téléphone (la phase n'a pas de réseau).

## 4. Résultats des tests
Relancés par le chef de phase sur la branche `phase-2` (`node --test tests/`, Node 18.19.1, Chrome 145 via `playwright-core`) :

```
# tests 72
# pass 72
# fail 0
# skipped 0
# duration_ms 283371
```

- 22 tests de la phase 1 (contenu), toujours verts.
- 23 tests du développeur : HTML bien formé, ressources présentes, polices, aucune ressource externe, palette et contrastes calculés, tailles minimales, textes conformes à `regles.md`, écriture inclusive, aucun réglage en dur.
- 27 tests de navigateur du testeur : captures à 360 et 412 px, aucun débordement sur les 40 cartes (écrans carte et attente), boutons ≥ 48 px, texte des cartes à 22 px, contraste réel sur 556 textes (minimum 4,73:1), polices réellement chargées, aucune requête externe, aucune erreur de console, « Réduire les animations » (bouton et réglage du système), `config.json` modifié (6 tours / 7 places, puis 2 / 3) suivi par l'interface, parcours complet, `demo.html`.

Rapport du testeur : [phase-2-test.md](phase-2-test.md).

## 5. Ce qui n'a pas été vérifié
- Le rendu sur un vrai téléphone (toucher, clavier à l'écran, barre d'adresse).
- Le goût du design et le plaisir de jeu : c'est ton avis qui compte.
- Firefox et Safari (retournement 3D, boîte de dialogue, hauteur d'écran dynamique).
- L'apparence des emblèmes (emojis), qui varie selon le téléphone.
- Les écrans plus étroits que 360 px.
- Le clavier à l'écran avec la barre de boutons fixée en bas de la salle d'attente (le testeur signale qu'elle prend environ un quart d'un écran de 640 px).
- Les quotas Firebase : aucune connexion Firebase dans cette phase.

## 6. Écarts par rapport au plan
- Ajout de `package.json` et `package-lock.json` (playwright-core 1.45.3 en dépendance de développement) pour les tests de navigateur. Prévu par `docs/PROJET.md` (Playwright), mais version choisie pour Node 18 (les versions récentes exigent Node 20). Les tests de navigateur se sautent avec un message clair si Chrome ou playwright-core est absent.
- Ajout de `public/demo.html` et des paramètres `?ecran=` pour que tu puisses voir chaque écran : pas dans le plan, à retirer ou masquer en phase 7.
- Sinon : aucun écart.

## 7. Décisions prises par les agents
À confirmer ou contester (aussi listées dans « Décisions à confirmer » de `docs/SUIVI.md`) :
1. **Libellés absents de `regles.md`** : « Je suis prêt(e) », « Ton prénom », « Ton emblème », « Code de la partie », « Joueur(se)s », « hôte », « toi », « Invoquer » et « Annuler » (confirmation du bouclier), « Effet durable », « Effets en cours », « Retour à l'accueil », « Réduire les animations ».
2. **Durées du bandeau** déduites du champ `duree` : « Jusqu'à ton prochain tour », « Jusqu'à son prochain tour », « Jusqu'à la fin de la partie ».
3. **« Rejoindre une partie »** : la saisie du code n'est décrite nulle part, renvoyée à la phase 4. En phase 2, ce bouton ouvre la salle d'attente en simple joueur(se). Souhaites-tu une autre présentation ?
4. **Minimum de 2 joueur(se)s prêt(e)s pour commencer** : constante dans `public/js/fictif.js`, car absente de `config.json`. Faut-il l'ajouter à `config.json` ?
5. **Titre de l'onglet** : « Romantasy ».
6. **Icônes** : épée, étoile et bouclier sont de simples dessins SVG faits pour le projet, en attendant game-icons.net (phase 7).
7. **Dos de carte Révélation** : pour atteindre le contraste 4,5:1 sans toucher à la palette, le dégradé du dos est un peu moins clair au centre (teintes du dégradé, pas de la palette).
8. **Remarques du testeur, laissées à ton appréciation** : le « 1 » de Cinzel ressemble à un « I » (« TOUR 1 / 4 » se lit presque « TOUR I / 4 »), et la barre de boutons de la salle d'attente occupe beaucoup de place sur un petit écran.

## 8. Fichiers modifiés et commits
Sortie de `git diff --stat main...HEAD` (28 fichiers, 3370 lignes ajoutées, 5 supprimées) :

- Interface : `public/index.html`, `public/demo.html`, `public/css/style.css`, `public/js/` (app, demo, dom, donnees, ecrans, fictif, reglages, textes, verif-serveur), `public/fonts/` (6 polices, 2 licences).
- Tests : `tests/ecrans-design.test.js`, `tests/reglages-en-dur.test.js`, `tests/navigateur.test.js`.
- Documentation et outils : `README.md`, `docs/SUIVI.md`, `docs/rapports/phase-2-test.md`, `package.json`, `package-lock.json`.

Commits (de `main` à `phase-2`, dépôt `IvoryNayeli/romantasy-game`) :
- `7f2f697` démarrage, statut en cours
- `6735887` polices hébergées
- `356a7c1` page, styles et huit écrans
- `24b8ad2` page de démonstration
- `4dc59d9` test des réglages en dur
- `119a2f7` tests des écrans et du design, README
- `7dfef5c` suivi, statut en test
- `e3d940e`, `4c3c061` tests de navigateur et rapport du testeur
- `bbee63b`, `8d17c72`, `29af327` correctifs D1 à D4
- `dad70a1` suivi des correctifs
- `518986c` rapport du testeur, deuxième passage

## 9. Défauts
- **Corrigés pendant la boucle** (2 passages du testeur sur 3 possibles) :
  - D1 : texte du bandeau « Effets en cours » à 19,2 px, porté à 20 px ;
  - D2 : contraste du mot « Révélation » sur le dos de carte (4,22:1), porté à 4,73:1 ;
  - D3 : « prêt à commencer » sans « (e) » dans `demo.html`, corrigé ;
  - D4 : README affirmant qu'aucune installation n'est requise pour les tests, corrigé (`npm install` et Chrome pour les tests de navigateur).
- **Encore ouverts** : aucun.

## 10. Tes remarques précédentes
Aucune : première itération de la phase.

## 11. Consommation Firebase
Sans objet : aucune connexion Firebase dans cette phase.

## 12. Comment répondre
- « Phase 2 validée » : fusion dans `main`, tag `phase-2`, push.
- « Phase 2, remarques : … » : nouvelle itération de la phase.
- « Lance la phase 3 » est refusé tant que la phase 2 n'est pas validée.
