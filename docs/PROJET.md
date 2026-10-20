# Décisions du projet

Ce fichier regroupe les choix techniques et de design validés. Les règles du jeu et les textes sont dans [regles.md](regles.md). En cas de doute sur un choix non écrit ici, demander à la propriétaire du projet.

## Contraintes générales

- **Tout est gratuit.** Aucune carte bancaire, jamais de plan Blaze Firebase.
- **Pas d'application à installer** : une page web, accessible par un lien. Pas de PWA, pas de mode hors ligne.
- **Pas de son.**
- **Une seule partie jouée à la fois par groupe**, 5 personnes au maximum, 4 tours par personne (réglages dans `config.json`, jamais écrits en dur ailleurs).
- Langue de l'interface, des commentaires et des commits : **français**.
- **Écriture inclusive** dans tous les textes du jeu (interface, règles, cartes) et dans le vocabulaire du projet. Convention (allégée à la demande de la propriétaire, itération 3 de la phase 2) : **formulation neutre d'abord**, sans accord quand c'est naturel : « chaque personne », « tout le monde », « les autres », « le groupe », « les convives », « la personne qui joue », « cette personne », « la première personne qui… », « la personne à ta gauche », « Je suis là », « sous le charme ». Les parenthèses (joueur(se), chacun(e), prêt(e)) ne viennent **qu'en dernier recours**, si aucune formule neutre simple n'existe, sans alourdir le texte. Jamais de point médian (on écrit « le groupe » pour la liste des personnes présentes). Ne jamais employer de forme exclusivement féminine ni exclusivement masculine pour désigner une personne qui joue (« joueuse », « elle », « celle », « voisine », « la première qui »…). Les noms de créatures des emblèmes et les personnages des cartes (le héros, le roi, la reine) restent tels quels. Dans le code, les identifiants restent neutres (`joueur`, `joueurs`).
- Dépôt GitHub **public** : aucun secret versionné. Les identifiants Firebase du navigateur sont publics par conception, à isoler dans un fichier de configuration identifié comme tel.

## Technique

- Page web simple : HTML, CSS, JavaScript, **sans framework ni étape de build**.
- Synchronisation temps réel : **Firebase Realtime Database**, plan Spark.
- Hébergement : GitHub Pages (publie la branche `main`).
- Les cartes sont chargées depuis le site (`public/data/cartes.json`), pas depuis la base. La base ne contient que l'état de la partie.
- L'état de la partie (tour, carte, compteur, effets) vit dans Firebase, pas sur le téléphone de l'hôte.
- Écran allumé : API Wake Lock. Reconnexion automatique : l'identité de chaque personne est mémorisée sur son téléphone. Une personne déconnectée est marquée « absente » sans être retirée de la partie (libellé neutre à choisir en phase 6). Si c'est son tour et qu'elle est absente, n'importe qui dans le groupe peut passer son tour après quelques secondes.
  Mise en œuvre (phase 6, à confirmer) :
  - Écran allumé (`public/js/wakelock.js`) : demandé sur la salle d'attente et la partie, redemandé au retour de la page au premier plan, relâché à l'écran de fin. Sans aucun message si l'API manque (page `http://` du réseau local, navigateur ancien) ou si le navigateur refuse.
  - Reconnexion : le SDK Firebase se reconnecte de lui-même et l'écoute de la partie reprend. L'identité reste gardée dans l'onglet (`sessionStorage`, choix de la phase 4) : elle survit à une coupure réseau et à un rechargement, pas à la fermeture de l'onglet.
  - Présence : une entrée par connexion ouverte sous `parties/<CODE>/presents/<id>`, retirée par le serveur à la coupure (`onDisconnect`) ; une personne sans aucune connexion est affichée « hors ligne » (libellé neutre, sans accord), sans être retirée de la partie. Seules écritures du jeu hors transaction.
  - Tour d'une personne hors ligne : « Passer son tour » apparaît chez les autres quand l'absence dure depuis `delaiAbsenceSecondes` (`config.json`, 10 secondes, compté sur chaque téléphone depuis qu'il a vu l'absence). Le tour est compté, comme un bouclier : une carte déjà tirée est consumée, sans effet durable. Transition : « Le tour de [prénom] est passé. ». Les règles de la base n'acceptent un tour passé que si la personne n'a plus aucune connexion.
  - Expiration des parties jugée à l'heure du serveur estimée par le SDK (`.info/serverTimeOffset`), et non à l'horloge du téléphone.
