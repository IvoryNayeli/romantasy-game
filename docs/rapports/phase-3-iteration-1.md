# Phase 3, itération 1 : moteur de jeu (logique pure)

**État** : prête pour relecture. **Attendu de toi** : lire les décisions de la section 7 (surtout la 1 et la 4), puis valider la phase ou donner des remarques.

## 1. En bref
Le moteur du jeu existe : il connaît l'ordre des tours, le compteur, la pioche sans répétition, le bouclier, les effets durables et la fin de partie. Il n'a ni réseau ni interface : rien ne change à l'écran. 640 parties simulées de 2 à 5 personnes, aucune anomalie ; la suite complète passe (137 tests réussis, 0 échec).

## 2. Ce qui a été fait
- **Moteur** (`public/js/game.js`) : création d'une partie de 2 à 5 personnes (maximum lu dans `config.json`), dans l'ordre d'arrivée. Les deux piles (Épreuve, Révélation) sont mélangées une seule fois au début. À son tour, chaque personne choisit un type et reçoit la carte du dessus de cette pile ; une carte tirée ne ressort jamais.
- **Fin du tour** : « Le sort est jeté » ou « Invoquer un bouclier » consomme le tour. Avec le bouclier, l'effet durable de la carte n'est pas créé.
- **Compteur** « Tour N / 4 » : il avance quand tout le monde a joué une fois. La partie s'arrête exactement quand chaque personne a joué 4 fois (valeur lue dans `config.json`).
- **Effets durables** : plusieurs effets peuvent se cumuler sur une même personne. « Jusqu'à son prochain tour » prend fin au début du tour suivant de la personne ; « jusqu'à la fin de la partie » dure jusqu'à l'écran de fin. Tout effet disparaît dès qu'un échange de butins provoqué par lui est signalé.
- **Refus** : toute action faite hors de son moment est refusée avec un motif précis (jouer hors de son tour, tirer deux cartes, jouer après la fin…).
- **État de la partie** : un objet simple, prêt à être rangé dans Firebase en phase 4-5, de moins de 3 000 caractères dans le pire cas mesuré.
- **Simulations et rapport** : `scripts/simulation.js` joue des parties complètes, vérifie les règles à chaque action et écrit le [rapport de simulation](phase-3-simulation.md).
- **README** : seule la partie sur les tests est mise à jour. « Lancer le jeu » ne change pas : la phase ne modifie pas la façon d'ouvrir le jeu.

## 3. Où le voir, comment le vérifier
Tout se vérifie seule, sur l'ordinateur, sans téléphone.

| Élément | Comment (fichier, commande ou lien) | Ce que tu dois constater |
|---|---|---|
| Rapport de simulation | Ouvrir [phase-3-simulation.md](phase-3-simulation.md) | 640 parties, « Anomalies relevées : 0 », 18 cas limites sur 18 refusés comme prévu |
| Pire cas (tout le monde choisit le même type) | Même fichier, lignes « toujours Épreuve » et « toujours Révélation » à 5 personnes | « Cartes restantes au minimum » vaut 1 : la pile de 20 suffit tout juste, sans répétition |
| Simulations reproductibles | `node scripts/simulation.js`, puis `git status` | Le fichier du rapport est réécrit à l'identique : `git status` ne montre aucun changement |
| Tests rapides | `npm run test:rapide` | Environ 6 secondes, « 73 réussis, 0 échoués » |
| Suite complète | `npm test` | « 137 réussis, 0 échoués, 0 sautés » (5 à 7 minutes) |
| Le jeu n'a pas changé | Ouvrir le jeu comme d'habitude (README, « Lancer le jeu ») | Les mêmes écrans qu'à la fin de la phase 2 |
| Section « Lancer le jeu » | README, section « Lancer le jeu » | Inchangée : `git diff main...phase-3 -- README.md` ne touche que la partie sur les tests |

## 4. Résultats des tests
Suite complète lancée par le chef de phase sur le commit `28c6918` : **137 réussis, 0 échoués, 0 sautés**.

