import mongoose from 'mongoose';
import { z } from 'zod';

export const UserZodSchema = z.object({
  _id: z.string().uuid('Neplatný formát UUID uživatele.'),
  email: z.string().email('Neplatný email.'),
  name: z.string().min(1, 'Jméno nesmí být prázdné.'),
  role: z.enum(['athlete', 'coach', 'admin']).default('athlete')
});

export type UserType = z.infer<typeof UserZodSchema>;

const UserSchema = new mongoose.Schema({
  _id: {
    type: String, // UUID
    required: true,
    validate: {
      validator: (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v),
      message: 'Neplatný formát UUID uživatele.'
    }
  },
  email: {
    type: String,
    required: [true, 'Email je povinný.'],
    unique: true,
    trim: true,
    lowercase: true,
    index: true,
    validate: {
      validator: (v: string) => /^\S+@\S+\.\S+$/.test(v),
      message: 'Neplatný email.'
    }
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
