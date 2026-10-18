# Suivi du projet

Source de vérité de l'avancement. À lire **en premier** à chaque session. Mis à jour par le chef de phase avant chaque commit.

## Statuts possibles

`à faire` → `en cours` → `en test` → `prête pour relecture` → `validée`. Retour possible de `prête pour relecture` vers `en cours` (itération N+1) après remarques.

| Statut | Qui peut agir |
|---|---|
| `à faire`, `en cours` | Développeur |
| `en test` | Testeur (phases 4 à 7, ou tests de navigateur à adapter) ; sinon chef de phase (suite de tests complète) |
| `prête pour relecture` | Personne : attente de la propriétaire |
| `validée` | Personne : phase suivante possible |

Seul le chef de phase écrit `validée`, uniquement après le message explicite « Phase N validée » de la propriétaire.

## Phases

| Phase | Intitulé | Statut | Itération | Dernier rapport |
|---|---|---|---|---|
| 0 | Fondations | validée le 2026-10-15 | 3 | [phase-0-iteration-3](rapports/phase-0-iteration-3.md) |
| 1 | Contenu | validée le 2026-10-15 | 1 | [phase-1-iteration-1](rapports/phase-1-iteration-1.md) |
| 2 | Écrans et design | validée le 2026-10-18 | 5 | [phase-2-iteration-5](rapports/phase-2-iteration-5.md) |
| 3 | Moteur de jeu | validée le 2026-10-18 | 1 | [phase-3-iteration-1](rapports/phase-3-iteration-1.md) |
| 4 | Multijoueur et salle d'attente | en test | 1 | |
| 5 | Partie jouable en réseau | à faire | 0 | |
| 6 | Robustesse | à faire | 0 | |
| 7 | Finition et mise en ligne | à faire | 0 | |

## Prochaine action

Phase 4 en test (itération 1) : vérification par `romantasy-testeur`.

## Journal

Une ligne par session : date, phase, ce qui a été fait, ce qui reste. Courte : le détail est dans le rapport, qu'on lie. Les lignes des phases validées sont déplacées dans [journal-archive](journal-archive.md) par le chef de phase à la validation.

