# Phase 5, itération 1 : partie jouable en réseau

**État** : prête pour relecture. **Attendu de toi** : jouer une partie à plusieurs onglets ou téléphones, relire les décisions de la section 7, puis répondre (section 12).

## 1. En bref

Une partie se joue maintenant en entier en réseau, de « Commencer la quête » jusqu'à l'écran de fin. Toutes les personnes voient la même carte, le même compteur et les mêmes effets, et seule la personne dont c'est le tour peut agir. La suite complète passe : 204 tests réussis, aucun échec.

## 2. Ce qui a été fait

- **État de la partie dans la base** : au « Commencer la quête », la partie est préparée dans la base (piles mélangées, tour 1, première personne de l'ordre d'arrivée), dans la même écriture que le départ. Chaque action applique le moteur de la phase 3 (`public/js/game.js`), sans réécrire la logique du jeu.
- **Tour synchronisé** : choix du type de carte, carte visible par tout le monde, « Le sort est jeté » ou « Invoquer un bouclier », transition de 2 secondes chez tout le monde, puis tour suivant ou écran de fin. La personne dont c'est le tour voit les cartes et les boutons. Les autres voient « Au tour de… », la même carte sans boutons, et « En attente de… ».
- **Effets en cours** : le panneau est relié à la vraie partie, sur tous les écrans de tour. Sous chaque effet, un bouton « Échange de butins fait » permet de signaler l'échange qui met fin à l'effet (nouveau texte, voir section 7).
- **Une seule personne à la fois** : le moteur refuse toute action d'une personne dont ce n'est pas le tour, et rien n'est écrit. Chaque action fait une seule écriture dans la base. Si deux actions arrivent presque en même temps, une seule passe.
- **Règles de la base** (`database.rules.json`) : elles refusent les écritures directes qui sortent du déroulé normal. On ne peut pas sauter une personne, jouer une autre carte que celle qui a été tirée, effacer les cartes jouées, ni relancer une partie terminée. Leurs limites sont décrites en sections 7 et 9.
- **Restes de la phase 4** :
  - Les personnes inscrites sans « Je suis là » ne jouent pas et voient « La quête a déjà commencé ».
  - « Nouvelle quête » efface la partie terminée.
- **README** : la phrase d'état est passée à la phase 5. La section « Lancer le jeu » a une étape 5 (déroulé des tours, « Nouvelle quête ») et documente l'adresse `?ecran=jeu&code=…`.

## 3. Où le voir, comment le vérifier

| Élément | Comment (fichier, commande ou lien) | Ce que tu dois constater |
|---|---|---|
| Partie complète | Lancer l'émulateur et le serveur comme dans « Lancer le jeu » du `README.md`, ouvrir `http://localhost:8000/` dans 2 ou 3 onglets, créer une partie, la rejoindre, « Je suis là » partout, puis « Commencer la quête » | Les tours s'enchaînent dans l'ordre d'arrivée, 4 tours par personne, jusqu'à l'écran de fin, dans chaque onglet |
| Seule la personne dont c'est le tour agit | Pendant un tour, regarder un autre onglet | « Au tour de… », la carte sans boutons, « En attente de… » |
| Même carte pour tout le monde | Tirer une carte dans l'onglet dont c'est le tour | La même carte apparaît aussitôt dans les autres onglets |
| Effets durables | Jouer une carte Épreuve à effet durable avec « Le sort est jeté » | L'effet apparaît dans « Effets en cours » partout ; « Échange de butins fait » le retire partout |
| Bouclier | « Invoquer un bouclier » | La transition l'annonce chez tout le monde, aucun effet n'est ajouté |
| Personne sans « Je suis là » | Un troisième onglet rejoint sans toucher « Je suis là », puis l'hôte commence | Cet onglet affiche « La quête a déjà commencé » et ne joue pas |
| Fin et « Nouvelle quête » | Aller au bout, toucher « Nouvelle quête » | Retour à l'accueil ; le code redevient libre dans « Créer une partie » |
| README | Ouvrir `README.md`, section « Lancer le jeu » | Phrase d'état « phase 5 », étape 5 sur le déroulé des tours |
| Tests | `npm test` | `204 réussis, 0 échoués, 0 sautés` (plus 1 « à faire », le D2 connu) |

Seule, sur un ordinateur, tu peux tout vérifier avec plusieurs onglets. Pour l'essai sur de vrais téléphones, il faut le même Wi-Fi (section « Sur les téléphones » du README).

