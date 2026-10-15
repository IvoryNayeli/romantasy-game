# Phase 1 : rapport de test (itération 1)

Testeur : agent `romantasy-testeur`. Branche `phase-1`, arbre de travail propre au départ (commit `612b35a`). Node.js v18.19.1.

## Résultat

- `node --test tests/` avant mes ajouts : **14 tests, 14 réussis, 0 échec**.
- `node --test tests/` après ajout de `tests/conformite.test.js` (8 tests) : **22 tests, 22 réussis, 0 échec**.
- Défauts ouverts : **aucun**.
- Verdict : **tout passe**.

## Vérifications indépendantes

| Point | Méthode | Résultat |
|---|---|---|
| Textes des 40 cartes | Script écrit par le testeur : relecture de `docs/cartes-source.md`, comparaison mot pour mot (identifiant, type, texte, durée, effet) avec `cartes.json` | 0 différence. Ordre conforme. Apostrophes droites (34, comme la source), guillemets courbes `“ ”` conservés (2, comme la source). Pas de BOM, pas de CRLF, textes en NFC |
| Répartition | Comptage | 20 Révélations, 20 Épreuves |
| 9 cartes durables | Comparaison avec les lignes 🔁 de la source | `epr-06, 07, 08, 09, 14, 16, 17, 18, 19`, durées et libellés `effet` identiques. Les 31 autres cartes n'ont ni `duree` ni `effet` |
| `config.json` seule source | Recherche de 4, 5, « quatre », « cinq » hors `docs/` | Seules occurrences : `config.json` et le test qui le contrôle. Aucun code de jeu n'existe encore (pas de `public/*.js`) : le contrôle devra être refait dès la phase 2 (voir test ajouté) |
| Emblèmes | Comparaison avec la liste de `docs/PROJET.md` | 10 emblèmes, noms et emojis identiques (`🛡️` = U+1F6E1 U+FE0F, comme dans PROJET.md), identifiants sans accent |
| Codes | Comparaison avec `docs/PROJET.md` | 10 mots identiques, même ordre, majuscules, sans accent |
| Écriture inclusive, vocabulaire | Recherche dans `cartes.json`, `emblemes.json`, `codes.json`, `docs/cartes-a-relire.md`, règles et README | Voir observations O1 à O3 : aucune forme exclusive de joueur(se) |
| `docs/cartes-a-relire.md` | Régénération par `node scripts/generer-cartes-a-relire.js` | Fichier identique octet pour octet, `git status` propre |
| Qualité des tests | Une cinquantaine de mutations appliquées dans une copie du dépôt dans `/tmp` (le dépôt n'a jamais été modifié ; `git status` propre ensuite) | Toutes sont détectées après ajout de mes tests (une seule ne l'était pas avant : D0 ci-dessous) |
| Secrets, fichiers superflus | Recherche de clés, jetons, mots de passe dans les fichiers versionnés ; `git ls-files` | Aucun secret. Aucun fichier superflu : `checks.json` est ignoré, `build/` n'est pas versionné. JSON valide, UTF-8 valide, fin de ligne LF |

## Mutations appliquées (copie temporaire)

Toutes détectées par au moins un test : doublon de texte, identifiant en double, type invalide (avec accent, autre), 39 cartes, 19 épreuves, 8 et 10 cartes durables, durée invalide, durée valide mais différente de la source, effet modifié, effet sans durée, durable sur une Révélation, apostrophe courbe, espace final, ponctuation finale supprimée, cartes permutées, champ en plus, « poche » (texte, effet, majuscule, dans `rev-16`), « sac » (hors `rev-16`, dans `epr-03`), « elle », « celle », « joueuse », « voisine », « chacune », « la première qui », « elle » dans un effet, « elle » ajouté dans `epr-03`, « joueuse » dans `rev-16`, code avec accent / minuscules / doublon / espace, config à 5 tours / 6 joueur(se)s / champ en plus, emblème avec accent / emoji en double / nom modifié / 9 emblèmes, tableau modifié à la main, `cartes.json` modifié sans régénérer le tableau, JSON invalide.

