# Décisions du projet

Ce fichier regroupe les choix techniques et de design validés. Les règles du jeu et les textes sont dans [regles.md](regles.md). En cas de doute sur un choix non écrit ici, demander à la propriétaire du projet.

## Contraintes générales

- **Tout est gratuit.** Aucune carte bancaire, jamais de plan Blaze Firebase.
- **Pas d'application à installer** : une page web, accessible par un lien. Pas de PWA, pas de mode hors ligne.
- **Pas de son.**
- **Une seule partie jouée à la fois par groupe**, 5 joueuses maximum, 4 tours par joueuse (réglages dans `config.json`, jamais écrits en dur ailleurs).
- Langue de l'interface, des commentaires et des commits : **français**.
- Dépôt GitHub **public** : aucun secret versionné. Les identifiants Firebase du navigateur sont publics par conception, à isoler dans un fichier de configuration identifié comme tel.

## Technique

- Page web simple : HTML, CSS, JavaScript, **sans framework ni étape de build**.
- Synchronisation temps réel : **Firebase Realtime Database**, plan Spark.
- Hébergement : GitHub Pages (publie la branche `main`).
- Les cartes sont chargées depuis le site (`public/data/cartes.json`), pas depuis la base. La base ne contient que l'état de la partie.
- L'état de la partie (tour, carte, compteur, effets) vit dans Firebase, pas sur le téléphone de l'hôte.
- Écran allumé : API Wake Lock. Reconnexion automatique : l'identité de chaque joueuse est mémorisée sur son téléphone. Une joueuse déconnectée est marquée « absente » sans être retirée. Si c'est son tour et qu'elle est absente, n'importe quelle joueuse peut passer son tour après quelques secondes.
- Plan Spark : 100 connexions simultanées, 1 Go de stockage, 10 Go par mois de téléchargements de la base, 10 Go de transfert d'hébergement. Pas de Cloud Functions : toute la logique tourne dans les navigateurs.
- Écoutes de la base uniquement sur le chemin de la partie en cours, jamais à la racine. Taille de l'état et nombre d'écritures par tour bornés.
- Suppression de la partie à la fin, expiration des parties abandonnées.
- Deux projets Firebase : `romantasy-dev` (essais) et `romantasy-prod` (lien partagé). Les tests automatiques visent **uniquement l'émulateur local** et refusent de tourner sur une adresse non locale.
- Outils de test : Node.js (lanceur de tests intégré), Playwright, émulateur Firebase (nécessite Java).

## Cartes

- 40 cartes : 20 Révélations et 20 Épreuves. Source dans [cartes-source.md](cartes-source.md), à convertir en `public/data/cartes.json` en phase 1.
- Une carte n'est jouée qu'une seule fois par partie.
- Comme chaque joueuse choisit le type, une pile doit pouvoir fournir 20 cartes (5 joueuses × 4 tours).
- Effets durables : champ `duree` valant `prochain_tour` (jusqu'à son prochain tour) ou `fin_partie`, et champ `effet` (libellé court du bandeau). Absents pour les cartes immédiates. Plusieurs effets peuvent se cumuler sur une joueuse. Un effet disparaît quand il a provoqué un échange de butins, ou à son échéance. Un bouclier sur la carte annule l'effet.
- Format d'une carte :

```json
{"id":"epr-06","type":"epreuve","duree":"fin_partie","effet":"Vouvoie tout le monde","texte":"…"}
```

## Emblèmes (10, sans marque)

Dragon 🐉, Sorcière 🧙, Vampire 🧛, Fée 🧚, Elfe 🧝, Loup-garou 🐺, Sirène 🧜, Phénix 🔥, Licorne 🦄, Chevalier 🛡️.

Emojis pour le prototype. Remplacement par les icônes de game-icons.net (licence CC BY 3.0, auteurs à créditer) en phase 7.

## Codes de partie

Un mot du thème, sans accent, insensible à la casse et aux accents à la saisie : ECLIPSE, RUNE, ONYX, AURORE, CRYPTE, GRIMOIRE, TALISMAN, ELIXIR, SORTILEGE, OBSIDIENNE. Tirage au hasard parmi ceux qui ne sont pas utilisés par une partie en cours.

## Design

- Ambiance : nuit de conte, sombre, dorures, un peu mystérieuse, sans être glauque.
- Palette :

| Rôle | Couleur |
|---|---|
| Fond | `#14101F` (dégradé vers `#2A1B3D`) |
| Surface | `#221A33` |
| Or | `#D4AF6A` |
| Texte | `#F3ECE0` |
| Épreuve | `#B3263E` |
| Révélation | `#6C4FD1` |
| Secondaire | `#A79BBE` |

- Typographie : Cinzel (titres, boutons en petites capitales), Cormorant Garamond ou EB Garamond (texte des cartes et des règles). Polices **hébergées avec le site**, pas de Google Fonts.
- Chaque type de carte a une couleur **et** un symbole (épée, étoile), pour ne pas dépendre de la couleur seule.
- Accessibilité : boutons d'au moins 48 px de haut, texte des cartes d'au moins 20 px, contrastes élevés, animations désactivées si « réduire les animations » est demandé.
- Animations courtes : retournement de carte en 3D CSS, fondu, légère lueur. Fond d'étincelles dorées en CSS léger sur l'accueil.

## Arborescence cible

```
romantasy-game/
├── .github/            copilot-instructions.md, agents/
├── docs/               regles.md, PROJET.md, PLAN.md, SUIVI.md, cartes-source.md,
│                       rapports/, remarques/
├── public/
│   ├── index.html
│   ├── css/style.css
│   ├── js/             app.js, game.js, firebase.js, wakelock.js
│   ├── data/           cartes.json, emblemes.json, codes.json, config.json
│   └── fonts/
├── tests/
├── firebase.json
└── database.rules.json
```
