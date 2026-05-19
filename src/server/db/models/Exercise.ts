import mongoose from 'mongoose';
import { z } from 'zod';

export const ExerciseZodSchema = z.object({
  _id: z.string().uuid('Neplatný formát UUID cviku.'),
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

export type ExerciseType = z.infer<typeof ExerciseZodSchema>;

const ExerciseSchema = new mongoose.Schema({
  _id: {
    type: String, // UUID
    required: true
  },
  name: {
    type: String,
    required: [true, 'Název cviku je povinný.'],
    trim: true,
    index: true
  },
  category: {
    type: String,
    required: [true, 'Kategorie je povinná.'],
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
    weight: { type: Number, default: 0 }, // v kg
    duration: { type: Number, default: 0 }, // v sekundách
    rounds: { type: Number, default: 1 },
    roundDuration: { type: Number, default: 180 }, // v sekundách
    restDuration: { type: Number, default: 60 } // v sekundách
  }
}, {
  _id: false,
  timestamps: true
});

export default mongoose.models.Exercise || mongoose.model('Exercise', ExerciseSchema);
