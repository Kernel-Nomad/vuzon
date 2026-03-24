FROM node:20-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY src ./src
COPY public ./public
COPY scripts ./scripts

RUN npm run build

FROM node:20-slim AS runtime

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends gosu ca-certificates && \
    rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY scripts ./scripts
COPY --from=builder /app/dist/public ./dist/public

RUN chown -R node:node /app

ENV PORT=8001
EXPOSE 8001

HEALTHCHECK --interval=30s --timeout=10s --start-period=25s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:' + process.env.PORT + '/healthz').then((res) => { if (!res.ok) process.exit(1); }).catch(() => process.exit(1))"]

RUN chmod +x scripts/entrypoint.sh

ENTRYPOINT ["/app/scripts/entrypoint.sh"]
CMD ["node", "src/server.js"]
