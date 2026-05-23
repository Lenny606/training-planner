#!/bin/sh
set -e

# Pokud jsme v development režimu
if [ "$NODE_ENV" = "development" ]; then
  echo "Checking node_modules..."
  # Pokud node_modules neexistuje nebo je package.json/package-lock.json novější než node_modules
  if [ ! -d "node_modules" ] || [ package.json -nt node_modules ] || [ package-lock.json -nt node_modules ]; then
    echo "package.json or package-lock.json changed. Updating node_modules..."
    npm install
    # Aktualizujeme časovou značku složky node_modules, aby odpovídala dokončení instalace
    touch node_modules
  else
    echo "node_modules is up to date."
  fi
fi

# Spustíme hlavní CMD
exec "$@"
