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
| 1 | Contenu | validée le 2026-10-15 | 1 | [phase-1-iteration-1](rapports/phase-1-iteration-1.md) |
| 2 | Écrans et design | en test | 2 | |
| 3 | Moteur de jeu | à faire | 0 | |
| 4 | Multijoueur et salle d'attente | à faire | 0 | |
| 5 | Partie jouable en réseau | à faire | 0 | |
| 6 | Robustesse | à faire | 0 | |
| 7 | Finition et mise en ligne | à faire | 0 | |

## Prochaine action

Phase 2 (écrans et design), itération 2, en test : le testeur met à jour `tests/navigateur.test.js` (sélecteurs, textes en capitales, nouveaux écrans `creer` et `rejoindre`, polices Jost, retrait de l'option d'animations, couleurs de la charte), refait un passage complet et écrit son rapport. Ensuite le chef de phase rédige le rapport de l'itération 2 pour la propriétaire. Phase 3 refusée tant que la phase 2 n'est pas validée.

## Journal

Une ligne par session : date, phase, ce qui a été fait, ce qui reste.

- 2026-10-15 | phase 0 | Dépôt créé et lié à GitHub, documents de référence, instructions communes, trois agents `romantasy-*`, modèle de rapport. Reste : relecture et validation, essai à blanc de la chaîne dans une nouvelle session.
- 2026-10-15 | phase 0, itération 2 | Remarques de la propriétaire traitées : écriture inclusive (règles, 40 cartes, documents, instructions), README (section « Lancer le jeu », section agents clarifiée, « s'en défaire » retirée), « au fil de la partie », phrase des effets durables validée, phrase de fin refusée. Rapport : [phase-0-iteration-2](rapports/phase-0-iteration-2.md). Reste : relecture et validation, essai à blanc de la chaîne.
- 2026-10-15 | phase 0, itération 3 | Trois remarques du README traitées : « multijoueur sur téléphone », « meneur de jeu », liste des documents déplacée dans la section sur les agents Copilot. Même description alignée dans les instructions communes. `checks.json` supprimé. Rapport : [phase-0-iteration-3](rapports/phase-0-iteration-3.md). Reste : relecture et validation, essai à blanc de la chaîne.
- 2026-10-15 | phase 0 validée | Validation explicite de la propriétaire (« Phase 0 validée »). Fusion de `phase-0` dans `main`, tag `phase-0`. Aucune remarque en attente à la validation. Reste : phase 1.
- 2026-10-15 | phase 1, démarrage | Essai à blanc de la chaîne réussi (développeur et testeur appelés, chacun a écrit sa ligne). Décisions de la propriétaire consignées. `checks.json` ajouté au `.gitignore`. Branche `phase-1` créée. Reste : contenu, tests, rapport.
- 2026-10-15 | phase 1, itération 1 | Développement : `cartes.json` (40 cartes), `emblemes.json`, `codes.json`, `config.json`, script `scripts/generer-cartes-a-relire.js` et `docs/cartes-a-relire.md`, 14 tests dans `tests/` (`node --test tests/`), tous verts. Reste : test, rapport.
- 2026-10-15 | phase 1, rapport | Test indépendant : verdict `tout passe`, 8 tests de conformité ajoutés par le testeur (22 tests, tous verts, relancés par le chef de phase). Aucun défaut ouvert. Rapport : [phase-1-iteration-1](rapports/phase-1-iteration-1.md), rapport du testeur : [phase-1-test](rapports/phase-1-test.md). Reste : relecture et validation.
- 2026-10-15 | phase 1 validée | Validation explicite de la propriétaire (« Phase 1 validée »), avec ses réponses aux trois questions du rapport. Fusion de `phase-1` dans `main`, tag `phase-1`. Reste : phase 2.

- 2026-10-15 | phase 2, démarrage | Branche `phase-2` créée depuis `main` (phase 1 validée, 22 tests verts). Statut `en cours`, itération 1. Reste : développement, test, rapport.
- 2026-10-15 | phase 2, itération 1 | Développement : polices Cinzel et Cormorant Garamond hébergées (woff2, OFL), `index.html`, `css/style.css`, `js/` (app, écrans, textes, données fictives, réglage des animations), huit écrans (accueil, règles, salle d'attente, choix, carte révélée, attente, transition de 2 secondes, fin), page `demo.html` (liens vers chaque écran et les 40 cartes), README mis à jour, 23 tests ajoutés dont le contrôle des réglages en dur (45 tests, tous verts). Reste : test indépendant, rapport.
- 2026-10-15 | phase 2, correctifs du rapport du testeur | D1 (bandeau « Effets en cours » à 20 px), D2 (dos « Révélation » : centre du dégradé éclairci moins fort, contraste minimal relevé 4,73:1, palette inchangée), D3 (« prêt(e) à commencer » dans `demo.html`), D4 (README : `npm install`, Chrome, environ 5 minutes). 72 tests sur 72 verts, tests de navigateur compris. Statut `en test`. Reste : nouveau passage du testeur, rapport.

- 2026-10-15 | phase 2, rapport | Test indépendant en deux passages : 4 défauts mineurs au premier (D1 à D4), tous corrigés ; deuxième passage `tout passe`, 72 tests sur 72 (relancés par le chef de phase). Aucun défaut ouvert. Rapport : [phase-2-iteration-1](rapports/phase-2-iteration-1.md), rapport du testeur : [phase-2-test](rapports/phase-2-test.md). Reste : relecture et validation.

- 2026-10-16 | phase 2, remarques | Quatre remarques de la propriétaire consignées dans [phase-2](remarques/phase-2.md) (retrait de « Réduire les animations », parcours « Créer » et « Rejoindre », nouvelle charte graphique copiée dans [charte-graphique](charte-graphique.md)). Statut `en cours (itération 2)`. Reste : développement, test complet, rapport.
- 2026-10-16 | phase 2, itération 2 | Développement : (1) option « Réduire les animations » supprimée (bouton, `reglages.js`, localStorage, textes, README), règle système `prefers-reduced-motion` conservée ; (2) « Créer une partie » : écran de choix du code dans la liste de `codes.json` ; (3) « Rejoindre une partie » : écran de saisie du code (insensible à la casse et aux accents, message d'erreur), `js/codes.js` ; salle d'attente réordonnée (code discret, menu emblème + prénom, liste des participant(e)s) ; `demo.html`, `?ecran=creer|rejoindre`, README mis à jour ; (4) charte graphique appliquée à tout le projet : variables CSS de la charte telles quelles, Cormorant Garamond et Jost hébergées (Cinzel retirée), cartes 2:3 en `cqw` avec double filet, lettrine, étincelles, dos de carte, logo SVG provisoire, grain, boutons, panneaux ; Épreuve = braise + épée, Révélation = lune + étoile ; section « Design » de `PROJET.md` réécrite. Tests du développeur mis à jour (54 tests sans navigateur verts). `tests/navigateur.test.js` non touché : 10 tests sur 27 passent encore, les 17 autres visent l'ancien design ou l'ancien parcours (liste dans le compte rendu). Statut `en test`. Reste : mise à jour des tests de navigateur par le testeur, passage complet, rapport.
- 2026-10-16 | phase 2, itération 2, correctif du rapport du testeur | D5 corrigé : étoiles du fond `.ciel` et étincelles de l'accueil déplacées dans les marges latérales (jamais sous le texte, plus de `background-attachment` ni de calque ajouté) ; noms d'emblème passés de 14 à 15 px ; README (quatre fichiers de tests de navigateur, 112 tests, 4 à 5 minutes) ; PLAN.md (phase 2 : « respect du réglage système prefers-reduced-motion ») ; `PROJET.md` note l'adaptation du fond. `regles.md` non touché (« affiché en grand » et « Aucun titre » à trancher par la propriétaire). Statut `en test`. Reste : nouveau passage du testeur, rapport.

## Défauts ouverts

Aucun.

## Décisions à confirmer

Choix de la phase 2 qui ne sont pas écrits dans les documents (à confirmer par la propriétaire dans le rapport) :

- Libellés d'interface absents de `regles.md` : « Je suis prêt(e) », « Ton prénom », « Ton emblème », « Code de la partie », « Participant(e)s » (titre de la liste), étiquettes « hôte » et « toi », « Invoquer » et « Annuler » (boîte de confirmation du bouclier), « Effet durable », « Effets en cours », durées « Jusqu'à ton prochain tour », « Jusqu'à son prochain tour », « Jusqu'à la fin de la partie », « Retour à l'accueil » et « Retour aux règles » (étiquettes des flèches de retour), nom « Romantasy » sous le logo de l'accueil.
- Textes des écrans « Créer » et « Rejoindre » (absents de `regles.md`) : « Choisis le code de la partie », « Les autres joueur(se)s le saisiront pour te rejoindre. », « Saisis le code de la partie », « Majuscules, minuscules et accents n'ont pas d'importance. », « Valider », « Saisis le code de la partie. » (champ vide), « Ce code ne correspond à aucune partie. Vérifie-le et réessaie. » (code inconnu).
- Charte graphique, adaptations à confirmer : (a0) étoiles du fond et étincelles de l'accueil posées dans les marges latérales (la charte les répartit sur toute la hauteur de la page, ce qui les fait passer derrière le texte, défaut D5) ; (a) polices hébergées au lieu de l'`@import` Google Fonts (Cormorant Garamond 500, 600, 500 italique ; Jost 300, 400, 500), Cinzel retirée ; (b) types de carte à la place des raretés : Épreuve = `--c-braise` + épée + « ÉPREUVE », Révélation = `--c-lune` + étoile + « RÉVÉLATION » (`regles.md` dit encore « améthyste », interdit par la charte : le texte n'a pas été modifié) ; (c) cartes sans coût, nom ni illustration, texte de carte gardé à 20 px au minimum (la charte demande 15 px) : la carte 2:3 s'allonge quand il le faut ; (d) logo SVG provisoire fait pour le projet, sans sous-titre (non fourni par la charte) ; (e) le fondu flou 6 px de l'apparition d'une carte n'est pas fait (« n'animer que opacity et transform ») ; (f) le texte des règles et de l'accueil reste à 20 px (la charte dit 15 à 16 px au minimum).
- Salle d'attente : code de partie petit et discret (remarque 2 de l'itération 1) alors que `regles.md` dit « affiché en grand » (texte non modifié) ; le texte d'accompagnement « Rassemblez votre troupe… » est placé sous la liste pour garder l'ordre code, menu emblème et prénom, liste.
- « Rejoindre » et « Créer » en phase 2 : le code n'est vérifié que dans la liste de `codes.json`, sans réseau ni unicité (phase 4).
- Nombre minimal de joueur(se)s prêt(e)s pour commencer (2, de `regles.md`) : constante dans `public/js/fictif.js`, car absente de `config.json`.
- Titre de l'onglet : « Romantasy ».
- Icônes (épée, étoile, bouclier) : dessins SVG simples faits pour le projet, en attendant game-icons.net (phase 7).
- `demo.html` et le paramètre `?ecran=` : outils de validation de la phase 2, à retirer ou masquer en phase 7.

## Risques reportés

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
