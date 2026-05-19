# 03. Specifikace Databázového Připojení a Schémat (Database Setup & Schemas)

Tato specifikace detailně navrhuje **databázové připojení (MongoDB / Mongoose)**, **adresářovou strukturu datové vrstvy**, **vzor pro Repository Layer** a **kompletní schémata modelů**. Všechny modely plně respektují klíčové pravidlo projektu: **klientsky generovaná UUID (String) namísto auto-generovaných ObjectId**.

---

## 🎯 Cíle Návrhu (Objectives)
1. **Robusní připojení**: Jediná instance (Singleton) Mongoose připojení odolná vůči hot-reloadu ve Vite/TanStack Start.
2. **Klientská UUID kompatibilita**: Všechna `_id` jsou typu `String` (striktně validovaná jako UUID). Subdokumenty mají vypnuté automatické generování `_id: false` k zamezení kolizí.
3. **Repository Layer**: Abstragovaná vrstva pro práci s databází, která odděluje business logiku (Server Functions) od samotného Mongoose.
4. **Hierarchická struktura tréninku**: Plná podpora struktury: **User ➡️ Cycle ➡️ Mesocycle ➡️ Microcycle ➡️ TrainingSession (se zápisem Workoutů a Exercises)**.

---

## 📂 1. Návrh Adresářové Struktury

Datová vrstva bude umístěna v `src/server/db/` pro server-side kód:

```
src/server/
├── db/
│   ├── connection.ts          # Mongoose singleton připojení
│   ├── models/                # Mongoose modely
│   │   ├── User.ts
│   │   ├── Cycle.ts
│   │   ├── Mesocycle.ts
│   │   ├── Microcycle.ts
│   │   ├── Workout.ts
│   │   ├── Exercise.ts
│   │   └── TrainingSession.ts
│   └── repositories/          # Repository Layer (Data Access)
│       ├── UserRepository.ts
│       ├── CycleRepository.ts
│       ├── WorkoutRepository.ts
│       └── TrainingSessionRepository.ts
```

---

## 🔌 2. Připojení k Databázi (`src/server/db/connection.ts`)

Abychom zabránili otevírání nekonečného množství připojení při hot-reloadu ve vývoji (Vite), implementujeme robustní připojovací Singleton pattern.

```typescript
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Chybí MONGODB_URI v environmentálních proměnných.');
}

/**
  Globální deklarace pro uchování připojení v rámci vývojového reloadu.
 */
interface GlobalMongoose {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseGlobal: GlobalMongoose | undefined;
}

let cached = globalThis.mongooseGlobal;

if (!cached) {
  cached = globalThis.mongooseGlobal = { conn: null, promise: null };
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      autoIndex: true,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((m) => {
      console.log('🔌 MongoDB úspěšně připojeno.');
      return m;
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
```

---

## 🏗️ 3. Repository Layer (Vzorový Návrh)

Repository Layer slouží jako mezivrstva. Serverové funkce (RPC) volají výhradně metody repozitářů, které se starají o validaci a DB volání.

```typescript
// Příklad: src/server/db/repositories/TrainingSessionRepository.ts
import TrainingSession from '../models/TrainingSession';
import { connectToDatabase } from '../connection';

export class TrainingSessionRepository {
  /**
   * Získá všechny tréninkové jednotky uživatele za dané období
   */
  static async getByDateRange(userId: string, startDate: Date, endDate: Date) {
    await connectToDatabase();
    return TrainingSession.find({
      userId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });
  }

  /**
   * Bezpečně vytvoří nebo zaktualizuje tréninkovou jednotku
   * Klientská UUID vyžadují nejprve kontrolu existence (.findById)
   */
  static async save(sessionData: any) {
    await connectToDatabase();
    
    // Nejprve ověříme existenci podle klientského UUID
    const existing = await TrainingSession.findById(sessionData._id);
    
    if (existing) {
      // Provedeme UPDATE
      return TrainingSession.findByIdAndUpdate(sessionData._id, sessionData, {
        new: true,
        runValidators: true
      });
    } else {
      // Provedeme INSERT
      const newSession = new TrainingSession(sessionData);
      return newSession.save();
    }
  }

  /**
   * Odstraní tréninkovou jednotku podle ID
   */
  static async delete(id: string) {
    await connectToDatabase();
    return TrainingSession.findByIdAndDelete(id);
  }
}
```

---

## 🧬 4. Návrh Mongoose Schémat a Validací (UUID)

Všechny modely používají String UUID. Zod schémata jsou navržena pro synchronní validaci příchozích dat.

---

### A. Uživatel (`src/server/db/models/User.ts`)
Uchovává identitu a roli uživatele (atlet vs. trenér).

