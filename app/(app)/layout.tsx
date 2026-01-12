'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        // Try to get user, with retry for Safari cookie issues
        let user = null;
        let attempts = 0;
        const maxAttempts = 3;

        while (!user && attempts < maxAttempts) {
          const { data, error } = await supabase.auth.getUser();
          
          if (error) {
            console.error('Auth check error:', error);
            // If it's a session error, try refreshing
            if (error.message?.includes('session') || error.message?.includes('JWT')) {
              await supabase.auth.refreshSession();
              attempts++;
              if (attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 500)); // Wait before retry
                continue;
              }
            }
          }
          
          user = data?.user;
          if (user) break;
          
          attempts++;
          if (attempts < maxAttempts) {
            // Wait a bit before retrying (helps with Safari cookie propagation)
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        if (!user && pathname !== '/login') {
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}
