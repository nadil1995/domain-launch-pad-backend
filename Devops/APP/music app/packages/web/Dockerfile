# Next.js Web App - Phase 7

# Build stage
FROM node:20-slim AS builder

WORKDIR /app/packages/web

# Copy web package files from context root
COPY packages/web/package*.json ./
COPY packages/web/src ./src
COPY packages/web/public ./public
COPY packages/web/tailwind.config.ts ./
COPY packages/web/postcss.config.js ./
COPY packages/web/next.config.js ./
COPY packages/web/tsconfig.json ./

RUN npm install --legacy-peer-deps
RUN npm run build

# Production stage
FROM node:20-slim

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=http://api:4000

COPY --from=builder /app/packages/web/node_modules ./node_modules
COPY --from=builder /app/packages/web/.next ./.next
COPY --from=builder /app/packages/web/package.json ./package.json
COPY --from=builder /app/packages/web/next.config.js ./next.config.js

EXPOSE 3000

CMD ["npm", "start"]