#### Mongoose Schéma
```typescript
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  _id: {
    type: String, // UUID
    required: true
  },
  email: {
    type: String,
    required: [true, 'Email je povinný.'],
    unique: true,
    trim: true,
    lowercase: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Jméno je povinné.'],
    trim: true
  },
  role: {
    type: String,
    enum: ['athlete', 'coach', 'admin'],
    default: 'athlete',
    required: true
  }
}, {
  _id: false,
  timestamps: true
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
```

#### Zod Schéma
```typescript
import { z } from 'zod';

export const UserZodSchema = z.object({
  _id: z.string().uuid('Neplatný formát UUID uživatele.'),
  email: z.string().email('Neplatný email.'),
  name: z.string().min(1, 'Jméno nesmí být prázdné.'),
  role: z.enum(['athlete', 'coach', 'admin']).default('athlete')
});
```

---

### B. Cyklus (`src/server/db/models/Cycle.ts`)
Makrocyklus – dlouhodobá tréninková fáze (např. "Příprava na sezónu 2026", obvykle 6-12 měsíců).

#### Mongoose Schéma
```typescript
import mongoose from 'mongoose';

const CycleSchema = new mongoose.Schema({
  _id: {
    type: String, // UUID
    required: true
  },
  userId: {
    type: String, // Vztah 1:N k User._id (UUID)
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Název cyklu je povinný.'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['planned', 'active', 'completed'],
    default: 'planned',
    required: true
  }
}, {
  _id: false,
  timestamps: true
});

export default mongoose.models.Cycle || mongoose.model('Cycle', CycleSchema);
```

#### Zod Schéma
```typescript
export const CycleZodSchema = z.object({
  _id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1, 'Název cyklu je povinný.'),
  description: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  status: z.enum(['planned', 'active', 'completed']).default('planned')
}).refine(data => data.endDate >= data.startDate, {
  message: "Datum konce musí být po datu začátku.",
  path: ["endDate"]
});
```

---

### C. Mezocyklus (`src/server/db/models/Mesocycle.ts`)
Střednědobá tréninková fáze (např. 4-6 týdnů) se specifickým zaměřením (např. "Objemová fáze", "Maximální síla").

#### Mongoose Schéma
```typescript
import mongoose from 'mongoose';

const MesocycleSchema = new mongoose.Schema({
  _id: {
    type: String, // UUID
    required: true
  },
  cycleId: {
    type: String, // Vztah k Cycle._id (UUID)
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Název mezocyklu je povinný.'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  focus: {
    type: String,
    enum: ['hypertrophy', 'strength', 'power', 'endurance', 'peaking', 'deload', 'recovery'],
    default: 'strength',
    required: true
  }
}, {
  _id: false,
  timestamps: true
});

export default mongoose.models.Mesocycle || mongoose.model('Mesocycle', MesocycleSchema);
```

#### Zod Schéma
```typescript
export const MesocycleZodSchema = z.object({
  _id: z.string().uuid(),
  cycleId: z.string().uuid(),
  name: z.string().min(1, 'Název mezocyklu je povinný.'),
  description: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  focus: z.enum(['hypertrophy', 'strength', 'power', 'endurance', 'peaking', 'deload', 'recovery']).default('strength')
}).refine(data => data.endDate >= data.startDate, {
  message: "Datum konce musí být po datu začátku.",
  path: ["endDate"]
});
```

---

### D. Mikrocyklus (`src/server/db/models/Microcycle.ts`)
Krátkodobá tréninková fáze (typicky 1 týden tréninkového programu).

#### Mongoose Schéma
```typescript
import mongoose from 'mongoose';

const MicrocycleSchema = new mongoose.Schema({
  _id: {
    type: String, // UUID
    required: true
  },
  mesocycleId: {
    type: String, // Vztah k Mesocycle._id (UUID)
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Název mikrocyklu je povinný.'], // Např. "Týden 1"
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  order: {
    type: Number, // Pořadí týdnu v rámci mezocyklu (např. 1, 2, 3...)
    required: true,
    index: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  }
}, {
  _id: false,
  timestamps: true
});

export default mongoose.models.Microcycle || mongoose.model('Microcycle', MicrocycleSchema);
```

#### Zod Schéma
```typescript
export const MicrocycleZodSchema = z.object({
  _id: z.string().uuid(),
  mesocycleId: z.string().uuid(),
  name: z.string().min(1, 'Název mikrocyklu je povinný.'),
  description: z.string().optional(),
  order: z.number().int().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date()
}).refine(data => data.endDate >= data.startDate, {
  message: "Datum konce musí být po datu začátku.",
  path: ["endDate"]
});
```

---

### E. Cvik (`src/server/db/models/Exercise.ts`)
Katalogový cvik trvalého charakteru.

