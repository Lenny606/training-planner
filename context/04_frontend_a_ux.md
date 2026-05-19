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

## 2. Zustand Store s Server Functions (`app/store/usePlannerStore.ts`)

Zustand spravuje lokální interaktivní stav rozpracovaného tréninku a po skončení úprav volá typově bezpečnou serverovou funkci `saveTrainingPlanFn`.

```typescript
import { create } from 'zustand';
import { saveTrainingPlanFn } from '../db/functions';

interface PlannerState {
  activePlan: any;
  isSaving: boolean;
  autosaveTimeout: NodeJS.Timeout | null;
  loadPlan: (plan: any) => void;
  addTimeBlock: (name?: string, duration?: number) => void;
  removeTimeBlock: (blockId: string) => void;
  addExerciseToBlock: (blockId: string, exercise: any, index?: number) => void;
  updateExerciseMetrics: (blockId: string, assignedExerciseId: string, newMetrics: any) => void;
  triggerAutosave: () => void;
}

export const usePlannerStore = create<PlannerState>((set, get) => ({
  activePlan: null,
  isSaving: false,
  autosaveTimeout: null,

  // Inicializace dat z Router Loaderu
  loadPlan: (plan) => set({ activePlan: plan }),

  // Správa časových bloků
  addTimeBlock: (name = 'Nový Blok', duration = 15) => {
    const activePlan = get().activePlan;
    if (!activePlan) return;

    const newBlock = {
      id: crypto.randomUUID(),
      name,
      duration,
      exercises: []
    };

    set({
      activePlan: {
        ...activePlan,
        timeBlocks: [...activePlan.timeBlocks, newBlock]
      }
    });
    get().triggerAutosave();
  },

  removeTimeBlock: (blockId) => {
    const activePlan = get().activePlan;
    if (!activePlan) return;

    set({
      activePlan: {
        ...activePlan,
        timeBlocks: activePlan.timeBlocks.filter((b: any) => b.id !== blockId)
      }
    });
    get().triggerAutosave();
  },

  // Správa cviků v časových blocích
  addExerciseToBlock: (blockId, exercise, index) => {
    const activePlan = get().activePlan;
    if (!activePlan) return;

    const assignedExercise = {
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

    set({ activePlan: { ...activePlan, timeBlocks: updatedTimeBlocks } });
    get().triggerAutosave();
  },

  updateExerciseMetrics: (blockId, assignedExerciseId, newMetrics) => {
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

    set({ activePlan: { ...activePlan, timeBlocks: updatedTimeBlocks } });
    get().triggerAutosave();
  },

  // Automatické debounced ukládání přes Server Function
  triggerAutosave: () => {
    set({ isSaving: true });

    if (get().autosaveTimeout) {
      clearTimeout(get().autosaveTimeout!);
    }

    const timeout = setTimeout(async () => {
      const activePlan = get().activePlan;
      if (!activePlan) return;

      try {
        // Volání typově bezpečné serverové funkce TanStack Start
        const response = await saveTrainingPlanFn({ data: activePlan });
        
        if (response.success) {
          // Aktualizace stavu s potvrzenými daty ze serveru (např. vygenerovaná _id pro cviky)
          set({ activePlan: response.plan });
        }
      } catch (error) {
        console.error('Automatické ukládání selhalo:', error);
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

Zde je ukázka, jak typově bezpečný router načte výchozí data (pomocí `loaderu`) a jak propojíme DndContext se Zustand storem.

```tsx
import { createFileRoute } from '@tanstack/react-router';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { useEffect } from 'react';
import { usePlannerStore } from '../store/usePlannerStore';
import { getPlanByIdFn } from '../db/functions';
import ExerciseLibrary from '../components/exercise-library/ExerciseLibrary';
import Timeline from '../components/planner/Timeline';

// 1. Definice routy a typově bezpečného načtení dat (Loader)
export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      search: (search.search as string) || '',
      category: (search.category as string) || 'all',
      planId: (search.planId as string) || 'default-plan-id', // Např. ID dnešního plánu
    };
  },
  loader: async ({ search }) => {
    // Spustí se na serveru při SSR a stáhne data z MongoDB
    const plan = await getPlanByIdFn({ data: search.planId });
    return { plan };
  }
});

export default function PlannerPage() {
  const { plan } = Route.useLoaderData();
  const { search, category } = Route.useSearch();
  const { loadPlan, addExerciseToBlock, exercises } = usePlannerStore();

  // 2. Synchronizace dat z loaderu do Zustand Store
  useEffect(() => {
    if (plan) loadPlan(plan);
  }, [plan]);

  // 3. Obsluha přetažení cviku
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
      }
    }
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
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