- 2026-10-18, phase 4 : lancement de l'itération 1 (prérequis vérifiés : Firebase CLI connectée, bases `romantasy-dev` et `romantasy-prod` actives en europe-west1, Java 21).
- 2026-10-18, phase 4 : itération 1 développée (création et jonction par code, emblèmes, « Je suis là », « Commencer la quête » en réseau ; règles de sécurité ; nettoyage par expiration ; tests sur l'émulateur et dans le navigateur ; README). Reste : vérification par le testeur.

## Défauts ouverts

Aucun.

## Décisions à confirmer

Phase 4, itération 1 (choix du développeur) :

- **Codes de partie** : l'écran « Créer » validé en phase 2 (choix du code dans la liste) est gardé ; les codes déjà pris par une partie en cours y sont grisés et inactifs, et un code pris entre-temps est refusé avec un message. `PROJET.md` parle d'un tirage au hasard parmi les codes libres : non appliqué, à trancher.
- **Nettoyage des parties** (sans Cloud Functions) : chaque écriture met à jour un horodatage du serveur (`actif`) ; une partie sans écriture depuis **3 heures** est abandonnée. Elle est supprimée par le premier client qui la croise (ouverture de « Créer », qui lit les 10 codes un par un, ou tentative de la rejoindre), et son code redevient libre (les règles n'autorisent la reprise d'un code que dans ce cas). Les règles n'acceptent que les 10 codes de `codes.json` : 10 parties au plus dans la base. Partie terminée : fonction de suppression prête, à appeler à la fin de partie en phase 5.
- **Minimum de 2 présences** : reste une constante, pas dans `config.json` (règle du jeu de `regles.md`, pas un réglage). Source unique : `JOUEURS_MINIMUM` de `game.js`, reprise par la salle fictive et la salle en réseau (la copie `PRETS_MINIMUM` de `fictif.js` est supprimée).
- **Jouer sur le réseau local** : l'émulateur écoute sur toutes les adresses de l'ordinateur (`firebase.json`) ; une page ouverte depuis l'ordinateur ou une adresse privée (192.168…, 10…, 172.16 à 31…, `.local`) utilise l'émulateur de la même machine (port 9000). `?base=dev` force `romantasy-dev`. Une page servie ailleurs utilise `romantasy-dev` jusqu'à la phase 7 ; `romantasy-prod` n'est encore jamais choisie.
- **Pas de clé d'API ni d'application Web** : la page n'initialise Firebase qu'avec l'identifiant du projet et l'adresse de la base, ce qui suffit à la Realtime Database seule (vérifié sur l'émulateur, pas sur la vraie base).
- **Pas d'authentification** : sans Firebase Auth (qui demanderait d'enregistrer une application Web), les règles vérifient la forme, la taille et les invariants (places, emblème unique, rang, présence définitive, code en cours non réattribuable), mais ne peuvent pas empêcher une personne malveillante qui connaît un code de modifier ou supprimer cette partie. À décider : ajouter l'authentification anonyme (phase 6 ?) ou accepter ce risque pour un jeu entre amis.
- **Nouveaux textes affichés** (absents de `regles.md`) : « Connexion impossible. Vérifie ton réseau et réessaie. » (réseau ou base indisponible), « Ce code est déjà pris par une autre partie. Choisis-en un autre. » (écran « Créer »), « La quête a déjà commencé » (salle, à la place de « La partie est complète » quand la partie a commencé).
- **Prénom** : 24 caractères au plus (champ et règles) ; envoyé seulement au « Je suis là » (avant, les autres voient « … » et l'emblème choisi).
- **Identité** : gardée dans l'onglet (`sessionStorage`) ; un onglet = une personne, ce qui permet d'essayer à plusieurs sur un ordinateur. La reconnexion de la phase 6 pourra la garder plus durablement.
- **Après « Commencer la quête »** : la base passe la partie au statut « partie » et tout le monde est envoyé sur l'écran de choix de carte, encore fictif (le tour en réseau est la phase 5, qui décidera aussi du sort des personnes inscrites sans « Je suis là »).
- **Mode démonstration** : `?demo=1` (ajouté à tous les liens de `demo.html` et gardé d'un écran à l'autre) ou une salle ouverte avec ses paramètres fictifs (`hote`, `autres`, `complete`…) gardent les écrans de la phase 2 sans base. Les tests de navigateur des phases précédentes s'ouvrent désormais en démonstration.
- **SDK Firebase 11.10.0** (et non la dernière, 13.0.0) : les versions 12 et 13 demandent Node 20, alors que l'ordinateur a Node 18 ; même version pour le CDN et pour le paquet `firebase` des tests (nouvelle dépendance de développement, nécessaire pour tester la logique réelle contre l'émulateur).

## Risques reportés

- Phase 7 : `demo.html` et le paramètre `?ecran=` (outils de validation de la phase 2) à retirer ou masquer ; icônes SVG faites pour le projet (épée, étoile, bouclier) à remplacer ou garder selon le choix des icônes game-icons.net.
- Phase 7 : l'image de banque de données (avec crédit de licence) ne concerne que les emojis des emblèmes ; le logo est l'image de la propriétaire (itération 4 de la phase 2), déjà en place.
- Essai à blanc de la chaîne : réussi le 2026-10-15 au démarrage de la phase 1 (développeur et testeur appelés, fichier d'essai créé puis supprimé). Remarque : le testeur a écrit hors de `tests/` et `docs/rapports/` parce que la demande l'y invitait explicitement ; ses garde-fous n'ont pas été éprouvés au-delà.

## Décisions confirmées

- Apostrophes : apostrophe droite (`'`) conservée dans le JSON, confirmé le 2026-10-15.
- Carte `rev-16` (« un seul sac ») : gardée telle quelle, avec son exception dans les tests, confirmé le 2026-10-15.
- Carte `epr-03` (« Comme elle, murmure… », « elle » = la rose) : confirmée, avec son exception dans les tests, le 2026-10-15.

- Cartes Révélation 4 (« un personnage masculin ») et 9 (« un homme gentil… un homme problématique ») : laissées telles quelles (2026-10-15).
- Formulations inclusives des 40 cartes et des règles, et libellés `effet` des 9 cartes durables de [cartes-source.md](cartes-source.md) : confirmés (2026-10-15).
- `checks.json` (fichier d'éditeur) : ignoré via `.gitignore` (2026-10-15).
- Phrase sur les effets durables (« Certaines cartes Épreuve produisent un effet qui dure. Il prend fin dès qu'il a provoqué un échange de butins. ») : validée le 2026-10-15.
- Phrase « Terminez les échanges en cours avant d'ouvrir vos butins » : refusée le 2026-10-15, ne pas l'ajouter.
- Projet inclusif : validé le 2026-10-15 (convention dans [PROJET.md](PROJET.md)).
- « meneur de jeu » (et non « meneur(se) ») dans la description du README : demandé par la propriétaire le 2026-10-15. Exception volontaire à la convention inclusive, ne pas la « corriger ».
- Choix de la phase 2 (libellés d'interface dont « Je suis là », « C'est bon », « La compagnie » ; écriture inclusive allégée et ses 9 cartes reformulées ; accueil sans titre et onglet « Romantasy » ; écarts à la charte : formes pleines du bouclier et du sort jeté, étoiles dans les marges, constellations, polices hébergées, types de carte à la place des raretés, texte à 20 px, filigranes ambre ; code de la salle petit et discret ; « C'est bon » définitif) : validés avec la phase le 2026-10-18. Détail dans les rapports [phase-2-iteration-1](rapports/phase-2-iteration-1.md) à [phase-2-iteration-5](rapports/phase-2-iteration-5.md). `regles.md` garde « améthyste » (Révélation) et « affiché en grand » (code) : non modifiés, l'interface suit la charte et les remarques.
- Choix du moteur de la phase 3 (effet rattaché à la personne qui a joué la carte, même pour le groupe ; « prochain tour » fini au début de son tour suivant, ou à la fin s'il est obtenu au dernier tour ; effets effacés à l'écran de fin ; échange de butins signalé par n'importe qui, à tout moment avant la fin ; ordre d'arrivée ; partie refusée si une pile est insuffisante ; minimum de 2 en constante) : validés avec la phase le 2026-10-18. Détail en section 7 de [phase-3-iteration-1](rapports/phase-3-iteration-1.md).
