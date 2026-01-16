/**
 * Offline queue manager for check-ins
 * Handles queueing and syncing check-ins when offline
 */

import { Answers, CheckinResult } from '@/types';
import { addOfflineCheckin, getUnsyncedCheckins, deleteOfflineCheckin, getUnsyncedCount } from './indexeddb';

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
 * Process all queued check-ins
 * Called when network connection is restored
 * @returns Number of check-ins successfully synced
 */
export async function processQueue(): Promise<{ synced: number; failed: number }> {
  try {
    const unsynced = await getUnsyncedCheckins();
    
    if (unsynced.length === 0) {
      console.log('No check-ins to sync');
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

    console.log(`Sync complete: ${syncedCount} synced, ${failedCount} failed`);
    
    return { synced: syncedCount, failed: failedCount };
  } catch (error) {
    console.error('Error processing queue:', error);
    return { synced: 0, failed: 0 };
  }
}

/**
 * Get count of pending check-ins in queue
 */
export async function getQueueCount(): Promise<number> {
  try {
    return await getUnsyncedCount();
  } catch (error) {
    console.error('Error getting queue count:', error);
    return 0;
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
