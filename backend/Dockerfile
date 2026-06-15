# Backend image: builds the NestJS app and keeps source + dev deps so the
# TypeORM (ts-node) migration and seed scripts can run at container start.
FROM node:20-bookworm-slim

WORKDIR /app

# Build tools for native deps (bcrypt) when a prebuilt binary isn't available.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000

# docker-compose overrides this to run migrations + seed before starting.
CMD ["node", "dist/main.js"]
