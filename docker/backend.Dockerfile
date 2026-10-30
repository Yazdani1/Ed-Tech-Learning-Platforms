# syntax=docker/dockerfile:1.7
# Ed-Tech Learning Platform: Docker images for local work and checks.
#   dev  - toolchain only; source is bind-mounted by docker/compose.dev.yml and docker/compose.test.yml
#          (backend `npm run dev`, tests, and the opt-in Next.js container)
#   prod - the backend built like Render builds it; only used by `npm run docker:build` to prove it builds.
#          Production itself stays on Render (render.yaml).

# Same major as .nvmrc (CI and local); a newer Node changes FormData/File behaviour in the jsdom tests
ARG NODE_VERSION=22

# ---------- dev / test toolchain (glibc, like the Playwright image) ----------
FROM node:${NODE_VERSION}-trixie-slim AS dev
ENV HUSKY=0 \
    NEXT_TELEMETRY_DISABLED=1 \
    CHOKIDAR_USEPOLLING=true \
    WATCHPACK_POLLING=true
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates wget \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
# Pre-create mount points so named volumes are initialised owned by the non-root user
RUN mkdir -p /app/backend/node_modules /app/frontend/node_modules /app/frontend/.next \
    && chown -R node:node /app
USER node
EXPOSE 5000

# ---------- backend build ----------
FROM node:${NODE_VERSION}-alpine AS build
ENV HUSKY=0 CI=true
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json backend/.npmrc ./
RUN --mount=type=cache,id=npm-cache,target=/root/.npm npm ci
COPY backend/ ./
RUN npm run build && npm prune --omit=dev

# ---------- backend production runtime ----------
FROM node:${NODE_VERSION}-alpine AS prod
RUN apk add --no-cache tini
ENV NODE_ENV=production PORT=5000
WORKDIR /app
COPY --from=build --chown=node:node /app/backend/node_modules ./node_modules
COPY --from=build --chown=node:node /app/backend/package.json ./package.json
COPY --from=build --chown=node:node /app/backend/dist ./dist
USER node
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD wget -qO- http://127.0.0.1:5000/api/health || exit 1
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/server.js"]
