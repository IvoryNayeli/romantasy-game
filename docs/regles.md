# Règles et textes validés

Source unique des règles et des textes affichés. Tout texte ci-dessous a été validé par la propriétaire du projet. Ne pas les réécrire sans demande explicite.

## Écriture inclusive

Tous les textes du jeu sont inclusifs, selon la convention de [PROJET.md](PROJET.md) : parenthèses pour les noms et les accords (joueur(se), voyageur(euse), chacun(e), prêt(e)), formulation neutre quand c'est plus simple (« cette personne », « la première personne qui… »).

## Écran d'accueil

Aucun titre. Un seul bouton : « Comment ça marche ? ».

> *Bienvenue, voyageur(euse).*
>
> Les Cours s'agitent, les dragons s'éveillent et le destin s'apprête à battre ses cartes.
>
> Récupérez votre butin, choisissez votre emblème et laissez le sort décider du trésor qui sera le vôtre.

## Écran « Comment ça marche ? »

Défile verticalement. Les boutons « Créer une partie » et « Rejoindre une partie » sont fixés en bas de l'écran. Flèche de retour vers l'accueil.

> **But du jeu**
> Chaque joueur(se) commence la partie avec un butin mystère. Au fil de la partie, ce butin pourra passer de main en main… jusqu'à la grande révélation finale !
>
> **Déroulement**
> À tour de rôle, chaque joueur(se) tire une carte de son choix : Épreuve ou Révélation. Tout ce qui doit être accompli est inscrit dessus.
> - **Carte Révélation (question)** : le/la joueur(se) désigne une personne (soi-même ou une autre) selon la consigne de la carte. Il est aussi possible de ne désigner personne : dans ce cas, aucun butin ne change de main.
> - **Carte Épreuve (action)** : le/la joueur(se) accomplit l'action que le destin réclame.
>
> **Invoquer un bouclier**
> Une fois la carte révélée, le/la joueur(se) peut toujours invoquer un bouclier pour refuser l'épreuve ou la révélation. Mais prenez garde : son tour est alors tout de même consumé.
>
> **Fin de la partie**
> Lorsque chaque joueur(se) a joué 4 fois, la quête s'achève. Vient alors, pour chacun(e), l'heure d'ouvrir son butin et de découvrir ce que le sort lui a réservé !

Le nombre de tours (4) vient du réglage unique `config.json`. Les textes doivent en tenir compte.

Phrase sur les effets durables, validée, à placer sous « Déroulement », après la carte Épreuve :

> Certaines cartes Épreuve produisent un effet qui dure. Il prend fin dès qu'il a provoqué un échange de butins.

## Cartes

- **Épreuve** : carte action. Symbole épée, couleur rouge braise.
- **Révélation** : carte question. Symbole étoile, couleur améthyste.
- Le/la joueur(se) choisit le type de carte avant de la tirer. Une carte ne sort qu'une seule fois par partie.
- Vocabulaire : toujours « butin » (jamais « poche » ni « sac » dans les textes du jeu).

## Boutons de la carte révélée

- Bouton principal : **Le sort est jeté** (la carte a été accomplie).
- Bouton secondaire : **Invoquer un bouclier** (passer). Une confirmation légère : « Invoquer un bouclier ? Ton tour sera tout de même compté. »

## Écrans de tour

- Joueur(se) actif(ve), choix : « À toi de jouer ! » puis deux dos de cartes (Épreuve, Révélation).
- Joueur(se) actif(ve), carte révélée : type de carte en en-tête, texte en grand, deux boutons.
- Autres joueur(se)s : « Au tour de [emblème + prénom] », même carte affichée, sans boutons, « En attente de [prénom]… ».
- Transition de 2 secondes visible par tou(te)s : « Le sort est jeté pour [prénom]. » ou « [prénom] a invoqué un bouclier. »
- Compteur : « Tour N / 4 » (tour de la partie).
- Un bandeau visible de tou(te)s affiche les effets durables en cours (par exemple « Léa : miaule jusqu'à son prochain tour »).

## Écran de fin

> *La quête s'achève.*
>
> Le destin a rendu son verdict. Chacun(e) tient désormais entre ses mains le butin que le sort lui a réservé. Le moment est venu de le découvrir !
>
> **[ Nouvelle quête ]**

Aucune autre phrase : en particulier, ne pas ajouter de rappel sur les échanges en cours avant l'ouverture des butins (refusé par la propriétaire).

## Salle d'attente

- Code de partie : un mot du thème, affiché en grand, sans bouton copier ni partager.
- Prénom et emblème obligatoires pour être prêt(e).
- Un emblème déjà pris est grisé.
- 5 joueur(se)s maximum ; un(e) sixième voit « La partie est complète ».
- Le bouton « Commencer la quête » n'est visible que de l'hôte, actif à partir de 2 joueur(se)s prêt(e)s.
- Ordre des tours : ordre d'arrivée dans le salon.
- Texte d'accompagnement : « Rassemblez votre troupe. La quête commencera quand l'hôte donnera le signal. »
