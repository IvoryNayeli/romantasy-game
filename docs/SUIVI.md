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
| 1 | Contenu | prête pour relecture | 1 | [phase-1-iteration-1](rapports/phase-1-iteration-1.md) |
| 2 | Écrans et design | à faire | 0 | |
| 3 | Moteur de jeu | à faire | 0 | |
| 4 | Multijoueur et salle d'attente | à faire | 0 | |
| 5 | Partie jouable en réseau | à faire | 0 | |
| 6 | Robustesse | à faire | 0 | |
| 7 | Finition et mise en ligne | à faire | 0 | |

## Prochaine action

Phase 1 (contenu) prête pour relecture (branche `phase-1`, itération 1). Attente de la propriétaire : « Phase 1 validée » ou « Phase 1, remarques : … ». Questions du rapport (section 7) : apostrophes, « sac » dans `rev-16`, « elle » dans `epr-03`.

## Journal

Une ligne par session : date, phase, ce qui a été fait, ce qui reste.

- 2026-10-15 | phase 0 | Dépôt créé et lié à GitHub, documents de référence, instructions communes, trois agents `romantasy-*`, modèle de rapport. Reste : relecture et validation, essai à blanc de la chaîne dans une nouvelle session.
- 2026-10-15 | phase 0, itération 2 | Remarques de la propriétaire traitées : écriture inclusive (règles, 40 cartes, documents, instructions), README (section « Lancer le jeu », section agents clarifiée, « s'en défaire » retirée), « au fil de la partie », phrase des effets durables validée, phrase de fin refusée. Rapport : [phase-0-iteration-2](rapports/phase-0-iteration-2.md). Reste : relecture et validation, essai à blanc de la chaîne.
- 2026-10-15 | phase 0, itération 3 | Trois remarques du README traitées : « multijoueur sur téléphone », « meneur de jeu », liste des documents déplacée dans la section sur les agents Copilot. Même description alignée dans les instructions communes. `checks.json` supprimé. Rapport : [phase-0-iteration-3](rapports/phase-0-iteration-3.md). Reste : relecture et validation, essai à blanc de la chaîne.
- 2026-10-15 | phase 0 validée | Validation explicite de la propriétaire (« Phase 0 validée »). Fusion de `phase-0` dans `main`, tag `phase-0`. Aucune remarque en attente à la validation. Reste : phase 1.
- 2026-10-15 | phase 1, démarrage | Essai à blanc de la chaîne réussi (développeur et testeur appelés, chacun a écrit sa ligne). Décisions de la propriétaire consignées. `checks.json` ajouté au `.gitignore`. Branche `phase-1` créée. Reste : contenu, tests, rapport.
- 2026-10-15 | phase 1, itération 1 | Développement : `cartes.json` (40 cartes), `emblemes.json`, `codes.json`, `config.json`, script `scripts/generer-cartes-a-relire.js` et `docs/cartes-a-relire.md`, 14 tests dans `tests/` (`node --test tests/`), tous verts. Reste : test, rapport.
- 2026-10-15 | phase 1, rapport | Test indépendant : verdict `tout passe`, 8 tests de conformité ajoutés par le testeur (22 tests, tous verts, relancés par le chef de phase). Aucun défaut ouvert. Rapport : [phase-1-iteration-1](rapports/phase-1-iteration-1.md), rapport du testeur : [phase-1-test](rapports/phase-1-test.md). Reste : relecture et validation.

## Défauts ouverts

Aucun.

## Décisions à confirmer

- Typographie des apostrophes : la propriétaire a répondu « format JSON ». Interprétation retenue : apostrophe droite (`'`), valide telle quelle dans le JSON, donc aucune conversion. À confirmer à la relecture du rapport de la phase 1.
- Carte `rev-16` (« un seul sac ») : le mot « sac » est interdit dans les textes du jeu, mais le texte validé est conservé, avec exception dans les tests. À garder ou reformuler.
- Carte `epr-03` (« Comme elle, murmure… ») : « elle » désigne la rose, exception dans les tests. À confirmer.

## Risques reportés

- Essai à blanc de la chaîne : réussi le 2026-10-15 au démarrage de la phase 1 (développeur et testeur appelés, fichier d'essai créé puis supprimé). Remarque : le testeur a écrit hors de `tests/` et `docs/rapports/` parce que la demande l'y invitait explicitement ; ses garde-fous n'ont pas été éprouvés au-delà.

## Décisions confirmées

- Cartes Révélation 4 (« un personnage masculin ») et 9 (« un homme gentil… un homme problématique ») : laissées telles quelles (2026-10-15).
- Formulations inclusives des 40 cartes et des règles, et libellés `effet` des 9 cartes durables de [cartes-source.md](cartes-source.md) : confirmés (2026-10-15).
- `checks.json` (fichier d'éditeur) : ignoré via `.gitignore` (2026-10-15).
- Phrase sur les effets durables (« Certaines cartes Épreuve produisent un effet qui dure. Il prend fin dès qu'il a provoqué un échange de butins. ») : validée le 2026-10-15.
- Phrase « Terminez les échanges en cours avant d'ouvrir vos butins » : refusée le 2026-10-15, ne pas l'ajouter.
- Projet inclusif : validé le 2026-10-15 (convention dans [PROJET.md](PROJET.md)).
- « meneur de jeu » (et non « meneur(se) ») dans la description du README : demandé par la propriétaire le 2026-10-15. Exception volontaire à la convention inclusive, ne pas la « corriger ».
