# Kontext a Specifikace Projektu (Training Planner)

Vítejte ve složce specifikací projektu **Training Planner** (Plánovač tréninků). Tato složka slouží jako kompletní architektonická kuchařka pro vývojáře, který bude aplikaci kódovat. Každá vrstva aplikace je dopodrobna rozepsána v samostatném souboru a plně přizpůsobena pro moderní fullstack framework **TanStack Start**.

---

## 🗺️ Mapa Specifikací (Specification Map)

1.  **[01. Přehled Architektury](file:///home/tomas/my-projects/training-planner/context/01_prehled_architektury.md)**
    *   *Obsah*: Technologický stack (TanStack Start, MongoDB, Mongoose, Zustand, Vanilla CSS Modules), struktura složek aplikace pod adresářem `app/`, nákres jednosměrného toku dat přes serverové funkce a zdůvodnění volby tohoto moderního stacku.
2.  **[02. Databázová Vrstva](file:///home/tomas/my-projects/training-planner/context/02_databazova_vrstva.md)**
    *   *Obsah*: Koncepční ER diagram navržené databáze, detailně nadefinovaná Mongoose schémata pro globální knihovnu cviků (`Exercise`) a tréninkový plán (`TrainingPlan`) s přípravou pro hot reload ve Vite.
3.  **[03. Server Functions a Validace](file:///home/tomas/my-projects/training-planner/context/03_api_vrstva.md)**
    *   *Obsah*: Návrh typově bezpečných serverových funkcí (`createServerFn`) nahrazujících klasické REST API, detailní validační schémata v knihovně Zod pro cviky i plány a bezpečné připojení k MongoDB bez exponování citlivých ENV proměnných.
4.  **[04. Frontend a UX](file:///home/tomas/my-projects/training-planner/context/04_frontend_a_ux.md)**
    *   *Obsah*: ASCII drátěný model (wireframe) plánovače, URL-first vyhledávání a filtrování pomocí TanStack Routeru, definice Zustand store s integrovanými serverovými funkcemi a autosave mechanikou, zapojení `@dnd-kit` a designové tokeny v čistém CSS.
5.  **[05. Offline Režim a Mobilní Zařízení](file:///home/tomas/my-projects/training-planner/context/05_offline_rezim.md)**
    *   *Obsah*: Detailní srovnání mobilních technologií (PWA, Capacitor, React Native), návrh offline datového úložiště přes IndexedDB (Dexie.js), synchronizační protokol s Outbox frontou, řešení konfliktů (LWW) a platformní úskalí iOS.

---

## 💡 Shrnutí Klíčových Vlastností Aplikace

Aplikace byla navržena s následujícími hlavními pilíři:

*   **100% Typová Bezpečnost (End-to-End Type-Safety)**: Díky TanStack Start jsou typy z databáze automaticky přenášeny přes serverové funkce až do klientských komponent. Jakákoliv chyba ve struktuře dat je odhalena ihned při psaní kódu.
*   **Offline-First Schopnosti**: Uživatel může sestavit celý tréninkový plán bez připojení k síti (např. přímo v posilovně). Veškerá data se ukládají lokálně do mobilní IndexedDB a synchronizují se automaticky na pozadí, jakmile se zařízení znovu připojí.
*   **URL-First Stav**: Vyhledávání a kategorie v knihovně cviků jsou synchronizované s URL. Uživatel má možnost si stav vyhledávání uložit do záložek nebo jej sdílet.
*   **Absolutní Univerzálnost**: Díky flexibilním metrikám v MongoDB schématech dokáže aplikace obsloužit silový trénink (série, opakování, váha), bojové sporty (kola, trvání kola, délka pauzy) i vytrvalostní sporty (trvání, tempo).
*   **Autosave na pozadí**: Uživatel mění hodnoty přímo v plánovači na místě (inline). Zustand automaticky s prodlevou (debouncing) odesílá data na server a ukládá je bez nutnosti klikat na tlačítko "Uložit".

---

## 🚀 Další Krok: Jak Začít Vývoj (Roadmap)

Až budete připraveni přejít k samotnému kódování, doporučujeme tento postup:

1.  **Inicializace projektu**:
    Vytvořit TanStack Start projekt (můžete použít oficiální CLI šablonu):
    ```bash
    # Pro stažení šablony v aktuálním adresáři
    # (případně nahlédnout do dokumentace TanStack Start na start.tanstack.com)
    ```
2.  **Nastavení Databáze**:
    *   Zprovoznit lokální MongoDB nebo MongoDB Atlas.
    *   Vytvořit soubor `.env` a přidat do něj `MONGODB_URI` (tento soubor nesmí být nikdy nahrán na Git!).
    *   Vytvořit soubor `app/db/connect.ts` s připojením Mongoose (kód ze specifikace 03).
3.  **Definice Modelů a Validací**:
    *   Vytvořit Mongoose modely v `app/db/` (specifikace 02).
    *   Vytvořit Zod validační schémata v `app/utils/validation.ts` (specifikace 03).
4.  **Vytvoření Serverových Funkcí**:
    *   Naimplementovat funkce `getPlanByIdFn` a `saveTrainingPlanFn` v `app/db/functions.ts` (specifikace 03).
5.  **Vývoj UI a Drag & Drop**:
    *   Nainstalovat `@dnd-kit/core` a `@dnd-kit/sortable` a `zustand`.
    *   Zprovoznit Zustand store v `app/store/usePlannerStore.ts` (specifikace 04).
    *   Napsat UI komponenty a propojit je s `DndContext` v hlavní routě `app/routes/index.tsx` (specifikace 04).
6.  **Stylování**:
    *   Nadefinovat CSS proměnné v `app/styles/variables.css` a přidat moderní animace pro drop zóny (specifikace 04).
