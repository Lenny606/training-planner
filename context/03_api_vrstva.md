# 03. Server Functions a Validace (API & Server Layer)

Tento dokument specifikuje rozhraní pro komunikaci mezi frontendem a backendem v **TanStack Start**. Namísto klasického REST API využíváme hlavní přednost tohoto frameworku: **Serverové Funkce (Server Functions)**, které zaručují 100% typovou bezpečnost (type-safety) napříč celou aplikací. K validaci dat na vstupu slouží knihovna **Zod**.

---

## 1. Architektura Serverových Funkcí (Server Functions)

V TanStack Start se serverové funkce vytvářejí pomocí `createServerFn`. Tyto funkce:
1.  Jsou definovány na serverové straně a mají přímý přístup k databázi MongoDB přes Mongoose.
2.  Z frontendu se volají jako běžné asynchronní JavaScriptové funkce (vracejí Promise).
3.  Přenášejí automaticky typy parametrů a návratových hodnot (TypeScript typy) bez nutnosti generovat OpenAPI schémata nebo psát trpc konfigurace.

Ukládáme je do složky `app/db/` nebo `app/utils/` a importujeme přímo do klientských komponent.

---

## 2. Zod Validační Schémata (`app/utils/validation.ts`)

Předtím, než serverová funkce zpracuje dotaz do databáze, proběhne striktní validace pomocí knihovny Zod.

### **A. Schéma pro Cvik (`ExerciseValidationSchema`)**
```typescript
import { z } from 'zod';

export const ExerciseValidationSchema = z.object({
  name: z.string().min(1, "Název cviku je povinný.").max(100),
  category: z.enum(['strength', 'combat', 'cardio', 'mobility', 'stretch']),
  description: z.string().optional(),
  videoUrl: z.string().url("Neplatný formát URL odkazu.").or(z.literal("")).optional(),
  defaultMetrics: z.object({
    sets: z.number().int().nonnegative().optional(),
    reps: z.number().int().nonnegative().optional(),
    weight: z.number().nonnegative().optional(),
    duration: z.number().int().nonnegative().optional(),
    rounds: z.number().int().nonnegative().optional(),
    roundDuration: z.number().int().nonnegative().optional(),
    restDuration: z.number().int().nonnegative().optional(),
  }).optional()
});
```

### **B. Schéma pro Plán (`TrainingPlanValidationSchema`)**
Validuje kompletní strukturu tréninku a časových bloků odesílanou z frontendu po jakékoliv interakci.

```typescript
import { z } from 'zod';

const AssignedExerciseSchema = z.object({
  exerciseId: z.string(),
  name: z.string(),
  category: z.string(),
  metrics: z.object({
    sets: z.number().int().nonnegative().nullish(),
    reps: z.number().int().nonnegative().nullish(),
    weight: z.number().nonnegative().nullish(),
    duration: z.number().int().nonnegative().nullish(),
    rounds: z.number().int().nonnegative().nullish(),
    roundDuration: z.number().int().nonnegative().nullish(),
    restDuration: z.number().int().nonnegative().nullish(),
  }).optional()
});

const TimeBlockSchema = z.object({
  id: z.string(), // UUID z frontendu
  name: z.string().min(1, "Název bloku je povinný."),
  duration: z.number().int().positive("Délka bloku musí být kladné číslo."),
  exercises: z.array(AssignedExerciseSchema)
});

export const TrainingPlanValidationSchema = z.object({
  _id: z.string().optional(), // Může chybět při zakládání nového
  name: z.string().min(1, "Název plánu je povinný."),
  description: z.string().optional(),
  date: z.string().datetime().or(z.string().pipe(z.coerce.date())),
  timeBlocks: z.array(TimeBlockSchema)
});
```

---

## 3. Implementace Serverových Funkcí (`app/db/functions.ts`)

Upozornění: Připojení k databázi MongoDB využívá proměnnou prostředí `process.env.MONGODB_URI`. **Tento citlivý údaj nikdy neexponujeme přímo v kódu** a necháváme jej bezpečně uložený v konfiguraci hostingu nebo souboru `.env`.

Níže je ukázka implementace dvou klíčových serverových funkcí pro načtení a bezpečné uložení tréninkového plánu.

```typescript
import { createServerFn } from '@tanstack/start';
import dbConnect from './connect';
import TrainingPlan from './TrainingPlan';
import { TrainingPlanValidationSchema } from '../utils/validation';

/**
 * 1. Načtení konkrétního plánu podle ID
 * Vykoná se bezpečně na serveru, klient obdrží pouze výsledek.
 */
export const getPlanByIdFn = createServerFn({ method: 'GET' })
  .validator((planId: string) => {
    if (!planId || typeof planId !== 'string') {
      throw new Error('Neplatný identifikátor plánu');
    }
    return planId;
  })
  .handler(async ({ data: planId }) => {
    try {
      await dbConnect();
      
      const plan = await TrainingPlan.findById(planId).lean();
      if (!plan) {
        throw new Error('Tréninkový plán nebyl nalezen.');
      }
      
      // Mongoose vrací objekty, které převedeme na čisté JSON objekty
      return JSON.parse(JSON.stringify(plan));
    } catch (error) {
      console.error('Chyba při stahování plánu ze serveru:', error);
      throw new Error('Chyba serveru při načítání plánu.');
    }
  });

/**
 * 2. Uložení / Aktualizace tréninkového plánu
 * Přijímá celý objekt plánu, provede Zod validaci a zapíše jej do MongoDB.
 */
export const saveTrainingPlanFn = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    // Bezpečná validace dat na vstupu
    const validationResult = TrainingPlanValidationSchema.safeParse(data);
    if (!validationResult.success) {
      throw new Error(
        `Neplatná data plánu: ${validationResult.error.message}`
      );
    }
    return validationResult.data;
  })
  .handler(async ({ data: planData }) => {
    try {
      await dbConnect();

      if (!planData._id) {
        // Vytvoření nového plánu
        const newPlan = new TrainingPlan(planData);
        await newPlan.save();
        return { success: true, plan: JSON.parse(JSON.stringify(newPlan)) };
      } else {
        // Aktualizace existujícího plánu
        const updatedPlan = await TrainingPlan.findByIdAndUpdate(
          planData._id,
          planData,
          { new: true, runValidators: true }
        );

        if (!updatedPlan) {
          throw new Error('Plán k aktualizaci nebyl nalezen.');
        }

        return { success: true, plan: JSON.parse(JSON.stringify(updatedPlan)) };
      }
    } catch (error) {
      console.error('Chyba při ukládání plánu na serveru:', error);
      throw new Error('Chyba serveru při zápisu plánu.');
    }
  });
```

---

## 4. Připojení k Databázi (`app/db/connect.ts`)

Zde důsledně dodržujeme bezpečnostní pravidlo: **Žádné heslo ani tajný klíč nejsou uloženy v kódu (hardcoded).**

```typescript
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Definujte prosím proměnnou MONGODB_URI v konfiguraci prostředí (.env)'
  );
}

// Ochrana před opakovaným připojením během hot-reloadu ve Vite
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
```
