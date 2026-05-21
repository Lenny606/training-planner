# 05. Specifikace Základního Frontend UI a Testovací Homepage (Base Frontend UI & Test Homepage)

Tento dokument detailně specifikuje **základní uživatelské rozhraní (Frontend UI)** a **testovací domovskou stránku (Homepage)**. Cílem je vytvořit přehledný, rychlý a vizuálně atraktivní testovací panel (Dashboard), který umožní vývojářům a testerům snadno inicializovat databázi, přepínat uživatelské role, simulovat offline režim, sledovat synchronizační frontu a vizualizovat data načtená z Mongoose (MongoDB) a Dexie.js (IndexedDB).

Rozhraní striktně dodržuje designové standardy projektu: **sleek dark mode, glassmorphismus, moderní typografii (Inter/Outfit) a prémiovou barevnou paletu**.

---

## 🎯 Cíle Návrhu (Objectives)

1. **Testovací Control Center**: Rychlý panel pro spuštění seedování databáze, promazání dat a reset lokálního IndexedDB úložiště.
2. **Přepínání uživatelských profilů (User Impersonation)**: Jednoduchý přepínač mezi dvěma testovacími účty (Trenér Tomáš vs. Atlet Jan) pro okamžité ověření oprávnění a načtení specifických dat bez nutnosti plné integrace Auth0/Clerk v této fázi.
3. **Diagnostika synchronizačního cyklu (Sync & Offline Monitor)**: Vizuální panel indikující stav sítě (`Online` / `Offline` simulace), velikost lokální `syncQueue` (Outbox fronta v Dexie) a tlačítko pro ruční spuštění synchronizačního cyklu.
4. **Data Explorer**: Pěkně nastylované sekce pro zobrazení katalogu cviků (seskupené podle kategorií), šablon tréninků (Workout Templates) a aktuálních tréninkových jednotek (Training Sessions) pro vybraného uživatele.
5. **No Auth Required**: Pro účely Fáze 2 a 3 je celá homepage přístupná bez nutnosti předchozího přihlašování, přičemž aktivní uživatel je držen v Zustand store.

---

## 🎨 1. Vizuální Styl & UX (Premium Dark Theme)

Aplikace bude používat moderní dark theme s jemnými gradienty a poloprůhlednými panely (glassmorphismus).

* **Barevná paleta (HSL)**:
  * Background: `hsl(224, 25%, 8%)` (Hluboká tmavě modrá/šedá)
  * Card Background (Glass): `hsla(224, 25%, 12%, 0.7)` s borderem `1px solid hsla(224, 20%, 20%, 0.5)`
  * Primary Accent: `hsl(250, 85%, 65%)` (Fialová / Indigo)
  * Success (Online): `hsl(142, 70%, 45%)` (Svěží zelená)
  * Warning (Offline/Fallback): `hsl(38, 90%, 55%)` (Teplá oranžová)
  * Error (Danger): `hsl(346, 80%, 55%)` (Moderní korálově červená)
* **Typografie**:
  * Rodina: `Outfit`, sans-serif (načtená z Google Fonts)
  * Nadpisy: `font-bold tracking-tight text-white`
* **Vizuální efekty**:
  * `backdrop-filter: blur(12px)` na panelech.
  * Zářivý stín / záře (`pulseGlow`) pro aktivní elementy.
  * Hladké přechody (`transition-all duration-300`) pro všechny interaktivní prvky a hover stavy.

---

## 📂 2. Struktura Homepage Komponent

Homepage bude implementována v souboru `src/routes/index.tsx` a bude se skládat z následujících logických bloků:

