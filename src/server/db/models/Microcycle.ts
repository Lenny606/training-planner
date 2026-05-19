import mongoose from 'mongoose';
import { z } from 'zod';

export const MicrocycleZodSchema = z.object({
  _id: z.string().uuid('Neplatný formát UUID mikrocyklu.'),
  mesocycleId: z.string().uuid('Neplatný formát UUID mezocyklu.'),
  name: z.string().min(1, 'Název mikrocyklu je povinný.'),
  description: z.string().optional(),
  order: z.number().int().min(1, 'Pořadí musí být alespoň 1.'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date()
}).refine(data => data.endDate >= data.startDate, {
  message: "Datum konce musí být po datu začátku.",
  path: ["endDate"]
});

export type MicrocycleType = z.infer<typeof MicrocycleZodSchema>;

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
    required: [true, 'Název mikrocyklu je povinný.'],
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
