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
| 4 | Multijoueur et salle d'attente | validée le 2026-10-19 | 2 | [phase-4-iteration-2](rapports/phase-4-iteration-2.md) |
| 5 | Partie jouable en réseau | validée le 2026-10-19 | 1 | [phase-5-iteration-1](rapports/phase-5-iteration-1.md) |
| 6 | Robustesse | en test | 1 | |
| 7 | Finition et mise en ligne | à faire | 0 | |

## Prochaine action

Phase 6, itération 1 : développement terminé, vérification par le testeur en cours.

## Journal

Une ligne par session : date, phase, ce qui a été fait, ce qui reste. Courte : le détail est dans le rapport, qu'on lie. Les lignes des phases validées sont déplacées dans [journal-archive](journal-archive.md) par le chef de phase à la validation.

- 2026-10-19, phase 6 : lancement de l'itération 1 (branche `phase-6`).

## Défauts ouverts

Aucun.

## Décisions à confirmer

Aucune.

## Risques reportés

- Phase 7 : `demo.html` et le paramètre `?ecran=` (outils de validation de la phase 2) à retirer ou masquer ; icônes SVG faites pour le projet (épée, étoile, bouclier) à remplacer ou garder selon le choix des icônes game-icons.net.
- Phase 7 : l'image de banque de données (avec crédit de licence) ne concerne que les emojis des emblèmes ; le logo est l'image de la propriétaire (itération 4 de la phase 2), déjà en place.
- Phase 6 : sans authentification, une personne qui connaît un code peut modifier ou supprimer la partie par écriture directe (défaut D2 de la phase 4, risque accepté à la validation ; test marqué « à faire » dans `tests/emulateur-regles.test.js`). L'authentification anonyme reste possible si la propriétaire le demande.
- Phase 6 : l'expiration est jugée avec l'horloge du téléphone côté page et celle du serveur dans les règles ; un téléphone très en avance (plus de 30 minutes) pourrait supprimer une salle encore active (relevé par le testeur, itération 2 de la phase 4).
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
- Choix de la phase 4 (codes choisis dans la liste et non tirés au hasard ; nettoyage sans Cloud Functions, 30 minutes pour une salle d'attente et 3 heures pour une partie démarrée ; minimum de 2 en constante ; émulateur sur le réseau local et `?base=dev` ; pas de clé d'API ; pas d'authentification, risque D2 accepté ; nouveaux textes « Connexion impossible. Vérifie ton réseau et réessaie. », « Ce code est déjà pris par une autre partie. Choisis-en un autre. », « La quête a déjà commencé » ; prénom de 24 caractères envoyé au « Je suis là » ; identité gardée dans l'onglet ; écran de choix fictif après le départ ; `?demo=1` ; SDK Firebase 11.10.0) : validés avec la phase le 2026-10-19. Détail en section 7 de [phase-4-iteration-1](rapports/phase-4-iteration-1.md) et [phase-4-iteration-2](rapports/phase-4-iteration-2.md).
- Choix de la phase 5 (nouveau texte « Échange de butins fait », touchable par n'importe qui à tout moment ; personnes sans « Je suis là » au départ exclues, avec « La quête a déjà commencé » ; partie terminée supprimée à « Nouvelle quête », sinon nettoyage des 3 heures ; panneau « Effets en cours » sur tous les écrans de tour, « Jusqu'à ton prochain tour » pour ses propres effets ; attente sans carte avant le tirage ; reprise après rechargement sans rejouer la transition ; règles de la base vérifiant l'enchaînement des tours, avec les limites D9 et D10 liées au risque D2) : validés avec la phase le 2026-10-19. Détail en section 7 de [phase-5-iteration-1](rapports/phase-5-iteration-1.md).
