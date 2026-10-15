# Plan des phases

Plan stable. L'état d'avancement est dans [SUIVI.md](SUIVI.md). Chaque phase se déroule sur la branche `phase-N`. `main` ne contient que des phases validées. Chaque phase se termine par un rapport (voir [rapports/MODELE.md](rapports/MODELE.md)) puis par la validation explicite de la propriétaire du projet.

## Prérequis à installer par la propriétaire

| Avant la phase | Prérequis |
|---|---|
| 1 | **Node.js** (non installé à la fin de la phase 0) |
| 4 | **Java** (déjà présent : OpenJDK 21), deux projets Firebase gratuits `romantasy-dev` et `romantasy-prod` (région européenne), Firebase CLI |
| 7 | Activer GitHub Pages dans les paramètres du dépôt (publication depuis `main`) |

## Phase 0 : fondations

- Dépôt, structure, `.gitignore`, `README.md`, documents de référence, instructions communes, les trois agents `romantasy-*`.
- **Vérification** : le dépôt se clone ; les agents apparaissent dans le sélecteur ; essai à blanc de la chaîne (« Teste la chaîne »).
- **Validation humaine** : lecture du rapport, du modèle de rapport et des agents.

## Phase 1 : contenu

- `public/data/cartes.json` (40 cartes depuis `docs/cartes-source.md`), `emblemes.json`, `codes.json`, `config.json` (4 tours, 5 joueuses).
- `docs/cartes-a-relire.md` : tableau lisible généré par un script, pour la relecture.
- **Tests automatiques** : format des cartes, identifiants uniques, types et durées valides, au moins 20 cartes de chaque type, aucun doublon de texte, « butin » seul terme utilisé (pas de « poche »), codes sans accent, 9 cartes à effet durable.

## Phase 2 : écrans et design (sans réseau)

- Accueil, règles, salle d'attente, choix de carte, carte révélée, attente, fin de partie, alimentés par des données fictives.
- Palette, polices hébergées, animations, réglage « réduire les animations ».
- **Tests** : captures d'écran aux largeurs 360 et 412 px, aucun débordement de texte même sur les cartes les plus longues, taille des boutons, contrastes.
- **Validation humaine** : ouverture des écrans sur son téléphone, avis sur le design.

## Phase 3 : moteur de jeu (logique pure)

- Pioche sans répétition, ordre des tours, compteur de tours, bouclier, effets durables, fin de partie. Aucun réseau, aucune interface.
- **Tests** : simulations de parties complètes de 2 à 5 joueuses, dont le pire cas où toutes choisissent le même type ; aucune carte jouée deux fois ; arrêt au bon moment ; expiration des effets. Rapport de simulation en français.

## Phase 4 : multijoueur et salle d'attente

- Firebase : création et jonction de partie par code, prénom, emblème, emblème pris grisé, limite de 5 joueuses, ordre d'arrivée, règles de sécurité de la base, nettoyage des parties.
- **Tests** sur l'émulateur local : clients simultanés, sixième joueuse refusée, deux joueuses visant le même emblème, code introuvable, règles de sécurité (taille, forme), non-boucle d'écriture, écoutes limitées au chemin de la partie.

## Phase 5 : partie jouable en réseau

- Tour synchronisé complet : choix, carte visible par toutes, « Le sort est jeté », « Invoquer un bouclier », bandeau d'effets, écran de fin.
- **Tests** : partie complète avec plusieurs navigateurs automatisés ; seule la joueuse active peut agir.

## Phase 6 : robustesse

- Wake Lock, reconnexion automatique, joueuse « absente », passage de tour d'une absente.
- **Tests** : coupure réseau simulée, rechargement en pleine partie, absence prolongée.

## Phase 7 : finition et mise en ligne

- Icônes game-icons.net et crédits, GitHub Pages, accessibilité, lien définitif, contrôle des quotas Firebase.
- **Validation humaine** : partie réelle sur plusieurs téléphones, avec une check-list fournie.