- Moteur (`tests/moteur.test.js`, 16 tests nouveaux) : module pur (sans affichage, réseau, Firebase ni hasard caché) ; création de partie ; hasard reproductible ; état jamais modifié en place ; réglages lus dans `config.json` ; ordre des tours, compteur et arrêt au bon moment ; sort jeté et bouclier ; effets « prochain tour », « fin de partie », « prochain tour » obtenu au dernier tour ; effets cumulés et fin par échange ; état relu sans listes vides (comme Firebase) ; cas limites ; simulations de 2 à 5 personnes avec le pire cas ; taille de l'état bornée ; rapport de simulation à jour.
- Tests des phases précédentes (données, cartes, écrans, charte, navigateur) : 121, tous réussis.
- Le développeur a aussi glissé cinq erreurs volontaires dans le moteur, une à la fois (carte qui ressort, effet qui ne finit jamais, effet jamais créé, bouclier qui crée l'effet, fin décalée) : chacune fait échouer de 3 à 7 tests. Il a ensuite remis le fichier d'origine, ce que confirment les 137 tests réussis.

Pas de testeur appelé : ce n'est pas obligatoire en phase 3, et aucun test de navigateur n'était à adapter.

## 5. Ce qui n'a pas été vérifié
- Le moteur n'est branché sur aucun écran ni sur Firebase. Le cas de deux téléphones qui écrivent en même temps relève des phases 4 et 5.
- Une personne absente, et la possibilité de passer son tour, relèvent de la phase 6.
- Le moteur n'a tourné qu'avec Node 18, pas dans un navigateur. Il utilise `structuredClone`, présent dans les navigateurs récents ; il faudra le confirmer sur téléphone en phase 5.
- Le plaisir de jeu et le rythme réel d'une partie ne se vérifient qu'en jouant.

## 6. Écarts par rapport au plan
Aucun écart. Un ajout : `scripts/simulation.js`, qui produit le rapport de simulation demandé par le plan et dont les tests réutilisent les fonctions.

## 7. Décisions prises par les agents
Ces choix ne sont écrits ni dans `regles.md` ni dans `PROJET.md`. Le développeur a pris à chaque fois le plus simple ; tu peux contester chacun.

1. **Un effet durable appartient à la personne qui a joué la carte**, même quand il concerne tout le groupe. Exemple : `epr-07` « Mot interdit annoncé » s'affichera au nom de la personne qui a choisi le mot.
2. **« Jusqu'à son prochain tour »** prend fin au début du tour suivant de la personne, avant qu'elle choisisse sa carte. Si elle l'obtient à son dernier tour, l'effet dure jusqu'à la fin de la partie.
3. Les effets « jusqu'à la fin de la partie » sont effacés à l'écran de fin.
4. **N'importe quelle personne** peut signaler qu'un effet a provoqué un échange de butins, à tout moment avant la fin, même hors de son tour. L'interface de ce signalement (bouton, emplacement, libellé) n'existe pas encore : elle sera à choisir en phase 5.
5. Ordre des tours : l'ordre d'arrivée dans la salle. À la fin, le compteur reste sur « Tour 4 / 4 ».
6. Une partie est refusée si une pile ne peut pas fournir « nombre de personnes × tours » cartes. Avec les données actuelles (20 par pile, 5 × 4), cela n'arrive jamais.
7. Le minimum de 2 personnes est une constante du moteur, absente de `config.json`, comme dans `fictif.js`. Le risque est déjà noté dans `SUIVI.md`.

## 8. Fichiers modifiés et commits
D'après `git diff --stat main...phase-3`, avant ce rapport :

```
 README.md                           |   6 +-
 docs/SUIVI.md                       |   6 +-
 docs/rapports/phase-3-simulation.md |  66 +++++++++
 package.json                        |   2 +-
 public/js/game.js                   | 240 +++++++++++++++++++++++++++++++
 scripts/simulation.js               | 276 ++++++++++++++++++++++++++++++++++++
 tests/moteur.test.js                | 242 +++++++++++++++++++++++++++++++
 7 files changed, 833 insertions(+), 5 deletions(-)
```

Commits :
- [bea7bd9](https://github.com/IvoryNayeli/romantasy-game/commit/bea7bd966a2f2485cbedbb4a0d3fc5aba34368c4) phase 3 : lancement de l'itération 1
- [e2b8d6c](https://github.com/IvoryNayeli/romantasy-game/commit/e2b8d6c2f22672bb192d90461958b32283dc6281) phase 3 : moteur de jeu en logique pure, simulations et rapport de simulation
- [28c6918](https://github.com/IvoryNayeli/romantasy-game/commit/28c6918eaf1200a7a10f6a7782190070a0d43f0a) phase 3 : README, tests du moteur et rapport de simulation
- puis le commit de ce rapport.

## 9. Défauts
Aucun défaut relevé pendant la boucle. Aucun défaut ouvert.

## 10. Tes remarques précédentes (à partir de l'itération 2)
Sans objet (itération 1).

## 11. Consommation Firebase (phases réseau)
Sans objet : la phase 3 n'utilise pas le réseau.

## 12. Comment répondre
- « Phase 3 validée » : fusion dans `main`, tag `phase-3`, push.
- « Phase 3, remarques : … » : nouvelle itération de la phase (par exemple pour changer une décision de la section 7).
- « Lance la phase 4 » est refusé tant que la phase 3 n'est pas validée.
