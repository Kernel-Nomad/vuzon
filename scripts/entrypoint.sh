#!/bin/sh
set -e
# Asegura que el volumen montado en /app/sessions sea escribible por el usuario node del contenedor.

if [ -d "/app/sessions" ]; then
    chown -R node:node /app/sessions
fi

exec gosu node "$@"