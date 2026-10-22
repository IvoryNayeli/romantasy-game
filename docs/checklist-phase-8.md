# Check-list de validation de la phase 8 : partie réelle en ligne

Pour la propriétaire. À faire avec plusieurs téléphones (Android et iPhone si possible), chacun sur sa propre connexion (Wi-Fi ou données mobiles), sur le lien définitif :

**https://ivorynayeli.github.io/romantasy-game/**

Le nombre de tours et le nombre de places viennent de `public/data/config.json` (aujourd'hui : 4 tours, 5 places). Si ces réglages changent, adapter les nombres ci-dessous.

Cocher chaque étape et noter ce qui ne va pas (téléphone, navigateur, ce qui s'est passé) : ces notes serviront de remarques pour la phase.

## Avant de commencer (une seule fois)

- [ ] 0.1. Dans le dépôt GitHub, `Settings`, `Pages`, `Build and deployment`, `Source` : `GitHub Actions` (voir le README, « Mise en ligne »).
- [ ] 0.2. Règles publiées sur la base de production : `firebase deploy --only database --project prod`, depuis le dossier du projet.
- [ ] 0.3. Onglet `Actions` du dépôt : le dernier passage du flux « Mise en ligne (GitHub Pages) » est vert.

## La partie

| N° | Action | Résultat attendu | OK |
|---|---|---|---|
| 1 | Sur chaque téléphone, ouvrir le lien. | L'accueil s'affiche avec le logo, les étoiles et les polices du jeu, sans message d'erreur. L'adresse commence par `https://`. | [ ] |
| 2 | Téléphone A : « Comment ça marche ? », puis retour. | Les règles s'affichent en entier ; le retour ramène à l'accueil. | [ ] |
| 3 | Téléphone A : « Créer une partie », choisir un code. | La salle d'attente s'ouvre, A est l'hôte. Le code est affiché dans la salle. | [ ] |
| 4 | Téléphone B : « Rejoindre une partie », saisir le code (en minuscules, par exemple). | B arrive dans la salle. A et B se voient l'un l'autre. | [ ] |
| 5 | A et B : prénom, emblème, « Je rejoins la compagnie ». | Les deux présences sont confirmées ; « Commencer la quête » devient actif chez A. Un emblème déjà pris ne peut pas être choisi par l'autre. | [ ] |
| 6 | Avec d'autres téléphones (ou d'autres onglets), rejoindre jusqu'au nombre de places de `config.json` (5). | Chaque arrivée s'affiche chez tout le monde, dans l'ordre d'arrivée. | [ ] |
| 7 | Une personne de plus (6e) essaie de rejoindre avec le même code. | Refus avec « La partie est complète ». | [ ] |
| 8 | Téléphone A : « Commencer la quête ». | Tout le monde passe à la partie, compteur « Tour 1 / 4 ». Seule la personne dont c'est le tour voit les cartes à choisir et les boutons ; les autres voient « Au tour de… ». | [ ] |
| 9 | Jouer les tours : choisir une carte, puis « Le sort est jeté ». | La carte s'affiche chez tout le monde ; la transition « Le sort est jeté pour… » apparaît chez tout le monde, puis le tour passe à la personne suivante. | [ ] |
| 10 | À un tour, tirer une carte à effet durable et jeter le sort. | Le panneau « Effets en cours » apparaît chez tout le monde, avec l'effet et sa durée. | [ ] |
| 11 | Sur n'importe quel téléphone, ouvrir « Effets en cours » et toucher « Échange de butins fait ». | L'effet disparaît chez tout le monde (éclat d'étoiles chez la personne qui a touché). | [ ] |
| 12 | À un tour, toucher « Invoquer un bouclier » puis confirmer. | La transition du bouclier apparaît chez tout le monde ; aucun effet n'est ajouté. | [ ] |
| 13 | Pendant la partie, couper le réseau d'un téléphone (mode avion) une trentaine de secondes, puis le rétablir. | Chez les autres, la personne est affichée « hors ligne » sans être retirée. Au retour du réseau, ce téléphone retrouve la partie là où elle en était, sans rien toucher. | [ ] |
| 14 | Couper le réseau du téléphone dont c'est le tour, attendre une dizaine de secondes. | Chez les autres : « [prénom] est hors ligne. » puis « Passer son tour ». Le toucher affiche « Le tour de [prénom] est passé. » et la partie continue. | [ ] |
| 15 | Fermer l'onglet du jeu sur un téléphone, rouvrir le lien, « Rejoindre une partie », même code, même prénom. | La personne reprend sa place dans la partie, avec son emblème. | [ ] |
| 16 | Recharger la page sur un téléphone pendant la partie. | La partie revient telle quelle, sans rejouer la transition. | [ ] |
| 17 | Pendant la salle et la partie, laisser un téléphone posé sans le toucher plus longtemps que son délai de mise en veille. | L'écran reste allumé (page `https://`). À noter si un navigateur ne le fait pas. | [ ] |
| 18 | Jouer jusqu'au dernier tour (4 tours de chaque personne). | L'écran de fin s'affiche chez tout le monde. | [ ] |
| 19 | Toucher « Nouvelle quête ». | Retour à l'accueil. « Créer une partie » montre de nouveau le code utilisé comme libre. | [ ] |
| 20 | Essayer d'ouvrir `https://ivorynayeli.github.io/romantasy-game/demo.html` et `https://ivorynayeli.github.io/romantasy-game/?ecran=carte`. | La première adresse n'existe pas (page d'erreur de GitHub) ; la seconde ouvre l'accueil. | [ ] |

## Après la partie

- [ ] 21. Console Firebase (https://console.firebase.google.com), projet `romantasy-prod`, `Realtime Database`, onglet `Utilisation` : quelques connexions pendant la partie, retombées à zéro après ; stockage de quelques kilo-octets ; téléchargements de l'ordre de quelques mégaoctets au plus (voir le README, « Surveiller la consommation »).
- [ ] 22. Onglet `Données` du même projet : plus de partie pour le code utilisé après « Nouvelle quête ».

## À noter pour le retour

- Modèles de téléphones et navigateurs utilisés.
- Toute étape en échec, avec ce qui s'est affiché.
- Tout texte, couleur ou bouton qui gêne.
