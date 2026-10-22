# Phase 8, itération 1 : finition et mise en ligne

**État** : prête pour relecture. **Attendu de toi** : relire ce rapport et ouvrir le README, puis choisir comment faire la partie réelle en ligne (point 1 de la section 7). Ensuite, réponds « Phase 8 validée » ou « Phase 8, remarques : … ».

## 1. En bref
Le jeu est prêt à être publié sur `https://ivorynayeli.github.io/romantasy-game/`, avec la base `romantasy-prod`. Les outils de démonstration restent réservés à ton ordinateur, et la check-list de la partie réelle est écrite. La publication ne se déclenche que depuis `main` : la partie en ligne ne peut donc se faire qu'après la fusion, sauf si tu choisis l'autre solution de la section 7.

## 2. Ce qui a été fait
- **Mise en ligne** : un flux GitHub Actions publie le contenu de `public/` sur GitHub Pages à chaque arrivée sur `main`. Il le publie aussi à la demande, avec le bouton « Run workflow » de l'onglet Actions. Seul le dossier du jeu est publié, sans `demo.html` ni `js/demo.js`, et sans la documentation ni les tests. C'est gratuit pour un dépôt public, et le flux n'a besoin d'aucun secret.
- **Base de production** : la page en ligne utilise `romantasy-prod`. En local (ordinateur ou Wi-Fi de la maison), c'est toujours l'émulateur. `?base=dev` force toujours `romantasy-dev`. Une page locale ne peut jamais viser la base de production.
- **Outils de démonstration** : en ligne, `?demo=1`, les écrans fictifs (`?ecran=choix`, `carte`, `attente`, `transition`, `fin`) et la salle fictive sont ignorés, et la page s'ouvre sur l'accueil. La vraie partie (`?ecran=jeu&code=…`) et la vraie salle (`?ecran=salle&code=…`) restent ouvertes. En local, rien ne change.
- **Accessibilité** :
  - **Ajout** : une zone invisible relit aux lecteurs d'écran (TalkBack, VoiceOver) le texte déjà affiché quand la partie change de vue (titre, carte, transition). Aucun texte nouveau, rien ne change à l'écran.
  - **Vérifié et déjà conforme** : langue française déclarée, textes alternatifs des images, libellés des boutons, contour visible du bouton sélectionné, zones à toucher d'au moins 48 px, contrastes, réduction des animations.
