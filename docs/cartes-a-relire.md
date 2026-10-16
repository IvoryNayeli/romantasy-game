# Cartes à relire

> Fichier **généré** par `scripts/generer-cartes-a-relire.js` à partir de `public/data/cartes.json`. Ne pas le modifier à la main : pour corriger un texte, modifier `docs/cartes-source.md` (sur demande de la propriétaire) puis `cartes.json`, et relancer `node scripts/generer-cartes-a-relire.js`.

## Format de `cartes.json`

Tableau de 40 cartes, dans l'ordre de `docs/cartes-source.md`. Chaque carte est un objet :

| Champ | Obligatoire | Valeur |
|---|---|---|
| `id` | oui | `rev-01` à `rev-20` (Révélations), `epr-01` à `epr-20` (Épreuves) |
| `type` | oui | `revelation` ou `epreuve` (sans accent) |
| `duree` | cartes à effet durable seulement | `prochain_tour` ou `fin_partie` |
| `effet` | cartes à effet durable seulement | libellé court du bandeau d'effets |
| `texte` | oui | texte de la carte, repris tel quel de `docs/cartes-source.md` |

Les champs `duree` et `effet` vont toujours ensemble : les 31 cartes immédiates n'ont ni l'un ni l'autre.

## Révélations (20)

| N° | Identifiant | Texte | Effet durable |
|---|---|---|---|
| 1 | `rev-01` | Une malédiction frappe le groupe. Qui serait la première personne à chercher une solution sur Google ? Échange ton butin avec cette personne. |  |
| 2 | `rev-02` | Le roi organise un grand bal. Qui choisirait vos tenues ? Échange ton butin avec cette personne. |  |
| 3 | `rev-03` | Une prophétie annonce que le trône reviendra à une personne d'entre vous. Qui réorganise déjà la déco du palais ? Échange ton butin avec cette personne. |  |
| 4 | `rev-04` | Un personnage masculin clame : « Je ne laisserai personne lui faire du mal ! » Qui craquerait aussitôt ? Échange ton butin avec cette personne. |  |
| 5 | `rev-05` | Le héros vient de commettre l'impardonnable… mais il est torse nu. Qui lui pardonne en premier ? Échange ton butin avec cette personne. |  |
| 6 | `rev-06` | Sur une porte, on lit : « N'ENTREZ SURTOUT PAS. » Qui entre quand même ? Échange ton butin avec cette personne. |  |
| 7 | `rev-07` | Tout le monde peut choisir une créature magique pour compagnon. Qui serait la personne la plus assortie à une licorne ? Échange ton butin avec cette personne. |  |
| 8 | `rev-08` | Vous devez passer une soirée à la cour sans révéler votre identité. Qui passerait le mieux inaperçu ? Échange ton butin avec cette personne. |  |
| 9 | `rev-09` | Entre une vie paisible avec un homme gentil et une vie dangereuse avec un homme problématique mais beaucoup trop sexy, qui choisit la seconde ? Échange ton butin avec cette personne. |  |
| 10 | `rev-10` | Une potion permet de parler aux animaux pendant une journée. Qui serait la première personne à la tester ? Échange ton butin avec cette personne. |  |
| 11 | `rev-11` | Un grimoire contient toutes les conversations de votre groupe depuis six ans. Qui aurait le courage de le lire ? Échange ton butin avec cette personne. |  |
| 12 | `rev-12` | Le groupe s'infiltre dans un camp ennemi. Qui se fait repérer en deux minutes après avoir marché sur une branche ? Échange ton butin avec cette personne. |  |
| 13 | `rev-13` | Le love interest chuchote : « Tu es à moi. » Qui roule des yeux au lieu de fondre ? Échange ton butin avec cette personne. |  |
| 14 | `rev-14` | On vous propose de sauver le monde ou de dormir douze heures d'affilée. Qui hésite sincèrement ? Échange ton butin avec cette personne. |  |
| 15 | `rev-15` | Vous traversez en secret la forêt enchantée pendant une semaine. Qui aurait pensé aux provisions, à la carte et aux chaussettes de rechange ? Échange ton butin avec cette personne. |  |
| 16 | `rev-16` | Le groupe part à l'aventure avec un seul sac. Qui y glisserait discrètement des douceurs pour tout le monde ? Échange ton butin avec cette personne. |  |
| 17 | `rev-17` | La reine vous invite à un thé royal. Qui connaîtrait l'étiquette sur le bout des doigts ? Échange ton butin avec cette personne. |  |
| 18 | `rev-18` | La première neige tombe sur le royaume. Qui sort aussitôt en profiter ? Échange ton butin avec cette personne. |  |
| 19 | `rev-19` | Chez un vieux marchand de grimoires, une reliure bleu nuit constellée d'étoiles attire votre regard. Qui l'achèterait uniquement pour sa couverture ? Échange ton butin avec cette personne. |  |
| 20 | `rev-20` | Le roi vous charge de retracer les lignées des grandes maisons du royaume. Qui connaîtrait chaque alliance et chaque secret de famille ? Échange ton butin avec cette personne. |  |