Les exceptions du test du développeur (`rev-16` : « sac », `epr-03` : « elle ») sont bien limitées à ces deux cartes et à ces deux mots. Tout autre mot interdit, y compris dans ces deux cartes, fait échouer les tests. Tout ajout d'un second « elle » ou « sac » dans ces cartes reste invisible aux tests de vocabulaire, mais échoue au test de comparaison avec la source : les exceptions ne masquent donc rien d'autre.

## Tests ajoutés par le testeur : `tests/conformite.test.js`

1. Les 40 cartes (id, type, texte, durée, effet) égales à la source, dans l'ordre.
2. Les 9 cartes durables sont celles marquées 🔁 dans la source, avec la bonne durée.
3. Textes sur une ligne, sans tabulation ni double espace, en NFC.
4. Emblèmes égaux à la liste de `docs/PROJET.md`.
5. Codes égaux à la liste de `docs/PROJET.md`.
6. Données en UTF-8 valide, sans BOM, sans CRLF.
7. Emblèmes et codes sans « poche », « sac » ni forme féminine exclusive.
8. Aucun réglage 4 / 5 écrit en dur dans `public/` et `scripts/` (code futur).

## Défauts

| Id | Gravité | Statut | Description |
|---|---|---|---|
| D0 | faible (lacune de tests, pas du jeu) | vérifié | Le test du développeur ne comparait pas la durée (`duree`) à la source (le motif la captait sans la contrôler), ni les noms et emojis des emblèmes ni les codes à `docs/PROJET.md`. Reproduction : changer `duree` de `epr-06` en `prochain_tour`, ou le nom `Dragon` en `Dragonne` dans une copie : le test du développeur seul passait. Comblé par `tests/conformite.test.js` ; les deux mutations sont maintenant détectées. |

Aucun défaut ouvert sur le contenu livré.

## Observations (non bloquantes)

- **O1** : `rev-16` contient « sac » (« un seul sac »). Écart de forme avec la règle « jamais sac » de `docs/regles.md`, mais texte identique à la source validée. Exception déclarée dans le test. À confirmer par la propriétaire.
- **O2** : `epr-03` contient « elle » (désigne la rose enchantée, pas un(e) joueur(se)). Texte identique à la source. Exception déclarée dans le test.
- **O3** : `rev-07` : « la personne la plus assortie à une licorne » (accord au féminin avec le nom « personne »), `rev-04` et `rev-05` : « il », « lui » désignent un personnage (le héros), `rev-04` « un personnage masculin » et `rev-09` « un homme gentil… un homme problématique » : décisions déjà confirmées dans `docs/SUIVI.md`. Aucun de ces textes ne désigne un(e) joueur(se) par une forme exclusive.
- **O4** : les tests du plan ne couvrent que les formes féminines (« elle », « celle », « la première qui », « voisine », « joueuse »). Une forme masculine exclusive (« celui », « voisin », « le premier qui ») ajoutée à une carte serait détectée uniquement par la comparaison avec la source, pas par le test d'écriture inclusive. Conforme au plan, mentionné par prudence.
- **O5** : `README.md` ne dit pas comment lancer les tests (`node --test tests/`) ni que Node.js est nécessaire. Cette phase ne change pas la façon de lancer le jeu (il n'existe pas encore), donc ce n'est pas un défaut au sens des règles communes. À prévoir dans le rapport (section « Où le voir »).
- **O6** : `docs/cartes-a-relire.md` écrit en dur « 40 cartes » et « 31 cartes immédiates » dans le texte fixe du script (ce sont des décomptes de contenu, pas des réglages). Sans conséquence tant que les cartes sont figées.
- **O7** : le README (description du projet) emploie « vrais sacs » pour désigner les butins physiques : texte de la phase 0 validée, hors textes du jeu.

## Non vérifié

- Rendu visuel, lisibilité et longueur des cartes à l'écran (phase 2).
- Plaisir de jeu, équilibre des cartes, pertinence des libellés `effet` (propositions du chef de projet).
- Comportement sur un vrai téléphone, quotas Firebase : sans objet en phase 1.
- Comportement de `node --test tests/` avec une version récente de Node.js (22 ou plus), où l'argument est interprété comme un motif de fichiers : seul Node 18.19.1 est installé ici. À contrôler quand Node.js sera installé par la propriétaire ; `node --test` sans argument est une alternative.
- Typographie des apostrophes (droites, interprétation « format JSON ») : décision encore à confirmer, signalée dans `docs/SUIVI.md`.
