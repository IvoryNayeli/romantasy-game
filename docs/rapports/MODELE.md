# Phase N, itération M : <intitulé>

> Rapport rédigé pour la propriétaire du projet, en français courant, sans jargon. Fichier : `docs/rapports/phase-N-iteration-M.md`. Ne jamais écraser un rapport précédent.
> Les faits (fichiers modifiés, résultats des tests) sont tirés de `git diff --stat` et de l'exécution réelle des tests, jamais de la mémoire. Aucune formule vague (« tout fonctionne ») : chaque affirmation renvoie à un test, un fichier ou une action de vérification.

**État** : <prête pour relecture | en cours | bloquée>. **Attendu de toi** : <ce que la propriétaire doit faire>.

## 1. En bref
Trois lignes maximum.

## 2. Ce qui a été fait
Liste par fonctionnalité, en français courant.

## 3. Où le voir, comment le vérifier
| Élément | Comment (fichier, commande ou lien) | Ce que tu dois constater |
|---|---|---|
| | | |

Indiquer ce que la propriétaire peut vérifier seule et ce qui demande plusieurs téléphones.

## 4. Résultats des tests
Nombre de tests réussis et échoués (ligne de résumé de `npm test`), tests listés par thème. Pas de fichier séparé du testeur : ses constats sont en section 9.

## 5. Ce qui n'a pas été vérifié
Obligatoire. Ce que les tests ne couvrent pas (aspect visuel, plaisir de jeu, vrai téléphone). Si rien : « rien de notable ».

## 6. Écarts par rapport au plan
Tout ce qui a été fait autrement que prévu, avec la raison. Sinon : « aucun écart ».

## 7. Décisions prises par les agents
Tout choix non prévu dans les règles ou dans `docs/PROJET.md`, pour que la propriétaire puisse le contester. Sinon : « aucune ».

## 8. Fichiers modifiés et commits
Liste issue de `git diff --stat`, et commits de la phase (liens GitHub).

## 9. Défauts
Corrigés pendant la boucle (identifiant, description) et encore ouverts. S'il y a eu un testeur, ses défauts sont ici (identifiant, gravité, reproduction, attendu et obtenu, statut).

## 10. Tes remarques précédentes (à partir de l'itération 2)
| Remarque | Traitement (faite, refusée avec explication, à discuter) | Où le vérifier |
|---|---|---|
| | | |

## 11. Consommation Firebase (phases réseau)
Relevé à consulter dans la console (onglet Usage), valeur attendue.

## 12. Comment répondre
- « Phase N validée » : fusion dans `main`, tag `phase-N`, push.
- « Phase N, remarques : … » : nouvelle itération de la phase.
- « Lance la phase N+1 » est refusé tant que la phase N n'est pas validée.
