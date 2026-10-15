# romantasy-game

Jeu de soirée multijoueur pour téléphone, sur le thème de la romantasy. Chaque joueuse ouvre un simple lien dans son navigateur (rien à installer). L'application joue le rôle de meneuse de jeu : elle tire les cartes, annonce les tours et compte jusqu'à la fin. Les butins, eux, sont de vrais sacs que les joueuses s'échangent.

- Règles et textes validés : [docs/regles.md](docs/regles.md)
- Décisions du projet : [docs/PROJET.md](docs/PROJET.md)
- Plan des phases : [docs/PLAN.md](docs/PLAN.md)
- État d'avancement : [docs/SUIVI.md](docs/SUIVI.md)

## Développement par phases

Le projet est construit phase par phase, avec trois agents Copilot définis dans [.github/agents/](.github/agents/) :

| Agent | Rôle |
|---|---|
| `romantasy-chef-de-phase` | Seul agent à lancer. Coordonne la phase, rédige le rapport, fusionne après validation. |
| `romantasy-developpeur` | Implémente la phase (appelé par le chef de phase). |
| `romantasy-testeur` | Vérifie la phase et rédige les rapports de défauts (appelé par le chef de phase). |

### Utilisation

Ouvrir ce dossier dans VS Code (`Fichier`, `Ouvrir le dossier`), démarrer une **nouvelle session** en mode agent, choisir `romantasy-chef-de-phase` et écrire l'une de ces trois phrases :

| Phrase | Effet |
|---|---|
| `Lance la phase N` | Lance ou reprend la phase, jusqu'au rapport de fin. |
| `Phase N, remarques : …` | Consigne les remarques et refait une itération de la phase. |
| `Phase N validée` | Fusionne dans `main`, pose le tag `phase-N` et pousse. |

À la fin de chaque boucle, un rapport est écrit dans `docs/rapports/phase-N-iteration-M.md`. Aucune phase n'est validée sans ton message explicite.

### S'en défaire à la fin du projet

- Les garder : ils ne coûtent rien et documentent la construction du projet.
- Les supprimer : `git rm -r .github/agents` puis commit. Ils restent récupérables dans l'historique git.

## Licence et crédits

À compléter en phase 7 (icônes game-icons.net, licence CC BY 3.0, à créditer).
