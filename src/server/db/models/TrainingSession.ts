import mongoose from 'mongoose';
import { z } from 'zod';

export const SessionExerciseZodSchema = z.object({
  _id: z.string().uuid('Neplatný formát UUID přiřazení cviku.'),
  exerciseId: z.string().uuid('Neplatný formát UUID katalogového cviku.'),
  name: z.string().min(1, 'Název cviku je povinný.'),
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
  id: z.string().uuid('Neplatný formát UUID časového bloku.'),
  name: z.string().min(1, 'Název bloku je povinný.'),
  duration: z.number().int().nonnegative().default(15),
  exercises: z.array(SessionExerciseZodSchema).default([])
});

export const TrainingSessionZodSchema = z.object({
  _id: z.string().uuid('Neplatný formát UUID tréninkové jednotky.'),
  userId: z.string().uuid('Neplatný formát UUID uživatele.'),
  microcycleId: z.string().uuid('Neplatný formát UUID mikrocyklu.').nullable().default(null),
  workoutId: z.string().uuid('Neplatný formát UUID šablony tréninku.').nullable().default(null),
  name: z.string().min(1, 'Název tréninkové jednotky je povinný.'),
  date: z.coerce.date(),
  duration: z.number().int().nonnegative().default(0),
  status: z.enum(['planned', 'completed', 'skipped']).default('planned'),
  timeBlocks: z.array(SessionTimeBlockZodSchema).default([]),
  notes: z.string().optional()
});

export type TrainingSessionType = z.infer<typeof TrainingSessionZodSchema>;
export type SessionTimeBlockType = z.infer<typeof SessionTimeBlockZodSchema>;
export type SessionExerciseType = z.infer<typeof SessionExerciseZodSchema>;

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
  _id: false // Vypneme automatické ObjectId
});

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
  _id: false // Vypneme automatické ObjectId
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
    type: String, // Vztah k Microcycle._id (UUID) - může být null pro ad-hoc trénink
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
