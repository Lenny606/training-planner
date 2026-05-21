import Dexie, { type Table } from 'dexie';

export interface LocalUser {
  id: string; // client-generated UUID
  name: string;
  email: string;
  role: 'coach' | 'athlete';
}

export interface LocalExercise {
  id: string; // client-generated UUID
  name: string;
  category: 'strength' | 'cardio' | 'mobility' | 'stretch' | 'combat';
  description?: string;
  videoUrl?: string;
  defaultMetrics?: {
    sets: number;
    reps: number;
    weight: number;
    duration: number;
    rounds: number;
    roundDuration: number;
    restDuration: number;
  };
}

export interface LocalWorkout {
  id: string; // client-generated UUID
  userId: string;
  name: string;
  description?: string;
  targetDuration?: number;
  exercises: Array<{
    id: string;
    exerciseId: string;
    name: string;
    category: string;
    metrics: {
      sets?: number;
      reps?: number;
      weight?: number;
      duration?: number;
      rounds?: number;
      roundDuration?: number;
      restDuration?: number;
    };
  }>;
  synced?: number; // 0 = unsynced, 1 = synced
}

export interface LocalCycle {
  id: string; // client-generated UUID
  userId: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'archived';
  synced?: number; // 0 = unsynced, 1 = synced
}

export interface LocalMesocycle {
  id: string; // client-generated UUID
  cycleId: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  focus: 'strength' | 'hypertrophy' | 'endurance' | 'power' | 'deload' | 'other';
  synced?: number;
}

export interface LocalMicrocycle {
  id: string; // client-generated UUID
  mesocycleId: string;
  name: string;
  description?: string;
  order: number;
  startDate: string;
  endDate: string;
  synced?: number;
}

export interface LocalTrainingSession {
  id: string; // client-generated UUID
  userId: string;
  microcycleId?: string;
  workoutId?: string;
  name: string;
  date: string;
  duration?: number;
  status: 'planned' | 'completed' | 'skipped';
  notes?: string;
  timeBlocks: Array<{
    id: string;
    name: string;
    duration: number;
    exercises: Array<{
      _id: string;
      exerciseId: string;
      name: string;
      category: string;
      metrics: {
        sets?: number;
        reps?: number;
        weight?: number;
        duration?: number;
        rounds?: number;
        roundDuration?: number;
        restDuration?: number;
      };
      completedSets?: Array<{
        reps: number;
        weight: number;
        completed: boolean;
      }>;
    }>;
  }>;
  synced?: number; // 0 = unsynced, 1 = synced
}

export interface SyncQueueItem {
  id?: number;
  entityId: string;
  entityType: 'User' | 'Exercise' | 'Workout' | 'Cycle' | 'Mesocycle' | 'Microcycle' | 'TrainingSession';
  action: 'SAVE' | 'DELETE';
  payload: any;
  timestamp: number;
}

export class ClientDatabase extends Dexie {
  users!: Table<LocalUser, string>;
  exercises!: Table<LocalExercise, string>;
  workouts!: Table<LocalWorkout, string>;
  cycles!: Table<LocalCycle, string>;
  mesocycles!: Table<LocalMesocycle, string>;
  microcycles!: Table<LocalMicrocycle, string>;
  trainingSessions!: Table<LocalTrainingSession, string>;
  syncQueue!: Table<SyncQueueItem, number>;

  constructor() {
    super('TrainingPlannerDB');
    this.version(1).stores({
      users: 'id',
      exercises: 'id, category',
      workouts: 'id, userId',
      cycles: 'id, userId',
      mesocycles: 'id, cycleId',
      microcycles: 'id, mesocycleId',
      trainingSessions: 'id, userId, date',
      syncQueue: '++id, entityId, entityType, action'
    });
  }
}

export const localDb = new ClientDatabase();
