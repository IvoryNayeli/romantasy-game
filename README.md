# romantasy-game

Jeu de soirée multijoueur sur téléphone, sur le thème de la romantasy. Chaque personne ouvre un simple lien dans son navigateur (rien à installer). L'application joue le rôle de meneur de jeu : elle tire les cartes, annonce les tours et compte jusqu'à la fin. Les butins, eux, sont de vrais sacs que les convives s'échangent.

## Lancer le jeu

**Le jeu n'est pas encore jouable** : à ce stade (phase 2), seuls les écrans existent, avec des données fictives, sans réseau ni règles de jeu. On peut les parcourir sur ordinateur ou sur téléphone.

### Servir le jeu sur son ordinateur

La page doit être servie par un petit serveur web : l'ouvrir directement depuis le dossier (adresse `file://`) ne fonctionne pas, le navigateur bloque le chargement des fichiers de données. Aucune installation n'est nécessaire si Python 3 est présent (c'est le cas sur la plupart des ordinateurs Linux et macOS).

Depuis le dossier du projet :

```
python3 -m http.server -d public 8000
```

Puis ouvrir `http://localhost:8000/` dans le navigateur. Pour arrêter le serveur : `Ctrl+C` dans le terminal.

### Ouvrir les écrans

- **Parcours complet** : `http://localhost:8000/` (accueil, puis « Comment ça marche ? », puis au choix « Créer une partie » (choix du code dans la liste) ou « Rejoindre une partie » (saisie du code), salle d'attente, choix de carte, carte révélée, transition, fin). Les boutons enchaînent les écrans avec des données fictives. Pour rejoindre, saisir l'un des dix codes de `public/data/codes.json` (majuscules, minuscules et accents n'ont pas d'importance, par exemple « élixir ») ; tout autre code affiche un message d'erreur. Il n'y a aucun réseau : les codes ne sont pas encore partagés entre appareils (phase 4).
- **Liste de tous les écrans** : `http://localhost:8000/demo.html`. Chaque écran y a son lien, avec des variantes (choix du code, saisie du code avec ses messages d'erreur, salle complète, carte à effet durable, carte la plus longue, etc.) et la liste des 40 cartes.
- **Un écran précis**, avec le paramètre `ecran` dans l'adresse : `http://localhost:8000/index.html?ecran=carte&type=epreuve&carte=epr-06`

| Paramètre | Valeurs | Rôle |
|---|---|---|
| `ecran` | `accueil`, `regles`, `creer` (choix du code), `rejoindre` (saisie du code), `salle`, `choix`, `carte`, `attente`, `transition`, `fin` | Écran à afficher (accueil par défaut) |
| `type` | `epreuve`, `revelation` | Type de la carte (première carte de ce type) |
| `carte` | un identifiant de `public/data/cartes.json`, par exemple `epr-06` | Carte précise (prioritaire sur `type`) |
| `tour` | un numéro de tour, borné par `config.json` | Compteur « Tour N / … » |
| `code` | un mot de `public/data/codes.json` (accents et casse libres) | Code déjà choisi (`creer`), code déjà saisi (`rejoindre`) ou code affiché (`salle`) |
| `erreur` | `vide`, `inconnu` | Affiche le message d'erreur de l'écran `rejoindre` |
| `hote`, `autres`, `complete`, `prenom`, `embleme`, `pret` | voir `public/js/ecrans.js` | Variantes de la salle d'attente |
| `bouclier`, `prenom`, `embleme`, `effets` | `1` ou `0`, texte, identifiant d'emblème | Variantes de la transition et de l'attente |

Le nombre de tours et de places maximum vient uniquement de `public/data/config.json`. Les animations se coupent d'elles-mêmes quand le téléphone ou l'ordinateur demande de réduire les animations (réglage du système, pas une option du jeu).

### Ouvrir les écrans sur son téléphone

1. Brancher l'ordinateur et le téléphone sur le **même réseau Wi-Fi**.
2. Lancer le serveur comme ci-dessus : il écoute sur toutes les adresses de l'ordinateur.
3. Trouver l'adresse de l'ordinateur sur le réseau : `hostname -I` (Linux) ou `ipconfig getifaddr en0` (macOS). Elle ressemble à `192.168.1.23`.
4. Sur le téléphone, ouvrir `http://192.168.1.23:8000/demo.html` (en remplaçant par l'adresse trouvée).

Si la page ne s'ouvre pas, vérifier que le pare-feu de l'ordinateur autorise le port 8000 et que le Wi-Fi n'isole pas les appareils entre eux (c'est parfois le cas des réseaux d'invité).

### Plus tard

| À partir de | Ce qui sera documenté ici |
|---|---|
| Phase 4 | Comment lancer le jeu avec l'émulateur Firebase local, pour tester la salle d'attente et les parties sans toucher à la vraie base. |
| Phase 7 | Le lien définitif à partager (GitHub Pages) et comment créer une partie avec son groupe. |

## Développement du projet avec des agents Copilot

> Cette section décrit comment le projet est **construit**, pas comment on y joue. Elle ne s'adresse qu'à la personne qui développe le jeu, avec les agents de développement de VS Code.

### Lancer les tests automatiques

**Node.js** est nécessaire (version 18 ou plus récente). Depuis le dossier du projet :

```
npm install
npm test
```

`npm test` affiche seulement un résumé et les échecs. Pour aller plus vite : `npm run test:rapide` (sans navigateur, quelques secondes) et `npm run test:navigateur` (navigateur seul).

Il y a deux familles de tests :

- **Tests sans navigateur** (données, cartes, emblèmes, codes, réglages ; écrans et design : polices hébergées, tailles minimales, palette, textes inclusifs, réglages jamais écrits en dur). Ils n'ont besoin d'aucune installation : `npm run test:rapide` (ou `node --test tests/`) suffit.
- **Tests de navigateur** (58 tests, dans quatre fichiers : `tests/navigateur.test.js` pour les captures aux largeurs 360 et 412 px, les débordements, les contrastes mesurés à l'écran, les animations et les 40 cartes ; `tests/navigateur-parcours.test.js` pour les parcours « Créer » et « Rejoindre » et le retrait de l'option d'animations ; `tests/navigateur-charte.test.js` pour la conformité à la charte graphique ; `tests/aide-navigateur.js` pour les outils communs, sans test). Avec les 54 tests sans navigateur, cela fait 112 tests. Ils demandent `npm install` (qui installe `playwright-core`, seule dépendance de développement, utilisée uniquement par ces tests) et **Google Chrome ou Chromium** installé sur l'ordinateur. Ils durent **environ 4 à 5 minutes**. Sans `playwright-core` ou sans Chrome, ils sont sautés proprement avec un message, et le reste des tests tourne normalement.

Le jeu lui-même n'a aucune dépendance : `npm install` ne sert qu'aux tests.

- Règles et textes validés : [docs/regles.md](docs/regles.md)
- Décisions du projet : [docs/PROJET.md](docs/PROJET.md)
- Plan des phases : [docs/PLAN.md](docs/PLAN.md)
- État d'avancement : [docs/SUIVI.md](docs/SUIVI.md)

Le projet est construit phase par phase, avec trois agents Copilot définis dans [.github/agents/](.github/agents/) :

| Agent | Rôle |
|---|---|
| `romantasy-chef-de-phase` | Seul agent à lancer. Coordonne la phase, rédige le rapport, fusionne après validation. |
| `romantasy-developpeur` | Implémente la phase (appelé par le chef de phase). |
| `romantasy-testeur` | Vérifie la phase et liste les défauts (appelé par le chef de phase pour les phases 4 à 7, ou quand des tests de navigateur sont à adapter). |

### Piloter les agents de développement

Ouvrir ce dossier dans VS Code (`Fichier`, `Ouvrir le dossier`), démarrer une **nouvelle session** en mode agent, choisir `romantasy-chef-de-phase` et écrire l'une de ces phrases :

| Phrase | Effet |
|---|---|
| `Lance la phase N` | Lance ou reprend la phase, jusqu'au rapport de fin. |
| `Phase N, remarques : …` | Consigne les remarques et refait une itération de la phase. |
| `Phase N validée` | Fusionne dans `main`, pose le tag `phase-N` et pousse. |
| `Teste la chaîne` | Essai à blanc : vérifie que les deux autres agents répondent, sans rien modifier. |

À la fin de chaque boucle, un rapport est écrit dans `docs/rapports/phase-N-iteration-M.md`. Aucune phase n'est validée sans un message explicite de la personne qui porte le projet. Pour limiter la consommation, regroupe tes remarques en un seul message : une itération par message.

## Licence et crédits

À compléter en phase 7 (icônes game-icons.net, licence CC BY 3.0, à créditer).
