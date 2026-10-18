# Phase 3 : rapport de simulation du moteur de jeu

> Fichier généré par `node scripts/simulation.js` à partir de simulations réelles du moteur (`public/js/game.js`). Ne pas le modifier à la main.
> Les graines du hasard sont fixes : relancer la commande redonne exactement les mêmes chiffres. `npm run test:rapide` vérifie que ce fichier est à jour.

Réglages lus dans `public/data/config.json` : 4 tours, 5 personnes au maximum.

## En bref

- 640 parties complètes simulées, de 2 à 5 personnes.
- Anomalies relevées : 0.
- Cas limites (actions hors de leur moment) refusés comme prévu : 18 sur 18.

## Ce qui est vérifié à chaque action de chaque partie

- Ordre des tours : ordre d'arrivée, la main passe à la personne suivante puis revient à la première.
- Compteur « Tour N / 4 » : il avance quand tout le monde a joué une fois.
- Chaque carte tirée vient de la pile choisie et n'a jamais été jouée avant ; aucune carte n'est perdue ni dupliquée.
- « Invoquer un bouclier » compte le tour mais ne crée aucun effet ; « Le sort est jeté » sur une carte durable crée son effet pour la personne qui l'a jouée.
- Un effet « jusqu'à son prochain tour » disparaît au début du tour suivant de la personne concernée, pas avant ; un effet « jusqu'à la fin de la partie » ne disparaît qu'à la fin ou après un échange de butins ; après un échange signalé, l'effet a disparu.
- L'état reste un objet simple, identique après un aller-retour en JSON (comme dans Firebase).
- Fin : la partie s'arrête exactement quand chaque personne a joué 4 fois, plus aucun effet ni personne n'a la main, et toute action est ensuite refusée.

Hasard des simulations : bouclier invoqué dans 20 % des tours ; avant chaque tour, si un effet est en cours, un échange de butins est signalé dans 15 % des cas.

## Résultats par taille de groupe

| Personnes | Choix du type | Parties | Cartes jouées | Sorts jetés | Boucliers | Effets créés | Fin au prochain tour | Fin par échange | Fin de partie | Cartes restantes au minimum dans la pile choisie | Taille max de l'état (caractères JSON) | Anomalies |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2 | type choisi au hasard | 100 | 800 | 632 | 168 | 141 | 57 | 32 | 43 | 14 | 1919 | 0 |
| 2 | toujours Épreuve (pire cas) | 30 | 240 | 192 | 48 | 90 | 30 | 20 | 28 | 13 | 1922 | 0 |
| 2 | toujours Révélation (pire cas) | 30 | 240 | 197 | 43 | 0 | 0 | 0 | 0 | 13 | 1660 | 0 |
| 3 | type choisi au hasard | 100 | 1200 | 928 | 272 | 209 | 66 | 66 | 60 | 10 | 2234 | 0 |
| 3 | toujours Épreuve (pire cas) | 30 | 360 | 287 | 73 | 124 | 43 | 34 | 39 | 9 | 2116 | 0 |
| 3 | toujours Révélation (pire cas) | 30 | 360 | 286 | 74 | 0 | 0 | 0 | 0 | 9 | 1857 | 0 |
| 4 | type choisi au hasard | 100 | 1600 | 1299 | 301 | 293 | 79 | 106 | 89 | 8 | 2519 | 0 |
| 4 | toujours Épreuve (pire cas) | 30 | 480 | 384 | 96 | 165 | 45 | 58 | 52 | 5 | 2417 | 0 |
| 4 | toujours Révélation (pire cas) | 30 | 480 | 397 | 83 | 0 | 0 | 0 | 0 | 5 | 2054 | 0 |
| 5 | type choisi au hasard | 100 | 2000 | 1590 | 410 | 366 | 90 | 163 | 89 | 5 | 2611 | 0 |
| 5 | toujours Épreuve (pire cas) | 30 | 600 | 470 | 130 | 217 | 68 | 68 | 65 | 1 | 2712 | 0 |
| 5 | toujours Révélation (pire cas) | 30 | 600 | 471 | 129 | 0 | 0 | 0 | 0 | 1 | 2268 | 0 |

« Cartes restantes au minimum » : le plus petit nombre de cartes qui restait dans la pile au moment d'y tirer. Dans le pire cas (tout le monde choisit toujours le même type), la dernière carte tirée laisse la pile à ce nombre moins une.

## Cas limites

| Action | Refus attendu | Refus obtenu | Conforme |
|---|---|---|---|
| Partie à une seule personne | `pas-assez-de-joueurs` | `pas-assez-de-joueurs` | oui |
| Une personne de plus que le maximum de config.json | `partie-complete` | `partie-complete` | oui |
| Même personne inscrite deux fois | `joueurs-en-double` | `joueurs-en-double` | oui |
| Partie sans fonction de hasard | `hasard-absent` | `hasard-absent` | oui |
| Pile trop petite pour le pire cas (tout le monde choisit le même type) | `pile-insuffisante` | `pile-insuffisante` | oui |
| Tirer une carte hors de son tour | `pas-son-tour` | `pas-son-tour` | oui |
| Tirer une carte pour une personne inconnue | `joueur-inconnu` | `joueur-inconnu` | oui |
| Tirer un type de carte inconnu | `type-inconnu` | `type-inconnu` | oui |
| Tirer une deuxième carte dans le même tour | `carte-deja-tiree` | `carte-deja-tiree` | oui |
| « Le sort est jeté » avant d'avoir tiré une carte | `aucune-carte` | `aucune-carte` | oui |
| « Invoquer un bouclier » avant d'avoir tiré une carte | `aucune-carte` | `aucune-carte` | oui |
| « Le sort est jeté » par quelqu'un d'autre que la personne qui joue | `pas-son-tour` | `pas-son-tour` | oui |
| Signaler un échange pour un effet qui n'existe pas | `effet-inconnu` | `effet-inconnu` | oui |
| Signaler un échange par une personne inconnue | `joueur-inconnu` | `joueur-inconnu` | oui |
| Tirer une carte après la fin | `partie-finie` | `partie-finie` | oui |
| « Le sort est jeté » après la fin | `partie-finie` | `partie-finie` | oui |
| « Invoquer un bouclier » après la fin | `partie-finie` | `partie-finie` | oui |
| Signaler un échange après la fin | `partie-finie` | `partie-finie` | oui |
