import mongoose from 'mongoose';
import { z } from 'zod';

export const MesocycleZodSchema = z.object({
  _id: z.string().uuid('Neplatný formát UUID mezocyklu.'),
  cycleId: z.string().uuid('Neplatný formát UUID cyklu.'),
  name: z.string().min(1, 'Název mezocyklu je povinný.'),
  description: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  focus: z.enum(['hypertrophy', 'strength', 'power', 'endurance', 'peaking', 'deload', 'recovery']).default('strength')
}).refine(data => data.endDate >= data.startDate, {
  message: "Datum konce musí být po datu začátku.",
  path: ["endDate"]
});

export type MesocycleType = z.infer<typeof MesocycleZodSchema>;

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
