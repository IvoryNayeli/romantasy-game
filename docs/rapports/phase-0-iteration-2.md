# Phase 0, itération 2 : fondations

**État** : prête pour relecture. **Attendu de toi** : relire les changements (section 3), confirmer ou corriger les formulations inclusives, lancer l'essai à blanc des agents (toujours à faire), puis écrire « Phase 0 validée » ou « Phase 0, remarques : … ».

## 1. En bref

- Tes 7 remarques sont traitées. La première (écriture inclusive) change beaucoup de textes et demande ta relecture attentive, notamment des cartes.
- L'écriture inclusive est appliquée aux règles, aux 40 cartes, au README et aux documents du projet, avec une convention écrite pour les phases suivantes.
- Les agents n'ont toujours jamais tourné : l'essai à blanc reste ta vérification n° 4 du rapport de l'itération 1.

## 2. Ce qui a été fait

- **Remarques consignées** mot pour mot dans `docs/remarques/phase-0.md`, avant toute modification.
- **Écriture inclusive** (remarque 1) :
  - une convention écrite dans `docs/PROJET.md` : parenthèses pour les noms et les accords (joueur(se), voyageur(euse), chacun(e), prêt(e)), formulation neutre quand c'est plus simple (« cette personne », « la première personne qui… », « la personne à ta gauche ») ;
  - appliquée à `docs/regles.md`, aux 40 cartes de `docs/cartes-source.md`, au README, au plan, aux instructions communes et à l'agent testeur ;
  - le plan de la phase 1 prévoit un test automatique qui cherche les formes exclusivement féminines dans les textes du jeu ;
  - le testeur et le chef de phase ont une consigne de contrôle d'inclusivité.
- **README** (remarques 2, 3 et 4) :
  - nouvelle section « Lancer le jeu » : elle dit que le jeu n'existe pas encore et indique à partir de quelle phase chaque mode de lancement sera documenté (phase 2 : serveur local, phase 4 : émulateur Firebase, phase 7 : lien définitif) ;
  - la section « Utilisation » est renommée « Piloter les agents de développement » et placée sous un titre « Développement du projet avec des agents Copilot », avec un encadré qui précise que c'est la construction du projet, pas le jeu ;
  - la section « S'en défaire à la fin du projet » est retirée ;
  - la règle « mettre à jour la section Lancer le jeu quand une phase change la façon de lancer » est ajoutée au plan, aux instructions communes, au chef de phase et au testeur.
- **Règles** (remarques 5, 6 et 7) :
  - « Au fil des échanges » devient « Au fil de la partie » ;
  - la phrase sur les effets durables est marquée validée ;
  - la phrase « Terminez les échanges en cours avant d'ouvrir vos butins. » est supprimée, avec une mention explicite de ne pas l'ajouter.

## 3. Où le voir, comment le vérifier

| Élément | Comment | Ce que tu dois constater |
|---|---|---|
| Remarques consignées | Ouvrir `docs/remarques/phase-0.md` | Tes 7 remarques, mot pour mot. |
| 1. Écriture inclusive, règles | Ouvrir `docs/regles.md` | « voyageur(euse) », « joueur(se) », « chacun(e) », « prêt(e) ». Le texte de l'accueil, du « Comment ça marche ? » et de la fin est inclusif. |
| 1. Écriture inclusive, cartes | Ouvrir `docs/cartes-source.md` | Plus aucun « elle », « celle », « voisine » ni « joueuse » pour désigner un(e) joueur(se). Compter toujours 20 Révélations, 20 Épreuves, 9 cartes 🔁. |
| 1. Convention | Ouvrir `docs/PROJET.md`, ligne « Écriture inclusive » | La convention en une phrase. |
| 2. Lancer le jeu | Ouvrir `README.md`, section « Lancer le jeu » | Un tableau qui indique qu'il sera documenté aux phases 2, 4 et 7. Dis-moi si tu préfères autre chose. |
| 3. Section agents | Ouvrir `README.md`, section « Développement du projet avec des agents Copilot » | Un encadré dit que cela décrit la construction du projet, pas le jeu. Le mot « Utilisation » a disparu. |
| 4. « S'en défaire » | Chercher ce titre dans `README.md` | Absent. |
| 5. « Au fil de la partie » | Ouvrir `docs/regles.md`, « But du jeu » | La formule est celle que tu as demandée. |
| 6. Phrase validée | `docs/regles.md`, sous « Déroulement » | Marquée « validée ». |
| 7. Phrase refusée | `docs/regles.md`, « Écran de fin » | Absente, avec la consigne de ne pas l'ajouter. |
| Sur GitHub | https://github.com/IvoryNayeli/romantasy-game/commit/dfce5fc | Les changements ligne par ligne. |
| Essai à blanc des agents | Nouvelle session dans le dossier du projet, agent `romantasy-chef-de-phase`, écrire « Teste la chaîne » | Voir le rapport de l'itération 1, vérifications 4 et 5. |

