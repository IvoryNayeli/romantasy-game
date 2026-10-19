# romantasy-game

Jeu de soirée multijoueur sur téléphone, sur le thème de la romantasy. Chaque personne ouvre un simple lien dans son navigateur (rien à installer). L'application joue le rôle de meneur de jeu : elle tire les cartes, annonce les tours et compte jusqu'à la fin. Les butins, eux, sont de vrais sacs que les convives s'échangent.

## Lancer le jeu

**Le jeu n'est pas encore entièrement jouable** : à ce stade (phase 4), la salle d'attente fonctionne en réseau (créer une partie, la rejoindre depuis d'autres téléphones, choisir prénom et emblème, « Je suis là », « Commencer la quête »). Les tours de jeu qui suivent sont encore des écrans de démonstration, avec des données fictives (le jeu en réseau complet arrive en phase 5).

### Ce qu'il faut sur l'ordinateur

- **Python 3**, pour servir la page (présent sur la plupart des ordinateurs Linux et macOS).
- Pour jouer à plusieurs : **Firebase CLI** et **Java** (version 11 ou plus récente), qui font tourner l'émulateur Firebase, une copie locale de la base de données. Firebase CLI s'installe avec `npm install -g firebase-tools` (Node.js nécessaire). Au premier lancement, l'émulateur se télécharge tout seul. Il n'a besoin d'aucun compte : il utilise un projet de démonstration (`demo-romantasy`) et ne touche jamais aux vraies bases.

La page doit être servie par un petit serveur web : l'ouvrir directement depuis le dossier (adresse `file://`) ne fonctionne pas, le navigateur bloque le chargement des fichiers de données.

### Jouer en local, sur un ou plusieurs appareils

Depuis le dossier du projet, ouvrir **deux terminaux**.

1. Dans le premier, démarrer l'émulateur de la base :

   ```
   firebase emulators:start --only database --project demo-romantasy
   ```

2. Dans le second, servir la page :

   ```
   python3 -m http.server -d public 8000
   ```

3. Ouvrir `http://localhost:8000/` dans le navigateur, puis « Comment ça marche ? », « Créer une partie » et choisir un code. Les codes déjà pris par une partie en cours sont grisés.
4. Pour les autres personnes : « Rejoindre une partie » et saisir le même code (majuscules, minuscules et accents n'ont pas d'importance). Sur un seul ordinateur, chaque **onglet** compte pour une personne différente : on peut donc essayer à plusieurs avec plusieurs onglets.

Pour arrêter : `Ctrl+C` dans chacun des deux terminaux. Les parties de l'émulateur sont effacées à son arrêt.

### Sur les téléphones (même Wi-Fi)

1. Brancher l'ordinateur et les téléphones sur le **même réseau Wi-Fi**.
2. Lancer l'émulateur et le serveur comme ci-dessus : tous deux écoutent sur toutes les adresses de l'ordinateur.
3. Trouver l'adresse de l'ordinateur sur le réseau : `hostname -I` (Linux) ou `ipconfig getifaddr en0` (macOS). Elle ressemble à `192.168.1.23`.
4. Sur chaque téléphone, ouvrir `http://192.168.1.23:8000/` (en remplaçant par l'adresse trouvée). La page utilise alors l'émulateur de cet ordinateur (port 9000), à la même adresse.

Si la page ne s'ouvre pas, ou si « Connexion impossible » s'affiche, vérifier que le pare-feu de l'ordinateur autorise les ports **8000** (la page) et **9000** (l'émulateur), et que le Wi-Fi n'isole pas les appareils entre eux (c'est parfois le cas des réseaux d'invité). L'émulateur accepte les appareils du réseau local : ne le lancer que sur un réseau de confiance (celui de la maison).

### Utiliser la vraie base de développement (`romantasy-dev`)

Ajouter `?base=dev` à l'adresse, par exemple `http://192.168.1.23:8000/?base=dev` : la page utilise alors la base `romantasy-dev` au lieu de l'émulateur (le paramètre est gardé d'un écran à l'autre). Les règles de sécurité (`database.rules.json`) doivent d'abord y être publiées, une fois puis à chaque changement, par la propriétaire du projet, connectée à son compte Firebase :

```
firebase deploy --only database --project dev
```

Cette commande publie seulement les règles de la base (rien d'autre, aucun service payant). Les parties abandonnées sont supprimées d'elles-mêmes après 30 minutes sans activité pour une salle d'attente (partie pas encore commencée), après 3 heures pour une partie commencée, dès qu'une personne ouvre « Créer une partie » ou tente de les rejoindre.

### Écrans de démonstration

Les écrans restent consultables avec des données fictives, sans base ni émulateur (seul le serveur Python est nécessaire) :

- **Liste de tous les écrans** : `http://localhost:8000/demo.html`. Chaque écran y a son lien, avec des variantes (choix du code, saisie du code avec ses messages d'erreur, salle complète, carte à effet durable, carte la plus longue, etc.) et la liste des 40 cartes.
- **Parcours complet de démonstration** : `http://localhost:8000/?demo=1` (accueil, règles, « Créer une partie » ou « Rejoindre une partie », salle d'attente fictive, tous les tours, fin). Pour rejoindre, saisir l'un des dix codes de `public/data/codes.json`.
- **Un écran précis**, avec le paramètre `ecran` dans l'adresse : `http://localhost:8000/index.html?ecran=carte&type=epreuve&carte=epr-06`

| Paramètre | Valeurs | Rôle |
|---|---|---|
| `ecran` | `accueil`, `regles`, `creer` (choix du code), `rejoindre` (saisie du code), `salle`, `choix`, `carte`, `attente`, `transition`, `fin` | Écran à afficher (accueil par défaut) |
| `demo` | `1` | Démonstration : « Créer », « Rejoindre » et la salle d'attente utilisent des données fictives, sans base. Gardé d'un écran à l'autre. |
| `base` | `dev` | Utilise la base `romantasy-dev` au lieu de l'émulateur local (voir plus haut) |
| `type` | `epreuve`, `revelation` | Type de la carte (première carte de ce type) |
| `carte` | un identifiant de `public/data/cartes.json`, par exemple `epr-06` | Carte précise (prioritaire sur `type`) |
| `tour` | un numéro de tour, borné par `config.json` | Compteur « Tour N / … » |
| `code` | un mot de `public/data/codes.json` (accents et casse libres) | Code déjà choisi (`creer`), code déjà saisi (`rejoindre`) ou code de la partie (`salle`) |
| `erreur` | `vide`, `inconnu` | Affiche le message d'erreur de l'écran `rejoindre` |
| `hote`, `autres`, `complete`, `prenom`, `embleme`, `pret` | voir `public/js/ecrans.js` | Variantes de la salle d'attente fictive (leur présence suffit à ouvrir la salle de démonstration) |
| `bouclier`, `prenom`, `embleme`, `effets` | `1` ou `0`, texte, identifiant d'emblème | Variantes de la transition et de l'attente |

Le nombre de tours et de places maximum vient uniquement de `public/data/config.json`. Les animations se coupent d'elles-mêmes quand le téléphone ou l'ordinateur demande de réduire les animations (réglage du système, pas une option du jeu).

### Plus tard

| À partir de | Ce qui sera documenté ici |
|---|---|
| Phase 5 | Les tours de jeu en réseau, jusqu'à la fin de la partie. |
| Phase 7 | Le lien définitif à partager (GitHub Pages) et comment créer une partie avec son groupe. |

## Développement du projet avec des agents (Copilot ou Claude Code)

> Cette section décrit comment le projet est **construit**, pas comment on y joue. Elle ne s'adresse qu'à la personne qui développe le jeu, avec des agents de développement (GitHub Copilot ou Claude Code, dans VS Code).

### Lancer les tests automatiques

**Node.js** est nécessaire (version 18 ou plus récente). Pour la suite complète, il faut aussi **Firebase CLI** et **Java** (voir « Ce qu'il faut sur l'ordinateur »), et Google Chrome ou Chromium. Depuis le dossier du projet :

```
npm install
npm test
```

`npm test` démarre l'émulateur Firebase local (projet de démonstration `demo-romantasy`, jamais un projet réel), lance tous les tests, puis arrête l'émulateur. Il affiche seulement un résumé et les échecs. Si Firebase CLI ou Java manquent, il échoue tout de suite avec un message qui le dit. Pour aller plus vite :

- `npm run test:rapide` : tests sans navigateur ni émulateur ni réseau, quelques secondes ;
- `npm run test:emulateur` : tests de la base sur l'émulateur, quelques secondes ;
- `npm run test:navigateur` : tests de navigateur (avec l'émulateur), plusieurs minutes.

Il y a trois familles de tests :

- **Tests sans navigateur ni émulateur** (données, cartes, emblèmes, codes, réglages ; écrans et design : polices hébergées, tailles minimales, palette, textes inclusifs, réglages jamais écrits en dur ; moteur de jeu, dans `tests/moteur.test.js` : parties complètes simulées de 2 personnes jusqu'au maximum de `config.json`, effets durables, bouclier, fin de partie, actions refusées ; réseau, dans `tests/reseau.test.js` : garde-fou qui refuse toute base non locale, règles de sécurité cohérentes avec les données, SDK Firebase isolé dans `public/js/firebase.js`, écoutes limitées au chemin de la partie, choix de la base). Ils n'ont besoin d'aucune installation : `npm run test:rapide` suffit. Lancer `node --test tests/` sans passer par npm fait échouer les tests de l'émulateur avec un message qui explique quoi faire.
- **Tests sur l'émulateur** (`tests/emulateur.test.js` et `tests/emulateur-regles.test.js`, outils communs dans `tests/aide-emulateur.js`) : clients simultanés, sixième personne refusée, deux personnes visant le même emblème, code introuvable, code déjà pris, ordre d'arrivée, règles de sécurité (taille, forme), non-boucle d'écriture, écoutes limitées au chemin de la partie, nettoyage des parties expirées. Ils utilisent le paquet `firebase` (dépendance de développement, même version que le SDK chargé par la page depuis le CDN).
- **Tests de navigateur** (cinq fichiers : `tests/navigateur.test.js` pour les captures aux largeurs 360 et 412 px, les débordements, les contrastes mesurés à l'écran, les animations et les 40 cartes ; `tests/navigateur-parcours.test.js` pour les parcours « Créer » et « Rejoindre » de démonstration et le retrait de l'option d'animations ; `tests/navigateur-charte.test.js` pour la conformité à la charte graphique ; `tests/navigateur-reseau.test.js` pour la salle d'attente en réseau, avec plusieurs pages à la fois sur l'émulateur ; `tests/aide-navigateur.js` pour les outils communs, sans test). Ils demandent `npm install` (qui installe `playwright-core`, utilisé uniquement par ces tests) et **Google Chrome ou Chromium** installé sur l'ordinateur. Ils durent **environ 5 à 7 minutes**. Sans `playwright-core` ou sans Chrome, ils sont sautés proprement avec un message, et le reste des tests tourne normalement. Ils n'accèdent à aucune adresse extérieure : le SDK Firebase leur est servi depuis `node_modules`.

Le résumé de `npm test` donne le nombre de tests réussis, échoués, sautés et « à faire ». Un test sur l'émulateur est marqué « à faire » (todo) en attendant une décision (voir docs/SUIVI.md) : il tourne sans compter comme échec.

Le jeu lui-même n'installe aucune dépendance : le SDK Firebase est chargé par la page depuis le CDN officiel (version figée dans `public/js/firebase-config.js`), et `npm install` ne sert qu'aux tests.

Le rapport de simulation du moteur ([docs/rapports/phase-3-simulation.md](docs/rapports/phase-3-simulation.md)) est produit par `node scripts/simulation.js` ; `npm run test:rapide` échoue s'il n'est plus à jour.

- Règles et textes validés : [docs/regles.md](docs/regles.md)
- Décisions du projet : [docs/PROJET.md](docs/PROJET.md)
- Plan des phases : [docs/PLAN.md](docs/PLAN.md)
- État d'avancement : [docs/SUIVI.md](docs/SUIVI.md)

Le projet est construit phase par phase, avec trois agents définis dans [.github/agents/](.github/agents/) (source unique de leurs rôles), repris pour Claude Code dans [.claude/](.claude/) et [CLAUDE.md](CLAUDE.md) :

| Agent | Rôle |
|---|---|
| `romantasy-chef-de-phase` | Seul agent à lancer. Coordonne la phase, rédige le rapport, fusionne après validation. |
| `romantasy-developpeur` | Implémente la phase (appelé par le chef de phase). |
| `romantasy-testeur` | Vérifie la phase et liste les défauts (appelé par le chef de phase pour les phases 4 à 7, ou quand des tests de navigateur sont à adapter). |

### Piloter les agents de développement

Ouvrir ce dossier dans VS Code (`Fichier`, `Ouvrir le dossier`) et démarrer une **nouvelle session** :

- **Copilot** : mode agent, choisir `romantasy-chef-de-phase`, puis écrire l'une des phrases ci-dessous.
- **Claude Code** : écrire `/romantasy-chef-de-phase` suivi de l'une des phrases ci-dessous, par exemple `/romantasy-chef-de-phase Lance la phase 3`. Le chef de phase tourne dans la session et appelle lui-même les sous-agents `romantasy-developpeur` et `romantasy-testeur`.

Une session par phase ou par itération suffit : toute la mémoire du projet est dans les fichiers du dépôt (`docs/SUIVI.md` en premier).

| Phrase | Effet |
|---|---|
| `Lance la phase N` | Lance ou reprend la phase, jusqu'au rapport de fin. |
| `Phase N, remarques : …` | Consigne les remarques et refait une itération de la phase. |
| `Phase N validée` | Fusionne dans `main`, pose le tag `phase-N` et pousse. |
| `Teste la chaîne` | Essai à blanc : vérifie que les deux autres agents répondent, sans rien modifier. |

À la fin de chaque boucle, un rapport est écrit dans `docs/rapports/phase-N-iteration-M.md`. Aucune phase n'est validée sans un message explicite de la personne qui porte le projet. Pour limiter la consommation, regroupe tes remarques en un seul message : une itération par message.

## Licence et crédits

À compléter en phase 7 (icônes game-icons.net, licence CC BY 3.0, à créditer).
