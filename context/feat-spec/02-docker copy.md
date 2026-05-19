# 02. Specifikace Docker Prostředí (Docker Environment Specification)
READ GEMINI.MD first

Tento dokument detailně specifikuje a navrhuje **lokální vývojové prostředí v Dockeru** pro projekt **Tréninkový Plánovač (Training Planner)**. Prostředí zajišťuje plnou reprodukovatelnost, izolaci a automatické spouštění závislostí (MongoDB) i samotné aplikace s podporou hot reloadu.

---

## 🎯 Cíle Návrhu (Objectives)

1.  **Zero-configuration start**: Vývojář může spustit celý stack (MongoDB + Web App) jediným příkazem `docker compose up`.
2.  **Perzistence dat**: Lokální data v MongoDB zůstanou zachována i po restartu nebo smazání kontejnerů.
3.  **Hot Reload**: Kód běžící uvnitř vývojového kontejneru reaguje na změny provedené na hostiteli (WSL).
4.  **Bezpečnost**: Pověření a citlivá data jsou předávána výhradně přes `.env.development` soubor, který je chráněn `.gitignore`.
5.  **Multi-stage sestavení**: Dockerfile podporuje jak rychlý vývoj (development), tak optimalizovanou a bezpečnou produkční verzi.

---

## 🧬 Architektura Lokálního Prostředí

Prostředí sestává ze tří hlavních služeb spojených v interní síti typu `bridge`.

```mermaid
flowchart TD
    subgraph Host ["Hostitel (WSL / Windows)"]
        Browser["Prohlížeč (localhost:3000)"]
        DatabaseUI["Mongo Express UI (localhost:8081)"]
        SourceCode["Zdrojové soubory (Volume Mount)"]
    end

    subgraph Docker ["Docker Compose Network (training-network)"]
        direction TB
        WebApp["Služba: web-app\n(Node.js / TanStack Start)\nPort: 3000"]
        MongoDB["Služba: mongodb\n(Mongo:7.0)\nPort: 27017"]
        MongoExpress["Služba: mongo-express\n(Web UI)\nPort: 8081"]
        
        MongoVolume[("Volume: mongodb_data")]
    end

    Browser <--> WebApp
    DatabaseUI <--> MongoExpress
    SourceCode <--- Mount ---> WebApp
    
    WebApp <--> MongoDB
    MongoExpress <--> MongoDB
    MongoDB <---> MongoVolume
```

---

## 📄 1. Specifikace Multi-stage Dockerfile (`Dockerfile`)

Dockerfile je navržen s ohledem na velikost a rychlost sestavení pomocí multi-stage procesu postaveného na `node:20-alpine`.

```dockerfile
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
```

---

## ⚙️ 2. Konfigurace Docker Compose (`docker-compose.yml`)

Hlavní konfigurační soubor definuje služby, síť a svazek (volume) pro MongoDB.

```yaml
version: '3.8'

services:
  # 1. Databáze MongoDB
  mongodb:
    image: mongo:7.0-jammy
    container_name: tp-mongodb
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USER:-admin}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD:-secret-pass-123}
      MONGO_INITDB_DATABASE: training-planner
    volumes:
      - mongodb_data:/data/db
    networks:
      - training-network

  # 2. Databázové webové rozhraní (Mongo Express)
  mongo-express:
    image: mongo-express:latest
    container_name: tp-mongo-express
    restart: unless-stopped
    ports:
      - "8081:8081"
    environment:
      ME_CONFIG_MONGODB_ADMINUSERNAME: ${MONGO_ROOT_USER:-admin}
      ME_CONFIG_MONGODB_ADMINPASSWORD: ${MONGO_ROOT_PASSWORD:-secret-pass-123}
      ME_CONFIG_MONGODB_SERVER: mongodb
      ME_CONFIG_BASICAUTH_USERNAME: ${ME_USER:-admin}
      ME_CONFIG_BASICAUTH_PASSWORD: ${ME_PASSWORD:-admin}
    depends_on:
      - mongodb
    networks:
      - training-network

  # 3. Webová aplikace (TanStack Start)
  web-app:
    build:
      context: .
      target: development
    container_name: tp-web-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      MONGODB_URI: mongodb://${MONGO_ROOT_USER:-admin}:${MONGO_ROOT_PASSWORD:-secret-pass-123}@mongodb:27017/training-planner?authSource=admin
      GEMINI_API_KEY: ${GEMINI_API_KEY}
    volumes:
      - .:/app
      - /app/node_modules # Zabrání přepsání nodemodules z hostitele
    depends_on:
      - mongodb
    networks:
      - training-network

volumes:
  mongodb_data:
    name: tp_mongodb_data

networks:
  training-network:
    name: tp_network
    driver: bridge
```

---

## 🔒 3. Integrace Environmentálních Proměnných

Hodnoty pro konfiguraci se načítají ze souboru `.env.development`, který by měl být nastaven následovně:

```bash
# Docker root pověření pro MongoDB
MONGO_ROOT_USER=tp_dev_user
MONGO_ROOT_PASSWORD=complex_dev_password_987

# Mongo Express Basic Auth
ME_USER=admin
ME_PASSWORD=secret_express_auth

# Konfigurace pro aplikaci (uvnitř kontejneru komunikuje s "mongodb" službou)
MONGODB_URI=mongodb://tp_dev_user:complex_dev_password_987@mongodb:27017/training-planner?authSource=admin

# Google Gemini API Klíč (musí zůstat tajný)
GEMINI_API_KEY=AIzaSyD_your_gemini_api_key_here
```

---

## 💻 4. Příručka pro Vývojáře (Developer Commands)

### Spuštění celého prostředí (Hot-reload)
```bash
docker compose up -d --build
```
*Tento příkaz sestaví vývojové prostředí, spustí MongoDB na pozadí a namontuje zdrojový kód z hostitele.*

### Zobrazení logů aplikace
```bash
docker compose logs -f web-app
```

### Zastavení prostředí se zachováním dat
```bash
docker compose down
```

### Úplný reset prostředí (Včetně smazání databáze)
```bash
docker compose down -v
```

---

## 🧪 5. Integrační a Smoke Testy v Dockeru

Když běží prostředí v Dockeru, je nutné ověřit, že:
1.  **MongoDB Port**: Je přístupný z hostitele na `localhost:27017`.
2.  **Mongo Express**: Je funkční na `http://localhost:8081` (přihlášení pomocí `ME_USER` / `ME_PASSWORD`).
3.  **Web App**: Správně komunikuje s MongoDB a odpovídá na `http://localhost:3000`.

Tato konfigurace poskytuje plně izolované, bezpečné a seniorně navržené lokální vývojové prostředí odpovídající standardům moderního webového vývoje.