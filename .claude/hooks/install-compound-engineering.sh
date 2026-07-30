#!/usr/bin/env bash
# SessionStart hook : rend le plugin "compound-engineering" disponible
# à chaque session Claude Code (y compris les sessions web éphémères).
#
# Contexte : déclarer le plugin dans .claude/settings.json
# (extraKnownMarketplaces + enabledPlugins) ne suffit pas sur le web.
# Le marketplace tiers n'est pas cloné/installé automatiquement au démarrage.
# Ce hook exécute l'installation (idempotente) à chaque session.
#
# Le hook ne doit JAMAIS faire échouer le démarrage de session : il se
# termine toujours avec le code 0, même en cas d'erreur réseau.

set -u

MARKETPLACE="EveryInc/compound-engineering-plugin"
PLUGIN="compound-engineering@compound-engineering-plugin"

log() { printf '[compound-engineering] %s\n' "$1" >&2; }

# Déjà installé et activé ? On ne fait rien (démarrage rapide).
if claude plugin list 2>/dev/null | grep -q "compound-engineering@compound-engineering-plugin"; then
  log "Plugin déjà installé — rien à faire."
  exit 0
fi

log "Installation du plugin compound-engineering…"

# Ajoute le marketplace (idempotent). Déjà déclaré via extraKnownMarketplaces,
# mais on force le clone/refresh du cache ici.
claude plugin marketplace add "$MARKETPLACE" >/dev/null 2>&1 \
  || log "Avertissement : impossible d'ajouter le marketplace (réseau ?)."

# Installe le plugin (idempotent).
if claude plugin install "$PLUGIN" >/dev/null 2>&1; then
  log "Plugin installé avec succès."
else
  log "Avertissement : installation du plugin échouée (réseau ?). Réessai à la prochaine session."
fi

exit 0
