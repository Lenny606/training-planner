# Progress Tracker: Tréninkový Plánovač (Training Planner)

Tento dokument slouží jako **paměť projektu** a hlavní přehled stavu implementace. Mapuje jednotlivé fáze vývoje, zaznamenává již dokončené architektonické kroky, aktuální úkoly a plánuje bezprostředně následující etapy.

---

## 📊 Celkový Stav Projektu

* **Aktuální Fáze**: `Fáze 2: Databázová vrstva a lokální úložiště`
* **Celkový progres**: ██████░░░░░░░░░░░░░░ **30%**
* **Poslední aktualizace**: 19. května 2026

---

## 🗺️ Plán Fází Vývoje & Status

| Fáze | Modul / Popis | Stav | Priorita |
| :--- | :--- | :--- | :--- |
| **Fáze 1** | **Inicializace projektu a kostra aplikace** (TanStack Start, Tailwind v4, AI SDK, Testy, Env) | 🟢 Dokončeno | 🔴 Vysoká |
| **Fáze 2** | **Databázová vrstva a lokální úložiště** (Dexie.js, Mongoose UUID integrace, Mongoose schemas) | ⏳ V progresu | 🔴 Vysoká |
| **Fáze 3** | **Zustand Offline Store a Sync Engine** (Outbox fronta, synchronizační cyklus, rekonciliace dat) | 💤 Čeká | 🔴 Vysoká |
| **Fáze 4** | **Frontend Core & Drag and Drop** (DnD-kit s touch podporou, layouty, správa časových bloků) | 💤 Čeká | 🟡 Střední |
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
  - Ověřena 100% funkčnost build procesu (`npm run build`), TypeScript kompilace (`npx tsc`) a spuštění testů (`npm run test:unit`) s nulovými chybami.

---

## 🏃‍♂️ Aktuální Úkol: Fáze 2 — Databázová vrstva a lokální úložiště
Po úspěšném dokončení kostry přecházíme na zprovoznění datové vrstvy.

### Podkroky aktuální fáze:
1. `[ ]` Vytvoření lokální IndexedDB databáze (`localDb.ts`) pomocí **Dexie.js** na frontendu.
2. `[ ]` Definování Dexie schémat pro plány (`plans`) a synchronizační frontu (`syncQueue` aka Outbox).
3. `[ ]` Příprava Mongoose schémat na backendu se String UUID primárními klíči (`_id`).
4. `[ ]` Vytvoření Zod schemas pro validaci příchozích dat s přísným UUID formátem.
5. `[ ]` Implementace a spuštění integračních testů ověřujících CRUD operace nad lokální Dexie a Mongoose.

---

## 🔮 Bezprostředně Následující Kroky (Next Steps)
Jakmile dokončíme Fázi 2, budeme pokračovat na:

1. **Fáze 3: Zustand Offline Store a Sync Engine**:
   * Propojení Zustand storu s Dexie.js (synchronní zápis) a zařazení do Outbox fronty.
   * Vytvoření Sync Engine cyklu pro debounced odesílání změn na server.