## 4. Résultats des tests

`npm test` sur le commit `58d78b0` (lancé par le testeur ; depuis, seuls les documents ont changé) : **204 réussis, 0 échoués, 0 sautés, 1 à faire** (le test D2 de la phase 4, inchangé). `npm run test:rapide`, relancé par le chef de phase sur la branche à jour : 84 réussis, 0 échoués.

Nouveaux tests de la phase :
- **Partie sur l'émulateur** (`tests/emulateur-partie.test.js`) :
  - parties complètes à 3 et à 5 personnes (5 étant le maximum de `config.json`), avec le même état pour chacune et l'ordre des tours respecté ;
  - seule la personne dont c'est le tour peut agir, et chaque action fait une seule écriture ;
  - effets durables et échange signalé par une autre personne ;
  - personnes sans « Je suis là » ;
  - écritures directes refusées par les règles, y compris le test D9 (cartes jouées non effaçables, partie terminée figée).
- **Navigateurs automatisés** (`tests/navigateur-reseau.test.js`) : partie complète à deux navigateurs plus une troisième personne sans « Je suis là ». Le test va jusqu'à l'écran de fin et vérifie que la partie est effacée par « Nouvelle quête ».
- Le reste de la suite (phases 0 à 4) passe toujours, après de petites adaptations listées en section 8.

## 5. Ce qui n'a pas été vérifié

