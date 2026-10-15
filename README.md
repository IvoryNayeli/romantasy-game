# romantasy-game

Jeu de soirée multijoueur sur téléphone, sur le thème de la romantasy. Chaque joueur(se) ouvre un simple lien dans son navigateur (rien à installer). L'application joue le rôle de meneur de jeu : elle tire les cartes, annonce les tours et compte jusqu'à la fin. Les butins, eux, sont de vrais sacs que les joueur(se)s s'échangent.

## Lancer le jeu

**Le jeu n'existe pas encore** : cette section sera complétée au fil des phases, et mise à jour à chaque phase qui change la façon de le lancer.

| À partir de | Ce qui sera documenté ici |
|---|---|
| Phase 2 | Comment ouvrir le jeu sur son ordinateur ou sur son téléphone pendant le développement (serveur local), pour voir les écrans. |
| Phase 4 | Comment lancer le jeu avec l'émulateur Firebase local, pour tester la salle d'attente et les parties sans toucher à la vraie base. |
| Phase 7 | Le lien définitif à partager (GitHub Pages) et comment créer une partie avec ses ami(e)s. |

## Développement du projet avec des agents Copilot

> Cette section décrit comment le projet est **construit**, pas comment on y joue. Elle ne s'adresse qu'à la personne qui développe le jeu, avec les agents de développement de VS Code.

- Règles et textes validés : [docs/regles.md](docs/regles.md)
- Décisions du projet : [docs/PROJET.md](docs/PROJET.md)
- Plan des phases : [docs/PLAN.md](docs/PLAN.md)
- État d'avancement : [docs/SUIVI.md](docs/SUIVI.md)

Le projet est construit phase par phase, avec trois agents Copilot définis dans [.github/agents/](.github/agents/) :

| Agent | Rôle |
|---|---|
| `romantasy-chef-de-phase` | Seul agent à lancer. Coordonne la phase, rédige le rapport, fusionne après validation. |
| `romantasy-developpeur` | Implémente la phase (appelé par le chef de phase). |
| `romantasy-testeur` | Vérifie la phase et rédige les rapports de défauts (appelé par le chef de phase). |

### Piloter les agents de développement

Ouvrir ce dossier dans VS Code (`Fichier`, `Ouvrir le dossier`), démarrer une **nouvelle session** en mode agent, choisir `romantasy-chef-de-phase` et écrire l'une de ces phrases :

| Phrase | Effet |
|---|---|
| `Lance la phase N` | Lance ou reprend la phase, jusqu'au rapport de fin. |
| `Phase N, remarques : …` | Consigne les remarques et refait une itération de la phase. |
| `Phase N validée` | Fusionne dans `main`, pose le tag `phase-N` et pousse. |
| `Teste la chaîne` | Essai à blanc : vérifie que les deux autres agents répondent, sans rien modifier. |

À la fin de chaque boucle, un rapport est écrit dans `docs/rapports/phase-N-iteration-M.md`. Aucune phase n'est validée sans un message explicite de la personne qui porte le projet.

## Licence et crédits

À compléter en phase 7 (icônes game-icons.net, licence CC BY 3.0, à créditer).
