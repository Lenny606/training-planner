# 04. Frontend a UX (Frontend & User Experience)

Tento dokument detailně popisuje uživatelské rozhraní (UI), uživatelský zážitek (UX), správu globálního a URL-first stavu a technickou implementaci **Drag & Drop** přetahování cviků v rámci frameworku **TanStack Start**.

Rozhraní je navrženo s důrazem na **prémiový a moderní vzhled** (tmavý režim, glassmorfismus, plynulé animace a nulové zpoždění odezvy).

---

## 1. Návrh UI a Dispozice (UI Layout)

Rozhraní je rozděleno do dvou hlavních sekcí na jedné obrazovce pro pohodlné sestavování plánu drag-and-drop metodou.

```text
+------------------------------------------------------------------------------------+
|  [Logo] TRAINING PLANNER - Pondělí, 19. Května 2026           [Uloženo (Auto-save)]|
+------------------------------------------------------------------------------------+
|  KNIHOVNA CVIKŮ (SIDEBAR)          |  ČASOVÁ OSA TRÉNINKU (MAIN PLANNER VIEW)       |
|  [ Hledat cvik...          ]       |  Název: Trénink Box & Kondice                  |
|  Filtry: [Vše] [Síla] [Box] [Kardio]|  Popis: Zaměřeno na explozivní sílu a kardio.   |
|                                    |  --------------------------------------------  |
|  +------------------------------+  |  +==========================================+  |
|  |  Benchpress             (::) |  |  | BLOK 1: Rozcvička (15 min)             X |  |
|  |  Kategorie: Síla             |  |  +------------------------------------------+  |
|  +------------------------------+  |  |  - Poklus na místě (Kardio)              |  |
|  +------------------------------+  |  |  - Mobilita ramen (Stretch)              |  |
|  |  Stínový box            (::) |  |  |  [ Sem přetáhněte cvik pro vložení ]    |  |
|  |  Kategorie: Box              |  |  +==========================================+  |
|  +------------------------------+  |                                                |
|  +------------------------------+  |  +==========================================+  |
|  |  Běh na páse            (::) |  |  | BLOK 2: Hlavní část - Box (30 min)     X |  |
|  |  Kategorie: Kardio           |  |  +------------------------------------------+  |
|  +------------------------------+  |  |  - Stínový box [ 3 kola | 180s kolo ]    |  |
|                                    |  |  [ Sem přetáhněte cvik pro vložení ]    |  |
|  [+ Nový Cvik ]                    |  |  +==========================================+  |
|                                    |  |                                                |
|                                    |  [+ Přidat nový časový blok ]                  |
+------------------------------------------------------------------------------------+
```

### **A. URL-First Stav v Knihovně Cviků**
Díky **TanStack Routeru** ukládáme vyhledávací dotaz a filtr kategorií přímo do **Search Parameters v URL** (např. `/planner?search=bench&category=strength`).
*   **Proč?**: Pokud uživatel obnoví stránku, jeho filtry zůstanou zachované. Odkaz na konkrétní pohled lze také snadno sdílet.
*   Při psaní vyhledávání využíváme `router.navigate({ search: ... })` s parametrem `replace: true` pro plynulost historie prohlížeče.

### **B. Hlavní Panel (Časová Osa Tréninku)**
*   Zobrazení **časových bloků** s přímou inline editací názvu, popisu a trvání bloku (v minutách).
*   **Customizace Metrik**: Po přesunutí cviku do bloku se ihněd zobrazí příslušné vstupní prvky (inputy) upravené na míru danému typu cviku. Uživatel mění hodnoty na místě a Zustand automaticky spouští ukládání na pozadí.

---

## 2. Zustand Store s Integrovanou Dexie.js a Server Functions (`app/store/usePlannerStore.ts`)

