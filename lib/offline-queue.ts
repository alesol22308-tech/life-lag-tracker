/**
 * Offline queue manager for check-ins
 * Handles queueing and syncing check-ins when offline
 */

import { Answers, CheckinResult } from '@/types';
import { 
  addOfflineCheckin, 
  getUnsyncedCheckins, 
  deleteOfflineCheckin, 
  getUnsyncedCount,
  addOfflineAction,
  getUnsyncedActions,
  deleteOfflineAction,
  getTotalUnsyncedCount
} from './indexeddb';

/**
 * Enqueue a check-in when offline
 * @param answers Check-in answers
 * @param reflectionNote Optional reflection note
 * @returns Queue ID
 */
export async function enqueueCheckin(answers: Answers, reflectionNote?: string): Promise<string> {
  try {
    const id = await addOfflineCheckin(answers, reflectionNote);
    console.log('Check-in queued for offline sync:', id);
    return id;
  } catch (error) {
    console.error('Error queueing check-in:', error);
    throw error;
  }
}

/**
 * Process all queued actions (commitment updates, status updates, etc.)
 * Called when network connection is restored
 */
async function processActions(): Promise<{ synced: number; failed: number }> {
  try {
    const unsynced = await getUnsyncedActions();
    
    if (unsynced.length === 0) {
      return { synced: 0, failed: 0 };
    }

    console.log(`Processing ${unsynced.length} queued action(s)...`);
    
    let syncedCount = 0;
    let failedCount = 0;

    for (const action of unsynced) {
      try {
        const response = await fetch(action.url, {
          method: action.method,
          headers: {
            'Content-Type': 'application/json',
            ...action.headers,
          },
          body: action.body,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Delete from queue after successful sync
        await deleteOfflineAction(action.id);
        syncedCount++;
        
        console.log(`Synced action ${action.id}`);
      } catch (error) {
        console.error(`Failed to sync action ${action.id}:`, error);
        failedCount++;
        // Don't delete - keep in queue for next sync attempt
      }
    }

    return { synced: syncedCount, failed: failedCount };
  } catch (error) {
    console.error('Error processing actions:', error);
    return { synced: 0, failed: 0 };
  }
}

/**
 * Process all queued check-ins
 * Called when network connection is restored
 * @returns Number of check-ins successfully synced
 */
async function processCheckins(): Promise<{ synced: number; failed: number }> {
  try {
    const unsynced = await getUnsyncedCheckins();
    
    if (unsynced.length === 0) {
      return { synced: 0, failed: 0 };
    }

    console.log(`Processing ${unsynced.length} queued check-in(s)...`);
    
    let syncedCount = 0;
    let failedCount = 0;

    for (const checkin of unsynced) {
      try {
        // Submit check-in to API
        const response = await fetch('/api/checkin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            answers: checkin.answers,
            reflectionNote: checkin.reflectionNote,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Delete from queue after successful sync
        await deleteOfflineCheckin(checkin.id);
        syncedCount++;
        
        console.log(`Synced check-in ${checkin.id}`);
      } catch (error) {
        console.error(`Failed to sync check-in ${checkin.id}:`, error);
        failedCount++;
        // Don't delete - keep in queue for next sync attempt
      }
    }

    return { synced: syncedCount, failed: failedCount };
  } catch (error) {
    console.error('Error processing check-ins:', error);
    return { synced: 0, failed: 0 };
  }
}

/**
 * Process all queued items (check-ins + actions)
 * Called when network connection is restored
 * @returns Total number of items successfully synced
 */
export async function processQueue(): Promise<{ synced: number; failed: number }> {
  const checkinResult = await processCheckins();
  const actionResult = await processActions();
  
  const totalSynced = checkinResult.synced + actionResult.synced;
  const totalFailed = checkinResult.failed + actionResult.failed;
  
  console.log(`Sync complete: ${totalSynced} synced, ${totalFailed} failed`);
  
  return { synced: totalSynced, failed: totalFailed };
}

/**
 * Get count of pending items in queue (check-ins + actions)
 */
export async function getQueueCount(): Promise<number> {
  try {
    return await getTotalUnsyncedCount();
  } catch (error) {
    console.error('Error getting queue count:', error);
    return 0;
  }
}

/**
 * Enqueue a generic action for offline sync
 * Used for commitment updates, micro-goal status updates, etc.
 */
export async function enqueueAction(
  url: string,
  method: string,
  body: Record<string, any>,
  headers: Record<string, string> = {}
): Promise<string> {
  try {
    const id = await addOfflineAction(url, method, body, headers);
    console.log('Action queued for offline sync:', id);
    return id;
  } catch (error) {
    console.error('Error queueing action:', error);
    throw error;
  }
}

/**
 * Submit check-in (online or offline)
 * Automatically queues if offline
 * @param answers Check-in answers
 * @param reflectionNote Optional reflection note
 * @param isOnline Whether user is online
 * @returns Check-in result or queue confirmation
 */
export async function submitCheckin(
  answers: Answers,
  isOnline: boolean,
  reflectionNote?: string
): Promise<{ result?: CheckinResult; queued?: boolean; queueId?: string }> {
  // If offline, queue the check-in
  if (!isOnline) {
    const queueId = await enqueueCheckin(answers, reflectionNote);
    return { queued: true, queueId };
  }

  // If online, submit directly
  try {
    const response = await fetch('/api/checkin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        answers,
        reflectionNote: reflectionNote?.trim() || undefined,
      }),
    });

    if (!response.ok) {
      // If network error while "online", queue it
      if (response.status >= 500 || !navigator.onLine) {
        const queueId = await enqueueCheckin(answers);
        return { queued: true, queueId };
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result: CheckinResult = await response.json();
    return { result };
  } catch (error) {
      // Network error - queue the check-in
      console.error('Network error, queueing check-in:', error);
      const queueId = await enqueueCheckin(answers, reflectionNote);
      return { queued: true, queueId };
    }
}
