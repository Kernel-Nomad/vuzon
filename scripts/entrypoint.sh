#!/bin/sh
set -e

if [ -d "/app/sessions" ]; then
    echo "🔧 Ajustando permisos de /app/sessions..."
    chown -R node:node /app/sessions
fi

exec gosu node "$@"