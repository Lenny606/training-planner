import { localDb } from './localDb';
import * as serverFns from '../server/functions';
import { useStore } from '../store/useStore';

export async function syncOfflineQueue(): Promise<{ success: boolean; processedCount: number }> {
  const store = useStore.getState();
  
  if (store.isSimulatedOffline || !store.isOnline) {
    store.addLog('Sync skipped: App is offline (simulated or real).', 'info');
    return { success: false, processedCount: 0 };
  }

  const queueItems = await localDb.syncQueue.orderBy('id').toArray();
  if (queueItems.length === 0) {
    store.addLog('Sync queue is empty. Nothing to sync.', 'info');
    return { success: true, processedCount: 0 };
  }

  store.addLog(`Starting sync of ${queueItems.length} outbox queue items...`, 'info');
  let processedCount = 0;

  for (const item of queueItems) {
    // Re-check online status before each request
    if (store.isSimulatedOffline || !store.isOnline) {
      store.addLog('Sync paused: connection lost during processing.', 'warn');
      return { success: false, processedCount };
    }

    const { id, entityId, entityType, action, payload } = item;
    store.addLog(`Processing ${action} on ${entityType} (ID: ${entityId})...`, 'info');

    try {
      switch (entityType) {
        case 'User':
          if (action === 'SAVE') {
            await serverFns.saveUserFn({ data: payload });
          }
          break;
        case 'Exercise':
          if (action === 'SAVE') {
            await serverFns.saveExerciseFn({ data: payload });
          }
          break;
        case 'Workout':
          if (action === 'SAVE') {
            await serverFns.saveWorkoutFn({ data: payload });
          } else if (action === 'DELETE') {
            await serverFns.deleteWorkoutFn({ data: { id: entityId } });
          }
          break;
        case 'Cycle':
          if (action === 'SAVE') {
            await serverFns.saveCycleFn({ data: payload });
          } else if (action === 'DELETE') {
            await serverFns.deleteCycleFn({ data: { id: entityId } });
          }
          break;
        case 'Mesocycle':
          if (action === 'SAVE') {
            await serverFns.saveMesocycleFn({ data: payload });
          }
          break;
        case 'Microcycle':
          if (action === 'SAVE') {
            await serverFns.saveMicrocycleFn({ data: payload });
          }
          break;
        case 'TrainingSession':
          if (action === 'SAVE') {
            await serverFns.saveTrainingSessionFn({ data: payload });
          } else if (action === 'DELETE') {
            await serverFns.deleteTrainingSessionFn({ data: { id: entityId } });
          }
          break;
        default:
          store.addLog(`Unknown entity type: ${entityType}`, 'error');
          break;
      }

      // If successful, delete from syncQueue
      if (id !== undefined) {
        await localDb.syncQueue.delete(id);
      }
      
      // Mark as synced: 1 in Dexie (except if it was deleted)
      if (action !== 'DELETE') {
        const table = getDexieTable(entityType);
        if (table) {
          await table.update(entityId, { synced: 1 });
        }
      }

      store.addLog(`Successfully synced ${action} on ${entityType} (ID: ${entityId}).`, 'success');
      processedCount++;
    } catch (error: any) {
      const errMsg = error?.message || String(error);
      store.addLog(`Sync FAILED for ${action} on ${entityType} (ID: ${entityId}): ${errMsg}. Halting queue.`, 'error');
      return { success: false, processedCount };
    }
  }

  // Refresh UI data lists after a successful sync
  await store.loadLocalData();
  store.addLog(`Sync complete. Processed ${processedCount} items successfully.`, 'success');
  return { success: true, processedCount };
}

function getDexieTable(entityType: string) {
  switch (entityType) {
    case 'User': return localDb.users;
    case 'Exercise': return localDb.exercises;
    case 'Workout': return localDb.workouts;
    case 'Cycle': return localDb.cycles;
    case 'Mesocycle': return localDb.mesocycles;
    case 'Microcycle': return localDb.microcycles;
    case 'TrainingSession': return localDb.trainingSessions;
    default: return null;
  }
}
