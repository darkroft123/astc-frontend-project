FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm config set maxsockets 5 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-factor 20 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-timeout 300000 && \
    (npm ci --legacy-peer-deps --no-audit --no-fund || npm install --legacy-peer-deps --no-audit --no-fund)
# tailwindcss@4 arrastra lightningcss, cuyo binario nativo vive en un paquete opcional
# separado (lightningcss-linux-arm64-gnu) con campos "os"/"cpu"/"libc". Bajo emulacion
# QEMU npm no lo instala y next build muere con
# "Cannot find module '../lightningcss.linux-arm64-gnu.node'".
# Se extrae a mano con npm pack: deterministico, no reconcilia el arbol de deps y cubre
# las dos rutas que prueba lightningcss/node/index.js (el paquete y el fallback .node).
RUN --mount=type=cache,target=/root/.npm \
    set -e; \
    LC_V=$(node -p "require('/app/node_modules/lightningcss/package.json').version"); \
    cd /tmp; \
    npm pack "lightningcss-linux-arm64-gnu@$LC_V" --silent; \
    mkdir -p /app/node_modules/lightningcss-linux-arm64-gnu; \
    tar -xzf lightningcss-linux-arm64-gnu-*.tgz; \
    cp package/lightningcss.linux-arm64-gnu.node package/package.json /app/node_modules/lightningcss-linux-arm64-gnu/; \
    cp package/lightningcss.linux-arm64-gnu.node /app/node_modules/lightningcss/; \
    test -f /app/node_modules/lightningcss-linux-arm64-gnu/lightningcss.linux-arm64-gnu.node
COPY . .
ENV NEXT_BUILD_NO_LINT=1
RUN --mount=type=cache,target=/app/.next/cache \
    npm run build

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]