#### Mongoose Schéma
*(Shodné s existující specifikací v `02_databazova_vrstva.md`)*
```typescript
import mongoose from 'mongoose';

const ExerciseSchema = new mongoose.Schema({
  _id: {
    type: String, // UUID
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  category: {
    type: String,
    required: true,
    enum: ['strength', 'combat', 'cardio', 'mobility', 'stretch'],
    default: 'strength'
  },
  description: {
    type: String,
    trim: true
  },
  videoUrl: {
    type: String,
    trim: true
  },
  defaultMetrics: {
    sets: { type: Number, default: 3 },
    reps: { type: Number, default: 10 },
    weight: { type: Number, default: 0 },
    duration: { type: Number, default: 0 },
    rounds: { type: Number, default: 1 },
    roundDuration: { type: Number, default: 180 },
    restDuration: { type: Number, default: 60 }
  }
}, {
  _id: false,
  timestamps: true
});

export default mongoose.models.Exercise || mongoose.model('Exercise', ExerciseSchema);
```

#### Zod Schéma
```typescript
export const ExerciseZodSchema = z.object({
  _id: z.string().uuid(),
  name: z.string().min(1, 'Název cviku je povinný.'),
  category: z.enum(['strength', 'combat', 'cardio', 'mobility', 'stretch']).default('strength'),
  description: z.string().optional(),
  videoUrl: z.string().url('Neplatná URL videa.').or(z.string().length(0)).optional(),
  defaultMetrics: z.object({
    sets: z.number().nonnegative().default(3),
    reps: z.number().nonnegative().default(10),
    weight: z.number().nonnegative().default(0),
    duration: z.number().nonnegative().default(0),
    rounds: z.number().nonnegative().default(1),
    roundDuration: z.number().nonnegative().default(180),
    restDuration: z.number().nonnegative().default(60)
  })
});
```

---

### F. Tréninkový Blok (Workout / Šablona) (`src/server/db/models/Workout.ts`)
Šablona celého tréninkového dne (např. "Push Day", "Běžecký intervalový trénink"), kterou lze opakovaně používat nebo přiřazovat do kalendáře.

#### Mongoose Schéma
```typescript
import mongoose from 'mongoose';

// Pomocné schéma pro zařazené cviky v šabloně tréninku
const WorkoutExerciseSchema = new mongoose.Schema({
  id: {
    type: String, // UUID přiřazení
    required: true
  },
  exerciseId: {
    type: String, // Odkaz na Exercise katalog
    required: true
  },
  name: { type: String, required: true },
  category: { type: String, required: true },
  metrics: {
    sets: Number,
    reps: Number,
    weight: Number,
    duration: Number,
    rounds: Number,
    roundDuration: Number,
    restDuration: Number
  }
}, {
  _id: false
});

const WorkoutSchema = new mongoose.Schema({
  _id: {
    type: String, // UUID
    required: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Název tréninku je povinný.'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  targetDuration: {
    type: Number, // Cílová délka v minutách
    default: 60
  },
  exercises: [WorkoutExerciseSchema]
}, {
  _id: false,
  timestamps: true
});

export default mongoose.models.Workout || mongoose.model('Workout', WorkoutSchema);
```

#### Zod Schéma
```typescript
export const WorkoutExerciseZodSchema = z.object({
  id: z.string().uuid(),
  exerciseId: z.string().uuid(),
  name: z.string(),
  category: z.enum(['strength', 'combat', 'cardio', 'mobility', 'stretch']),
  metrics: z.object({
    sets: z.number().nonnegative().optional(),
    reps: z.number().nonnegative().optional(),
    weight: z.number().nonnegative().optional(),
    duration: z.number().nonnegative().optional(),
    rounds: z.number().nonnegative().optional(),
    roundDuration: z.number().nonnegative().optional(),
    restDuration: z.number().nonnegative().optional()
  })
});

export const WorkoutZodSchema = z.object({
  _id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1, 'Název tréninku je povinný.'),
  description: z.string().optional(),
  targetDuration: z.number().int().nonnegative().default(60),
  exercises: z.array(WorkoutExerciseZodSchema).default([])
});
```

---

### G. Záznam Tréninku (Training Session / Zápis v kalendáři) (`src/server/db/models/TrainingSession.ts`)
Reprezentuje konkrétní odtrénovaný (nebo plánovaný) den v kalendáři uživatele. Je přímo svázán s mikrocyklem a může vycházet ze šablony (Workout). Obsahuje vnořené časové bloky a cviky, které uživatel skutečně splnil (včetně přepisů hmotností, opakování apod.).

