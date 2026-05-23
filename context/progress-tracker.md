# Progress Tracker: Tréninkový Plánovač (Training Planner)

Tento dokument slouží jako **paměť projektu** a hlavní přehled stavu implementace. Mapuje jednotlivé fáze vývoje, zaznamenává již dokončené architektonické kroky, aktuální úkoly a plánuje bezprostředně následující etapy.

---

## 📊 Celkový Stav Projektu

* **Aktuální Fáze**: `Fáze 4: Frontend Core & Drag and Drop`
* **Celkový progres**: ██████████████░░░░░ **75%**
* **Poslední aktualizace**: 23. května 2026

---

## 🗺️ Plán Fází Vývoje & Status

| Fáze | Modul / Popis | Stav | Priorita |
| :--- | :--- | :--- | :--- |
| **Fáze 1** | **Inicializace projektu a kostra aplikace** (TanStack Start, Tailwind v4, AI SDK, Testy, Env) | 🟢 Dokončeno | 🔴 Vysoká |
| **Fáze 2** | **Databázová vrstva a lokální úložiště** (Dexie.js, Mongoose UUID integrace, Mongoose schemas) | 🟢 Dokončeno | 🔴 Vysoká |
| **Fáze 3** | **Zustand Offline Store a Sync Engine** (Outbox fronta, synchronizační cyklus, rekonciliace dat) | 🟢 Dokončeno | 🔴 Vysoká |
| **Fáze 4** | **Frontend Core & Drag and Drop** (DnD-kit s touch podporou, layouty, správa časových bloků) | ⏳ V progresu | 🟡 Střední |
| **Fáze 5** | **AI Asistent (Chytré generování a úpravy)** (Vercel AI SDK, Gemini API integrace, streamování) | 💤 Čeká | 🟡 Střední |
| **Fáze 6** | **PWA a Testování** (Serwist Service Worker, offline fallback, Vitest & Playwright spuštění) | 💤 Čeká | 🟢 Nízká |

> **Vysvětlivky stavů:**
> * 🟢 **Dokončeno** — Plně implementováno, otestováno a nasazeno.
> * ⏳ **V progresu** — Aktuálně se na něm pracuje.
> * 💤 **Čeká** — Připraveno k zahájení po dokončení předchozích kroků.

---

## 🛠️ Historie Provedených Kroků (Project Changelog)

### Květen 2026
- [x] **Architektonická revize specifikací**:
  - Provedena hloubková kontrola pěti původních specifikací v `context/`.
  - Identifikována a opravena rizika (CastError u Mongoose ObjectId, debounced offline ztráta dat, blokování skrolování u DnD-kit na mobilech, SSR dehydratační pády při offline režimu).
