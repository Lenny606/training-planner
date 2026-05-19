# GEMINI.md: Instrukce pro Vývojáře a AI Agenty

Tento soubor je **hlavní navigací a paměťovou mapou** pro AI agenty (Gemini, Antigravity) i lidské vývojáře pracující na projektu **Tréninkový Plánovač (Training Planner)**. Obsahuje shrnutí celého kontextu, klíčová architektonická pravidla a odkazy na detailní specifikace.

> [!IMPORTANT]
> **Při práci na jakémkoliv úkolu (tasku) v tomto projektu se VŽDY řiďte pravidly popsanými v tomto souboru a odkazovaných dokumentech.**

---

## 🗺️ Mapa Kontextových Specifikací (`context/`)

Adresář `context/` obsahuje kompletní podklady a specifikace systému. Zde je jejich přehled:

### 1. Jádro Projektu a Přehled
- **[README.md](file:///home/tomas/my-projects/training-planner/context/README.md)**: Základní představení projektu, stacku a fází roadmapy.
- **[01_prehled_architektury.md](file:///home/tomas/my-projects/training-planner/context/01_prehled_architektury.md)**: Globální architektura, diagramy toku dat (SSR -> Client) a struktura složek.
- **[progress-tracker.md](file:///home/tomas/my-projects/training-planner/context/progress-tracker.md)**: **Živá paměť vývoje**. Zde se zaznamenává aktuální stav, hotové úkoly a bezprostřední kroky. **Vždy aktualizujte po dokončení úkolu!**

### 2. Technické Specifikace Vrstev
- **[02_databazova_vrstva.md](file:///home/tomas/my-projects/training-planner/context/02_databazova_vrstva.md)**: Databázová schémata pro Mongoose (MongoDB). **Zde je definováno zásadní pravidlo pro UUID**.
- **[03_api_vrstva.md](file:///home/tomas/my-projects/training-planner/context/03_api_vrstva.md)**: Zod validace, serverové funkce TanStack Start a API endpointy.
- **[04_frontend_a_ux.md](file:///home/tomas/my-projects/training-planner/context/04_frontend_a_ux.md)**: Návrh Zustand storu s okamžitým zápisem, drag-and-drop komponenty a mobilní optimalizace.
- **[05_offline_rezim.md](file:///home/tomas/my-projects/training-planner/context/05_offline_rezim.md)**: Dexie.js (IndexedDB) schéma, outbox synchronizační queue a nastavení Serwist PWA Service Workera.

### 3. Specifikace Funkcionalit (Feat Specs)
- **[03-database-setup-schemas.md](file:///home/tomas/my-projects/training-planner/context/feat-spec/03-database-setup-schemas.md)**: Připojení k databázi MongoDB/Mongoose (Singleton), adresářová struktura, Repository vrstva a podrobná UUID schémata pro User, Cycle, Mesocycle, Microcycle, Workout, Exercise a TrainingSession.

---

## ⚠️ KRITICKÁ ARCHITEKTONICKÁ PRAVIDLA (Neporušitelná)

Během implementace jakékoliv funkce musíte bezpodmínečně dodržet následující čtyři pilíře, které byly vyřešeny v rámci seniorní revize kódu:

### 1. Klientská UUID namísto ObjectId (Databáze & Validace)
* **Pravidlo**: Všechna ID (`_id` v MongoDB a `id` v Dexie) jsou **klientsky generovaná UUID** (string).
* **Mongoose**: Schemata musí mít `_id` nastaveno jako `type: String` a u vnořených subdokumentů musíte zakázat automatické generování `_id: false` (pokud nejsou explicitně potřeba).
* **Zod**: Validace musí striktně očekávat `z.string().uuid()`.
* **Server Functions**: Funkce pro uložení (`saveTrainingPlanFn`) **nesmí** spoléhat pouze na kontrolu existence `!planData._id`, protože klientské UUID je přítomno vždy. Vždy použijte nejprve `.findById(planData._id)` pro ověření, zda jde o *insert* nebo *update*.

### 2. Zustand Store: Synchronní Zápis & Outbox Fronta (Offline-first)
* **Problém**: Autosave přímo na server vyvolaný uživatelským vstupem vede k chybám a ztrátě dat, pokud je uživatel offline.
* **Řešení**: Zustand store při jakékoliv změně plánu provede:
  1. Synchronní zápis do lokální kopie v **Dexie.js** (`localDb.plans.put`).
  2. Vytvoření záznamu ve frontě změn **Outbox** (`localDb.syncQueue.put`) s akcí `SAVE`/`DELETE`.
  3. Teprve pak spustí debounced (např. 1.5s) synchronizaci se serverem přes Server Function.
* **Sync Engine**: Synchronizační cyklus (`syncOfflineQueue`) sekvenčně prochází frontu a položky z ní maže **až po úspěšném zpracování serverem** (status 200). Pokud spojení selže, cyklus se přeruší a změny zůstávají bezpečně v lokální frontě.

### 3. Hybridní Router Loaders (Zamezení Hydratačních Pádů)
* **Pravidlo**: TanStack Start routovací loader se spouští jak na serveru při SSR, tak na klientovi během hydratace. V offline režimu serverové volání selže.
* **Řešení**: Loader musí detekovat klientské prostředí (`typeof window !== 'undefined'`) a nejprve se pokusit načíst data z **Dexie.js** (`localDb.plans.get`). Pokud jsou data lokálně k dispozici, vrátí je s příznakem `isOfflineFallback: true` a vůbec se nedotazuje nedostupného serveru.

### 4. Mobilní optimalizace Drag & Drop (@dnd-kit Touch Safety)
* **Problém**: Výchozí nastavení `@dnd-kit` přebírá kontrolu nad všemi dotykovými gesty, což kompletně zablokuje možnost skrolovat stránku na mobilech.
* **Řešení**: V nastavení `@dnd-kit` senzorů musíte striktně nastavit aktivační omezení (activation constraints):
  * **TouchSensor**: Aktivace pouze při držení delším než **250ms** (uživatel může normálně skrolovat, dokud na prvku podrží prst).
  * **PointerSensor**: Aktivace až po posunu o více než **8px** (zabraňuje nechtěnému spuštění drag-and-drop při jemném klepnutí).

---

## 🔒 BEZPEČNOST & ŽIVOTNÍ PROSTŘEDÍ (WSL & Secrets)

1. **WSL Linuxové prostředí**: Celý projekt běží v prostředí WSL (Ubuntu/Linux). Používejte zásadně dopředná lomítka `/` a Linuxové CLI nástroje.
2. **Ochrana Env**: **Nikdy** do kódu nezapisujte hodnoty z `.env` souborů (zejména API klíče). Všechny citlivé klíče (`GEMINI_API_KEY`, `MONGODB_URI`) musí zůstat skryté a nesmí mít prefix `VITE_`, aby se nedostaly do klientského bundle.

---

## 🧪 PRAVIDLO PRO VELKÉ REFAKTORY

> [!WARNING]
> Pokud v rámci jednoho úkolu editujete nebo refaktorujete **více než 100 řádků produkčního kódu**, je vaší **povinností** po dokončení změn spustit testovací suitu (`npm run test:unit`) a ověřit stabilitu systému. Kódové příklady důležitých refaktorů vždy uvádějte do výsledného Walkthrough.

---

*Tento soubor je neměnným průvodcem projektu. Při každé interakci s kódem se ujistěte, že vaše řešení neodporuje výše popsaným standardům.*