```
┌────────────────────────────────────────────────────────────────────────┐
│  🌐 TRAINING PLANNER - TEST PANEL (Header s indikací online/offline)   │
├──────────────────────────────────────┬─────────────────────────────────┤
│  ⚙️ DATABASE CONTROL CENTER           │  👥 ACTIVE USER SWITCHER        │
│  [ Seed Database ]  [ Wipe DB ]     │  Active: Jan Athlete (Athlete)  │
│  [ Reset Dexie ]    [ Trigger Sync ]│  [ Switch to Coach Tomas ]      │
├──────────────────────────────────────┴─────────────────────────────────┤
│  ⚡ OFFLINE & SYNC ENGINE DIAGNOSTICS                                  │
│  Network status: [ ONLINE ] (Simulate: [Toggle Offline])               │
│  Sync Queue Status: 0 pending items                                    │
│  [ Sync Queue Log Console (Glass Box) ]                                │
├────────────────────────────────────────────────────────────────────────┤
│  🏋️ DATA EXPLORER & DIAGNOSTICS                                        │
│  ┌─────────────────────────┐ ┌───────────────────┐ ┌─────────────────┐ │
│  │ Exercises by Category   │ │ Workout Templates │ │ Active Cycles   │ │
│  │ - Strength (5)          │ │ - Upper Body      │ │ - Strength 2026 │ │
│  │ - Combat (7)            │ │ - Boxing Cardio   │ │   (Micro 1)     │ │
│  └─────────────────────────┘ └───────────────────┘ └─────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ 3. Technické Specifikace Prvků

### A. Hlavička a Status Síťové Vrstvy (Header & Network Status)
* **Stav**: Detekuje `navigator.onLine` a ukládá ho do Zustand storu.
* **Simulátor**: Umožňuje ručně přepnout stav na "simulovaný offline režim" (nastaví se příznak v Zustand storu, který bude respektovat repozitář a sync engine).
* **UI**: Kulatý pulzující indikátor. Zelený pro Online, Oranžový pro Offline (s textem "OFFLINE - DEXIE BACKUP ACTIVE").

### B. Panel Správy Databází (Database Control Center)
Panel obsahuje 4 hlavní akční tlačítka napojená na Server Functions na backendu a lokální operace v Dexie:
1. **Seed Database** (`saveSeedDataFn`):
   * Zavolá serverovou funkci, která vymaže stávající tabulky v MongoDB a nahraje do nich kompletní testovací data z `04-data.md`.
   * Po úspěšném dokončení automaticky vyvolá synchronizaci s lokálním Dexie.js (stáhne nová data do paměti prohlížeče).
2. **Wipe Remote DB** (`clearDatabaseFn`):
   * Bezpečně promaže všechny kolekce v MongoDB (vhodné pro testování stavu "čistý štít").
3. **Reset Local Dexie**:
   * Kompletně vymaže IndexedDB databázi v prohlížeči.
4. **Trigger Sync** (`syncOfflineQueue`):
   * Okamžitě vyvolá zpracování položek v lokální synchronizační frontě (Outbox queue).

### C. Přepínač Uživatelských Účtů (Active User Impersonation)
* **Funkcionalita**: Umožňuje jedním kliknutím změnit aktivního uživatele v aplikaci.
* **Profily**:
  1. **Tomas Coach** (Coach, UUID: `c2069e2c-381c-43df-8121-66385f09623e`)
  2. **Jan Athlete** (Athlete, UUID: `a318b76c-38fa-4e78-98e3-466d11ff3e43`)
* **Ukládání**: Zvolené ID je uloženo v Zustand storu a v `localStorage` (při reloadu stránky zůstává uživatel přihlášen). Všechny dotazy na plány, cykly a tréninkové jednotky se filtrují podle tohoto aktivního ID.

### D. Offline & Sync Engine Diagnostics
* **Outbox Inspector**: Zobrazuje seznam objektů čekajících na odeslání v `localDb.syncQueue`. U každého prvku zobrazuje:
  * Typ operace (`SAVE` / `DELETE`)
  * Název entity (`Workout`, `TrainingSession`, `Cycle`)
  * Timestamp zařazení
  * Tlačítko pro ruční smazání položky z fronty (pro debugovací účely).
* **Console Logger**: Malé okno se skleněným pozadím, které zobrazuje poslední logy synchronizačního enginu (např. *"12:21:05 - Sync start"*, *"12:21:06 - TrainingSession s1069... úspěšně uložena na server"*, *"12:21:07 - Sync dokončen"*).

### E. Data Explorer (Diagnostická Vizualizace)
Zobrazuje data načtená z databáze (s prioritou Dexie -> Server).
1. **Katalog cviků (Exercise Catalog)**:
   * Sbalitelná akordeonová struktura podle kategorií (`strength`, `combat`, `cardio`, `mobility`, `stretch`).
   * Zobrazuje název cviku, výchozí metriky a popisek.
2. **Tréninkové Šablony (Workout Templates)**:
   * Mřížka karet zobrazující dostupné šablony tréninků pro daného uživatele.
   * Každá karta ukazuje název, popis, cílový čas a počet přiřazených cviků.
3. **Plánovací Cykly (Cycles)**:
   * Zobrazení aktivního Makrocyklu, přidruženého Mezocyklu a aktuálního Mikrocyklu.
   * Vizuální časová osa (Timeline) od - do.
4. **Kalendář Tréninků (Training Sessions)**:
   * Seznam tréninkových jednotek seřazený podle data.
   * Indikace stavu (`planned` = modrá/šedá, `completed` = zelená, `skipped` = červená).
   * Zobrazení poznámek a počtu splněných sérií.

---

## ⚡ 4. Návrh Serverových Funkcí (Server Functions API)

Pro podporu testovací homepage vytvoříme/rozšíříme následující serverové RPC funkce v `src/server/functions.ts` (nebo v příslušných `.functions.ts` souborech):

```typescript
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { connectToDatabase } from './db/connection'
import { UserRepository } from './db/repositories/UserRepository'
import { ExerciseRepository } from './db/repositories/ExerciseRepository'
import { WorkoutRepository } from './db/repositories/WorkoutRepository'
import { CycleRepository } from './db/repositories/CycleRepository'
import { TrainingSessionRepository } from './db/repositories/TrainingSessionRepository'

