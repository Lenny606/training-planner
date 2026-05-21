import { create } from 'zustand';
import { localDb } from '../db/localDb';
import { fetchDataFn } from '../server/functions';
import { syncOfflineQueue } from '../db/syncEngine';

export interface LogEntry {
  timestamp: number;
  message: string;
  type: 'info' | 'success' | 'warn' | 'error';
}

const DEFAULT_COACH_ID = 'c2069e2c-381c-43df-8121-66385f09623e';

interface StoreState {
  activeUserId: string;
  isOnline: boolean;
  isSimulatedOffline: boolean;
  isSyncing: boolean;
  logs: LogEntry[];

  // local DB lists for UI
  users: any[];
  exercises: any[];
  workouts: any[];
  cycles: any[];
  mesocycles: any[];
  microcycles: any[];
  trainingSessions: any[];
  syncQueueItems: any[];

  // Actions
  initStore: () => Promise<void>;
  setOnlineStatus: (status: boolean) => void;
  setSimulatedOffline: (simulated: boolean) => Promise<void>;
  addLog: (message: string, type?: 'info' | 'success' | 'warn' | 'error') => void;
  clearLogs: () => void;
  changeUser: (userId: string) => Promise<void>;
  loadLocalData: () => Promise<void>;
  triggerLocalSync: () => Promise<void>;

  // Direct edit actions for testing offline CRUD
  addWorkoutOffline: (name: string, description: string) => Promise<void>;
  deleteWorkoutOffline: (id: string) => Promise<void>;
  addCycleOffline: (name: string, startDate: string, endDate: string) => Promise<void>;
  deleteCycleOffline: (id: string) => Promise<void>;
  addTrainingSessionOffline: (name: string, date: string, status: 'planned' | 'completed' | 'skipped') => Promise<void>;
  deleteTrainingSessionOffline: (id: string) => Promise<void>;
}

