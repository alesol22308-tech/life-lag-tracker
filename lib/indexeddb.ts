/**
 * IndexedDB wrapper for offline storage
 * Uses idb library for promise-based API
 */

import { openDB, IDBPDatabase } from 'idb';
import { Answers } from '@/types';

// Define database schema type
type OfflineCheckin = {
  id: string;
  answers: Answers;
  timestamp: number;
  synced: boolean;
};

const DB_NAME = 'life-lag-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase | null = null;

/**
 * Initialize and open the IndexedDB database
 */
async function getDB(): Promise<IDBPDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create offline_checkins store if it doesn't exist
      if (!db.objectStoreNames.contains('offline_checkins')) {
        const store = db.createObjectStore('offline_checkins', { keyPath: 'id' });
        store.createIndex('by-timestamp', 'timestamp');
        store.createIndex('by-synced', 'synced');
      }
    },
  });

  return dbInstance;
}

/**
 * Add a check-in to offline queue
 */
export async function addOfflineCheckin(answers: Answers): Promise<string> {
  const db = await getDB();
  const id = `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const checkin: OfflineCheckin = {
    id,
    answers,
    timestamp: Date.now(),
    synced: false,
  };
  
  await db.add('offline_checkins', checkin);

  return id;
}

/**
 * Get all unsynced check-ins from offline queue
 */
export async function getUnsyncedCheckins(): Promise<OfflineCheckin[]> {
  const db = await getDB();
  const tx = db.transaction('offline_checkins', 'readonly');
  const index = tx.store.index('by-synced');
  
  // Query for unsynced check-ins (synced = false)
  const allCheckins = await index.getAll() as OfflineCheckin[];
  return allCheckins.filter(checkin => !checkin.synced);
}

/**
 * Get all check-ins (synced and unsynced)
 */
export async function getAllOfflineCheckins(): Promise<OfflineCheckin[]> {
  const db = await getDB();
  return await db.getAll('offline_checkins') as OfflineCheckin[];
}

/**
 * Mark a check-in as synced
 */
export async function markCheckinAsSynced(id: string): Promise<void> {
  const db = await getDB();
  const checkin = await db.get('offline_checkins', id) as OfflineCheckin | undefined;
  
  if (checkin) {
    checkin.synced = true;
    await db.put('offline_checkins', checkin);
  }
}

/**
 * Delete a check-in from offline queue
 */
export async function deleteOfflineCheckin(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('offline_checkins', id);
}

/**
 * Clear all synced check-ins from offline queue
 */
export async function clearSyncedCheckins(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('offline_checkins', 'readonly');
  const index = tx.store.index('by-synced');
  
  // Get all check-ins and filter for synced ones
  const allCheckins = await index.getAll() as OfflineCheckin[];
  const synced = allCheckins.filter(checkin => checkin.synced);
  
  // Delete synced check-ins
  const writeTx = db.transaction('offline_checkins', 'readwrite');
  await Promise.all(synced.map(checkin => writeTx.store.delete(checkin.id)));
  await writeTx.done;
}

/**
 * Get count of unsynced check-ins
 */
export async function getUnsyncedCount(): Promise<number> {
  const db = await getDB();
  const unsynced = await getUnsyncedCheckins();
  return unsynced.length;
}
