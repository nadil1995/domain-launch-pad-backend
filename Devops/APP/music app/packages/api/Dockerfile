FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/api/package.json packages/api/
RUN npm ci --workspace=packages/api
COPY packages/api/prisma ./packages/api/prisma
RUN cd packages/api && npx prisma generate
COPY packages/api/src ./packages/api/src
COPY packages/api/tsconfig.json ./packages/api/
RUN npm run build -w packages/api

FROM node:20-slim
WORKDIR /app
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY packages/api/prisma ./packages/api/prisma
COPY --from=build /app/packages/api/dist ./packages/api/dist
ENV NODE_ENV=production
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && node packages/api/dist/index.js"]
