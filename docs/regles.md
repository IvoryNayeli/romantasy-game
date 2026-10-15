# Règles et textes validés

Source unique des règles et des textes affichés. Tout texte ci-dessous a été validé par la propriétaire du projet, sauf mention « à valider ». Ne pas les réécrire sans demande explicite.

## Écran d'accueil

Aucun titre. Un seul bouton : « Comment ça marche ? ».

> *Bienvenue, voyageuse.*
>
> Les Cours s'agitent, les dragons s'éveillent et le destin s'apprête à battre ses cartes.
>
> Récupérez votre butin, choisissez votre emblème et laissez le sort décider du trésor qui sera le vôtre.

## Écran « Comment ça marche ? »

Défile verticalement. Les boutons « Créer une partie » et « Rejoindre une partie » sont fixés en bas de l'écran. Flèche de retour vers l'accueil.

> **But du jeu**
> Chaque joueuse commence la partie avec un butin mystère. Au fil des échanges, ce butin pourra passer de main en main… jusqu'à la grande révélation finale !
>
> **Déroulement**
> À tour de rôle, chaque joueuse tire une carte de son choix : Épreuve ou Révélation. Tout ce qu'elle doit accomplir est inscrit dessus.
> - **Carte Révélation (question)** : la joueuse désigne une personne (elle-même ou une autre) selon la consigne de la carte. Elle peut aussi ne désigner personne : dans ce cas, aucun butin ne change de main.
> - **Carte Épreuve (action)** : la joueuse accomplit l'action que le destin réclame.
>
> **Invoquer un bouclier**
> Une fois la carte révélée, la joueuse peut toujours invoquer un bouclier pour refuser l'épreuve ou la révélation. Mais prenez garde : son tour est alors tout de même consumé.
>
> **Fin de la partie**
> Lorsque chaque joueuse a joué 4 fois, la quête s'achève. Vient alors, pour chacune, l'heure d'ouvrir son butin et de découvrir ce que le sort lui a réservé !

Le nombre de tours (4) vient du réglage unique `config.json`. Les textes doivent en tenir compte.

Phrase sur les effets durables, **à valider** (proposée, pas encore confirmée), à placer sous « Déroulement » :

> Certaines cartes Épreuve produisent un effet qui dure. Il prend fin dès qu'il a provoqué un échange de butins.

## Cartes

- **Épreuve** : carte action. Symbole épée, couleur rouge braise.
- **Révélation** : carte question. Symbole étoile, couleur améthyste.
- La joueuse choisit le type de carte avant de la tirer. Une carte ne sort qu'une seule fois par partie.
- Vocabulaire : toujours « butin » (jamais « poche » ni « sac » dans les textes du jeu).

## Boutons de la carte révélée

- Bouton principal : **Le sort est jeté** (la joueuse a fait ce que la carte demandait).
- Bouton secondaire : **Invoquer un bouclier** (passer). Une confirmation légère : « Invoquer un bouclier ? Ton tour sera tout de même compté. »

## Écrans de tour

- Joueuse active, choix : « À toi de jouer ! » puis deux dos de cartes (Épreuve, Révélation).
- Joueuse active, carte révélée : type de carte en en-tête, texte en grand, deux boutons.
- Autres joueuses : « Au tour de [emblème + prénom] », même carte affichée, sans boutons, « En attente de [prénom]… ».
- Transition de 2 secondes visible par toutes : « Le sort est jeté pour [prénom]. » ou « [prénom] a invoqué un bouclier. »
- Compteur : « Tour N / 4 » (tour de la partie).
- Un bandeau visible de toutes affiche les effets durables en cours (par exemple « Léa : miaule jusqu'à son prochain tour »).

## Écran de fin

> *La quête s'achève.*
>
> Le destin a rendu son verdict. Chacune tient désormais entre ses mains le butin que le sort lui a réservé. Le moment est venu de le découvrir !
>
> **[ Nouvelle quête ]**

Phrase facultative **à valider** : « Terminez les échanges en cours avant d'ouvrir vos butins. »

## Salle d'attente

- Code de partie : un mot du thème, affiché en grand, sans bouton copier ni partager.
- Prénom et emblème obligatoires pour être prête.
- Un emblème déjà pris est grisé.
- 5 joueuses maximum ; une sixième voit « La partie est complète ».
- Le bouton « Commencer la quête » n'est visible que de l'hôte, actif à partir de 2 joueuses prêtes.
- Ordre des tours : ordre d'arrivée dans le salon.
- Texte d'accompagnement : « Rassemblez votre troupe. La quête commencera quand l'hôte donnera le signal. »
