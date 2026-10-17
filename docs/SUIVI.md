# Suivi du projet

Source de vérité de l'avancement. À lire **en premier** à chaque session. Mis à jour par le chef de phase avant chaque commit.

## Statuts possibles

`à faire` → `en cours` → `en test` → `prête pour relecture` → `validée`. Retour possible de `prête pour relecture` vers `en cours` (itération N+1) après remarques.

| Statut | Qui peut agir |
|---|---|
| `à faire`, `en cours` | Développeur |
| `en test` | Testeur (phases 4 à 7, ou tests de navigateur à adapter) ; sinon chef de phase (suite de tests complète) |
| `prête pour relecture` | Personne : attente de la propriétaire |
| `validée` | Personne : phase suivante possible |

Seul le chef de phase écrit `validée`, uniquement après le message explicite « Phase N validée » de la propriétaire.

## Phases

| Phase | Intitulé | Statut | Itération | Dernier rapport |
|---|---|---|---|---|
| 0 | Fondations | validée le 2026-10-15 | 3 | [phase-0-iteration-3](rapports/phase-0-iteration-3.md) |
| 1 | Contenu | validée le 2026-10-15 | 1 | [phase-1-iteration-1](rapports/phase-1-iteration-1.md) |
| 2 | Écrans et design | en cours (itération 5) | 5 | [phase-2-iteration-4](rapports/phase-2-iteration-4.md) |
| 3 | Moteur de jeu | à faire | 0 | |
| 4 | Multijoueur et salle d'attente | à faire | 0 | |
| 5 | Partie jouable en réseau | à faire | 0 | |
| 6 | Robustesse | à faire | 0 | |
| 7 | Finition et mise en ligne | à faire | 0 | |

## Prochaine action

Phase 2 (écrans et design), itération 5 en cours : huit remarques consignées dans [phase-2](remarques/phase-2.md) (filigranes ambre et pleine largeur, retournement des cartes, centrage du choix du code, nom du groupe, « Je suis là » verrouillé, écran sort et bouclier, étoile pleine). Ensuite : test, rapport, puis « Phase 2 validée » ou « Phase 2, remarques : … ». Phase 3 refusée tant que la phase 2 n'est pas validée.

## Journal

Une ligne par session : date, phase, ce qui a été fait, ce qui reste. Courte : le détail est dans le rapport, qu'on lie. Les lignes des phases validées sont déplacées dans [journal-archive](journal-archive.md) par le chef de phase à la validation.


