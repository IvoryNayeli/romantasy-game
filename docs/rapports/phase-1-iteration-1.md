# Phase 1, itération 1 : contenu

**État** : prête pour relecture. **Attendu de toi** : relire le tableau des cartes, répondre aux questions de la section 7, puis écrire « Phase 1 validée » ou « Phase 1, remarques : … ».

## 1. En bref
Les 40 cartes, les 10 emblèmes, les 10 codes de salle et les réglages (4 tours, 5 joueur(se)s maximum) sont en place sous forme de fichiers de données. Un tableau lisible des cartes est généré pour ta relecture. 22 tests automatiques passent.

## 2. Ce qui a été fait
- `public/data/cartes.json` : 40 cartes (20 Révélations, 20 Épreuves), textes repris mot pour mot de `docs/cartes-source.md`. Les 9 cartes à effet durable portent une durée et un libellé d'effet.
- `public/data/emblemes.json` : 10 emblèmes (nom, emoji, identifiant sans accent).
- `public/data/codes.json` : 10 mots de code, en majuscules et sans accent.
- `public/data/config.json` : `{"tours": 4, "joueursMax": 5}`. Ces deux réglages ne sont écrits qu'ici.
- `docs/cartes-a-relire.md` : tableau des cartes, généré par `scripts/generer-cartes-a-relire.js`.
- Tests dans `tests/` (Node.js, sans dépendance à installer).
- `.gitignore` : `checks.json` (fichier d'éditeur) est ignoré, à ta demande.
- Avant la phase : essai à blanc de la chaîne d'agents réussi.

## 3. Où le voir, comment le vérifier
| Élément | Comment (fichier, commande ou lien) | Ce que tu dois constater |
|---|---|---|
| Relecture des cartes | Ouvrir `docs/cartes-a-relire.md` | 20 Révélations et 20 Épreuves, textes conformes à ceux que tu as validés |
| Cartes à effet durable | Même fichier, cartes `epr-06`, `07`, `08`, `09`, `14`, `16`, `17`, `18`, `19` | Chacune a une durée (`prochain_tour` ou `fin_partie`) et un libellé d'effet |
| Données | Ouvrir `public/data/cartes.json`, `emblemes.json`, `codes.json`, `config.json` | 40 cartes, 10 emblèmes, 10 codes, 4 tours et 5 joueur(se)s |
| Tests | Dans un terminal, à la racine du dépôt : `node --test tests/` | `# pass 22`, `# fail 0` |
| Tableau à jour | `node scripts/generer-cartes-a-relire.js` puis `git status` | Aucun fichier modifié (le tableau était déjà à jour) |
| `.gitignore` | Ouvrir `.gitignore` | Ligne `checks.json` en bas du fichier |

Tout se vérifie seule, sans téléphone : il n'y a pas encore d'écran (phase 2).

## 4. Résultats des tests
Relancés par moi à la fin de la boucle, sur la branche `phase-1` :

```
# tests 22
# pass 22
# fail 0
```

- Tests du développeur (14), fichier `tests/contenu.test.js` : format des cartes, identifiants uniques, types et durées valides, au moins 20 cartes par type, aucun doublon de texte, « butin » seul terme (pas de « poche »), codes sans accent, 9 cartes durables, écriture inclusive, textes identiques à la source, validité de `config.json` et `emblemes.json`, tableau à jour.
- Tests ajoutés par le testeur (8), fichier `tests/conformite.test.js` : durées et libellés d'effet comparés à la source, noms et emojis des emblèmes et mots des codes comparés à `docs/PROJET.md`.
- Le testeur a aussi vérifié que les tests échouent bien quand on abîme les données (une cinquantaine de modifications d'essai, faites dans une copie hors du dépôt).

Rapport détaillé du testeur : [phase-1-test.md](phase-1-test.md).

## 5. Ce qui n'a pas été vérifié
- L'affichage des textes à l'écran et le plaisir de jeu (phase 2 et suivantes).
- La pertinence des libellés d'effet des cartes durables : confirmés par toi, mais jamais vus dans l'interface.
- `node --test tests/` avec Node 22 ou plus : seul Node 18.19.1 est installé ici. Avec une version plus récente, la commande `node --test` sans argument est l'alternative.
- Le test d'écriture inclusive ne détecte que des formes féminines précises (elle, celle, joueuse, voisine, chacune, « la première qui »). Les formes masculines exclusives (« celui », « voisin », « le premier qui ») ne sont repérées que par la comparaison avec la source.
- Les réglages 4 et 5 ne sont écrits en dur nulle part pour l'instant, mais il n'existe pas encore de code de jeu : le contrôle est à refaire dès la phase 2.

## 6. Écarts par rapport au plan
Aucun écart. Deux tests ont été ajoutés en plus de ceux du plan (conformité à la source, validité des données).

## 7. Décisions prises par les agents
À contester si besoin :
1. **Apostrophes** : tu as répondu « format JSON ». J'ai compris : apostrophe droite (`'`), valide telle quelle en JSON, donc aucune conversion. **À confirmer** : si tu voulais l'apostrophe courbe (`’`), dis-le en remarque.
2. **Carte `rev-16`** contient « un seul sac », alors que la règle dit de ne jamais écrire « sac » dans les textes du jeu. Le texte est celui que tu as validé, il n'a pas été modifié ; le test l'accepte pour cette seule carte. **Garder ou reformuler ?**
3. **Carte `epr-03`** contient « Comme elle, murmure… » : « elle » désigne la rose, pas un(e) joueur(se). Le test l'accepte pour cette seule carte. À confirmer.
4. Structure des données (non précisée dans les règles) : cartes `{id, type, texte}` avec `duree` et `effet` en plus pour les 9 durables ; identifiants `rev-01` à `rev-20` et `epr-01` à `epr-20` ; emblèmes `{id, nom, emoji}` (identifiants sans accent, par exemple `sorciere`, `loup-garou`) ; codes sous forme de simple tableau de mots. Noms, emojis et mots viennent de `docs/PROJET.md`.
5. Pas de `package.json` : les tests utilisent le module de test intégré à Node.js.

Observations du testeur, sans conséquence pour l'instant :
- Le README ne dit pas comment lancer les tests ni que Node.js est nécessaire (la section « Lancer le jeu » n'est pas concernée : le lancement du jeu n'a pas changé).
- Le script du tableau écrit en dur « 40 cartes » et « 31 immédiates » dans son texte fixe.
- Le README emploie « vrais sacs » pour les butins physiques : texte de la phase 0 validée, hors textes du jeu.

## 8. Fichiers modifiés et commits
`git diff --stat main...HEAD` :

```
 .gitignore                         |   3 +
 docs/SUIVI.md                      |  18 +--
 docs/cartes-a-relire.md            |  69 ++++++++++++
 docs/rapports/phase-1-test.md      |  68 ++++++++++++
 public/data/cartes.json            | 220 +++++++++++++++++++++++++++++++++++++
 public/data/codes.json             |  12 ++
 public/data/config.json            |   4 +
 public/data/emblemes.json          |  12 ++
 scripts/generer-cartes-a-relire.js |  85 ++++++++++++++
 tests/conformite.test.js           | 119 ++++++++++++++++++++
 tests/contenu.test.js              | 209 +++++++++++++++++++++++++++++++++++
```

Commits de la branche `phase-1` (`git log --oneline main..HEAD`, avant le commit de ce rapport) :
- `cd2f335` démarrage, décisions consignées, `checks.json` ignoré
- `65a687a` cartes.json, emblèmes, codes et config
- `524c898` script de génération et tableau cartes-a-relire.md
- `4ad9ce8` tests du contenu
- `612b35a` suivi, statut en test
- `1ce42dc` tests de conformité (testeur)
- `01d5bc9` rapport de test

## 9. Défauts
- **D0** (faible, corrigé) : les tests du développeur ne comparaient pas la durée des cartes durables, ni les noms et emojis des emblèmes, ni les codes à la source. Comblé par `tests/conformite.test.js`.
- Défauts encore ouverts : aucun.

## 10. Tes remarques précédentes
Sans objet : première itération de la phase 1. Les décisions que tu as données au lancement (cartes Révélation 4 et 9 inchangées, formulations inclusives et libellés d'effet confirmés, `checks.json` ignoré) sont appliquées ; l'apostrophe est à confirmer (section 7, point 1).

## 11. Consommation Firebase
Sans objet : aucune connexion réseau dans cette phase.

## 12. Comment répondre
- « Phase 1 validée » : fusion dans `main`, tag `phase-1`, push.
- « Phase 1, remarques : … » : nouvelle itération de la phase.
- « Lance la phase 2 » est refusé tant que la phase 1 n'est pas validée.
