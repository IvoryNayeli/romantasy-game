# Phase 0, itération 1 : fondations

**État** : prête pour relecture. **Attendu de toi** : relire le dépôt, lancer l'essai à blanc de la chaîne dans une nouvelle session (section 3, étape 4), puis écrire « Phase 0 validée » ou « Phase 0, remarques : … ».

## 1. En bref

- Le dépôt `romantasy-game` est créé, lié à GitHub par la clé de déploiement, et la phase est poussée sur la branche `phase-0`.
- Les règles, les 40 cartes validées, les décisions du projet, le plan et le suivi sont écrits dans le dépôt, pour qu'une nouvelle session retrouve tout sans mémoire.
- Les trois agents `romantasy-*` existent, mais **je n'ai pas pu les lancer moi-même** : leur bon fonctionnement reste à vérifier par toi (section 5).

## 2. Ce qui a été fait

- **Dépôt** : dossier `/home/cludwig/Documents/romantasy-game`, branche `main` (un commit vide d'initialisation) et branche `phase-0` (tout le travail).
- **Accès GitHub** : la connexion SSH par la clé `romantasy_deploy` fonctionne, avec accès au seul dépôt `romantasy-game`. Le dépôt distant était vide.
- **Documents de référence** :
  - `docs/regles.md` : règles et textes validés (accueil, « Comment ça marche ? », fin de partie, boutons, écrans de tour, salle d'attente).
  - `docs/cartes-source.md` : les 40 cartes validées, avec durée et libellé d'effet pour les 9 cartes durables.
  - `docs/PROJET.md` : contraintes, choix techniques, Firebase, design, arborescence cible.
  - `docs/PLAN.md` : les phases 0 à 7 et les prérequis.
  - `docs/SUIVI.md` : statuts, journal, défauts, décisions à confirmer.
  - `docs/rapports/MODELE.md` : modèle de ce rapport.
- **Agents et instructions** (`.github/`) : `copilot-instructions.md` (règles communes) et les trois agents `romantasy-chef-de-phase`, `romantasy-developpeur`, `romantasy-testeur`. Seul le chef de phase est visible dans le sélecteur.
- **README** : description du projet, mode d'emploi des agents, comment s'en défaire à la fin.

## 3. Où le voir, comment le vérifier

| Élément | Comment | Ce que tu dois constater |
|---|---|---|
| 1. Dépôt en ligne | Ouvrir https://github.com/IvoryNayeli/romantasy-game/tree/phase-0 | Les fichiers listés plus bas sont présents. Sur `main`, il n'y a rien d'autre que le commit d'initialisation : c'est normal, `main` ne reçoit que des phases validées. |
| 2. Clonage | `git clone -b phase-0 git@github-romantasy:IvoryNayeli/romantasy-game.git /tmp/essai` | Le clonage réussit (j'ai fait ce test, voir section 4). |
| 3. Règles et cartes | Lire `docs/regles.md` et `docs/cartes-source.md` | Les textes sont ceux que tu as validés. Compter 20 Révélations, 20 Épreuves, 9 cartes marquées 🔁. |
| 4. Agents et essai à blanc | Ouvrir le dossier du projet dans VS Code (`Fichier`, `Ouvrir le dossier`, `/home/cludwig/Documents/romantasy-game`), **nouvelle session** en mode agent, choisir `romantasy-chef-de-phase`, écrire « Teste la chaîne » | Seul `romantasy-chef-de-phase` apparaît dans le sélecteur. Le chef répond que le développeur puis le testeur ont chacun été appelés et ont répondu, puis que `docs/essai/` est supprimé. Aucun commit n'est créé. |
| 5. Garde-fou de validation | Dans la même session, écrire « Lance la phase 2 » | Le chef refuse : la phase 1 n'est pas validée. |
| 6. Modèle de rapport | Lire `docs/rapports/MODELE.md` | Ce plan de rapport te convient-il ? C'est le format des prochains rapports. |
| 7. Identité des commits | Sur GitHub, regarder l'auteur des commits | `IvoryNayeli`, avec une adresse de type `noreply`. |

Les étapes 1 à 3, 6 et 7 se font seule. Les étapes 4 et 5 demandent une nouvelle session dans le dossier du projet.

## 4. Résultats des tests

Il n'y a pas de test automatique en phase 0. Ce que j'ai vérifié, avec la commande réellement exécutée :

- Accès SSH : `ssh -T git@github-romantasy` répond « Hi IvoryNayeli/romantasy-game! You've successfully authenticated ».
- Dépôt distant vide avant le premier push : `git ls-remote` ne renvoie rien.
- Clonage de la branche `phase-0` depuis GitHub dans un dossier temporaire : réussi, 13 fichiers suivis (3 agents, instructions, `.gitignore`, README, 6 documents dans `docs/`, `docs/remarques/.gitkeep`).
- Auteur de tous les commits : `IvoryNayeli <IvoryNayeli@users.noreply.github.com>`, aucune adresse professionnelle.
- Recherche de clés privées, de l'adresse professionnelle, de « cnes », « api key » et « token » dans les fichiers du clone, sauf `docs/PROJET.md` : aucune occurrence.
- Vérification des erreurs de format sur `.github/` par l'éditeur : aucune.

## 5. Ce qui n'a pas été vérifié

- **Le fonctionnement des agents.** Je ne peux pas lancer des agents personnalisés depuis cette session. Ils n'ont donc jamais tourné. Je n'ai pas vu non plus s'ils apparaissent bien dans le sélecteur, ni si le chef peut appeler les deux autres comme sous-agents. C'est le but de l'essai à blanc (étape 4). Si les agents ne s'affichent pas, c'est un défaut de la phase 0, à me signaler en remarque.
- **Les restrictions du testeur.** Elles sont écrites dans ses consignes, pas verrouillées : il a l'outil d'édition. À contrôler en relisant les commits des phases suivantes.
- **Les commandes git de validation** (fusion, tag) : écrites, jamais exécutées.
- **Les textes du jeu** : je n'ai pas relu les cartes avec ton regard, seulement recopié ce que tu avais validé.

## 6. Écarts par rapport au plan

- La **branche `main` est vide** (un commit d'initialisation) tant que la phase 0 n'est pas validée. C'est la conséquence de la règle « main = phases validées ».
- **L'essai à blanc** ne peut pas être fait par moi dans cette session (section 5). Il devient ta vérification n° 4.
- **Node.js n'est pas installé** sur la machine. Ce n'est pas bloquant pour la phase 0, mais la phase 1 en a besoin (voir section 7).

## 7. Décisions prises par les agents

Ces choix n'étaient pas dans nos échanges. Conteste-les si tu n'es pas d'accord.

1. **Identité git locale** : nom `IvoryNayeli`, adresse `IvoryNayeli@users.noreply.github.com`, limitée à ce dépôt. Ton identité globale utilise une adresse professionnelle, que je ne voulais pas publier dans un dépôt public. Si ton compte GitHub utilise une adresse noreply avec un numéro devant, GitHub peut ne pas relier ces commits à ton profil : cela n'a aucune conséquence sur le fonctionnement.
2. **Deux documents ajoutés** au plan initial : `docs/PLAN.md` (le plan, séparé du suivi) et `docs/cartes-source.md` (les cartes validées, car sinon elles n'existaient que dans cette conversation).
3. **Quatrième commande « Teste la chaîne »** pour le chef de phase, pour permettre l'essai à blanc.
4. **Libellés des effets** des 9 cartes durables (par exemple « Vouvoie tout le monde », « Transformée en chat : miaule ») : j'en ai proposé, modifiables.
5. **Dossier `.vscode/` ignoré** par git, pour ne pas publier de réglages personnels.
6. **Deux phrases non confirmées** : celle sur les effets durables (« Il prend fin dès qu'il a provoqué un échange de butins ») et « Terminez les échanges en cours avant d'ouvrir vos butins ». Elles sont marquées « à valider » dans `docs/regles.md` et listées dans `docs/SUIVI.md`.

## 8. Fichiers modifiés et commits

Branche `phase-0`, https://github.com/IvoryNayeli/romantasy-game/tree/phase-0 :

- `5508fa7` Initialisation du dépôt (sur `main`, commit vide)
- `01727f5` phase 0 : README et .gitignore
- `75e9c92` phase 0 : règles, décisions, plan, suivi et modèle de rapport
- `564910c` phase 0 : instructions communes et agents romantasy
- le commit de ce rapport, ensuite

## 9. Défauts

Aucun défaut connu. Aucun testeur n'est intervenu : il n'y a pas de rapport de test pour la phase 0.

## 10. Tes remarques précédentes

Sans objet : première itération.

## 11. Consommation Firebase

Sans objet : aucune connexion Firebase à ce stade.

## 12. Comment répondre

- « Phase 0 validée » : je fusionne `phase-0` dans `main`, pose le tag `phase-0` et pousse.
- « Phase 0, remarques : … » : je consigne tes remarques et refais une itération.
- « Lance la phase 1 » est refusé tant que la phase 0 n'est pas validée. Avant la phase 1, installe **Node.js** (`sudo apt install nodejs`, ou une version plus récente par nvm), car les tests de contenu en ont besoin.
