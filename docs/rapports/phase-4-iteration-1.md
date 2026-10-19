# Phase 4, itération 1 : multijoueur et salle d'attente

**État** : prête pour relecture. **Attendu de toi** : essayer la salle d'attente à plusieurs (onglets ou téléphones), trancher les décisions de la section 7, en particulier D2 (authentification), puis répondre par « Phase 4 validée » ou « Phase 4, remarques : … ».

## 1. En bref

La salle d'attente fonctionne maintenant en réseau, avec l'émulateur Firebase local : créer une partie par code, la rejoindre depuis un autre appareil, choisir prénom et emblème, « Je suis là », « Commencer la quête ». Les règles de la base refusent les écritures qui contournent le jeu, sauf un cas qui demanderait une authentification (D2, à trancher). La suite complète passe : 190 tests réussis, 1 « à faire » (D2).

## 2. Ce qui a été fait

- **Créer une partie** : choix du code dans la liste de l'écran validé en phase 2. Les codes déjà pris par une partie en cours sont grisés, et un code pris entre-temps est refusé avec un message.
- **Rejoindre une partie** : saisie du code (casse et accents libres), message « code inconnu » si aucune partie n'existe, « La partie est complète » au-delà des places de `config.json`, « La quête a déjà commencé » après le départ.
- **Salle d'attente partagée** : liste des personnes synchronisée, ordre d'arrivée, emblème pris grisé chez les autres, prénom envoyé au « Je suis là » (les autres voient « … » d'ici là), « Je suis là » définitif.
- **« Commencer la quête »** : réservé à l'hôte, possible dès 2 présences confirmées. La base reçoit alors l'ordre des tours (les personnes prêtes, dans l'ordre d'arrivée) et tout le monde passe à l'écran de choix de carte, encore fictif (le tour en réseau est la phase 5).
- **Règles de sécurité de la base** (`database.rules.json`) : forme et taille des données, 10 codes autorisés seulement, emblème unique, rang et présence non modifiables, départ à 2 présences, pas d'arrivée après le départ, ordre des tours figé, partie expirée non modifiable.
- **Nettoyage sans service payant** : une partie sans écriture depuis 3 heures est supprimée par le premier appareil qui la croise, et son code redevient libre.
- **Choix de la base** : émulateur local pour une page ouverte depuis l'ordinateur ou le réseau de la maison, `romantasy-dev` avec `?base=dev`, jamais `romantasy-prod` avant la phase 7.
- **Mode démonstration** : `?demo=1` garde les écrans de la phase 2 sans base.
- **README**, section « Lancer le jeu » : émulateur, réseau local, téléphones, base de développement.

## 3. Où le voir, comment le vérifier

| Élément | Comment (fichier, commande ou lien) | Ce que tu dois constater |
|---|---|---|
| Lancer le jeu à plusieurs | Suivre `README.md`, section « Lancer le jeu », « Jouer en local » (deux terminaux), puis ouvrir `http://localhost:8000/` dans deux onglets | Chaque onglet compte pour une personne différente |
| Créer, rejoindre | Onglet 1 : « Créer une partie », choisir un code. Onglet 2 : « Rejoindre une partie », saisir ce code | L'onglet 2 arrive dans la même salle, la liste se met à jour dans les deux |
| Emblème pris | Choisir un emblème dans l'onglet 1 | Il apparaît grisé et inactif dans l'onglet 2 |
| Code déjà pris | Dans un troisième onglet, ouvrir « Créer une partie » | Le code de la partie en cours est grisé |
| Départ | Les deux onglets : « Je suis là », puis l'hôte : « Commencer la quête » | Les deux onglets passent à l'écran de choix de carte |
| Partie commencée | Un nouvel onglet tente de rejoindre le même code | Message « La quête a déjà commencé » |
| Sur les téléphones | README, « Sur les téléphones (même Wi-Fi) » | La page s'ouvre sur chaque téléphone et la salle est partagée. Demande plusieurs téléphones et l'ordinateur sur le même Wi-Fi |
| Démonstration | `http://localhost:8000/?demo=1` (serveur Python seul) | Le parcours de la phase 2, sans base |
| Tests | `npm test` | `190 réussis, 0 échoués, 0 sautés, 1 à faire (todo)` |

Tu peux tout vérifier seule sur l'ordinateur avec plusieurs onglets, sauf la ligne « Sur les téléphones ».

## 4. Résultats des tests

`npm test` sur le commit `3ff1714` : **190 réussis, 0 échoués, 0 sautés, 1 à faire (todo)**. Le test « à faire » est celui de D2 (section 9), mis de côté en attendant ta décision.

Par thème, pour la phase 4 :

- **Émulateur, salle** (`tests/emulateur.test.js`) : forme de la partie créée, code déjà pris (même en simultané), code introuvable sans écriture, sixième personne refusée lors d'arrivées simultanées, ordre d'arrivée, deux personnes visant le même emblème, changement d'emblème, départ réservé à l'hôte avec 2 présences, nettoyage des parties inactives, pas de boucle d'écriture, écoutes limitées au chemin de la partie, règles de forme, de taille et invariants.
- **Écritures directes** (`tests/emulateur-regles.test.js`) : contournements du jeu par écriture brute dans la base, D1 à D8 et leurs variantes, création sur un code expiré.
- **Sans navigateur** (`tests/reseau.test.js`) : garde-fous (refus de toute adresse non locale), contenu des règles, fonctions de `salon.js`, version figée du SDK, écoutes, choix de la base, configuration de Firebase CLI.
- **Navigateur** (`tests/navigateur-reseau.test.js`) : parcours à deux complet, code grisé dans « Créer », code inconnu, partie complète, démonstration sans base, aucune requête externe ni erreur de console.
- Les tests des phases 0 à 3 passent toujours. Ils ouvrent désormais les écrans en démonstration.

## 5. Ce qui n'a pas été vérifié

- **Vrais téléphones sur le Wi-Fi** : non essayé. Les tests simulent plusieurs personnes dans un navigateur sur l'ordinateur. Le pare-feu et l'isolation du Wi-Fi peuvent bloquer (voir README).
- **Vraie base `romantasy-dev`** : tous les tests visent l'émulateur. Ni la publication des règles (`firebase deploy --only database --project dev`) ni le démarrage de Firebase sans clé d'API n'ont été vérifiés sur la vraie base.
- **Aspect visuel** des nouveaux messages et des codes grisés : couvert seulement par les tests de charte existants, sans relecture à l'œil.
- **D2** : la base ne peut pas savoir qui écrit (section 9).
- **Contournements** : la recherche s'est arrêtée volontairement après trois séries (à ta demande) ; d'autres variantes d'écriture directe peuvent exister. Sans authentification, leur portée reste celle de D2.

## 6. Écarts par rapport au plan

- **Codes de partie** : `PROJET.md` prévoit un tirage au hasard parmi les codes libres ; l'écran validé en phase 2 (choix dans la liste) a été gardé. À trancher (section 7).
- **Sécurité** : le plan demande des règles de sécurité de la base ; elles ne peuvent pas empêcher une personne qui connaît un code de modifier une partie (D2), faute d'authentification.

## 7. Décisions prises par les agents

Détail dans `docs/SUIVI.md`, section « Décisions à confirmer ». En résumé :

1. **Pas d'authentification (D2)** : à décider, ajouter l'authentification anonyme (phase 6 ?) ou accepter le risque pour un jeu entre amis. C'est la décision la plus importante.
2. **Codes choisis dans la liste** plutôt que tirés au hasard (section 6).
3. **Nettoyage** après 3 heures sans écriture, par le premier appareil qui croise la partie ; 10 parties au plus dans la base. Suppression d'une partie terminée prête, à appeler en phase 5.
4. **Minimum de 2 présences** : constante `JOUEURS_MINIMUM` de `game.js`, pas dans `config.json` (règle du jeu, pas réglage).
5. **Réseau local** : émulateur ouvert sur toutes les adresses de l'ordinateur ; `?base=dev` pour la vraie base de développement.
6. **Pas de clé d'API ni d'application Web** Firebase : seulement l'identifiant du projet et l'adresse de la base.
7. **Nouveaux textes affichés**, absents de `regles.md` : « Connexion impossible. Vérifie ton réseau et réessaie. », « Ce code est déjà pris par une autre partie. Choisis-en un autre. », « La quête a déjà commencé ».
8. **Prénom** : 24 caractères au plus, envoyé seulement au « Je suis là ».
9. **Identité gardée dans l'onglet** : un onglet = une personne.
10. **Après « Commencer la quête »** : écran de choix de carte encore fictif ; le sort des personnes inscrites sans « Je suis là » est laissé à la phase 5.
11. **Mode démonstration** `?demo=1`, gardé d'un écran à l'autre.
12. **SDK Firebase 11.10.0** (et non 13.0.0, qui demande Node 20) ; paquet `firebase` ajouté aux dépendances de développement pour les tests.

## 8. Fichiers modifiés et commits

`git diff --stat main...HEAD` : 29 fichiers, 3 110 lignes ajoutées, 81 retirées.

- Jeu : `public/js/salon.js` (nouveau, logique de la salle), `public/js/ecrans-reseau.js`, `public/js/reseau.js`, `public/js/firebase.js`, `public/js/firebase-config.js` (nouveaux), `public/js/ecrans.js`, `public/js/app.js`, `public/js/textes.js`, `public/js/demo.js`, `public/js/game.js`, `public/js/fictif.js`, `public/css/style.css`.
- Base : `database.rules.json`, `firebase.json`, `.firebaserc` (nouveaux).
- Tests : `tests/emulateur.test.js`, `tests/emulateur-regles.test.js`, `tests/reseau.test.js`, `tests/navigateur-reseau.test.js`, `tests/aide-emulateur.js` (nouveaux), `tests/aide-navigateur.js`, `tests/ecrans-design.test.js`, `tests/navigateur-parcours.test.js`, `scripts/avec-emulateur.js` (nouveau), `scripts/reporter-court.js`.
- Divers : `README.md`, `docs/SUIVI.md`, `package.json`, `package-lock.json`.
- `docs/regles.md` et `docs/cartes-source.md` : non modifiés.

Commits de la phase :

- [324b9d3](https://github.com/IvoryNayeli/romantasy-game/commit/324b9d3) lancement de l'itération 1
- [862b953](https://github.com/IvoryNayeli/romantasy-game/commit/862b953) base Firebase, règles de sécurité, logique de la salle et tests sur l'émulateur
- [cba24f9](https://github.com/IvoryNayeli/romantasy-game/commit/cba24f9) écrans Créer, Rejoindre et salle d'attente en réseau
- [bcc8614](https://github.com/IvoryNayeli/romantasy-game/commit/bcc8614) tests de navigateur de la salle en réseau
- [9226f62](https://github.com/IvoryNayeli/romantasy-game/commit/9226f62) README et décisions à confirmer
- [2abb8a6](https://github.com/IvoryNayeli/romantasy-game/commit/2abb8a6) statut en test
- [64c9ec4](https://github.com/IvoryNayeli/romantasy-game/commit/64c9ec4) tests des règles contournées (défauts D1 à D5)
- [2635a33](https://github.com/IvoryNayeli/romantasy-game/commit/2635a33) règles renforcées, D2 en attente
- [10ba07d](https://github.com/IvoryNayeli/romantasy-game/commit/10ba07d) tests des variantes (défauts D6 à D8)
- [2fe7727](https://github.com/IvoryNayeli/romantasy-game/commit/2fe7727) partie expirée non modifiable, ordre des tours figé
- [3ff1714](https://github.com/IvoryNayeli/romantasy-game/commit/3ff1714) variantes sur partie expirée et commencée, création sur code expiré

## 9. Défauts

Trouvés par le testeur en écrivant directement dans la base de l'émulateur, sans passer par le jeu. Il y a eu deux allers-retours de correction ; la troisième série de variantes (`3ff1714`) n'a trouvé aucun nouveau défaut.

| Id | Description | Statut |
|---|---|---|
| D1 | Deux personnes pouvaient porter le même emblème | corrigé (`2635a33`), variantes vérifiées |
| D2 | L'emblème d'une personne qui n'a pas encore dit « Je suis là » peut être changé par quelqu'un d'autre | **ouvert, non corrigeable sans authentification** ; test marqué « à faire » ; décision 1 de la section 7 |
| D3 | Une personne dont la présence est confirmée pouvait être retirée de la partie | corrigé (`2635a33`), variantes vérifiées |
| D4 | La partie pouvait commencer sans 2 présences | corrigé (`2635a33`), variantes vérifiées |
| D5 | On pouvait rejoindre une partie déjà commencée | corrigé (`2635a33`), variantes vérifiées |
| D6 | L'ordre des tours pouvait être effacé ou modifié après le départ | corrigé (`2fe7727`), variantes vérifiées |
| D7 | Une partie expirée pouvait encore être modifiée | corrigé (`2fe7727`), variantes vérifiées |
| D8 | Une partie expirée pouvait être ranimée en changeant son horodatage | corrigé (`2fe7727`), variantes vérifiées |

Gravité : faible pour un jeu entre amis. Ces écritures demandent de connaître le code d'une partie en cours et d'écrire volontairement dans la base hors du jeu.

## 10. Tes remarques précédentes

Sans objet (itération 1).

## 11. Consommation Firebase

Les tests et le jeu en local n'utilisent que l'émulateur : **aucune consommation** sur les vraies bases. La base `romantasy-dev` n'est sollicitée qu'avec `?base=dev`.

À consulter : console Firebase, projet `romantasy-dev`, Realtime Database, onglet **Usage**. Valeur attendue : quasi nulle (quelques kilo-octets au plus si tu as essayé `?base=dev`), très loin des limites du plan Spark (1 Go stocké, 10 Go téléchargés par mois, 100 connexions simultanées). Pour `romantasy-prod` : zéro, elle n'est jamais utilisée avant la phase 7.

## 12. Comment répondre

- « Phase 4 validée » : fusion dans `main`, tag `phase-4`, push. Les décisions de la section 7 sont alors considérées comme acceptées, sauf celles que tu tranches autrement dans le même message (par exemple D2).
- « Phase 4, remarques : … » : nouvelle itération de la phase.
- « Lance la phase 5 » est refusé tant que la phase 4 n'est pas validée.
