FROM node:24-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY src ./src
COPY public ./public
COPY scripts ./scripts

RUN npm run build

FROM node:24-slim AS runtime

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates && \
    rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY scripts ./scripts
COPY --from=builder /app/dist/public ./dist/public

RUN chown -R node:node /app

USER node

ENV PORT=8001
EXPOSE 8001

CMD ["node", "src/server.js"]
