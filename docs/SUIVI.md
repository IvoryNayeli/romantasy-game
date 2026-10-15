# Suivi du projet

Source de vérité de l'avancement. À lire **en premier** à chaque session. Mis à jour par le chef de phase avant chaque commit.

## Statuts possibles

`à faire` → `en cours` → `en test` → `prête pour relecture` → `validée`. Retour possible de `prête pour relecture` vers `en cours` (itération N+1) après remarques.

| Statut | Qui peut agir |
|---|---|
| `à faire`, `en cours` | Développeur |
| `en test` | Testeur |
| `prête pour relecture` | Personne : attente de la propriétaire |
| `validée` | Personne : phase suivante possible |

Seul le chef de phase écrit `validée`, uniquement après le message explicite « Phase N validée » de la propriétaire.

## Phases

| Phase | Intitulé | Statut | Itération | Dernier rapport |
|---|---|---|---|---|
| 0 | Fondations | validée le 2026-10-15 | 3 | [phase-0-iteration-3](rapports/phase-0-iteration-3.md) |
| 1 | Contenu | à faire | 0 | |
| 2 | Écrans et design | à faire | 0 | |
| 3 | Moteur de jeu | à faire | 0 | |
| 4 | Multijoueur et salle d'attente | à faire | 0 | |
| 5 | Partie jouable en réseau | à faire | 0 | |
| 6 | Robustesse | à faire | 0 | |
| 7 | Finition et mise en ligne | à faire | 0 | |

## Prochaine action

Phase 1 (contenu), à lancer dans une nouvelle session avec `romantasy-chef-de-phase` : « Lance la phase 1 ». Prérequis : **Node.js** installé sur la machine (`sudo apt install nodejs`). Le chef de phase doit d'abord poser les deux questions ouvertes de la section « Décisions à confirmer » (cartes Révélation 4 et 9, apostrophes), car elles conditionnent la conversion des cartes en JSON. Il doit aussi lancer l'essai à blanc de la chaîne (voir « Risques reportés »).

## Journal

Une ligne par session : date, phase, ce qui a été fait, ce qui reste.

- 2026-10-15 | phase 0 | Dépôt créé et lié à GitHub, documents de référence, instructions communes, trois agents `romantasy-*`, modèle de rapport. Reste : relecture et validation, essai à blanc de la chaîne dans une nouvelle session.
- 2026-10-15 | phase 0, itération 2 | Remarques de la propriétaire traitées : écriture inclusive (règles, 40 cartes, documents, instructions), README (section « Lancer le jeu », section agents clarifiée, « s'en défaire » retirée), « au fil de la partie », phrase des effets durables validée, phrase de fin refusée. Rapport : [phase-0-iteration-2](rapports/phase-0-iteration-2.md). Reste : relecture et validation, essai à blanc de la chaîne.
- 2026-10-15 | phase 0, itération 3 | Trois remarques du README traitées : « multijoueur sur téléphone », « meneur de jeu », liste des documents déplacée dans la section sur les agents Copilot. Même description alignée dans les instructions communes. `checks.json` supprimé. Rapport : [phase-0-iteration-3](rapports/phase-0-iteration-3.md). Reste : relecture et validation, essai à blanc de la chaîne.
- 2026-10-15 | phase 0 validée | Validation explicite de la propriétaire (« Phase 0 validée »). Fusion de `phase-0` dans `main`, tag `phase-0`. Aucune remarque en attente à la validation. Reste : phase 1.

## Défauts ouverts

Aucun.

## Décisions à confirmer

Points non tranchés à la validation de la phase 0, à poser en début de phase 1 :

- Formulations inclusives des 40 cartes et des règles (itération 2 de la phase 0) : adaptées à partir des textes validés, à confirmer ([cartes-source.md](cartes-source.md)).
- Carte Révélation 9 (« un homme gentil… un homme problématique ») et carte Révélation 4 (« un personnage masculin ») : laissées telles quelles, à trancher si le caractère inclusif doit aussi couvrir ces personnages.
- Libellés `effet` des 9 cartes durables : propositions du chef de projet ([cartes-source.md](cartes-source.md)).
- Typographie des apostrophes : les documents utilisent l'apostrophe droite (`'`). À conserver, ou à passer en apostrophe courbe (`’`) lors de la conversion en JSON en phase 1.

## Risques reportés

- **Les agents n'ont jamais tourné.** La phase 0 a été validée sans l'essai à blanc de la chaîne (« Teste la chaîne »), que la propriétaire n'a pas indiqué avoir fait. Le fonctionnement de `romantasy-chef-de-phase` et des deux sous-agents n'est donc pas vérifié : affichage dans le sélecteur, appel des sous-agents, respect des garde-fous. Si la phase 1 ne démarre pas comme prévu, c'est la première piste à examiner. Le chef de phase doit proposer cet essai avant de lancer le développeur.

## Décisions confirmées

- Phrase sur les effets durables (« Certaines cartes Épreuve produisent un effet qui dure. Il prend fin dès qu'il a provoqué un échange de butins. ») : validée le 2026-10-15.
- Phrase « Terminez les échanges en cours avant d'ouvrir vos butins » : refusée le 2026-10-15, ne pas l'ajouter.
- Projet inclusif : validé le 2026-10-15 (convention dans [PROJET.md](PROJET.md)).
- « meneur de jeu » (et non « meneur(se) ») dans la description du README : demandé par la propriétaire le 2026-10-15. Exception volontaire à la convention inclusive, ne pas la « corriger ».