#### Mongoose Schéma
```typescript
import mongoose from 'mongoose';

// Schéma pro reálně splněný cvik v tréninkové jednotce
const SessionExerciseSchema = new mongoose.Schema({
  _id: {
    type: String, // UUID přiřazení cviku
    required: true
  },
  exerciseId: {
    type: String, // Reference na Exercise katalog
    required: true
  },
  name: { type: String, required: true },
  category: { type: String, required: true },
  metrics: {
    sets: Number,
    reps: Number,
    weight: Number,
    duration: Number,
    rounds: Number,
    roundDuration: Number,
    restDuration: Number
  },
  completedSets: {
    type: [{
      reps: Number,
      weight: Number,
      completed: Boolean
    }],
    default: []
  }
}, {
  _id: false
});

// Schéma pro reálný časový blok v kalendáři
const SessionTimeBlockSchema = new mongoose.Schema({
  id: {
    type: String, // UUID bloku
    required: true
  },
  name: {
    type: String,
    required: true,
    default: 'Tréninkový Blok'
  },
  duration: {
    type: Number, // Skutečná/plánovaná délka bloku v minutách
    required: true,
    default: 15
  },
  exercises: [SessionExerciseSchema]
}, {
  _id: false
});

const TrainingSessionSchema = new mongoose.Schema({
  _id: {
    type: String, // UUID
    required: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  microcycleId: {
    type: String, // Vztah k Microcycle._id (UUID) - může být null pro ad-hoc trénink mimo makrocyklus
    default: null,
    index: true
  },
  workoutId: {
    type: String, // Z jaké šablony (Workout._id) trénink vznikl (optional)
    default: null
  },
  name: {
    type: String,
    required: [true, 'Název tréninkové jednotky je povinný.'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Datum tréninku je povinné.'],
    index: true
  },
  duration: {
    type: Number, // Celková skutečná délka tréninku v minutách
    default: 0
  },
  status: {
    type: String,
    enum: ['planned', 'completed', 'skipped'],
    default: 'planned',
    required: true
  },
  timeBlocks: [SessionTimeBlockSchema],
  notes: {
    type: String,
    trim: true
  }
}, {
  _id: false,
  timestamps: true
});

export default mongoose.models.TrainingSession || mongoose.model('TrainingSession', TrainingSessionSchema);
```

#### Zod Schéma
```typescript
export const SessionExerciseZodSchema = z.object({
  _id: z.string().uuid(),
  exerciseId: z.string().uuid(),
  name: z.string(),
  category: z.enum(['strength', 'combat', 'cardio', 'mobility', 'stretch']),
  metrics: z.object({
    sets: z.number().nonnegative().optional(),
    reps: z.number().nonnegative().optional(),
    weight: z.number().nonnegative().optional(),
    duration: z.number().nonnegative().optional(),
    rounds: z.number().nonnegative().optional(),
    roundDuration: z.number().nonnegative().optional(),
    restDuration: z.number().nonnegative().optional()
  }),
  completedSets: z.array(z.object({
    reps: z.number().nonnegative().optional(),
    weight: z.number().nonnegative().optional(),
    completed: z.boolean().default(false)
  })).default([])
});

export const SessionTimeBlockZodSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  duration: z.number().int().nonnegative().default(15),
  exercises: z.array(SessionExerciseZodSchema).default([])
});

export const TrainingSessionZodSchema = z.object({
  _id: z.string().uuid(),
  userId: z.string().uuid(),
  microcycleId: z.string().uuid().nullable().default(null),
  workoutId: z.string().uuid().nullable().default(null),
  name: z.string().min(1, 'Název tréninkové jednotky je povinný.'),
  date: z.coerce.date(),
  duration: z.number().int().nonnegative().default(0),
  status: z.enum(['planned', 'completed', 'skipped']).default('planned'),
  timeBlocks: z.array(SessionTimeBlockZodSchema).default([]),
  notes: z.string().optional()
});
```

---

## 🧪 5. Plán Pro Verifikaci Databáze

Pro ověření integrity napojení a modelů budou vytvořeny **integrační testy** ve složce `tests/integration/` (pomocí Vitest) s následujícím pokrytím:
1. **Ověření připojení**: Smoke test navázání a ukončení Mongoose připojení.
2. **UUID Unikátnost & Formát**: Test, že vložení neplatného formátu UUID do libovolného modelu (např. `_id: "non-uuid-string"`) selže na úrovni Zod validace i Mongoose schema validatorů.
3. **Hierarchické CRUD Operace**:
   * Vytvoření `User` ➡️ `Cycle` ➡️ `Mesocycle` ➡️ `Microcycle` ➡️ `TrainingSession` (se zápisem reálných cviků).
   * Ověření správnosti čtení vnořených struktur a zachování String formátu u `_id`.
4. **Vypnuté automatické `_id` pro subdokumenty**: Kontrola, že subdokumenty (např. splněné sety nebo cviky v časovém bloku) negenerují výchozí Mongoose MongoDB `ObjectId`, ale drží výhradně klientsky dodaná UUID.