Zustand spravuje klientský interaktivní stav. Kvůli bezpečnosti dat při offline práci **každá akce okamžitě zapíše stav do lokální IndexedDB (Dexie.js)** a zařadí změnu do odchozí outbox fronty (`syncQueue`). Následně se spustí debounced pokus o uložení na server přes serverovou funkci.

```typescript
import { create } from 'zustand';
import { localDb } from '../db/localDb';
import { saveTrainingPlanFn } from '../db/functions';

interface PlannerState {
  activePlan: any;
  isSaving: boolean;
  autosaveTimeout: NodeJS.Timeout | null;
  loadPlan: (plan: any) => Promise<void>;
  updatePlanOffline: (updatedPlan: any) => Promise<void>;
  addTimeBlock: (name?: string, duration?: number) => Promise<void>;
  removeTimeBlock: (blockId: string) => Promise<void>;
  addExerciseToBlock: (blockId: string, exercise: any, index?: number) => Promise<void>;
  updateExerciseMetrics: (blockId: string, assignedExerciseId: string, newMetrics: any) => Promise<void>;
  triggerAutosave: () => void;
}

export const usePlannerStore = create<PlannerState>((set, get) => ({
  activePlan: null,
  isSaving: false,
  autosaveTimeout: null,

  // Inicializace dat z Router Loaderu (ukládá rovnou i do lokální Dexie cache)
  loadPlan: async (plan) => {
    if (!plan) return;
    set({ activePlan: plan });
    
    await localDb.plans.put({
      id: plan._id,
      ...plan,
      synced: 1, // Označeno jako načtené/uložené na serveru
      updatedAt: Date.now()
    });
  },

  // Centrální klientský zápis (Single Source of Truth)
  updatePlanOffline: async (updatedPlan) => {
    const planId = updatedPlan._id;
    const enrichedPlan = {
      ...updatedPlan,
      synced: 0, // Není uloženo na serveru
      updatedAt: Date.now()
    };

    set({ activePlan: enrichedPlan, isSaving: true });

    // 1. Zápis do IndexedDB (Dexie) - Nulová latence pro uživatele
    await localDb.plans.put(enrichedPlan);

    // 2. Přidání úkonu do fronty změn (Outbox)
    await localDb.syncQueue.put({
      planId,
      action: 'SAVE',
      payload: enrichedPlan,
      timestamp: Date.now()
    });

    // 3. Spuštění asynchronního uložení
    get().triggerAutosave();
  },

  // Správa časových bloků (každá akce deleguje na updatePlanOffline)
  addTimeBlock: async (name = 'Nový Blok', duration = 15) => {
    const activePlan = get().activePlan;
    if (!activePlan) return;

    const newBlock = {
      id: crypto.randomUUID(),
      name,
      duration,
      exercises: []
    };

    const updatedPlan = {
      ...activePlan,
      timeBlocks: [...activePlan.timeBlocks, newBlock]
    };

    await get().updatePlanOffline(updatedPlan);
  },

  removeTimeBlock: async (blockId) => {
    const activePlan = get().activePlan;
    if (!activePlan) return;

    const updatedPlan = {
      ...activePlan,
      timeBlocks: activePlan.timeBlocks.filter((b: any) => b.id !== blockId)
    };

    await get().updatePlanOffline(updatedPlan);
  },

  // Správa cviků v časových blocích
  addExerciseToBlock: async (blockId, exercise, index) => {
    const activePlan = get().activePlan;
    if (!activePlan) return;

    const assignedExercise = {
      _id: crypto.randomUUID(), // Každé přiřazení získá své unikátní UUID ihned na klientovi
      exerciseId: exercise._id,
      name: exercise.name,
      category: exercise.category,
      metrics: { ...exercise.defaultMetrics }
    };

    const updatedTimeBlocks = activePlan.timeBlocks.map((block: any) => {
      if (block.id !== blockId) return block;

      const newExercises = [...block.exercises];
      if (typeof index === 'number') {
        newExercises.splice(index, 0, assignedExercise);
      } else {
        newExercises.push(assignedExercise);
      }

      return { ...block, exercises: newExercises };
    });

    const updatedPlan = { ...activePlan, timeBlocks: updatedTimeBlocks };
    await get().updatePlanOffline(updatedPlan);
  },

  updateExerciseMetrics: async (blockId, assignedExerciseId, newMetrics) => {
    const activePlan = get().activePlan;
    if (!activePlan) return;

    const updatedTimeBlocks = activePlan.timeBlocks.map((block: any) => {
      if (block.id !== blockId) return block;

      const updatedExercises = block.exercises.map((ex: any) => {
        if (ex._id !== assignedExerciseId) return ex;
        return { ...ex, metrics: { ...ex.metrics, ...newMetrics } };
      });

      return { ...block, exercises: updatedExercises };
    });

    const updatedPlan = { ...activePlan, timeBlocks: updatedTimeBlocks };
    await get().updatePlanOffline(updatedPlan);
  },

  // Pokus o uložení na server (debounced)
  triggerAutosave: () => {
    if (get().autosaveTimeout) {
      clearTimeout(get().autosaveTimeout!);
    }

    const timeout = setTimeout(async () => {
      const activePlan = get().activePlan;
      if (!activePlan) return;

      // Pokud jsme offline, tiše počkáme. Dexie je již uložena, outbox je zapsán.
      if (!navigator.onLine) {
        set({ isSaving: false });
        return;
      }

      try {
        const response = await saveTrainingPlanFn({ data: activePlan });
        
        if (response.success) {
          // Uložení se na serveru podařilo -> označíme v Dexie jako synced: 1
          await localDb.plans.update(activePlan._id, { synced: 1 });
          // Smažeme úkol z fronty pro tento plán
          await localDb.syncQueue.where('planId').equals(activePlan._id).delete();
          
          set({ activePlan: response.plan });
        }
      } catch (error) {
        console.warn('Odeslání na server selhalo (např. krátký výpadek). Změny zůstávají bezpečně offline v IndexedDB.', error);
      } finally {
        set({ isSaving: false });
      }
    }, 1500); // 1.5 sekundy debouncing

    set({ autosaveTimeout: timeout });
  }
}));
```

