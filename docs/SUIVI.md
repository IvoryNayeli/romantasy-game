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
| 0 | Fondations | prête pour relecture | 1 | [phase-0-iteration-1](rapports/phase-0-iteration-1.md) |
| 1 | Contenu | à faire | 0 | |
| 2 | Écrans et design | à faire | 0 | |
| 3 | Moteur de jeu | à faire | 0 | |
| 4 | Multijoueur et salle d'attente | à faire | 0 | |
| 5 | Partie jouable en réseau | à faire | 0 | |
| 6 | Robustesse | à faire | 0 | |
| 7 | Finition et mise en ligne | à faire | 0 | |

## Prochaine action

Phase 0 : relecture de [rapports/phase-0-iteration-1.md](rapports/phase-0-iteration-1.md) par la propriétaire, puis « Phase 0 validée » ou « Phase 0, remarques : … ».

## Journal

Une ligne par session : date, phase, ce qui a été fait, ce qui reste.

- 2026-10-15 | phase 0 | Dépôt créé et lié à GitHub, documents de référence, instructions communes, trois agents `romantasy-*`, modèle de rapport. Reste : relecture et validation, essai à blanc de la chaîne dans une nouvelle session.

## Défauts ouverts

Aucun.

## Décisions à confirmer

- Phrase sur les effets durables (« Il prend fin dès qu'il a provoqué un échange de butins ») : proposée, non confirmée ([regles.md](regles.md)).
- Phrase de fin « Terminez les échanges en cours avant d'ouvrir vos butins » : proposée, non confirmée.
- Libellés `effet` des 9 cartes durables : propositions du chef de projet ([cartes-source.md](cartes-source.md)).
