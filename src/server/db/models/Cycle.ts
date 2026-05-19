import mongoose from 'mongoose';
import { z } from 'zod';

export const CycleZodSchema = z.object({
  _id: z.string().uuid('Neplatný formát UUID cyklu.'),
  userId: z.string().uuid('Neplatný formát UUID uživatele.'),
  name: z.string().min(1, 'Název cyklu je povinný.'),
  description: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  status: z.enum(['planned', 'active', 'completed']).default('planned')
}).refine(data => data.endDate >= data.startDate, {
  message: "Datum konce musí být po datu začátku.",
  path: ["endDate"]
});

export type CycleType = z.infer<typeof CycleZodSchema>;

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