---

## 3. Integrace `@dnd-kit` a TanStack Routeru (`app/routes/index.tsx`)

Zde je ukázka, jak typově bezpečný router načte výchozí data (loader je upraven jako hybridní, aby nezpůsobil pád offline režimu) a jak propojíme DndContext se senzory ošetřujícími mobilní dotykové skrolování.

```tsx
import { createFileRoute } from '@tanstack/react-router';
import { 
  DndContext, 
  DragEndEvent, 
  useSensor, 
  useSensors, 
  PointerSensor, 
  TouchSensor 
} from '@dnd-kit/core';
import { useEffect } from 'react';
import { usePlannerStore } from '../store/usePlannerStore';
import { getPlanByIdFn } from '../db/functions';
import { localDb } from '../db/localDb';
import ExerciseLibrary from '../components/exercise-library/ExerciseLibrary';
import Timeline from '../components/planner/Timeline';

// 1. Definice routy s hybridním loaderem odolným proti výpadku sítě
export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      search: (search.search as string) || '',
      category: (search.category as string) || 'all',
      planId: (search.planId as string) || 'd87bc4fa-4be1-4328-89c0-6d4a2bdf044c', // UUID plánu
    };
  },
  loader: async ({ search }) => {
    // Pokud jsme na klientovi, zkusíme nejprve načíst lokální IndexedDB kopii (okamžitý start)
    if (typeof window !== 'undefined') {
      const localPlan = await localDb.plans.get(search.planId);
      if (localPlan) {
        return { plan: localPlan, isOfflineFallback: true };
      }
    }

    try {
      // Stažení ze serveru přes Server Function
      const plan = await getPlanByIdFn({ data: search.planId });
      return { plan, isOfflineFallback: false };
    } catch (error) {
      console.warn('Nelze se připojit k serveru pro načtení plánu. Používám offline fallback.');
      return { plan: null, isOfflineFallback: true };
    }
  }
});

export default function PlannerPage() {
  const { plan } = Route.useLoaderData();
  const { search, category } = Route.useSearch();
  const { loadPlan, addExerciseToBlock, exercises } = usePlannerStore();

  // 2. Nastavení senzorů pro DND, které neblokují mobilní skrolování
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Uživatel musí táhnout alespoň 8px, aby nedošlo k záměně s pouhým klikem
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // Pro mobilní dotyk je nutné podržet prst 250ms pro zahájení přetahování
        tolerance: 5,
      },
    })
  );

  // 3. Synchronizace dat z loaderu do Zustand Store
  useEffect(() => {
    if (plan) {
      loadPlan(plan);
    }
  }, [plan]);

  // 4. Obsluha přetažení cviku
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string; // např. "library-65fc2..."
    const targetBlockId = over.id as string; // UUID časového bloku

    if (activeId.startsWith('library-')) {
      const exerciseId = activeId.replace('library-', '');
      const originalExercise = exercises.find(ex => ex._id === exerciseId);
      
      if (originalExercise) {
        addExerciseToBlock(targetBlockId, originalExercise);
        
        // Možnost přidat haptickou odezvu při úspěšném dropu cviku na mobilu
        if ('vibrate' in navigator) {
          navigator.vibrate(15);
        }
      }
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <main className="planner-container">
        {/* Knihovna cviků čte search a category přímo z URL */}
        <ExerciseLibrary search={search} category={category} />
        <Timeline />
      </main>
    </DndContext>
  );
}
```

