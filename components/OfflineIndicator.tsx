'use client';

import { useEffect, useState } from 'react';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { getQueueCount } from '@/lib/offline-queue';

export default function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const [queueCount, setQueueCount] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [previousOnlineStatus, setPreviousOnlineStatus] = useState(true);

  // Update queue count periodically
  useEffect(() => {
    async function updateQueueCount() {
      const count = await getQueueCount();
      setQueueCount(count);
    }
    
    updateQueueCount();
    
    // Update periodically when offline or when queue has items
    const interval = setInterval(updateQueueCount, 5000); // Every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Show toast when online/offline status changes
  useEffect(() => {
    if (previousOnlineStatus !== isOnline) {
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
    setPreviousOnlineStatus(isOnline);
  }, [isOnline, previousOnlineStatus]);

  // Don't show indicator if online and no queued items
  if (isOnline && queueCount === 0 && !showToast) {
    return null;
  }

  return (
    <>
      {/* Toast notification for status changes */}
      {showToast && (
        <div
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${
            isOnline
              ? 'bg-emerald-500/90 text-white'
              : 'bg-yellow-500/90 text-black'
          }`}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {isOnline
                ? '✅ Back online. Syncing...'
                : '⚠️ You\'re offline. Changes will sync when online.'}
            </span>
          </div>
        </div>
      )}

      {/* Persistent indicator when offline or queued items exist */}
      {(!isOnline || queueCount > 0) && (
        <div
          className={`fixed top-0 left-0 right-0 z-50 py-2 px-4 text-center text-sm font-medium ${
            !isOnline
              ? 'bg-yellow-500/90 text-black'
              : 'bg-blue-500/90 text-white'
          }`}
          role="status"
          aria-live="polite"
        >
          {!isOnline ? (
            <span>
              You&apos;re offline. Check-ins will be saved and synced when you&apos;re back online.
              {queueCount > 0 && ` ${queueCount} item${queueCount !== 1 ? 's' : ''} queued.`}
            </span>
          ) : (
            <span>
              Syncing {queueCount} queued check-in{queueCount !== 1 ? 's' : ''}...
            </span>
          )}
        </div>
      )}
    </>
  );
}
