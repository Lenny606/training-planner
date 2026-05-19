# 05. Offline Režim a Mobilní PWA (PWA & Client Database Specs)

Uživatel potvrdil volbu **PWA (Progressive Web App)** jako mobilního řešení a **IndexedDB (přes Dexie.js)** jako lokální databáze v prohlížeči. Tento dokument slouží jako závazný technický návod pro implementaci tohoto offline-first řešení.

---

## 1. Architektura PWA & Vite Konfigurace

Pro transformaci naší **TanStack Start** aplikace na plnohodnotné PWA použijeme moderní knihovnu **Serwist** (nástupce Workboxu pro Vite prostředí).

### **Konfigurace Vite (`vite.config.ts`)**
Zde definujeme Service Worker, ikony a manifest, který mobilnímu telefonu oznámí, že aplikace je instalovatelná na plochu.

```typescript
import { defineConfig } from 'vite';
import { tanstackStartVite } from '@tanstack/start/vite';
import { serwistVite } from '@serwist/vite';

export default defineConfig({
  plugins: [
    tanstackStartVite(),
    serwistVite({
      swSrc: 'app/sw.ts', // Vstupní bod pro náš Service Worker
      swDest: 'dist/client/sw.js',
      globDirectory: 'dist/client',
      globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
      manifest: {
        name: 'Training Planner',
        short_name: 'Trainer',
        description: 'Offline-first tréninkový plánovač',
        theme_color: '#0a0c10',
        background_color: '#0a0c10',
        display: 'standalone', // Odstraní záhlaví prohlížeče (vypadá jako nativní app)
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
});
```

---

## 2. Definice Lokální Databáze v Prohlížeči (`app/db/localDb.ts`)

Použijeme **Dexie.js**, což je lehký wrapper nad IndexedDB s plnou podporou TypeScriptu. Lokální databáze zrcadlí strukturu serverové MongoDB. Všechna ID jsou definována jako textové UUID klíče pro okamžité generování offline.

```typescript
import Dexie, { type Table } from 'dexie';

// Typové definice pro lokální tabulky
export interface LocalExercise {
  id: string; // Vždy UUID string
  name: string;
  category: 'strength' | 'combat' | 'cardio' | 'mobility' | 'stretch';
  description?: string;
  defaultMetrics: any;
}

export interface LocalTrainingPlan {
  id: string; // Vždy UUID string shodující se s MongoDB _id
  name: string;
  description?: string;
  date: Date;
  timeBlocks: any[];
  synced: 0 | 1; // 0 = neuloženo na server, 1 = plně synchronizováno
  updatedAt: number; // Timestamp pro řešení konfliktů (LWW)
}

export interface SyncQueueItem {
  id?: number; // Auto-increment ID lokální fronty (IndexedDB index)
  planId: string; // UUID plánu
  action: 'SAVE' | 'DELETE';
  payload: any;
  timestamp: number;
}

class ClientDatabase extends Dexie {
  exercises!: Table<LocalExercise>;
  plans!: Table<LocalTrainingPlan>;
  syncQueue!: Table<SyncQueueItem>; // Lokální "Outbox" fronta změn

  constructor() {
    super('TrainingPlannerDB');
    
    // Definice indexů pro rychlé vyhledávání
    this.version(1).stores({
      exercises: 'id, name, category',
      plans: 'id, date, synced, updatedAt',
      syncQueue: '++id, planId, timestamp',
    });
  }
}

export const localDb = new ClientDatabase();
```

---

## 3. Synchronizační Cyklus (Sync Engine Flow)

Když uživatel upraví tréninkový plán v offline režimu, akce se zapíše do `syncQueue`. Jakmile se zařízení znovu připojí k síti, spustí se synchronizační cyklus, který sequentially (po pořadí) zpracuje všechny nahromaděné požadavky a následně aktualizuje stav v lokální databázi.

```typescript
import { localDb } from '../db/localDb';
import { saveTrainingPlanFn } from '../db/functions';

/**
 * Hlavní synchronizační funkce, která se spustí při startu aplikace 
 * nebo při detekci přechodu do ONLINE režimu.
 */
export async function syncOfflineQueue() {
  if (!navigator.onLine) return;

  // 1. Načtení všech neodeslaných položek z lokální fronty seřazených chronologicky
  const queueItems = await localDb.syncQueue.orderBy('timestamp').toArray();
  if (queueItems.length === 0) return;

  console.log(`Detekováno ${queueItems.length} neodeslaných změn na pozadí. Spouštím synchronizaci...`);

  for (const item of queueItems) {
    try {
      if (item.action === 'SAVE') {
        // 2. Volání typově bezpečné serverové funkce TanStack Start
        // Server obdrží kompletní objekt plánu včetně klientského UUID v _id
        const result = await saveTrainingPlanFn({ data: item.payload });
        
        if (result.success) {
          // 3. Aktualizace lokálního plánu (označení jako synchronizovaný)
          await localDb.plans.update(item.planId, {
            synced: 1,
            // id zůstává stejné UUID, které server přijal a uložil
          });
          
          // 4. Odstranění položky z outbox fronty
          await localDb.syncQueue.delete(item.id!);
        }
      }
    } catch (error) {
      console.error(`Chyba při synchronizaci outbox položky ${item.id}:`, error);
      // V případě výpadku sítě nebo chyby spojení přerušíme cyklus.
      // Položka zůstane ve frontě a bude zpracována při dalším pokusu.
      break;
    }
  }
}
```

---

## 4. Ošetření Síťového Stavu v React Komponentách

Aby uživatel přesně věděl, v jakém stavu se jeho data nacházejí, implementujeme vizuální indikátory.

```tsx
import { useEffect, useState } from 'react';
import { syncOfflineQueue } from '../db/syncEngine';

export function SyncIndicator() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      // Jakmile naskočí internet, okamžitě spustíme odeslání fronty změn
      syncOfflineQueue();
    }
    
    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className={`indicator ${isOnline ? 'online' : 'offline'}`}>
      {isOnline ? (
        <span>🟢 Plně synchronizováno (Online)</span>
      ) : (
        <span>🟠 Pracujete offline (Změny se uloží lokálně)</span>
      )}
    </div>
  );
}
```

---

## 5. Shrnutí a Výhody tohoto Řešení

1.  **Blesková Odezva UI**: Aplikace se nespoléhá na rychlost sítě. Při načítání nejprve vykreslíme data z **IndexedDB** (okamžitě bez loaderů) a na pozadí se dotážeme serverové funkce na případné aktualizace.
2.  **Odolnost v Tělocvičně**: Uživatel může mít telefon v režimu "Letadlo" nebo bez signálu. Může kompletně přesouvat cviky, měnit trvání bloků i sérií. Vše se bezpečně ukládá do Dexie DB.
3.  **Žádné iOS Limity**: Protože se jedná o instalované PWA, operační systém iOS **nesmaže** IndexedDB po 7 dnech neaktivity, což řeší největší úskalí Safari prohlížeče.
