FROM node:20-slim

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends gosu wget ca-certificates && \
    rm -rf /var/lib/apt/lists/*

COPY package.json ./
RUN npm install --production

COPY src ./src
COPY public ./public
COPY scripts ./scripts

RUN mkdir -p public/js && \
    wget -O public/js/alpine.js https://cdn.jsdelivr.net/npm/alpinejs@3.13.3/dist/cdn.min.js

RUN chown -R node:node /app

ENV PORT=8001
EXPOSE 8001

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/api/me || exit 1

RUN chmod +x scripts/entrypoint.sh

ENTRYPOINT ["/app/scripts/entrypoint.sh"]
CMD ["node", "src/server.js"]