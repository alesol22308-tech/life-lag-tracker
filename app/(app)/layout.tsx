'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { processQueue, getQueueCount } from '@/lib/offline-queue';
import OfflineIndicator from '@/components/OfflineIndicator';
import ChatWidget from '@/components/ChatWidget';

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
          if (process.env.NODE_ENV === 'development') {
            console.error('Auth check error:', error);
          }
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
        if (process.env.NODE_ENV === 'development') {
          console.error('Error checking auth:', error);
        }
        if (pathname !== '/login') {
          router.push('/login');
        } else {
          setLoading(false);
        }
      }
    }

    checkAuth();
  }, [supabase, router, pathname]);

  // Update queue count (and when check-in or other action was just queued)
  useEffect(() => {
    async function updateQueueCount() {
      const count = await getQueueCount();
      setQueueCount(count);
    }

    updateQueueCount();

    const handleQueueUpdated = () => {
      updateQueueCount();
    };
    window.addEventListener('life-lag:queue-updated', handleQueueUpdated);

    // Update periodically
    const interval = setInterval(updateQueueCount, 30000); // Every 30 seconds
    return () => {
      window.removeEventListener('life-lag:queue-updated', handleQueueUpdated);
      clearInterval(interval);
    };
  }, []);

  // Process offline queue when coming back online
  useEffect(() => {
    if (isOnline && queueCount > 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Back online, processing queue...');
      }
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
      <OfflineIndicator />
      <ChatWidget />
      {children}
    </ErrorBoundary>
  );
}