export const useStore = create<StoreState>((set, get) => ({
  activeUserId: typeof window !== 'undefined' ? localStorage.getItem('activeUserId') || DEFAULT_COACH_ID : DEFAULT_COACH_ID,
  isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
  isSimulatedOffline: typeof window !== 'undefined' ? localStorage.getItem('isSimulatedOffline') === 'true' : false,
  isSyncing: false,
  logs: [],

  users: [],
  exercises: [],
  workouts: [],
  cycles: [],
  mesocycles: [],
  microcycles: [],
  trainingSessions: [],
  syncQueueItems: [],

  initStore: async () => {
    const isSimulated = get().isSimulatedOffline;
    const online = isSimulated ? false : (typeof window !== 'undefined' ? navigator.onLine : true);
    
    set({ isOnline: online });
    
    get().addLog(`Initialize Store. Active User: ${get().activeUserId}. Online: ${online} (Simulated: ${isSimulated})`, 'info');

    // Populate UI from local database
    await get().loadLocalData();

    // If online, perform automatic sync & download update
    if (online) {
      get().addLog('Online on startup. Triggering automatic sync...', 'info');
      await get().triggerLocalSync();
      
      try {
        get().addLog(`Fetching server snapshot for user ${get().activeUserId}...`, 'info');
        const data = await fetchDataFn({ data: get().activeUserId });
        
        // Put data into Dexie
        await localDb.transaction('rw', [
          localDb.users,
          localDb.exercises,
          localDb.workouts,
          localDb.cycles,
          localDb.mesocycles,
          localDb.microcycles,
          localDb.trainingSessions
        ], async () => {
          if (data.users.length > 0) await localDb.users.bulkPut(data.users);
          if (data.exercises.length > 0) await localDb.exercises.bulkPut(data.exercises);
          if (data.workouts.length > 0) await localDb.workouts.bulkPut(data.workouts);
          if (data.cycles.length > 0) await localDb.cycles.bulkPut(data.cycles);
          if (data.mesocycles.length > 0) await localDb.mesocycles.bulkPut(data.mesocycles);
          if (data.microcycles.length > 0) await localDb.microcycles.bulkPut(data.microcycles);
          if (data.trainingSessions.length > 0) await localDb.trainingSessions.bulkPut(data.trainingSessions);
        });

        get().addLog('Local DB updated with server snapshot.', 'success');
        await get().loadLocalData();
      } catch (err: any) {
        get().addLog(`Failed to fetch startup server snapshot: ${err.message || err}`, 'warn');
      }
    }
  },

  setOnlineStatus: (status) => {
    const simulated = get().isSimulatedOffline;
    if (simulated) {
      // Ignore physical browser changes if simulated offline is active
      return;
    }
    set({ isOnline: status });
    get().addLog(`Browser connection changed: isOnline = ${status}`, status ? 'success' : 'warn');
    if (status) {
      get().triggerLocalSync();
    }
  },

  setSimulatedOffline: async (simulated) => {
    localStorage.setItem('isSimulatedOffline', simulated ? 'true' : 'false');
    const actualOnline = typeof window !== 'undefined' ? navigator.onLine : true;
    const finalOnlineState = simulated ? false : actualOnline;

    set({
      isSimulatedOffline: simulated,
      isOnline: finalOnlineState
    });

    get().addLog(`Simulated Offline set to ${simulated}. Calculated online state: ${finalOnlineState}`, 'info');

    if (finalOnlineState) {
      get().addLog('Reconnected via simulation. Triggering sync...', 'success');
      await get().triggerLocalSync();
    }
  },

  addLog: (message, type = 'info') => {
    const entry: LogEntry = {
      timestamp: Date.now(),
      message,
      type
    };
    set((state) => ({ logs: [entry, ...state.logs].slice(0, 100) }));
  },

  clearLogs: () => set({ logs: [] }),

  changeUser: async (userId) => {
    set({ activeUserId: userId });
    localStorage.setItem('activeUserId', userId);
    get().addLog(`Switching active user to ${userId}`, 'info');

    // Wipe local cache tables except syncQueue to avoid leaks of athlete/coach templates
    await localDb.transaction('rw', [
      localDb.users,
      localDb.workouts,
      localDb.cycles,
      localDb.mesocycles,
      localDb.microcycles,
      localDb.trainingSessions
    ], async () => {
      await localDb.users.clear();
      await localDb.workouts.clear();
      await localDb.cycles.clear();
      await localDb.mesocycles.clear();
      await localDb.microcycles.clear();
      await localDb.trainingSessions.clear();
    });

    get().addLog('Local tables wiped for user switch.', 'info');

    // Fetch new user data from server if online
    if (get().isOnline) {
      try {
        get().addLog(`Fetching server data for new user ${userId}...`, 'info');
        const data = await fetchDataFn({ data: userId });
        
        await localDb.transaction('rw', [
          localDb.users,
          localDb.exercises,
          localDb.workouts,
          localDb.cycles,
          localDb.mesocycles,
          localDb.microcycles,
          localDb.trainingSessions
        ], async () => {
          if (data.users.length > 0) await localDb.users.bulkPut(data.users);
          if (data.exercises.length > 0) await localDb.exercises.bulkPut(data.exercises);
          if (data.workouts.length > 0) await localDb.workouts.bulkPut(data.workouts);
          if (data.cycles.length > 0) await localDb.cycles.bulkPut(data.cycles);
          if (data.mesocycles.length > 0) await localDb.mesocycles.bulkPut(data.mesocycles);
          if (data.microcycles.length > 0) await localDb.microcycles.bulkPut(data.microcycles);
          if (data.trainingSessions.length > 0) await localDb.trainingSessions.bulkPut(data.trainingSessions);
        });

        get().addLog('Local DB populated with fetched data for switched user.', 'success');
      } catch (err: any) {
        get().addLog(`Could not fetch data for switched user: ${err.message || err}`, 'warn');
      }
    } else {
      get().addLog('App is offline. Switched user local cache remains empty.', 'warn');
    }

    await get().loadLocalData();
  },

  loadLocalData: async () => {
    const [users, exercises, workouts, cycles, mesocycles, microcycles, trainingSessions, syncQueueItems] = await Promise.all([
      localDb.users.toArray(),
      localDb.exercises.orderBy('name').toArray(),
      localDb.workouts.where('userId').equals(get().activeUserId).toArray(),
      localDb.cycles.where('userId').equals(get().activeUserId).toArray(),
      localDb.mesocycles.toArray(),
      localDb.microcycles.toArray(),
      localDb.trainingSessions.where('userId').equals(get().activeUserId).toArray(),
      localDb.syncQueue.orderBy('id').toArray()
    ]);

    set({
      users,
      exercises,
      workouts,
      cycles,
      mesocycles,
      microcycles,
      trainingSessions,
      syncQueueItems
    });
  },

  triggerLocalSync: async () => {
    if (get().isSyncing) return;
    set({ isSyncing: true });
    try {
      await syncOfflineQueue();
    } finally {
      set({ isSyncing: false });
    }
  },

  // -------------------------------------------------------------
  // Offline Mocking CRUD Actions
  // -------------------------------------------------------------

  addWorkoutOffline: async (name, description) => {
    const activeUserId = get().activeUserId;
    const newWorkout = {
      id: crypto.randomUUID(),
      userId: activeUserId,
      name,
      description,
      targetDuration: 60,
      exercises: [],
      synced: 0
    };

    get().addLog(`[Local Actions] Creating Workout offline: "${name}"`, 'info');

    // 1. Write to Dexie
    await localDb.workouts.put(newWorkout);

    // 2. Push to Outbox Queue
    await localDb.syncQueue.put({
      entityId: newWorkout.id,
      entityType: 'Workout',
      action: 'SAVE',
      payload: newWorkout,
      timestamp: Date.now()
    });

    await get().loadLocalData();

    // 3. Trigger autosave if online
    if (get().isOnline) {
      await get().triggerLocalSync();
    }
  },

  deleteWorkoutOffline: async (id) => {
    get().addLog(`[Local Actions] Deleting Workout offline: (ID: ${id})`, 'info');

    // 1. Delete from Dexie
    await localDb.workouts.delete(id);

    // 2. Push DELETE action to Outbox Queue
    await localDb.syncQueue.put({
      entityId: id,
      entityType: 'Workout',
      action: 'DELETE',
      payload: null,
      timestamp: Date.now()
    });

    await get().loadLocalData();

    // 3. Sync if online
    if (get().isOnline) {
      await get().triggerLocalSync();
    }
  },

  addCycleOffline: async (name, startDate, endDate) => {
    const activeUserId = get().activeUserId;
    const newCycle = {
      id: crypto.randomUUID(),
      userId: activeUserId,
      name,
      description: 'Offline created training cycle',
      startDate,
      endDate,
      status: 'active' as const,
      synced: 0
    };

    get().addLog(`[Local Actions] Creating Cycle offline: "${name}"`, 'info');

    await localDb.cycles.put(newCycle);

    await localDb.syncQueue.put({
      entityId: newCycle.id,
      entityType: 'Cycle',
      action: 'SAVE',
      payload: newCycle,
      timestamp: Date.now()
    });

    await get().loadLocalData();

    if (get().isOnline) {
      await get().triggerLocalSync();
    }
  },

  deleteCycleOffline: async (id) => {
    get().addLog(`[Local Actions] Deleting Cycle offline: (ID: ${id})`, 'info');

    await localDb.cycles.delete(id);

    await localDb.syncQueue.put({
      entityId: id,
      entityType: 'Cycle',
      action: 'DELETE',
      payload: null,
      timestamp: Date.now()
    });

    await get().loadLocalData();

    if (get().isOnline) {
      await get().triggerLocalSync();
    }
  },

  addTrainingSessionOffline: async (name, date, status) => {
    const activeUserId = get().activeUserId;
    const newSession = {
      id: crypto.randomUUID(),
      userId: activeUserId,
      name,
      date,
      status,
      duration: 45,
      timeBlocks: [],
      synced: 0
    };

    get().addLog(`[Local Actions] Creating Training Session offline: "${name}"`, 'info');

    await localDb.trainingSessions.put(newSession);

    await localDb.syncQueue.put({
      entityId: newSession.id,
      entityType: 'TrainingSession',
      action: 'SAVE',
      payload: newSession,
      timestamp: Date.now()
    });

    await get().loadLocalData();

    if (get().isOnline) {
      await get().triggerLocalSync();
    }
  },

  deleteTrainingSessionOffline: async (id) => {
    get().addLog(`[Local Actions] Deleting Training Session offline: (ID: ${id})`, 'info');

    await localDb.trainingSessions.delete(id);

    await localDb.syncQueue.put({
      entityId: id,
      entityType: 'TrainingSession',
      action: 'DELETE',
      payload: null,
      timestamp: Date.now()
    });

    await get().loadLocalData();

    if (get().isOnline) {
      await get().triggerLocalSync();
    }
  }
}));