- Plan Spark : 100 connexions simultanées, 1 Go de stockage, 10 Go par mois de téléchargements de la base, 10 Go de transfert d'hébergement. Pas de Cloud Functions : toute la logique tourne dans les navigateurs.
- Écoutes de la base uniquement sur le chemin de la partie en cours, jamais à la racine. Taille de l'état et nombre d'écritures par tour bornés.
- Suppression de la partie à la fin, expiration des parties abandonnées.
- Deux projets Firebase : `romantasy-dev` (essais) et `romantasy-prod` (lien partagé). Les tests automatiques visent **uniquement l'émulateur local** et refusent de tourner sur une adresse non locale.
- Outils de test : Node.js (lanceur de tests intégré), Playwright, émulateur Firebase (nécessite Java).

## Cartes

- 40 cartes : 20 Révélations et 20 Épreuves. Source dans [cartes-source.md](cartes-source.md), à convertir en `public/data/cartes.json` en phase 1.
- Une carte n'est jouée qu'une seule fois par partie.
- Comme chaque personne choisit le type, une pile doit pouvoir fournir 20 cartes (5 personnes × 4 tours).
- Effets durables : champ `duree` valant `prochain_tour` (jusqu'à son prochain tour) ou `fin_partie`, et champ `effet` (libellé court du bandeau). Absents pour les cartes immédiates. Plusieurs effets peuvent se cumuler sur une même personne. Un effet disparaît quand il a provoqué un échange de butins, ou à son échéance. Un bouclier sur la carte annule l'effet.
- Format d'une carte :

```json
{"id":"epr-06","type":"epreuve","duree":"fin_partie","effet":"Vouvoie tout le monde","texte":"…"}
```

## Emblèmes (10, sans marque)

Dragon 🐉, Sorcière 🧙, Vampire 🧛, Fée 🧚, Elfe 🧝, Loup-garou 🐺, Sirène 🧜, Phénix 🔥, Licorne 🦄, Chevalier 🛡️.

Emojis pour le prototype. Remplacement par les icônes de game-icons.net (licence CC BY 3.0, auteurs à créditer) en phase 8. L'image de banque de données ne concerne que les emblèmes : le logo est l'image fournie par la propriétaire (voir « Logo » plus bas).

## Codes de partie

Un mot du thème, sans accent, insensible à la casse et aux accents à la saisie : ECLIPSE, RUNE, ONYX, AURORE, CRYPTE, GRIMOIRE, TALISMAN, ELIXIR, SORTILEGE, OBSIDIENNE. Tirage au hasard parmi ceux qui ne sont pas utilisés par une partie en cours.

## Design

Référence détaillée : [charte-graphique.md](charte-graphique.md) (variables CSS de la section 2 reprises telles quelles, formes, boutons, cartes, fond, grain, mouvement, accessibilité). Elle remplace l'ancienne palette (violet, rouge, or) et l'ancienne typographie : Cormorant Garamond et Jost remplacent Cinzel. Ce qui suit résume les choix du projet et les adaptations décidées pour notre jeu.

- Ambiance : nuit étoilée, dragons, mystique, féérique, moderne et élégant. 80 % de bleus nuit, 15 % de clair de lune, 5 % d'ambre : l'ambre signale ce qui compte (action principale, sélection, effet durable).
- Palette (variables `--c-*` du fichier CSS) :

| Rôle | Variable | Couleur |
|---|---|---|
| Fond principal, texte sur ambre | `--c-nuit` | `#060B1E` |
| Surfaces, haut des cartes | `--c-minuit` | `#0F1E4A` |
| Bordures communes, halos (jamais en texte) | `--c-brume` | `#3C5A8C` |
| Texte courant | `--c-lune` | `#C9D8EE` |
| Texte secondaire | `--c-lune-douce` | `#8FA6C8` |
| Titres, étoiles | `--c-etoile` | `#F4F1E8` |
| Accent, action principale | `--c-ambre` | `#F0A35E` |
| Feu, alertes, carte Épreuve | `--c-braise` | `#D9693A` |

  Interdits : violets, roses, verts vifs, blanc `#FFF` et noir `#000` purs, ombres portées noires.
- Typographie : **Cormorant Garamond** (titres, légendes de cartes, citations ; graisses 500, 600 et 500 italique) et **Jost** (interface et texte ; graisses 300, 400, 500), en capitales espacées pour les boutons et les légendes. Polices **hébergées avec le site** (`public/fonts/`, licences OFL conservées), jamais chargées depuis Google Fonts (la charte propose un `@import` Google Fonts : écarté).
- Formes : rectangulaires et douces (cartes 8 px, boutons 4 px), jamais de pilules. Filets de 1 à 1,5 px, double filet, étincelles à 4 branches aux coins, séparateur filigrane. Lumière (halos) plutôt qu'ombres. Icônes au trait fin de 1,5 px, jamais pleines. **Écart volontaire à la charte, demandé par la propriétaire (itération 3)** : le bouclier et le « sort est jeté » étaient trop discrets au trait fin. Ils sont désormais en formes pleines : sur l'écran de transition, grandes (9 rem) avec un halo ambre (sort jeté) ou braise (bouclier), aux seules couleurs de la charte (symboles `i-sort-jete` et `i-bouclier-grand`) ; dans les boutons, un bouclier plein de même couleur que le texte (`i-bouclier`). L'épée, l'étoile et les autres icônes restent au trait fin.
- Titres : aucun titre sur l'accueil (le nom du jeu n'est écrit nulle part à l'écran ; le logo garde seulement un nom accessible neutre, « Logo du jeu »). Le `<title>` de l'onglet reste « Romantasy » (à confirmer). Sur la page des règles, les titres de section (30 px, Cormorant Garamond 600, `--c-etoile`, interlettrage, filigrane ambre au-dessus, alignés à gauche (filigrane compris), grande marge supérieure) sont nettement plus visibles que le texte (20 px) et restent plus petits que les titres d'écran (32 à 40 px).
- Cartes : proportions 2:3 (la carte s'allonge si le texte l'exige), dimensions en `cqw`, lettrine, dos de carte avec logo. Les cartes du jeu n'ont ni coût, ni nom, ni illustration (éléments de la charte non utilisés). Les raretés de la charte (commune, rare, légendaire) n'existent pas dans le jeu : elles sont remplacées par les deux types de carte.
- Types de carte : chaque type a une couleur, un symbole **et** un mot, pour ne jamais dépendre de la couleur seule. **Épreuve** : `--c-braise`, épée, « ÉPREUVE ». **Révélation** : `--c-lune`, étoile, « RÉVÉLATION ».
- Logo : image fournie par la propriétaire (itération 4), **disque central seulement** (anneau clair de lune, disque minuit, dragon au trait ambre, petite étoile), détouré en cercle sur fond transparent pour se fondre dans `--c-nuit` : `public/img/logo.webp` (WebP, 384 x 384 px, environ 25 Ko). L'image d'origine (cadre doré, fond étoilé) est gardée comme source dans `docs/logo-source.jpeg`, hors du site servi. Utilisée en `img` décorative partout (accueil 96 px, barres 40 px, dos des cartes 52 % de la largeur) ; version complète sur l'accueil, sans nom écrit, nom accessible « Logo du jeu » ; version compacte de 40 px dans les barres.
- Fond : classe `.ciel` (étoiles, halo bleu, lueur de braise), un seul calque de grain par écran, jamais de fond fixe. Adaptation : les étoiles sont posées dans les marges latérales (jamais derrière le texte) au lieu d'être réparties sur toute la hauteur de la page. Constellations (itération 3) : quelques étoiles reliées par des filets de 0,8 px en faible opacité, motifs inventés ou inspirés du ciel, sans texte (`public/js/ciel.js`), posées **seulement dans des zones sans texte** : bande d'en-tête de part et d'autre du logo (écrans denses) et espace libre au-dessus et au-dessous du contenu (accueil, transition, fin ; masqué si l'espace est trop petit). Un motif d'étoiles répété dans les marges latérales (en pixels, à moins de 12 px du bord) complète le fond. Seules quelques étoiles scintillent (opacité).
- Accessibilité : boutons et cibles tactiles d'au moins 48 px (`--cible`), texte des cartes d'au moins 20 px (plus strict que les 15 px de la charte), contrastes élevés, aucun effet au survol (tout est tactile), focus visible. Les animations sont coupées quand l'appareil le demande (`prefers-reduced-motion`) : c'est une règle système, pas une option du jeu.
- Mouvement : fondu de 300 ms entre les écrans, retournement de carte en 3D CSS, scintillement lent des étoiles. On n'anime que `opacity` et `transform`.

## Arborescence cible

```
romantasy-game/
├── .github/            copilot-instructions.md, agents/
├── docs/               regles.md, PROJET.md, PLAN.md, SUIVI.md, cartes-source.md,
│                       rapports/, remarques/
├── public/
│   ├── index.html
│   ├── css/style.css
│   ├── js/             app.js, game.js, firebase.js, wakelock.js, …
│   ├── data/           cartes.json, emblemes.json, codes.json, config.json
│   └── fonts/
├── tests/
├── firebase.json
└── database.rules.json
```
