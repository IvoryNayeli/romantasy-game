# Instructions communes du projet romantasy-game

Jeu de soirée multijoueur sur téléphone, sur le thème de la romantasy. Page web (HTML, CSS, JavaScript sans framework), Firebase Realtime Database au plan Spark gratuit. Détails dans `docs/PROJET.md`.

Le projet peut aussi être mené avec Claude Code : `CLAUDE.md` et `.claude/` (skill `romantasy-chef-de-phase`, sous-agents `romantasy-developpeur` et `romantasy-testeur`) ne sont que des renvois vers ce fichier et vers `.github/agents/`, qui restent la source unique des règles et des rôles. Toute règle se change ici.

## Avant toute action

1. Lire `docs/SUIVI.md` (état des phases, journal, défauts ouverts), puis `docs/remarques/phase-N.md` et le dernier rapport de la phase concernée. Ne pas lire `docs/journal-archive.md` ni les rapports des phases validées, sauf besoin précis.
2. Pour les règles du jeu et les textes affichés, la source unique est `docs/regles.md`. Les cartes validées sont dans `docs/cartes-source.md`. Ne rien réécrire ni reformuler sans demande explicite.
3. Pour les choix techniques et de design : `docs/PROJET.md`. Le plan des phases est dans `docs/PLAN.md` : lire seulement la section de la phase concernée.
4. En cas de doute sur un choix non écrit, poser la question à la propriétaire plutôt que d'inventer.
5. Tests : `npm run test:rapide` (secondes, sans navigateur), `npm run test:navigateur` (minutes, seulement si `public/` a changé), `npm test` (suite complète). Sortie courte : ne pas coller de longs journaux dans les échanges.

## Langue et style

- Tout en français : interface, commentaires, documentation, messages de commit.
- Messages de commit courts, un par étape cohérente, préfixés par la phase, par exemple `phase 1 : ajout des 40 cartes`.
- Pas d'emojis dans les documents ou les messages, sauf ceux de l'interface (emblèmes).
- **Écriture inclusive partout** (interface, règles, cartes, documentation) : formulation neutre d'abord (« chaque personne », « tout le monde », « les autres », « Je suis là »), parenthèses seulement en dernier recours ; convention dans `docs/PROJET.md`. Ne jamais écrire « joueuse », « elle » ou « celle » (ni une forme exclusivement masculine) pour désigner un(e) joueur(se). Identifiants de code neutres (`joueur`, `joueurs`).
- Pas de refonte, de fonctionnalité ou de dépendance non demandées. Rester simple.

## Déroulement par phases

- Une phase = une branche `phase-N`. `main` ne contient que des phases validées. Ne jamais commiter directement sur `main`, sauf fusion de validation par le chef de phase.
- Ne jamais commencer la phase N+1 tant que `docs/SUIVI.md` n'indique pas la phase N comme `validée`.
- Le statut `validée` n'est écrit que par `romantasy-chef-de-phase`, et seulement après un message explicite de la propriétaire dans la conversation en cours (« Phase N validée »). Jamais déduit d'un silence ou d'un « ça a l'air bien ».
- Chaque phase se termine par un rapport pour la propriétaire (`docs/rapports/phase-N-iteration-M.md`, voir `docs/rapports/MODELE.md`), puis un arrêt. On ne propose pas d'enchaîner.
- Mettre à jour `docs/SUIVI.md` avant chaque commit de fin d'étape.
- Le README garde deux parties distinctes : le jeu (section « Lancer le jeu ») et le développement avec les agents Copilot. Dès qu'une phase change la façon de lancer ou d'ouvrir le jeu, mettre à jour « Lancer le jeu » dans la même phase.

## Git

- Après tout changement de fichiers du projet : commit puis push de la branche, systématiquement.
- Le dépôt est public : aucun secret, aucune clé privée, aucun jeton dans les fichiers ni dans l'historique.
- Ne jamais réécrire l'historique publié (`push --force`, `reset --hard` sur une branche poussée) sans accord explicite.
- Le dépôt distant est `git@github-romantasy:IvoryNayeli/romantasy-game.git`. Cette adresse utilise une clé de déploiement limitée à ce seul dépôt : ne pas la modifier, ne pas essayer d'accéder à d'autres dépôts.
- L'identité git est locale au dépôt (adresse de type `noreply`). Ne pas la remplacer.

## Contraintes techniques à ne jamais enfreindre

- Tout reste gratuit. Jamais de plan Blaze, de service payant ni de carte bancaire.
- Les tests automatiques visent uniquement l'émulateur Firebase local et refusent de tourner sur une adresse non locale.
- Les écoutes Firebase portent sur le chemin de la partie en cours, jamais sur la racine de la base.
- Réglages (4 tours, 5 joueur(se)s maximum) uniquement dans `public/data/config.json`, jamais écrits en dur ailleurs.
- Vocabulaire des textes du jeu : « butin », jamais « poche » ni « sac ».
