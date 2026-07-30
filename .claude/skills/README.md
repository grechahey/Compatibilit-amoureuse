# Skills Compound Engineering (embarquées)

Ces skills sont **copiées directement dans le dépôt** (et non installées via un
plugin) pour qu'elles soient disponibles à chaque session Claude Code, **y
compris les sessions web éphémères**.

## Pourquoi copiées et non installées via plugin ?

Sur le web, les skills sont chargées **au démarrage** de la session, à partir de
`.claude/skills/`. Déclarer un plugin de marketplace dans `settings.json`, ou
l'installer via un hook `SessionStart`, ne marche pas de façon fiable : le
conteneur repart vierge à chaque session et l'installation arrive trop tard (ou
pas du tout). Les skills placées ici sont chargées nativement, sans marketplace,
sans installation, sans réseau — zéro course de timing.

## Contenu

Sous-ensemble « cœur » du workflow compound engineering :

- **ce-plan** — plan structuré pour un travail multi-étapes
- **ce-brainstorm** — cadrage/exploration d'idées en exigences
- **ce-code-review** — revue de code structurée
- **ce-debug** — boucle de diagnostic de bugs
- **ce-work** — exécution d'un plan de bout en bout
- **ce-compound** — capitalisation d'un apprentissage dans le dépôt

## Mettre à jour / ajouter des skills

Source : https://github.com/EveryInc/compound-engineering-plugin (v3.20.0, MIT).
Le plugin complet contient 32 skills. Pour en ajouter une, copier son dossier
`skills/<nom>/` depuis le dépôt source vers `.claude/skills/<nom>/`.

Licence d'origine conservée dans `LICENSE` (MIT, © 2025 Every).