/**
 * Serverová funkce pro kompletní seedování databáze
 * Vymaže stávající data a nahraje testovací sadu (Fitness & Box)
 */
export const seedDatabaseFn = createServerFn('POST', async () => {
  await connectToDatabase()
  
  // 1. Promazání kolekcí
  await Promise.all([
    mongoose.connection.db.collection('users').deleteMany({}),
    mongoose.connection.db.collection('exercises').deleteMany({}),
    mongoose.connection.db.collection('workouts').deleteMany({}),
    mongoose.connection.db.collection('cycles').deleteMany({}),
    mongoose.connection.db.collection('trainingsessions').deleteMany({})
  ])

  // 2. Vložení testovacích dat z 04-data.md
  // ... (volání seed logiky)
  
  return { success: true, message: 'Databáze byla úspěšně seedována.' }
})

/**
 * Serverová funkce pro kompletní promazání databáze
 */
export const wipeDatabaseFn = createServerFn('POST', async () => {
  await connectToDatabase()
  
  await Promise.all([
    mongoose.connection.db.collection('users').deleteMany({}),
    mongoose.connection.db.collection('exercises').deleteMany({}),
    mongoose.connection.db.collection('workouts').deleteMany({}),
    mongoose.connection.db.collection('cycles').deleteMany({}),
    mongoose.connection.db.collection('trainingsessions').deleteMany({})
  ])

  return { success: true, message: 'Všechna data z MongoDB byla smazána.' }
})
```

---

## 🧪 5. Verifikační Scénáře (Testing Scenarios)

Vývojář a tester může na této zjednodušené homepage ověřit následující klíčové procesy:

### Scénář A: První spuštění (Cold Start)
1. Uživatel otevře web. Databáze je prázdná, lokální Dexie je prázdné.
2. Uživatel klikne na **Seed Database**.
3. UI zobrazí indikátor načítání, server provede seed a vrátí úspěch.
4. Na homepage se okamžitě zobrazí načtené cviky, šablony a aktivní tréninky.

### Scénář B: Simulace offline uložení a syncu (Fáze 3)
1. Uživatel přepne network status na **OFFLINE** (simulovaný režim).
2. Uživatel klikne u libovolného tréninku na "Označit jako dokončený" nebo upraví poznámku.
3. Zustand store okamžitě zapíše změnu do lokálního **Dexie.js** a přidá akci do **syncQueue** (Outbox).
4. V panelu diagnostiky se ihned objeví nová položka v `syncQueue` (např. `SAVE - TrainingSession - s1069...`).
5. Uživatel přepne status zpět na **ONLINE**.
6. Spustí se autosync (nebo uživatel klikne na **Trigger Sync**).
7. Položka zmizí z diagnostické fronty a v logovacím okně se objeví zpráva o úspěšné synchronizaci se serverem.
8. Uživatel obnoví stránku a ověří, že změny jsou bezpečně zapsány v MongoDB.

### Scénář C: Přepínání kontextu uživatele
1. Výchozí uživatel je **Jan Athlete**. Zobrazují se tréninky pro fitness rozvoj.
2. Uživatel klikne na přepínač a zvolí **Tomas Coach**.
3. Celé rozhraní se překreslí: zmizí tréninky atleta a zobrazí se přehled z pohledu trenéra (katalog šablon, možnost spravovat globální cviky).