- [x] **Zápis architektonických oprav do hlavních specifikací**:
  - Aktualizována **[Databázová vrstva (02)](file:///home/tomas/my-projects/training-planner/context/02_databazova_vrstva.md)** (UUID primární klíče).
  - Aktualizována **[API Vrstva (03)](file:///home/tomas/my-projects/training-planner/context/03_api_vrstva.md)** (dotaz `findById` u serverových funkcí, Zod UUID validace).
  - Aktualizován **[Frontend a UX (04)](file:///home/tomas/my-projects/training-planner/context/04_frontend_a_ux.md)** (synchronní Zustand-Dexie zápisy, mobilní sensors delay konfigurace).
  - Aktualizován **[Offline Režim (05)](file:///home/tomas/my-projects/training-planner/context/05_offline_rezim.md)** (sekvenční Outbox synchronizační cyklus).
- [x] **Vytvoření Specifikace Inicializace**:
  - Vytvořen a detailně rozpracován soubor **[01-skeleton-initialization.md](file:///home/tomas/my-projects/training-planner/context/feat-spec/01-skeleton-initialization.md)**.
- [x] **Inicializace Kostry Aplikace (Fáze 1)**:
  - Inicializován **TanStack Start** framework a nakonfigurovány Vite (`vite.config.ts`), TypeScript (`tsconfig.json`) s relativními cestami a aliasy.
  - Nainstalovány produkční závislosti (`ai`, `@ai-sdk/google`, `zod`, `dexie`) a vývojové závislosti (`vitest`, `playwright`, `@testing-library/jest-dom`, `fake-indexeddb`).
  - Plně nastaven **Tailwind CSS v4** s prémiovou barevnou paletou (dark mode primary/secondary/accent), skleněnými efekty (`.glass-panel`) a pulzujícími zářemi (`pulseGlow`).
  - Vytvořeny zabezpečené environmentální šablony (`.env.example`, `.env.development`, `.env.production`) a nastaven robustní `.gitignore`.
  - Nakonfigurován unit a integrační testovací framework **Vitest** (`vitest.config.ts`, `tests/setup.ts` s automatickým mockováním IndexedDB přes `fake-indexeddb` a `navigator.onLine`).
  - Nakonfigurován E2E testovací framework **Playwright** (`playwright.config.ts`) s přednastavenými profily pro Chromium a emulaci Pixel 5 pro Touch Sensor.
- [x] **Nastavení Lokálního Docker Vývojového Prostředí & Optimalizace (Fáze 2 - Docker)**:
  - Vytvořen optimalizovaný multi-stage `Dockerfile` s build a dev/prod targety.
  - Vytvořena orchestrace `docker-compose.yml` pro Mongo 7.0 (`tp-mongodb`), Mongo Express (`tp-mongo-express`) a webovou aplikaci (`tp-web-app`).
- [x] **Mongoose, Zod a Repository Layer (Fáze 2 - Backend DB)**:
  - Implementováno robustní Singleton připojení `connection.ts` chráněné proti znovupřipojování v dev prostředí a s dynamickou detekcí URI.
  - Vytvořena kompletní Mongoose schémata a Zod validátory se String UUID primárními klíči pro všechny modely se schema-level validacemi.
  - Vytvořena Repository vrstva pro všechny modely s podporou pro klientsky generovaná UUID a inteligentní `save()` kontrolou.
  - Napsány a úspěšně spuštěny robustní integrační testy (`database.test.ts`) s 100% úspěšností (7/7 testů prochází).
- [x] **Seeding a Testovací Data (Fáze 2 - Data Seeding)**:
  - Vytvořena kompletní a realistická specifikace testovacích dat v souboru `04-data.md`.
  - Implementován robustní, samočinný seeder skript `seed.ts` s plnou typovou a Mongoose kontrolou.
- [x] **IndexedDB (Dexie.js) Lokální Vrstva (Fáze 2 - Lokální DB)**:
  - Vytvořena lokální databáze `localDb.ts` na frontendu s Dexie.js.
  - Definována schémata pro offline entity a frontu synchronizace `syncQueue` (Outbox).
- [x] **Zustand Offline Store a Sync Engine (Fáze 3)**:
  - Implementováno propojení Zustand storu (`useStore.ts`) s Dexie.js (synchronní zápis) a zařazení do Outbox fronty.
  - Vytvořen Sync Engine cyklus (`syncEngine.ts`) pro debounced odesílání změn na server.
- [x] **Prémiová Knihovna Znovupoužitelných Komponent (Fáze 4)**:
  - Vytvořena modulární, premium UI komponentní knihovna s pěti designovými variantami (`Button.tsx`, `Input.tsx` s neonovým fokusem a asynchronní vyhledávací `SelectButton.tsx` se skleněným dropdownem).
  - Modernizovány CRUD formuláře a impersonační panel v celém dashboardu.
  - Vytvořen **Katalog Cviků v Databázi** (Exercise Catalog Explorer) využívající asynchronní načítání cviků z IndexedDB s fluidními animacemi.
  - Implementována adaptivní **Exercise Detail Karta** zobrazující specifické tréninkové metriky podle kategorie cviku.

---

## 🏃‍♂️ Aktuální Úkol: Fáze 4 — Frontend Core & Drag and Drop
Zaměříme se na vytvoření robustního DnD rozhraní.

### Podkroky aktuální fáze:
1. `[ ]` Integrace `@dnd-kit` pro řazení cviků v trénincích s podporou pro dotyková mobilní gesta (Touch Constraints: hold 250ms).
2. `[ ]` Vytvoření zobrazení tréninkového kalendáře s týdenním pohledem (Microcycle Planner).
3. `[ ]` Zprovoznění interaktivních grafů pro sledování progresu a zatížení.

---

## 🔮 Bezprostředně Následující Kroky (Next Steps)
Jakmile dokončíme Fázi 4, budeme pokračovat na:

1. **Fáze 5: AI Asistent (Chytré generování a úpravy)**:
   * Propojení Vercel AI SDK a Gemini API s kontextem tréninkového plánu pro tvorbu tréninkových jednotek na míru.
