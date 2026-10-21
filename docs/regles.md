# Règles et textes validés

Source unique des règles et des textes affichés. Tout texte ci-dessous a été validé par la propriétaire du projet. Ne pas les réécrire sans demande explicite.

## Écriture inclusive

Tous les textes du jeu sont inclusifs, selon la convention de [PROJET.md](PROJET.md) : formulation neutre d'abord (« chaque personne », « tout le monde », « cette personne », « la première personne qui… », « Je suis là »), jamais de forme exclusivement féminine ni masculine pour désigner un(e) joueur(se) ; parenthèses seulement en dernier recours, si aucune formule neutre simple n'existe.

## Écran d'accueil

Aucun titre. Un seul bouton : « Comment ça marche ? ».

> *Bienvenue, voyageur(se).*
>
> Les Cours s'agitent, les dragons s'éveillent et le destin s'apprête à battre ses cartes.
>
> Récupérez votre butin, choisissez votre emblème et laissez le sort décider du trésor qui sera le vôtre.

## Écran « Comment ça marche ? »

Défile verticalement. Les boutons « Créer une partie » et « Rejoindre une partie » sont fixés en bas de l'écran. Flèche de retour vers l'accueil.

> **But du jeu**
> Chaque personne commence la partie avec un butin mystère. Au fil de la partie, ce butin pourra passer de main en main… jusqu'à la grande révélation finale !
>
> **Déroulement**
> À tour de rôle, chaque personne tire une carte de son choix : Épreuve ou Révélation. Tout ce qui doit être accompli est inscrit dessus.
> - **Carte Révélation (question)** : la personne qui joue désigne quelqu'un (soi-même ou une autre personne) selon la consigne de la carte. Il est aussi possible de ne désigner personne : dans ce cas, aucun butin ne change de main.
> - **Carte Épreuve (action)** : la personne qui joue accomplit l'action que le destin réclame.
>
> **Invoquer un bouclier**
> Une fois la carte révélée, la personne qui joue peut toujours invoquer un bouclier pour refuser l'épreuve ou la révélation. Mais prenez garde : son tour est alors tout de même consumé.
>
> **Fin de la partie**
> Lorsque chaque personne a joué 4 fois, la quête s'achève. Vient alors, pour tout le monde, l'heure d'ouvrir son butin et de découvrir ce que le sort lui a réservé !

Le nombre de tours (4) vient du réglage unique `config.json`. Les textes doivent en tenir compte.

Phrase sur les effets durables, validée, à placer sous « Déroulement », après la carte Épreuve :

> Certaines cartes Épreuve produisent un effet qui dure. Il prend fin dès qu'il a provoqué un échange de butins.

## Cartes

- **Épreuve** : carte action. Symbole épée, couleur rouge braise.
- **Révélation** : carte question. Symbole étoile, couleur améthyste.
- Chaque personne choisit le type de carte avant de la tirer. Une carte ne sort qu'une seule fois par partie.
- Vocabulaire : toujours « butin » (jamais « poche » ni « sac » dans les textes du jeu).

## Boutons de la carte révélée

- Bouton principal : **Le sort est jeté** (la carte a été accomplie).
- Bouton secondaire : **Invoquer un bouclier** (passer). Une confirmation légère : « Invoquer un bouclier ? Ton tour sera tout de même compté. »

## Écrans de tour

- Pour la personne dont c'est le tour, choix : « À toi de jouer ! » puis deux dos de cartes (Épreuve, Révélation).
- Pour la personne dont c'est le tour, carte révélée : type de carte en en-tête, texte en grand, deux boutons.
- Pour les autres : « Au tour de [prénom + emblème] », même carte affichée, sans boutons ; tant que la carte n'est pas choisie, l'emblème est affiché en grand sous « Au tour de [prénom] ».
- Transition de 2 secondes visible par tout le monde : « Le sort est jeté pour [prénom]. » ou « [prénom] a invoqué un bouclier. »
- Compteur : « Tour N / 4 » (tour de la partie).
- Un bandeau visible par tout le monde affiche les effets durables en cours (par exemple « Léa : miaule jusqu'à son prochain tour »).

## Écran de fin

> *La quête s'achève.*
>
> Le destin a rendu son verdict. Chaque personne tient désormais entre ses mains le butin que le sort lui a réservé. Le moment est venu de le découvrir !
>
> **[ Nouvelle quête ]**

Aucune autre phrase : en particulier, ne pas ajouter de rappel sur les échanges en cours avant l'ouverture des butins (refusé par la propriétaire).

## Salle d'attente

- Code de partie : un mot du thème, affiché en grand, sans bouton copier ni partager.
- Écran du prénom : au-dessus du champ, la phrase « Quel nom les étoiles murmureront-elles ce soir ? »
- Écran de l'emblème : au-dessus des emblèmes, la question « Quelle puissance veille sur toi ? »
- Prénom et emblème obligatoires pour confirmer sa présence (« Je rejoins la compagnie »).
- Un emblème déjà pris est grisé.
- 5 personnes au maximum ; une sixième personne voit « La partie est complète ».
- Le bouton « Commencer la quête » n'est visible que de l'hôte, actif dès que 2 personnes ont confirmé leur présence.
- Ordre des tours : ordre d'arrivée dans le salon.
- Texte d'accompagnement : « La quête commencera quand l'hôte donnera le signal. »
