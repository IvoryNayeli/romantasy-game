# Projet romantasy-game (Claude Code)

Les règles communes du projet sont celles des agents Copilot, source unique, importée ici :

@.github/copilot-instructions.md

## Correspondance avec Claude Code

Le projet peut être mené avec GitHub Copilot ou avec Claude Code. Les fichiers de `.github/` restent la **source unique** des règles et des rôles ; les fichiers de `.claude/` n'en sont que des renvois, avec les seules adaptations propres à Claude Code. Pour changer une règle ou un rôle, modifier le fichier de `.github/`, jamais seulement celui de `.claude/`.

| Rôle | Copilot | Claude Code |
|---|---|---|
| Chef de phase (orchestrateur, seul point d'entrée) | `.github/agents/romantasy-chef-de-phase.agent.md` | skill `/romantasy-chef-de-phase` (`.claude/skills/romantasy-chef-de-phase/SKILL.md`), qui tourne dans la session principale |
| Développeur (sous-agent) | `.github/agents/romantasy-developpeur.agent.md` | `.claude/agents/romantasy-developpeur.md` |
| Testeur (sous-agent) | `.github/agents/romantasy-testeur.agent.md` | `.claude/agents/romantasy-testeur.md` |

Démarrer une nouvelle session, puis écrire par exemple `/romantasy-chef-de-phase Lance la phase 3`. Les quatre demandes sont les mêmes qu'avec Copilot : « Lance la phase N », « Phase N, remarques : … », « Phase N validée », « Teste la chaîne ».

Hors de ce skill, une session Claude Code ordinaire n'avance pas une phase de sa propre initiative : elle répond aux questions et renvoie vers `/romantasy-chef-de-phase`.
