#!/usr/bin/env bash
# Télécharge les moteurs Prisma via curl (qui respecte HTTPS_PROXY) puis les
# place là où Prisma les attend. Utile dans les environnements où le downloader
# interne de Prisma n'emprunte pas le proxy (ECONNRESET au `prisma generate`).
#
# Dans un environnement réseau classique, ce script est inutile :
# `npm install` télécharge les moteurs tout seul.
set -euo pipefail

cd "$(dirname "$0")/.."

HASH="$(node -e "console.log(require('@prisma/engines-version/package.json').prisma.enginesVersion)")"

# Détection de la cible binaire Prisma (Linux glibc + OpenSSL 3 par défaut).
TARGET="${PRISMA_BINARY_TARGET:-debian-openssl-3.0.x}"
BASE="https://binaries.prisma.sh/all_commits/$HASH/$TARGET"
ENG="node_modules/@prisma/engines"
mkdir -p "$ENG"

dl() { # url out
  local i
  for i in 1 2 3 4; do
    if curl -fsS --max-time 120 -o "$2.gz" "$1"; then
      gunzip -f "$2.gz"
      echo "✔ $(basename "$2")"
      return 0
    fi
    echo "… nouvelle tentative ($i) : $1"
    sleep $((2 ** i))
  done
  echo "✗ échec du téléchargement : $1" >&2
  return 1
}

echo "Engine version : $HASH"
echo "Cible          : $TARGET"
dl "$BASE/libquery_engine.so.node.gz" "$ENG/libquery_engine-$TARGET.so.node"
dl "$BASE/schema-engine.gz" "$ENG/schema-engine-$TARGET"
chmod +x "$ENG/schema-engine-$TARGET"

echo
echo "Moteurs installés. Exportez ces variables avant les commandes Prisma :"
echo "  export PRISMA_QUERY_ENGINE_LIBRARY=\"\$(pwd)/$ENG/libquery_engine-$TARGET.so.node\""
echo "  export PRISMA_SCHEMA_ENGINE_BINARY=\"\$(pwd)/$ENG/schema-engine-$TARGET\""
echo "  export PRISMA_CLI_QUERY_ENGINE_TYPE=library"