- **Carte révélée** : quand le téléphone demande de réduire les animations, la carte pouvait dépasser l'écran de quelques pixels, et même rester trop grande après un changement de taille de l'écran (barre d'adresse qui se replie). C'est corrigé dans ce seul mode : sans la réduction des animations, rien ne change.
- **Icônes game-icons.net** : retirées du travail, comme décidé en phase 7. Les emblèmes sont tes images.
- **README** :
  - « Lancer le jeu » commence par le lien et la façon de jouer avec son groupe.
  - Nouvelle section « Mise en ligne (à faire par la propriétaire du projet) », avec deux réglages à ta charge.
  - Nouvelle section « Surveiller la consommation ».
  - Le jeu en local passe en sous-section, et la section « Licence et crédits » est complétée.
- **Check-list** : `docs/checklist-phase-8.md`, 3 préalables et 22 étapes avec leur résultat attendu.
- **`docs/PROJET.md`** : hébergement, choix de la base et outils de démonstration mis à jour.

## 3. Où le voir, comment le vérifier
| Élément | Comment (fichier, commande ou lien) | Ce que tu dois constater |
|---|---|---|
| README | [README.md](../../README.md) sur la branche `phase-8` | En tête de « Lancer le jeu », le lien `https://ivorynayeli.github.io/romantasy-game/`, puis « Mise en ligne », « Surveiller la consommation » et, en bas, « Licence et crédits ». |
| Check-list | [docs/checklist-phase-8.md](../checklist-phase-8.md) | 3 préalables (source de Pages, règles de production, flux vert), puis les étapes d'une partie réelle. |
| Flux de publication | [.github/workflows/pages.yml](../../.github/workflows/pages.yml) | Publication de `public/` seulement, sur `main` ou à la demande. |
| En local, rien ne change | Lancer l'émulateur et `python3 -m http.server -d public 8000` (README, « Jouer en local »), ouvrir `http://localhost:8000/demo.html` | La liste des écrans de démonstration s'ouvre comme avant. |
| Réglage à faire par toi | GitHub, `Settings` > `Pages` > `Build and deployment` > `Source` : « GitHub Actions » | Faisable dès maintenant ; rien n'est publié tant que le flux ne tourne pas. |
| Règles de production | Depuis le dossier du projet : `firebase deploy --only database --project prod` | Message « Deploy complete! ». Ne publie que les règles de la base. |
| Partie réelle en ligne | La check-list, sur plusieurs téléphones | Demande la publication sur `main` (voir section 7, point 1). |

Tu peux vérifier seule le README, la check-list et la démonstration locale. La partie réelle demande plusieurs téléphones et la mise en ligne.

## 4. Résultats des tests
- `npm test` (suite complète) sur le commit `07b8da9` : **236 réussis, 0 échoué, 0 sauté, 1 à faire**. Le test « à faire » est le risque D2 de la phase 4, déjà accepté.
- `npm run test:rapide`, relancé par le chef de phase sur `07b8da9` : 93 réussis, 0 échoué.
- `tests/navigateur.test.js` (carte révélée) : 5 passages sur 5 côté développeur et 3 sur 3 côté testeur après la correction, contre 2 échecs sur 4 passages avant.
- Tests ajoutés ou adaptés pendant la phase :
  - **Choix de la base** : en ligne, `romantasy-prod` ; jamais la production depuis une page locale (`tests/reseau.test.js`).
  - **Outils de démonstration** : ignorés en ligne, salle fictive sans code comprise ; vraie partie et vraie salle toujours ouvertes (`tests/reseau.test.js`).
  - **Flux de publication** : il publie `public/` sans `demo.html`, et aucun chemin ne commence par `/` dans `public/` (tests rapides).
  - **Zone d'annonce** aux lecteurs d'écran (`tests/navigateur-reseau.test.js`).
  - **Carte révélée** : pas de défilement, même après un changement de taille de l'écran (`tests/navigateur.test.js`).
- **Contrôle du testeur hors suite** : une copie du site, telle que le flux la publiera, a été servie sous `/romantasy-game/`. L'accueil, les règles, la création du code RUNE et la salle se sont chargés sans aucune requête en échec ni erreur, et `demo.html` y renvoie « introuvable ».

## 5. Ce qui n'a pas été vérifié
- Le flux GitHub Actions n'a jamais tourné sur GitHub : il ne peut tourner que depuis `main`.
- La partie sur la base `romantasy-prod` : volontairement, aucun agent ne s'y est connecté, et ses règles ne sont pas encore publiées.
- Le maintien de l'écran allumé en `https`, possible seulement en ligne.
- Une vraie partie sur plusieurs téléphones (Android, iPhone), le rendu réel et le plaisir de jeu : c'est l'objet de la check-list.
- La zone d'annonce avec un vrai lecteur d'écran : seuls sa présence et son texte sont testés.
- La consommation réelle dans la console Firebase.
- La stabilité du test de la carte sur un grand nombre de passages : la cause est corrigée, mais 8 passages réussis ne prouvent pas que l'instabilité a disparu.

## 6. Écarts par rapport au plan
- Icônes game-icons.net : non faites, conformément à ta décision de la phase 7. Seuls les crédits ont été écrits.
- « Contrôle des quotas Firebase » : estimation à partir du code et paragraphe de surveillance dans le README, sans aucun mécanisme ajouté, car aucun risque réel n'est apparu (section 11).
- Correction de la carte révélée (défaut D4) : elle touche la mise en page, ce qui n'était pas prévu dans cette phase. Elle n'agit qu'avec la réduction des animations.

## 7. Décisions prises par les agents
1. **À trancher : comment faire la partie réelle en ligne.** Le jeu n'est publié que depuis `main`, et seule la validation de la phase met quelque chose sur `main`. Deux possibilités :
   - **A (le plus simple)** :
     1. Tu fais les deux réglages (source de Pages, règles de production), puis tu écris « Phase 8 validée » après la relecture.
     2. Je fusionne et le site part en ligne.
     3. Tu fais ensuite la check-list. Ce qui ne va pas devient des remarques, traitées dans une nouvelle itération rouverte à ta demande.
   - **B** : tu autorises la branche `phase-8` dans `Settings > Environments > github-pages`, et le développeur ajoute temporairement `phase-8` au flux. Tu fais la check-list en ligne avant de valider, puis le développeur retire `phase-8` du flux.
2. Outils de démonstration réservés au local (section 2) : `demo.html` et `js/demo.js` ne sont pas publiés, et les paramètres de démonstration sont ignorés en ligne (`public/js/navigation.js`).
3. `?base=dev` reste utilisable sur la page en ligne, pour essayer sur la base de développement.
4. Zone invisible d'annonce aux lecteurs d'écran. Les tests visuels l'ignorent dans leurs mesures, sinon ils la prendraient pour du texte coupé.
5. Nouvelles formulations de documentation (pas des textes du jeu) : les titres « Jouer avec son groupe » et « Surveiller la consommation », et les crédits. Ces crédits disent que les fonds d'étoiles, les constellations et les petits symboles au trait ont été « dessinés pour le projet ».
6. Défaut D3 (voir section 9), laissé tel quel : à toi de décider.

## 8. Fichiers modifiés et commits
D'après `git diff --stat main...phase-8` : 18 fichiers, 346 lignes ajoutées et 50 retirées.

- Jeu :
  - `public/js/app.js`, `public/js/firebase-config.js`, `public/js/reseau.js`
  - `public/js/navigation.js` (nouveau)
  - `public/index.html`, `public/css/style.css`
- Mise en ligne : `.github/workflows/pages.yml` (nouveau).
- Documentation :
  - `README.md`, `docs/PROJET.md`, `docs/SUIVI.md`
  - `docs/checklist-phase-8.md` (nouveau)
- Tests :
  - `tests/reseau.test.js`, `tests/navigateur.test.js`, `tests/navigateur-reseau.test.js`, `tests/navigateur-charte.test.js`
  - `tests/ecrans-design.test.js`, `tests/aide-navigateur.js`, `tests/aide-emulateur.js`

Commits :
- [`27663c2`](https://github.com/IvoryNayeli/romantasy-game/commit/27663c2) lancement de l'itération 1
- [`54c3567`](https://github.com/IvoryNayeli/romantasy-game/commit/54c3567) base de production pour la page en ligne
- [`f4a3e8b`](https://github.com/IvoryNayeli/romantasy-game/commit/f4a3e8b) outils de démonstration réservés au local
- [`08af035`](https://github.com/IvoryNayeli/romantasy-game/commit/08af035) mise en ligne par GitHub Pages (public/ seulement)
- [`0756344`](https://github.com/IvoryNayeli/romantasy-game/commit/0756344) README de mise en ligne, consommation, crédits et check-list
- [`f58f512`](https://github.com/IvoryNayeli/romantasy-game/commit/f58f512) accessibilité, annonce des changements de vue
- [`336c75d`](https://github.com/IvoryNayeli/romantasy-game/commit/336c75d) itération 1 passée en test
- [`eb1ac8a`](https://github.com/IvoryNayeli/romantasy-game/commit/eb1ac8a) salle fictive sans code ignorée en ligne (D1)
- [`7cb2d42`](https://github.com/IvoryNayeli/romantasy-game/commit/7cb2d42) formulations neutres (D2)
- [`cd5bbbc`](https://github.com/IvoryNayeli/romantasy-game/commit/cd5bbbc) carte révélée sans transition avec la réduction des animations (D4)
- [`07b8da9`](https://github.com/IvoryNayeli/romantasy-game/commit/07b8da9) règle de la carte limitée à la réduction des animations (D4)

## 9. Défauts
Le testeur a été appelé deux fois : une vérification complète sur `336c75d`, puis une vérification limitée aux corrections sur `07b8da9`, avec le verdict « tout passe ».

| Défaut | Gravité | Reproduction | Attendu / obtenu | Statut |
|---|---|---|---|---|
| D1 | mineure | En ligne, ouvrir `?ecran=salle&hote=1&autres=1` (salle fictive sans code) | Attendu : l'accueil. Obtenu : « Rejoindre une partie » | corrigé (`eb1ac8a`) |
| D2 | mineure | « elle » désignait une personne : README (l'hôte) et check-list (deux fois) ; un cas ancien du même genre trouvé ensuite dans `docs/PROJET.md` | Attendu : formulation neutre | corrigé (`7cb2d42`) |
| D3 | à trancher | `README.md`, ligne 3 : « Les butins, eux, sont de vrais sacs que les convives s'échangent » | La règle « butin, jamais sac » vise les textes du jeu ; ceci est la présentation du README | ouvert, à ta décision |
| D4 | test instable | `tests/navigateur.test.js`, carte révélée à 360 x 640 : défilement de 3 px une fois sur deux ou trois | Cause : transitions de 1 ms appliquées quand on réduit les animations | corrigé (`cd5bbbc`, `07b8da9`) |

## 10. Tes remarques précédentes
Sans objet (itération 1).

## 11. Consommation Firebase
Estimation tirée du code, à confirmer dans la console. Où regarder : console Firebase, projet `romantasy-prod`, Realtime Database, onglet « Utilisation » (Usage). Le README le décrit dans « Surveiller la consommation ».
- **Connexions simultanées** : une par téléphone, avec au plus 10 parties en même temps (une par code) de 5 places, soit au plus 50. Plafond gratuit : 100.
- **Stockage** : environ 5 Ko par partie, quelques dizaines de Ko au plus. Plafond : 1 Go.
- **Téléchargements** : 1 à 2 Mo au plus par partie complète, soit plusieurs milliers de parties par mois. Plafond : 10 Go par mois.
- **Écritures** : environ 60 par partie.
- **Écoutes de la base** : seulement le chemin de la partie, jamais la racine (vérifié par le testeur).

Après ta partie réelle, tu devrais voir au plus 5 connexions pendant la partie et quelques Mo téléchargés dans la journée.

## 12. Comment répondre
- « Phase 8 validée » : fusion dans `main`, tag `phase-8`, push. Avec la possibilité A, c'est cette fusion qui met le jeu en ligne.
- « Phase 8, remarques : … » : nouvelle itération de la phase. C'est là que tu indiques si tu choisis la possibilité B, et ta décision sur D3.
- Il n'y a pas de phase 9 au plan.
