# ── Stage 1: Build ──────────────────────────────
FROM node:20-slim AS build

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    libvips-dev \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg62-turbo-dev \
    libgif-dev \
    librsvg2-dev \
    libpixman-1-dev \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy root workspace files
COPY package.json package-lock.json ./
COPY packages/api/ packages/api/

# Install dependencies (workspace-aware)
RUN npm ci --workspace=packages/api

# Generate Prisma client & build TypeScript from the package directory
WORKDIR /app/packages/api
RUN npx prisma generate
RUN npx tsc

# Copy openapi.yaml into dist/ so the docs route can find it at runtime
RUN cp src/openapi.yaml dist/openapi.yaml

# ── Stage 2: Production ────────────────────────────
FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    libvips \
    libcairo2 \
    libpango-1.0-0 \
    libjpeg62-turbo \
    libgif7 \
    librsvg2-2 \
    libpixman-1-0 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app/packages/api

# Copy built artifacts from build stage
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/packages/api/node_modules ./node_modules
COPY --from=build /app/packages/api/dist ./dist
COPY --from=build /app/packages/api/prisma ./prisma
COPY --from=build /app/packages/api/package.json ./package.json

ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "dist/index.js"]
