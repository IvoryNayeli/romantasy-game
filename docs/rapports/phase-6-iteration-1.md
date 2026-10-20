# Phase 6, itération 1 : robustesse

**État** : prête pour relecture. **Attendu de toi** : essayer une coupure et un rechargement à plusieurs onglets ou téléphones, relire les décisions de la section 7 (surtout le libellé « hors ligne » et les nouveaux textes), puis répondre (section 12).

## 1. En bref

Quand la connexion d'un téléphone se perd, la personne reste dans la partie, affichée « hors ligne », et le téléphone retrouve la partie tout seul au retour du réseau ou après un rechargement de la page. Si c'est son tour, les autres peuvent le passer au bout de 10 secondes. L'écran reste allumé quand le navigateur le permet. La suite complète passe : 216 tests réussis, aucun échec.

## 2. Ce qui a été fait

- **Présence** : chaque téléphone signale sa connexion dans la partie (`parties/<CODE>/presents`). Le serveur Firebase retire ce signal tout seul quand la connexion se coupe. Une entrée par connexion : en passant du Wi-Fi à la 4G, la coupure tardive de l'ancienne connexion n'efface pas la nouvelle. La présence est suivie sans interruption de la salle d'attente à la partie, et s'arrête à l'écran de fin.
- **Personne hors ligne** : dans la salle, une étiquette « hors ligne » (couleur braise) à côté du prénom ; jamais sur sa propre ligne. La personne n'est pas retirée de la partie.
- **Reconnexion** : le SDK Firebase se reconnecte de lui-même ; l'écoute de la partie et la présence reprennent. Un rechargement en pleine partie (au choix de la carte ou carte tirée) ramène au même endroit.
- **Passer le tour d'une personne hors ligne** : sur l'écran d'attente, les autres lisent « [prénom] est hors ligne. », puis, après le délai, un bouton « Passer son tour ». Tout le monde voit ensuite la transition « Le tour de [prénom] est passé. », avec l'apparence du bouclier. Le tour compte comme joué ; une carte déjà tirée est consumée, sans effet durable. On ne peut pas passer son propre tour, ni deux tours d'un coup (`passerTour` dans `public/js/game.js`).
- **Délai** : `"delaiAbsenceSecondes": 10` dans `public/data/config.json`, seul endroit où il est écrit.
- **Écran allumé** : nouveau fichier `public/js/wakelock.js`. Demandé dans la salle et la partie, redemandé quand la page revient au premier plan, relâché à l'écran de fin. Aucun message si le navigateur ne le permet pas.
- **Règles de la base** (`database.rules.json`) : un tour passé n'est accepté que si la personne dont c'est le tour n'a plus aucune connexion. Les signaux de présence sont limités aux personnes de la partie. Les protections de la phase 5 sont inchangées (leurs tests passent sans modification).
- **Risque reporté de l'horloge** : l'expiration des parties est maintenant jugée à l'heure du serveur, estimée par le SDK (`.info/serverTimeOffset`), et non plus à l'horloge du téléphone. Un téléphone en avance de 40 minutes ne supprime plus une salle active (test dédié).
- **Démonstration** : nouvelles variantes `absent=1` et `passe=1` dans `demo.html` (salle avec une personne hors ligne, attente avec « Passer son tour », transition de tour passé).
- **Documents** : `docs/PROJET.md` (mise en œuvre de la phase 6, marquée « à confirmer ») et `README.md` (phrase d'état, Wake Lock indisponible en `http://` sur le réseau local, nouveaux paramètres de démonstration, nouveau réglage). La façon de lancer le jeu ne change pas.

## 3. Où le voir, comment le vérifier

| Élément | Comment (fichier, commande ou lien) | Ce que tu dois constater |
|---|---|---|
| Coupure dans la salle | Lancer l'émulateur et le serveur comme dans « Lancer le jeu » du `README.md`, ouvrir `http://localhost:8000/` dans 2 onglets, créer puis rejoindre une partie. Dans l'onglet invité : outils de développement (F12), onglet Réseau, « Hors connexion » | Après quelques secondes (jusqu'à environ une minute pour une perte de réseau), l'autre onglet affiche « hors ligne » à côté du prénom ; en remettant le réseau, l'étiquette disparaît |
| Fermeture d'onglet | Même salle, fermer l'onglet invité | « hors ligne » apparaît presque aussitôt chez l'hôte |
| Rechargement en pleine partie | Commencer la quête, tirer une carte, recharger la page (F5) dans cet onglet | Retour sur la même carte, sans rejouer la transition |
| Passer le tour | En partie, mettre hors connexion l'onglet dont c'est le tour | Chez les autres : « [prénom] est hors ligne. », puis « Passer son tour » après 10 secondes ; en le touchant, transition « Le tour de [prénom] est passé. » partout, puis tour suivant |
| Retour après absence | Remettre le réseau dans l'onglet coupé | Il retrouve la partie où elle en est, et joue normalement quand son tour revient |
| Écrans sans base | `demo.html`, groupes « Salle d'attente » et « Tour de jeu » | « Une personne hors ligne », « Attente, personne hors ligne, tour à passer », « Transition : tour passé » |
| Écran allumé | Seulement en `https://` (phase 7). Sur le réseau local (`http://`), le téléphone peut se mettre en veille : c'est attendu et écrit dans le README | Rien à constater pour l'instant |
| Réglage | Ouvrir `public/data/config.json` | `delaiAbsenceSecondes` à 10 |
| README | Ouvrir `README.md`, section « Lancer le jeu » | Phrase d'état complétée pour la phase 6, paragraphe sur le Wake Lock en `http://` ; les commandes de lancement sont inchangées |
| Tests | `npm test` | `216 réussis, 0 échoués, 0 sautés` (plus 1 « à faire », le D2 connu) |

Seule, sur un ordinateur, tu peux tout vérifier avec plusieurs onglets. La vraie mise en veille d'un téléphone et le passage Wi-Fi vers 4G demandent de vrais téléphones sur le même Wi-Fi (section « Sur les téléphones » du README).

## 4. Résultats des tests

`npm test` sur le commit `98c51e4` (lancé par le testeur, qui est aussi le commit testé ; depuis, seuls les documents ont changé) : **216 réussis, 0 échoués, 0 sautés, 1 à faire** (le test D2 de la phase 4, inchangé). `npm run test:rapide`, relancé par le chef de phase sur la branche à jour : 85 réussis, 0 échoués.

Nouveaux tests de la phase :
- **Robustesse sur l'émulateur** (nouveau fichier `tests/emulateur-robustesse.test.js`, 7 tests) :
  - présence retirée à la coupure et rétablie au retour du réseau ;
  - deux connexions de la même personne (changement de réseau) ;
  - présence refusée pour une personne étrangère à la partie, rien de recréé après suppression ;
  - absence prolongée : tours passés par une autre personne jusqu'à la fin ;
  - carte tirée puis coupure : carte consumée sans effet durable, personne revenue qui retrouve la partie ;
  - écritures directes : passer le tour d'une personne présente refusé, sans connexion accepté, autres enchaînements toujours refusés ;
  - horloge en avance de 40 minutes : salle active ni vue libre, ni supprimée.
- **Moteur** (`tests/moteur.test.js`) : passage de tour (refus de son propre tour, refus d'une autre cible que le tour courant).
- **Navigateurs automatisés** (`tests/navigateur-reseau.test.js`) : coupure dans la salle et en partie, rechargement au choix et sur la carte, tour passé, absence prolongée jusqu'à la fin ; Wake Lock simulé, absent et refusé.
- Le testeur a relancé plusieurs fois les tests sensibles pour juger leur stabilité : suite complète 2 fois verte après sa correction, fichiers émulateur et navigateur 2 fois verts chacun (voir D12 et D13).

## 5. Ce qui n'a pas été vérifié

- **Vrais téléphones** : aucun essai. La mise en veille et le passage Wi-Fi vers 4G ont seulement été simulés (coupure de l'émulateur, mode hors connexion du navigateur).
- **Wake Lock réel** : le navigateur automatisé ne l'accorde pas ; le test utilise une imitation de l'API. Il ne marche pas en `http://` sur le réseau local : à vérifier en phase 7, une fois en `https://`.
- **Délai réel de détection d'une perte de réseau** : le serveur repère une fermeture d'onglet tout de suite, mais une perte de réseau peut lui prendre jusqu'à environ une minute (comportement de Firebase, non mesuré ici).
- **Aspect visuel** des nouveaux éléments (étiquette « hors ligne », bouton « Passer son tour ») : non mesuré ; à regarder dans `demo.html`.
- **Vraie base `romantasy-dev`** : non essayée, tout tourne sur l'émulateur.
- **Échec isolé « aucune erreur de console »** vu une fois par le développeur : non reproduit depuis, cause exacte non établie (D13).
- **Plaisir de jeu** : à juger par toi.

## 6. Écarts par rapport au plan

Aucun écart. Le libellé « absente » prévu par `PROJET.md` est devenu « hors ligne », comme le plan le laissait à choisir.

## 7. Décisions prises par les agents

Également listées dans `docs/SUIVI.md`, section « Décisions à confirmer ».

1. **Libellé « hors ligne »** pour une personne sans connexion : neutre, sans accord.
2. **Nouveaux textes** (absents de `regles.md`, dans `public/js/textes.js`) : « [prénom] est hors ligne. », « Passer son tour », « Le tour de [prénom] est passé. ».
3. **Délai de 10 secondes** avant « Passer son tour », compté sur chaque téléphone à partir du moment où il voit l'absence.
4. **Tour passé compté comme un bouclier** : la carte éventuellement tirée est consumée, sans effet durable ; même apparence de transition que le bouclier ; pas de confirmation avant de passer.
5. **Identité toujours gardée dans l'onglet** (choix de la phase 4) : elle suffit pour une coupure réseau et un rechargement. En revanche, une personne qui **ferme son onglet** ne peut plus revenir dans une partie commencée, et ses tours devront être passés. La garder sur le téléphone réglerait ce cas, mais deux onglets d'un même ordinateur seraient alors la même personne (gênant pour les essais).
6. **Écran allumé aussi dans la salle d'attente**, pas seulement pendant la partie.
7. **Étiquette « hors ligne » jamais affichée sur sa propre ligne.** Une personne qui arrive peut apparaître « hors ligne » une fraction de seconde chez les autres, le temps que sa présence soit écrite.
8. **Expiration à l'heure du serveur** (risque reporté de la phase 4) : traité, sans changer les durées validées (30 minutes, 3 heures).

## 8. Fichiers modifiés et commits

`git diff --stat main...HEAD` (avant ce rapport) : 22 fichiers, 894 lignes ajoutées, 65 retirées.

- **Jeu** :
  - `public/js/game.js` (passage de tour) ;
  - `public/js/salon.js`, `public/js/firebase.js`, `public/js/reseau.js` (présence, action de passage, heure du serveur) ;
  - `public/js/ecrans.js`, `public/js/ecrans-reseau.js` (étiquette, message et bouton, transition) ;
  - `public/js/textes.js` (nouveaux textes) ;
  - `public/js/wakelock.js` (nouveau) ;
  - `public/js/demo.js` (variantes de démonstration) ;
  - `public/css/style.css` ;
  - `public/data/config.json` (`delaiAbsenceSecondes`).
- **Base** : `database.rules.json` (tour passé, nœud `presents`).
- **Documents** : `README.md`, `docs/PROJET.md`, `docs/SUIVI.md`.
- **Tests** : nouveau `tests/emulateur-robustesse.test.js` ; `tests/moteur.test.js`, `tests/navigateur-reseau.test.js`, `tests/reseau.test.js` (écritures de présence autorisées hors transaction), `tests/contenu.test.js` (nouvelle clé de `config.json`), `tests/aide-emulateur.js`, `tests/aide-navigateur.js`.

Commits sur la branche `phase-6` :
- [`f0f941d`](https://github.com/IvoryNayeli/romantasy-game/commit/f0f941d) moteur, passage du tour d'une personne absente
- [`d538e12`](https://github.com/IvoryNayeli/romantasy-game/commit/d538e12) présence, personne hors ligne, tour passé, écran allumé, horloge du serveur ; tests de robustesse
- [`46aa1b1`](https://github.com/IvoryNayeli/romantasy-game/commit/46aa1b1) présence gardée sans interruption entre la salle et la partie
- [`dbb840e`](https://github.com/IvoryNayeli/romantasy-game/commit/dbb840e) test de la présence continue au départ de la quête
- [`98c51e4`](https://github.com/IvoryNayeli/romantasy-game/commit/98c51e4) (testeur) tests de robustesse stabilisés
- plus les commits de suivi (lancement, passage en test, ce rapport).

## 9. Défauts

Aucun aller-retour de correction nécessaire : le testeur n'a trouvé aucun défaut dans le code du jeu.

| Défaut | Gravité | Description | Statut |
|---|---|---|---|
| D12 | moyenne (tests) | Le test « carte tirée puis coupure » échouait 2 fois sur 3 dans la suite complète : il agissait pour une personne avant que sa page ait reçu le coup précédent. Dans le jeu, une telle action est simplement refusée et l'écran se met à jour, sans dégât. | **Corrigé** par le testeur (`98c51e4`), deux suites complètes vertes ensuite. |
| D13 | mineure (tests) | Le filtre des erreurs de coupure réseau (`ERR_INTERNET_DISCONNECTED`) du test de coupure s'appliquait aussi aux messages des tests précédents. | **Corrigé** par le testeur (`98c51e4`) : limité à ce test. L'échec isolé « aucune erreur de console » vu une fois par le développeur n'a pas été reproduit. |
| D2 | risque accepté (phase 4) | Sans authentification, une personne qui connaît le code peut écrire directement dans la partie. Nouveauté de la phase : on peut aussi, de la même façon, faire paraître une personne présente (et empêcher « Passer son tour ») ou absente, ou ajouter des signaux de présence. Les règles vérifient la forme, pas l'auteur ; le délai de 10 secondes n'est appliqué que dans la page. | Ouvert, inchangé (test « à faire » dans `tests/emulateur-regles.test.js`). |

## 10. Tes remarques précédentes

Sans objet (itération 1).

## 11. Consommation Firebase

Inchangée sur les vraies bases : tout tourne sur l'émulateur. Avec `?base=dev`, la présence ajoute une petite écriture à chaque connexion ou reconnexion de chaque téléphone, et le serveur en efface une à chaque coupure ; c'est négligeable. Chaque téléphone ouvert compte pour une connexion simultanée (100 au maximum sur le plan Spark), comme avant. Les écoutes restent sur `parties/<CODE>` et les informations de connexion (`.info`), jamais sur la base entière.

Pour vérifier : console Firebase, projet `romantasy-dev`, Realtime Database, onglet **Usage**. Valeur attendue : quasi nulle, très loin des limites du plan Spark. Si tu essaies `?base=dev`, il faut d'abord publier les nouvelles règles (`firebase deploy --only database --project dev`, voir le README).

## 12. Comment répondre

- « Phase 6 validée » : fusion dans `main`, tag `phase-6`, push.
- « Phase 6, remarques : … » : nouvelle itération de la phase.
- « Lance la phase 7 » est refusé tant que la phase 6 n'est pas validée.
