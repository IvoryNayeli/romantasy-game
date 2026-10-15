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
| 0 | Fondations | prête pour relecture | 2 | [phase-0-iteration-2](rapports/phase-0-iteration-2.md) |
| 1 | Contenu | à faire | 0 | |
| 2 | Écrans et design | à faire | 0 | |
| 3 | Moteur de jeu | à faire | 0 | |
| 4 | Multijoueur et salle d'attente | à faire | 0 | |
| 5 | Partie jouable en réseau | à faire | 0 | |
| 6 | Robustesse | à faire | 0 | |
| 7 | Finition et mise en ligne | à faire | 0 | |

## Prochaine action

Phase 0 : relecture de [rapports/phase-0-iteration-2.md](rapports/phase-0-iteration-2.md) par la propriétaire (remarques de l'itération 1 traitées), puis « Phase 0 validée » ou « Phase 0, remarques : … ». L'essai à blanc de la chaîne (« Teste la chaîne », nouvelle session) reste à faire.

## Journal

Une ligne par session : date, phase, ce qui a été fait, ce qui reste.

- 2026-10-15 | phase 0 | Dépôt créé et lié à GitHub, documents de référence, instructions communes, trois agents `romantasy-*`, modèle de rapport. Reste : relecture et validation, essai à blanc de la chaîne dans une nouvelle session.
- 2026-10-15 | phase 0, itération 2 | Remarques de la propriétaire traitées : écriture inclusive (règles, 40 cartes, documents, instructions), README (section « Lancer le jeu », section agents clarifiée, « s'en défaire » retirée), « au fil de la partie », phrase des effets durables validée, phrase de fin refusée. Rapport : [phase-0-iteration-2](rapports/phase-0-iteration-2.md). Reste : relecture et validation, essai à blanc de la chaîne.

## Défauts ouverts

Aucun.

## Décisions à confirmer

- Formulations inclusives des 40 cartes et des règles (itération 2 de la phase 0) : adaptées à partir des textes validés, à confirmer ([cartes-source.md](cartes-source.md)).
- Carte Révélation 9 (« un homme gentil… un homme problématique ») et carte Révélation 4 (« un personnage masculin ») : laissées telles quelles, à trancher si le caractère inclusif doit aussi couvrir ces personnages.
- Libellés `effet` des 9 cartes durables : propositions du chef de projet ([cartes-source.md](cartes-source.md)).
- Typographie des apostrophes : les documents utilisent l'apostrophe droite (`'`). À conserver, ou à passer en apostrophe courbe (`’`) lors de la conversion en JSON en phase 1.

## Décisions confirmées

- Phrase sur les effets durables (« Certaines cartes Épreuve produisent un effet qui dure. Il prend fin dès qu'il a provoqué un échange de butins. ») : validée le 2026-10-15.
- Phrase « Terminez les échanges en cours avant d'ouvrir vos butins » : refusée le 2026-10-15, ne pas l'ajouter.
- Projet inclusif : validé le 2026-10-15 (convention dans [PROJET.md](PROJET.md)).