## Épreuves (20)

| N° | Identifiant | Texte | Effet durable |
|---|---|---|---|
| 1 | `epr-01` | Dis « Je te suivrai au bout du monde » à la personne à ta gauche, avec le plus de conviction possible. Si cette personne est sous le charme, échangez vos butins. |  |
| 2 | `epr-02` | Une créature magique arrive. Imite son cri ou sa façon de se déplacer. La première personne qui devine la créature échange son butin avec toi. |  |
| 3 | `epr-03` | Le héros t'offre une rose enchantée qui murmure des compliments. Comme elle, murmure trois compliments à la personne de ton choix, puis échangez vos butins. |  |
| 4 | `epr-04` | Le prince et sa promise ouvrent le bal. Avec la personne de ton choix, faites une révérence synchronisée, puis échangez vos butins. |  |
| 5 | `epr-05` | Un barde chante la gloire du héros. Fredonne un air connu, sans les paroles. La première personne qui trouve le titre échange son butin avec toi. |  |
| 6 | `epr-06` | Sort de la cour royale : jusqu'à la fin de la partie, vouvoie tout le monde. Si tu craques, échange ton butin avec la personne que tu as tutoyée. | Vouvoie tout le monde (jusqu'à la fin de la partie) |
| 7 | `epr-07` | Choisis un mot (« amour », « destin », « épée »…) et annonce-le à voix haute. La première personne qui le prononce avant la fin de la partie échange son butin avec toi. | Mot interdit annoncé (jusqu'à la fin de la partie) |
| 8 | `epr-08` | Tu règnes jusqu'à ton prochain tour. Tu peux décréter un seul échange de butins entre deux personnes de ton choix. | Règne : un échange à décréter (jusqu'à son prochain tour) |
| 9 | `epr-09` | Prédis un événement banal pour la suite de la partie (exemple : « Avant la fin, quelqu'un dira “dragon” »). Si ta prophétie se réalise, échange ton butin avec la personne qui l'a réalisée. | Prophétie en cours (jusqu'à la fin de la partie) |
| 10 | `epr-10` | Pense en secret à une créature fantastique (dragon, licorne, griffon…). Les autres te posent des questions à tour de rôle, auxquelles tu réponds seulement par « oui » ou « non ». La première personne qui trouve la créature échange son butin avec toi. |  |
| 11 | `epr-11` | Dis « Le destin a guidé mes pas jusqu'à toi » à la personne à ta droite, avec toute la solennité d'un personnage de légende. Si cette personne rit, échangez vos butins. |  |
| 12 | `epr-12` | Le royaume organise une remise de médailles. Remets une médaille imaginaire à la personne de ton choix en expliquant son exploit, puis échangez vos butins. |  |
| 13 | `epr-13` | Une alliance entre deux royaumes est scellée. Serre la main de la personne à ta droite avec la plus grande solennité, puis échangez vos butins. |  |
| 14 | `epr-14` | Le roi te confie la garde du trésor du royaume. Jusqu'à la fin de la partie, surveille ton butin avec un air très sérieux. Si tu souris, échange ton butin avec la première personne qui s'en aperçoit. | Garde du trésor : ne pas sourire (jusqu'à la fin de la partie) |
| 15 | `epr-15` | La reine te demande de nommer un bébé dragon. Demande des idées aux autres, puis échange ton butin avec la personne dont le nom te plaît le plus. |  |
| 16 | `epr-16` | Le sort du silence est lancé. Jusqu'à ton prochain tour, tu ne parles qu'en chuchotant. Si tu élèves la voix, échange ton butin avec la première personne qui l'a remarqué. | Sort du silence : chuchote (jusqu'à son prochain tour) |
| 17 | `epr-17` | Un sort te métamorphose en chat. Jusqu'à ton prochain tour, miaule à la place de dire « oui » et « non ». Si tu oublies, échange ton butin avec la première personne qui te le rappelle. | Métamorphose en chat : miaule (jusqu'à son prochain tour) |
| 18 | `epr-18` | Sort de l'écho : jusqu'à ton prochain tour, répète les trois derniers mots de chaque phrase de la personne à ta gauche. Si tu te trompes, échange ton butin avec cette personne. | Sort de l'écho : répète la personne à ta gauche (jusqu'à son prochain tour) |
| 19 | `epr-19` | Sort du compliment obligatoire : jusqu'à ton prochain tour, commence par un compliment chaque fois que tu t'adresses à quelqu'un. Si tu oublies, échange ton butin avec la personne à qui tu aurais dû le faire. | Compliment obligatoire (jusqu'à son prochain tour) |
| 20 | `epr-20` | Un portail s'ouvre vers le passé. Raconte un souvenir que tu as d'une personne du groupe, sans la nommer. La première personne qui se reconnaît échange son butin avec toi. |  |

Cartes à effet durable : 9.