---

## 4. Prémiový Vizuální Styl (CSS Modules)

Vzhled aplikace je navržen v moderním stylu **glassmorphismu** s plynulými barevnými přechody a animacemi drop zón.

### **A. Návrh CSS Variables (`app/styles/variables.css`)**
```css
:root {
  --bg-primary: #0a0c10;       /* Uhlově temná obsidian */
  --bg-secondary: #12161f;     /* Hluboká modrošedá pro panely */
  --bg-tertiary: #1b202c;      /* Vnitřní widgety */
  
  --color-accent: #00f2fe;      /* Neonově azurová */
  --color-accent-grad: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%);
  --color-strength: #ff5e62;    /* Korálově červená pro silové cviky */
  --color-combat: #ff9f43;      /* Teplá bojová oranžová */
  --color-cardio: #1dd1a1;      /* Svěží mátová */
  
  --text-main: #f3f6f9;
  --text-muted: #8292a6;
  
  /* Glassmorphism tokeny */
  --glass-bg: rgba(18, 22, 31, 0.75);
  --glass-border: rgba(255, 255, 255, 0.07);
  --glass-blur: blur(14px);
  
  --radius-lg: 16px;
  --radius-md: 10px;
  --transition-smooth: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
}
```

### **B. CSS Moduly pro Animaci Drag & Drop (`app/components/planner/Planner.module.css`)**
Při přesouvání cviků se spouští jemné a luxusní vizuální podněty:

```css
/* Styling aktivní drop zóny při tažení prvku */
.dropZone {
  border: 2px dashed rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-md);
  padding: 16px;
  text-align: center;
  color: var(--text-muted);
  transition: var(--transition-smooth);
}

.dropZoneActive {
  border: 2px dashed var(--color-accent);
  background: rgba(0, 242, 254, 0.04);
  color: var(--color-accent);
  box-shadow: 0 0 15px rgba(0, 242, 254, 0.1);
  animation: pulseGlow 1.5s infinite alternate;
}

@keyframes pulseGlow {
  0% {
    box-shadow: 0 0 10px rgba(0, 242, 254, 0.05);
  }
  100% {
    box-shadow: 0 0 20px rgba(0, 242, 254, 0.15);
  }
}
```
