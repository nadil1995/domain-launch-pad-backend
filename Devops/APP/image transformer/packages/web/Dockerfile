# ── Stage 1: Build ──────────────────────────────
FROM node:20-slim AS build

WORKDIR /app

# Copy workspace root package.json (without lock file — ensures platform-correct optional deps)
COPY package.json ./
COPY packages/web/package.json packages/web/

# Install dependencies for the target platform
RUN npm install --workspace=packages/web

# Copy source and build
COPY packages/web/ packages/web/
RUN npm run build -w packages/web

# ── Stage 2: Serve with nginx ───────────────────
FROM nginx:alpine

COPY --from=build /app/packages/web/dist /usr/share/nginx/html
COPY packages/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
