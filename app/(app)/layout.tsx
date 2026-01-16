'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { processQueue, getQueueCount } from '@/lib/offline-queue';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const isOnline = useOnlineStatus();
  const [queueCount, setQueueCount] = useState(0);

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Auth check error:', error);
          // Try refreshing session once without delay
          if (error.message?.includes('session') || error.message?.includes('JWT')) {
            await supabase.auth.refreshSession();
          }
        }
        
        if (!data?.user && pathname !== '/login') {
          router.push('/login');
          return;
        }

        setLoading(false);
      } catch (error) {
        console.error('Error checking auth:', error);
        if (pathname !== '/login') {
          router.push('/login');
        } else {
          setLoading(false);
        }
      }
    }

    checkAuth();
  }, [supabase, router, pathname]);

  // Update queue count
  useEffect(() => {
    async function updateQueueCount() {
      const count = await getQueueCount();
      setQueueCount(count);
    }
    
    updateQueueCount();
    
    // Update periodically
    const interval = setInterval(updateQueueCount, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Process offline queue when coming back online
  useEffect(() => {
    if (isOnline && queueCount > 0) {
      console.log('Back online, processing queue...');
      processQueue().then(result => {
        if (result.synced > 0) {
          // Update queue count after sync
          getQueueCount().then(setQueueCount);
        }
      });
    }
  }, [isOnline, queueCount]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <ErrorBoundary fallbackMessage="Something went wrong in this section. Please try refreshing the page.">
      {/* Offline indicator */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500/90 text-black text-center py-2 text-sm font-medium">
          You&apos;re offline. Check-ins will be saved and synced when you&apos;re back online.
        </div>
      )}
      
      {/* Queue indicator */}
      {queueCount > 0 && isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-blue-500/90 text-white text-center py-2 text-sm font-medium">
          Syncing {queueCount} queued check-in{queueCount > 1 ? 's' : ''}...
        </div>
      )}
      
      {children}
    </ErrorBoundary>
  );
}
