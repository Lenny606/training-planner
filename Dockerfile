# ==========================================
# STAGE 1: Base & Dependencies
# ==========================================
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package*.json ./

# ==========================================
# STAGE 2: Development (Pro lokální hot-reload)
# ==========================================
FROM base AS development
# Instalujeme veškeré závislosti včetně devDependencies
RUN npm ci
# Kopírujeme zbytek kódu (v docker-compose bude přepsán bind mountem)
COPY . .
ENV NODE_ENV=development
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ==========================================
# STAGE 3: Builder (Pro produkční sestavení)
# ==========================================
FROM base AS builder
RUN npm ci
COPY . .
# Sestavení klientského i serverového bundle (TanStack Start)
RUN npm run build

# ==========================================
# STAGE 4: Production Run (Šetrný produkční kontejner)
# ==========================================
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Kopírujeme pouze potřebné soubory z builderu a base stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
# Spuštění produkčního preview / serveru
CMD ["npm", "run", "start"]