Tout se vérifie seule, sauf l'essai à blanc, qui demande une nouvelle session.

## 4. Résultats des tests

Il n'y a pas de test automatique en phase 0. Contrôles faits par recherche dans les fichiers :

- Formes féminines (`joueuse`, `voyageuse`, `chacune`, `celle`, `voisine`, `meneuse`, `prête`) dans tous les documents hors rapports et remarques : plus aucune occurrence, sauf dans les consignes qui les interdisent (instructions communes, plan, convention du projet).
- Dans `docs/cartes-source.md`, une recherche des pronoms et formes féminines (`elle`, `celle`, `joueuse`, `voisine`, `chacune`, `compagne`, `première qui`) ne trouve que des cas légitimes : « Comme elle » (la rose de la carte Épreuve 3), « la première neige », « la première personne ».
- Anciennes formulations (« Au fil des échanges », « S'en défaire », « ### Utilisation », « Terminez les échanges ») : absentes des documents de référence. La seule mention de la phrase refusée est dans `docs/SUIVI.md` et `docs/regles.md`, pour interdire de l'ajouter.
- Comptage : 20 Révélations, 20 Épreuves, 9 cartes à effet durable (lignes numérotées commençant par 🔁).
- Vérification des erreurs de format par l'éditeur sur `.github/`, `docs/` et `README.md`, relancée après les modifications : aucune erreur.

## 5. Ce qui n'a pas été vérifié

- **Le fonctionnement des agents** : comme à l'itération 1, je ne peux pas les lancer. L'essai à blanc reste à faire.
- **La qualité des formulations inclusives** : j'ai appliqué une convention, mais je ne peux pas juger si le rendu te plaît à la lecture. Les cartes sont les textes les plus touchés, donc ta relecture est nécessaire (section 7).
- **Le rendu à l'écran** de formes comme « le/la joueur(se) » : cela dépendra de la phase 2.
- **La taille des textes** : les formulations avec parenthèses sont un peu plus longues, ce qui compte pour les cartes déjà longues. Sera contrôlé à la phase 2.

## 6. Écarts par rapport au plan

- **Pas de lancement par le chef de phase** : cette itération a été faite directement dans cette session, pas par la boucle développeur / testeur, qui n'a jamais tourné. Il n'y a donc pas eu de contrôle indépendant du testeur : mes vérifications (section 4) sont celles d'un seul agent.
- **Remarque 2 faite en deux temps** : le README contient maintenant une section « Lancer le jeu » avec son calendrier, mais pas de commande, puisque le jeu n'existe pas encore.

## 7. Décisions prises par les agents

À contester si besoin.

1. **Format inclusif choisi** : la forme que tu as donnée en exemple, avec parenthèses, pour les noms et les accords. Là où un pronom féminin désignait une joueuse, j'ai préféré une formulation neutre plutôt qu'une forme comme « il(elle) ».
2. **Reformulations plus larges que de simples parenthèses**, à relire :
   - « elle » et « celle » deviennent « cette personne » ou « la personne… » ;
   - « la première qui… » devient « la première personne qui… » ;
   - « ta voisine de gauche » devient « la personne à ta gauche » (idem pour la droite) ;
   - « à tes compagnes » devient « aux autres » ;
   - « Les autres te posent chacune leur tour des questions » devient « Les autres te posent des questions à tour de rôle » ;
   - « reine » (carte Épreuve 8) devient « souverain(e) », et « gardienne du trésor » devient « gardien(ne) du trésor » ;
   - « l'une d'entre vous » devient « l'un(e) d'entre vous », ou « une personne du groupe » ;
   - « héroïne de légende » devient « héros ou héroïne de légende » ;
   - « Qui serait la plus assortie à une licorne ? » devient « Qui serait la personne la plus assortie à une licorne ? » ;
   - sur les cartes Épreuve 1, 3 et 11, « échange ton butin avec elle » devient « échangez vos butins » pour éviter de répéter « cette personne ».
3. **Libellés d'effet** des cartes durables adaptés en conséquence (par exemple « Souverain(e) : un échange à décréter », « Transformé(e) en chat : miaule »).
4. **Cartes laissées telles quelles, à trancher** :
   - Révélation 9 : « un homme gentil… un homme problématique mais beaucoup trop sexy » ;
   - Révélation 4 : « Un personnage masculin clame… ».
   Ces deux cartes ne concernent pas le genre des joueur(se)s, mais des personnages. Veux-tu les neutraliser (« une personne gentille… », « Un personnage clame… ») ou les garder ?
5. **Le mot « propriétaire »** reste dans les documents internes : il est épicène, donc inclusif.
6. **Fichier `checks.json` inconnu** : un fichier de configuration d'analyse de code C/C++ est apparu à la racine du dossier du projet à 10 h 14. Il ne vient pas de mes actions et n'a rien à voir avec le jeu. Je ne l'ai ni ajouté à git, ni supprimé ni ignoré. Il vient probablement d'une extension de VS Code. À toi de décider : le supprimer ou l'ajouter au `.gitignore`.
7. **Apostrophes** : les documents utilisent l'apostrophe droite (`'`). Dans mon rapport de l'itération 1, j'avais parlé d'apostrophes courbes pour les cartes, ce qui n'est pas le cas dans le fichier. À trancher à la phase 1, lors de la conversion en JSON (point ajouté à `docs/SUIVI.md`).

## 8. Fichiers modifiés et commits

Commit de l'itération : [`dfce5fc`](https://github.com/IvoryNayeli/romantasy-game/commit/dfce5fc), « phase 0 (itération 2) : écriture inclusive, README, règles, remarques consignées ». Sorties de `git diff --stat b398d6e..dfce5fc` : 10 fichiers, 133 ajouts, 90 suppressions.

- `.github/agents/romantasy-chef-de-phase.agent.md`, `.github/agents/romantasy-testeur.agent.md`, `.github/copilot-instructions.md`
- `README.md`
- `docs/PLAN.md`, `docs/PROJET.md`, `docs/SUIVI.md`
- `docs/cartes-source.md`, `docs/regles.md`
- `docs/remarques/phase-0.md` (nouveau)

Le commit de ce rapport vient ensuite.

## 9. Défauts

Aucun défaut connu, mais aucun testeur n'est intervenu : il n'y a pas de rapport de test pour la phase 0.

## 10. Tes remarques précédentes

| Remarque | Traitement | Où le vérifier |
|---|---|---|
| 1. Projet inclusif | **Faite**, avec des points à relire (section 7, points 1, 2 et 4) | `docs/regles.md`, `docs/cartes-source.md`, `docs/PROJET.md` |
| 2. README : comment lancer le jeu | **Faite** : section « Lancer le jeu » avec le calendrier des phases 2, 4 et 7. Elle sera complétée de commandes réelles à ces phases, et une règle impose de la tenir à jour. | `README.md`, `docs/PLAN.md` |
| 3. README : renommer « Utilisation » | **Faite** : « Piloter les agents de développement », sous un titre et un encadré qui précisent que c'est le développement, pas le jeu | `README.md` |
| 4. README : retirer « s'en défaire » | **Faite** | `README.md` |
| 5. « Au fil de la partie » | **Faite** | `docs/regles.md` |
| 6. Phrase des effets durables | **Faite** : marquée validée | `docs/regles.md`, `docs/SUIVI.md` |
| 7. Pas de phrase « Terminez les échanges… » | **Faite** : supprimée, avec interdiction de l'ajouter | `docs/regles.md`, `docs/SUIVI.md` |

## 11. Consommation Firebase

Sans objet : aucune connexion Firebase à ce stade.

## 12. Comment répondre

- « Phase 0 validée » : je fusionne `phase-0` dans `main`, pose le tag `phase-0` et pousse.
- « Phase 0, remarques : … » : nouvelle itération. Pense à répondre aux deux questions de la section 7 (cartes 4 et 9, fichier `checks.json`).
- « Lance la phase 1 » est refusé tant que la phase 0 n'est pas validée. Avant la phase 1, installe **Node.js** (`sudo apt install nodejs`).
