import mongoose from 'mongoose';
import { z } from 'zod';

export const WorkoutExerciseZodSchema = z.object({
  id: z.string().uuid('Neplatné formát UUID přiřazení.'),
  exerciseId: z.string().uuid('Neplatné formát UUID katalogového cviku.'),
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
  })
});

export const WorkoutZodSchema = z.object({
  _id: z.string().uuid('Neplatný formát UUID tréninku.'),
  userId: z.string().uuid('Neplatný formát UUID uživatele.'),
  name: z.string().min(1, 'Název tréninku je povinný.'),
  description: z.string().optional(),
  targetDuration: z.number().int().nonnegative().default(60),
  exercises: z.array(WorkoutExerciseZodSchema).default([])
});

export type WorkoutType = z.infer<typeof WorkoutZodSchema>;
export type WorkoutExerciseType = z.infer<typeof WorkoutExerciseZodSchema>;

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
  _id: false // Vypneme automatické ObjectId
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