- **Vrais téléphones** : aucun essai, tout a été joué dans des navigateurs automatisés et sur l'émulateur.
- **Aspect visuel** : le développeur a seulement regardé deux captures à 360 px (écran d'attente, écran avec effet). Le contraste du nouveau bouton « Échange de butins fait » n'a pas été mesuré.
- **Partie à 5 dans le navigateur** : le cas à 5 personnes est vérifié sur l'émulateur, pas avec cinq pages ouvertes.
- **Rechargement pendant la transition** : vérifié seulement en lisant le code (la transition n'est pas rejouée, comme prévu).
- **Veille du téléphone, perte de connexion en cours de partie** : non testées, c'est le travail de la phase 6.
- **Vraie base `romantasy-dev`** : non essayée, tout tourne sur l'émulateur.
- **Plaisir de jeu** : à juger par toi.

## 6. Écarts par rapport au plan

- Le test de navigateur de la partie complète est dans `tests/navigateur-reseau.test.js` et non dans un fichier à part. Ce fichier vide la base avant chaque test, et les fichiers de test tournent en parallèle : un fichier séparé entrait en conflit avec lui.
- Sinon, aucun écart.

## 7. Décisions prises par les agents

Également listées dans `docs/SUIVI.md`, section « Décisions à confirmer ».

1. **Nouveau texte « Échange de butins fait »** (absent de `regles.md`) : un bouton sous chaque effet en cours, visible par tout le monde. N'importe quelle personne peut le toucher, à tout moment, comme décidé pour le moteur en phase 3.
2. **Personnes sans « Je suis là » au départ** : elles ne jouent pas et voient l'avis existant « La quête a déjà commencé ».
3. **Suppression de la partie terminée** quand une personne touche « Nouvelle quête ». Les autres restent sur l'écran de fin. Si personne ne la touche, le nettoyage des 3 heures s'applique.
4. **Panneau « Effets en cours » sur tous les écrans de tour**, et non plus seulement chez les autres. Pour ses propres effets, la personne lit « Jusqu'à ton prochain tour ».
5. **Avant le tirage**, les autres voient l'écran d'attente sans carte, puis la carte dès qu'elle est tirée.
6. **Rechargement de la page** en cours de partie : la partie reprend où elle en est, sans rejouer la dernière transition.
7. **Limites des règles de la base**, liées au risque D2 déjà accepté (pas d'authentification). Par écriture directe, hors du jeu et en connaissant le code, une personne peut encore :
   - effacer une carte jouée autre que la première, ou une carte isolée d'une pile ;
   - remettre en jeu une carte déjà jouée : la règle « une carte ne sort qu'une seule fois » est garantie par le jeu, pas par la base.

   Les empêcher demanderait de parcourir des listes, ce que les règles de Firebase ne savent pas faire simplement.

## 8. Fichiers modifiés et commits

`git diff --stat main...HEAD` (avant ce rapport) : 16 fichiers, 1 014 lignes ajoutées, 93 retirées.

- **Jeu** :
  - `public/js/salon.js` (actions de tour) ;
  - `public/js/ecrans.js` (écrans de tour découpés en vues réutilisables, même rendu) ;
  - `public/js/ecrans-reseau.js` ;
  - `public/js/reseau.js` ;
  - `public/js/app.js` ;
  - `public/js/textes.js` ;
  - `public/css/style.css` (style du bouton d'échange seulement).
- **Base** : `database.rules.json` (nœud `jeu`).
- **Documents** : `README.md`, `docs/SUIVI.md`.
- **Tests** :
  - nouveau fichier `tests/emulateur-partie.test.js` ;
  - `tests/navigateur-reseau.test.js` ;
  - `tests/aide-emulateur.js` (charge aussi le moteur) ;
  - `tests/aide-navigateur.js` (coupures locales de l'émulateur ignorées, voir D11) ;
  - `tests/emulateur.test.js` et `tests/reseau.test.js` (adaptés au nouvel état de partie).

Commits sur la branche `phase-5` :
- [`7538a50`](https://github.com/IvoryNayeli/romantasy-game/commit/7538a50) tours de jeu en réseau (état du moteur dans la base, actions par transaction, règles)
- [`2c5c2b5`](https://github.com/IvoryNayeli/romantasy-game/commit/2c5c2b5) bouton d'échange des effets en cours et partie complète dans les tests de navigateur
- [`a27c3fc`](https://github.com/IvoryNayeli/romantasy-game/commit/a27c3fc) README et décisions à confirmer
- [`83f480b`](https://github.com/IvoryNayeli/romantasy-game/commit/83f480b) (testeur) partie à cinq, test D9, coupures locales ignorées
- [`58d78b0`](https://github.com/IvoryNayeli/romantasy-game/commit/58d78b0) règles : cartes jouées non effaçables et partie terminée figée (D9), limites requalifiées
- plus les commits de suivi (lancement, passage en test, ce rapport).

## 9. Défauts

Une boucle de correction entre le développeur et le testeur (1 aller-retour sur les 2 permis).

| Défaut | Gravité | Description | Statut |
|---|---|---|---|
| D9 | mineure | Par écriture directe dans la base, on pouvait effacer les cartes jouées, ou réécrire la dernière carte et les piles après la fin, alors que la protection était annoncée. | **Corrigé** (`58d78b0`), test D9 exécuté et réussi. Il reste la limite décrite en section 7, point 7 : effacer une carte jouée isolée autre que la première, ou une carte isolée d'une pile. |
| D10 | mineure | Par écriture directe, une carte déjà jouée pouvait être remise comme carte tirée (la règle « une carte ne sort qu'une seule fois » n'est pas vérifiée par la base). | **Requalifié** en limite connue liée à D2 (section 7, point 7). |
| D11 | mineure (tests) | Le test « aucune requête externe, aucune erreur de console » échouait environ une fois sur cinq, à cause d'une connexion de l'émulateur coupée à la fermeture d'une page. Ce n'était pas un défaut du jeu. | **Corrigé** par le testeur dans `tests/aide-navigateur.js` (`83f480b`), deux passes complètes vertes. |

Aucun défaut ouvert. Le testeur a aussi relevé un point hors phase : la ligne 3 de `README.md` dit « Les butins, eux, sont de vrais sacs… ». Le mot « sac » est réservé au vocabulaire hors jeu, et ce n'est pas un texte du jeu, donc ce n'est pas compté comme défaut. Tu peux le signaler en remarque si tu veux le changer.

## 10. Tes remarques précédentes

Sans objet (itération 1).

## 11. Consommation Firebase

Inchangée sur les vraies bases : tout tourne sur l'émulateur. Avec `?base=dev`, une partie de 4 tours à 5 personnes fait quelques dizaines de petites écritures, une par action (tirage, choix, échange). Chaque appareil n'écoute que sa partie (`parties/<CODE>`), jamais la base entière.

Pour vérifier : console Firebase, projet `romantasy-dev`, Realtime Database, onglet **Usage**. Valeur attendue : quasi nulle, très loin des limites du plan Spark. Si tu essaies `?base=dev`, il faut d'abord publier les nouvelles règles (`firebase deploy --only database --project dev`, voir le README).

## 12. Comment répondre

- « Phase 5 validée » : fusion dans `main`, tag `phase-5`, push.
- « Phase 5, remarques : … » : nouvelle itération de la phase.
- « Lance la phase 6 » est refusé tant que la phase 5 n'est pas validée.
