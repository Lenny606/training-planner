# Progress Tracker: Tréninkový Plánovač (Training Planner)

Tento dokument slouží jako **paměť projektu** a hlavní přehled stavu implementace. Mapuje jednotlivé fáze vývoje, zaznamenává již dokončené architektonické kroky, aktuální úkoly a plánuje bezprostředně následující etapy.

---

## 📊 Celkový Stav Projektu

* **Aktuální Fáze**: `Fáze 1: Inicializace & Kostra`
* **Celkový progres**: ──░░░░░░░░░░░░░░░░░░░░ **15%**
* **Poslední aktualizace**: 19. května 2026

---

## 🗺️ Plán Fází Vývoje & Status

| Fáze | Modul / Popis | Stav | Priorita |
| :--- | :--- | :--- | :--- |
| **Fáze 1** | **Inicializace projektu a kostra aplikace** (TanStack Start, Tailwind v4, AI SDK, Testy, Env) | ⏳ V přípravě (Specifikace hotova) | 🔴 Vysoká |
| **Fáze 2** | **Databázová vrstva a lokální úložiště** (Dexie.js, Mongoose UUID integrace, Mongoose schemas) | 💤 Čeká | 🔴 Vysoká |
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
  * Identifikována a opravena rizika (CastError u Mongoose ObjectId, debounced offline ztráta dat, blokování skrolování u DnD-kit na mobilech, SSR dehydratační pády při offline režimu).
- [x] **Zápis architektonických oprav do hlavních specifikací**:
  - Aktualizována **[Databázová vrstva (02)](file:///home/tomas/my-projects/training-planner/context/02_databazova_vrstva.md)** (UUID primární klíče).
  - Aktualizována **[API Vrstva (03)](file:///home/tomas/my-projects/training-planner/context/03_api_vrstva.md)** (dotaz `findById` u serverových funkcí, Zod UUID validace).
  - Aktualizován **[Frontend a UX (04)](file:///home/tomas/my-projects/training-planner/context/04_frontend_a_ux.md)** (synchronní Zustand-Dexie zápisy, mobilní sensors delay konfigurace).
  - Aktualizován **[Offline Režim (05)](file:///home/tomas/my-projects/training-planner/context/05_offline_rezim.md)** (sekvenční Outbox synchronizační cyklus).
- [x] **Vytvoření Specifikace Inicializace**:
  - Vytvořen a detailně rozpracován soubor **[01-skeleton-initialization.md](file:///home/tomas/my-projects/training-planner/context/feat-spec/01-skeleton-initialization.md)**.
  - Zahrnuta konfigurace Tailwind CSS v4, Vercel AI SDK, TypeScript aliasů, dev server skriptů, `.env` šablon pro Dev & Prod a kompletní konfigurace Vitest + Playwright testovacího prostředí.

---

## 🏃‍♂️ Aktuální Úkol: Fáze 1 — Inicializace projektu a kostra aplikace
Momentálně se nacházíme na startovní čáře implementace. Specifikace v [01-skeleton-initialization.md](file:///home/tomas/my-projects/training-planner/context/feat-spec/01-skeleton-initialization.md) je připravena k exekuci.

### Podkroky aktuální fáze:
1. `[ ]` Spustit inicializaci TanStack Start přes `npx create-tanstack-app`.
2. `[ ]` Nainstalovat potřebné závislosti (`ai`, `@ai-sdk/google`, `zod`, `dexie`).
3. `[ ]` Konfigurovat Vite (`vite.config.ts`), TypeScript (`tsconfig.json`) a cesty.
4. `[ ]` Nastavit Tailwind CSS v4 (instalace, `@tailwindcss/vite` plugin, `globals.css` s proměnnými, import v `__root.tsx`).
5. `[ ]` Připravit `.env.development`, `.env.production` a `.env.example`.
6. `[ ]` Zabezpečit `.gitignore` proti úniku `.env` a build složek.
7. `[ ]` Konfigurovat Vitest (`vitest.config.ts`, `tests/setup.ts`) a Playwright (`playwright.config.ts`).
8. `[ ]` Ověřit funkčnost spuštěním `npm run dev` a cvičným spuštěním `npm run test:unit`.

---

## 🔮 Bezprostředně Následující Kroky (Next Steps)
Jakmile dokončíme Fázi 1, budeme pokračovat na:

1. **Fáze 2: Databázová vrstva a lokální úložiště**:
   * Implementace MongoDB / Mongoose schémat na backendu se String UUID klíči.
   * Vytvoření lokální databáze `localDb.ts` pomocí **Dexie.js** na frontendu.
   * Vytvoření prvních integračních testů pro databázové operace.