- 2026-10-15 | phase 2, démarrage | Branche `phase-2` créée depuis `main` (phase 1 validée, 22 tests verts). Statut `en cours`, itération 1. Reste : développement, test, rapport.
- 2026-10-15 | phase 2, itération 1 | Développement : polices Cinzel et Cormorant Garamond hébergées (woff2, OFL), `index.html`, `css/style.css`, `js/` (app, écrans, textes, données fictives, réglage des animations), huit écrans (accueil, règles, salle d'attente, choix, carte révélée, attente, transition de 2 secondes, fin), page `demo.html` (liens vers chaque écran et les 40 cartes), README mis à jour, 23 tests ajoutés dont le contrôle des réglages en dur (45 tests, tous verts). Reste : test indépendant, rapport.
- 2026-10-15 | phase 2, correctifs du rapport du testeur | D1 (bandeau « Effets en cours » à 20 px), D2 (dos « Révélation » : centre du dégradé éclairci moins fort, contraste minimal relevé 4,73:1, palette inchangée), D3 (« prêt(e) à commencer » dans `demo.html`), D4 (README : `npm install`, Chrome, environ 5 minutes). 72 tests sur 72 verts, tests de navigateur compris. Statut `en test`. Reste : nouveau passage du testeur, rapport.

- 2026-10-15 | phase 2, rapport | Test indépendant en deux passages : 4 défauts mineurs au premier (D1 à D4), tous corrigés ; deuxième passage `tout passe`, 72 tests sur 72 (relancés par le chef de phase). Aucun défaut ouvert. Rapport : [phase-2-iteration-1](rapports/phase-2-iteration-1.md), rapport du testeur : [phase-2-test](rapports/phase-2-test.md). Reste : relecture et validation.

- 2026-10-16 | phase 2, remarques | Quatre remarques de la propriétaire consignées dans [phase-2](remarques/phase-2.md) (retrait de « Réduire les animations », parcours « Créer » et « Rejoindre », nouvelle charte graphique copiée dans [charte-graphique](charte-graphique.md)). Statut `en cours (itération 2)`. Reste : développement, test complet, rapport.
- 2026-10-16 | phase 2, itération 2 | Développement : (1) option « Réduire les animations » supprimée (bouton, `reglages.js`, localStorage, textes, README), règle système `prefers-reduced-motion` conservée ; (2) « Créer une partie » : écran de choix du code dans la liste de `codes.json` ; (3) « Rejoindre une partie » : écran de saisie du code (insensible à la casse et aux accents, message d'erreur), `js/codes.js` ; salle d'attente réordonnée (code discret, menu emblème + prénom, liste des participant(e)s) ; `demo.html`, `?ecran=creer|rejoindre`, README mis à jour ; (4) charte graphique appliquée à tout le projet : variables CSS de la charte telles quelles, Cormorant Garamond et Jost hébergées (Cinzel retirée), cartes 2:3 en `cqw` avec double filet, lettrine, étincelles, dos de carte, logo SVG provisoire, grain, boutons, panneaux ; Épreuve = braise + épée, Révélation = lune + étoile ; section « Design » de `PROJET.md` réécrite. Tests du développeur mis à jour (54 tests sans navigateur verts). `tests/navigateur.test.js` non touché : 10 tests sur 27 passent encore, les 17 autres visent l'ancien design ou l'ancien parcours (liste dans le compte rendu). Statut `en test`. Reste : mise à jour des tests de navigateur par le testeur, passage complet, rapport.
- 2026-10-16 | phase 2, itération 2, correctif du rapport du testeur | D5 corrigé : étoiles du fond `.ciel` et étincelles de l'accueil déplacées dans les marges latérales (jamais sous le texte, plus de `background-attachment` ni de calque ajouté) ; noms d'emblème passés de 14 à 15 px ; README (quatre fichiers de tests de navigateur, 112 tests, 4 à 5 minutes) ; PLAN.md (phase 2 : « respect du réglage système prefers-reduced-motion ») ; `PROJET.md` note l'adaptation du fond. `regles.md` non touché (« affiché en grand » et « Aucun titre » à trancher par la propriétaire). Statut `en test`. Reste : nouveau passage du testeur, rapport.

- 2026-10-16 | phase 2, itération 2, rapport | Test indépendant en deux passages : 1 défaut visuel au premier (D5, étoiles du fond derrière le texte), corrigé puis revérifié ; deuxième passage `tout passe`, 112 tests sur 112 (relancés par le chef de phase). Aucun défaut ouvert. Rapport : [phase-2-iteration-2](rapports/phase-2-iteration-2.md), rapport du testeur : [phase-2-test](rapports/phase-2-test.md). Reste : relecture et validation.

- 2026-10-16 | phase 2, remarques de l'itération 2 | Six remarques de la propriétaire consignées dans [phase-2](remarques/phase-2.md) (itération 2 des remarques) : plus d'étoiles et constellations, accueil sans titre, aile de dragon à remplacer plus tard par une image de banque, titres de règles plus visibles, écriture inclusive allégée, formes « le sort est jeté » et bouclier plus visibles. Statut `en cours (itération 3)`. Reste : développement, test complet, rapport.
- 2026-10-16 | phase 2, itération 3 | Développement des six remarques : (1) constellations (`js/ciel.js`, 8 motifs, filets de 0,8 px, seulement dans les zones sans texte : en-tête et espace libre de l'accueil, de la transition et de la fin) et étoiles de marge supplémentaires ; (2) accueil sans nom écrit (logo à nom accessible « Logo du jeu », `<title>` inchangé) ; (3) aile de dragon : aucun changement, remplacement par une image de banque noté dans PROJET, PLAN (phase 7) et ici ; (4) titres de section des règles à 30 px avec filigrane ambre ; (5) écriture inclusive allégée dans tous les textes (interface, 9 cartes, règles, docs, tests), `cartes-a-relire.md` régénéré ; (6) bouclier et sort jeté en formes pleines, grandes, avec halo (écart à la charte noté). Tests sans navigateur : 55 verts. Suite complète : 113 tests, 101 verts, 12 rouges dus aux changements voulus (textes, `.logo-nom`, nom du logo) ; copie adaptée en local (hors dépôt) : 58 tests de navigateur sur 58 verts. Statut `en test`. Reste : adaptation des tests de navigateur par le testeur, passage complet, rapport.
- 2026-10-17 | outillage | Réduction de la consommation des agents : journal des phases 0 et 1 archivé ([journal-archive](journal-archive.md)), scripts `npm test` à sortie courte (`test:rapide`, `test:navigateur`), testeur limité aux phases 4 à 7 ou aux tests de navigateur à adapter, plafond de 2 allers-retours, un seul rapport par itération, modèle `Claude Haiku 4.5` pour chef et testeur. Reste : suite de la phase 2.

- 2026-10-17 | phase 2, remarques de l'itération 3 | Trois remarques de la propriétaire consignées dans [phase-2](remarques/phase-2.md) (itération 4 des remarques) : texte de salutation « Bienvenue, voyageur(se) », nouveau logo (disque central extrait), titres de section alignés à gauche. Statut `en cours (itération 4)`. Reste : développement, test complet, rapport.
- 2026-10-17 | phase 2, itération 4, rapport | Salutation, logo (WebP transparent) et titres à gauche faits ; 118 tests sur 118 (relancés par le chef de phase), aucun défaut ouvert ; surlignage violet introuvable dans le code, à préciser. Rapport : [phase-2-iteration-4](rapports/phase-2-iteration-4.md). Reste : relecture et validation.
- 2026-10-17 | phase 2, remarques de l'itération 4 | Huit remarques consignées dans [phase-2](remarques/phase-2.md) (« Itération 5 »). Statut `en cours (itération 5)`. Reste : développement, test, rapport.

## Défauts ouverts

Aucun.

## Décisions à confirmer

Choix de la phase 2 qui ne sont pas écrits dans les documents (à confirmer par la propriétaire dans le rapport) :

- Libellés d'interface absents de `regles.md` : « Je suis là » (bouton, remplace « Je suis prêt(e) »), « C'est bon » (étiquette et état du bouton, remplace « Prêt(e) »), « Ton prénom », « Ton emblème », « Code de la partie », « Le groupe » (titre de la liste, remplace « Participant(e)s »), étiquettes « hôte » et « toi », « Invoquer » et « Annuler » (boîte de confirmation du bouclier), « Effet durable », « Effets en cours », durées « Jusqu'à ton prochain tour », « Jusqu'à son prochain tour », « Jusqu'à la fin de la partie », « Retour à l'accueil » et « Retour aux règles » (étiquettes des flèches de retour), nom accessible « Logo du jeu » du logo de l'accueil (plus de nom « Romantasy » écrit à l'écran).
- Écriture inclusive allégée (itération 3, demande explicite de la propriétaire, y compris pour les textes validés) : formulations neutres choisies dans `regles.md`, `cartes-source.md`, `cartes.json`, `textes.js` et les documents ; tableau avant/après dans le rapport de l'itération 3, à confirmer. Choix à trancher : « la personne qui joue » (remplace « le/la joueur(se) »), « Je suis là » et « C'est bon » (remplacent « prêt(e) »), « Le groupe » (remplace « Participant(e)s »), 9 cartes (rev-02, rev-03, rev-04, rev-07, rev-08, epr-01, epr-08 [effet compris], epr-11, epr-14 [effet compris], epr-17 [effet compris]). `.github/copilot-instructions.md` garde une autre ligne avec « 5 joueur(se)s maximum » (consigne : toucher une seule ligne).
- Accueil sans titre (itération 3) : le nom « Romantasy » n'est plus écrit sous le logo. Le titre de l'onglet (`<title>Romantasy</title>`) est laissé tel quel : à confirmer. La salutation « Bienvenue, voyageur(se). » (rétablie à la demande de la propriétaire, itération 4, avec « (se) ») reste en italique 36 px (c'est la salutation du texte validé, pas un titre).
- Écart volontaire à la charte (itération 3, demandé par la propriétaire) : bouclier et « sort est jeté » en formes pleines, grandes, avec halo ambre ou braise, au lieu d'icônes au trait fin ; noté dans `PROJET.md`. L'épée et l'étoile des types de carte restent au trait fin (même problème de discrétion possible : à voir avec la propriétaire).
- Constellations (itération 3) : tracés inventés ou inspirés du ciel (lyre, croix, couronne, flèche, cassiopée, grande ourse, dragon, orion) posés seulement dans des zones sans texte (bande d'en-tête, espace libre de l'accueil, de la transition et de la fin), plus un motif d'étoiles dans les marges ; en conséquence, le critère « 11 dégradés dans `body.ciel` » du testeur est inchangé (les nouvelles étoiles ne sont pas dans les dégradés du corps).
- Titres de section de la page des règles (itération 3) : 30 px, interlettrage, filigrane ambre au-dessus, marge supérieure de 48 px ; textes de `regles.md` inchangés.
- Textes des écrans « Créer » et « Rejoindre » (absents de `regles.md`) : « Choisis le code de la partie », « Les autres le saisiront pour te rejoindre. » (remplace « Les autres joueur(se)s le saisiront… »), « Saisis le code de la partie », « Majuscules, minuscules et accents n'ont pas d'importance. », « Valider », « Saisis le code de la partie. » (champ vide), « Ce code ne correspond à aucune partie. Vérifie-le et réessaie. » (code inconnu).
- Charte graphique, adaptations à confirmer : (a0) étoiles du fond et étincelles de l'accueil posées dans les marges latérales (la charte les répartit sur toute la hauteur de la page, ce qui les fait passer derrière le texte, défaut D5) ; (a) polices hébergées au lieu de l'`@import` Google Fonts (Cormorant Garamond 500, 600, 500 italique ; Jost 300, 400, 500), Cinzel retirée ; (b) types de carte à la place des raretés : Épreuve = `--c-braise` + épée + « ÉPREUVE », Révélation = `--c-lune` + étoile + « RÉVÉLATION » (`regles.md` dit encore « améthyste », interdit par la charte : le texte n'a pas été modifié) ; (c) cartes sans coût, nom ni illustration, texte de carte gardé à 20 px au minimum (la charte demande 15 px) : la carte 2:3 s'allonge quand il le faut ; (d) logo SVG provisoire fait pour le projet, sans sous-titre (non fourni par la charte) ; (e) le fondu flou 6 px de l'apparition d'une carte n'est pas fait (« n'animer que opacity et transform ») ; (f) le texte des règles et de l'accueil reste à 20 px (la charte dit 15 à 16 px au minimum).
- Salle d'attente : code de partie petit et discret (remarque 2 de l'itération 1) alors que `regles.md` dit « affiché en grand » (texte non modifié) ; le texte d'accompagnement « Rassemblez votre troupe… » est placé sous la liste pour garder l'ordre code, menu emblème et prénom, liste.
- « Rejoindre » et « Créer » en phase 2 : le code n'est vérifié que dans la liste de `codes.json`, sans réseau ni unicité (phase 4).
- Nombre minimal de personnes ayant confirmé leur présence (« Je suis là ») pour commencer (2, de `regles.md`) : constante dans `public/js/fictif.js`, car absente de `config.json`.
- Titre de l'onglet : « Romantasy » (laissé tel quel malgré l'accueil sans titre, itération 3).
- Icônes (épée, étoile, bouclier) : dessins SVG simples faits pour le projet, en attendant game-icons.net (phase 7) ; le bouclier est désormais plein (voir plus haut).
- `demo.html` et le paramètre `?ecran=` : outils de validation de la phase 2, à retirer ou masquer en phase 7.

## Risques reportés

- Phase 7 : l'image de banque de données (avec crédit de licence) ne concerne que les emojis des emblèmes ; le logo est l'image de la propriétaire (itération 4 de la phase 2), déjà en place.
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
