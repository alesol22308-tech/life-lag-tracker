'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Client component to initialize dark mode on page load
 * Checks localStorage first, then database preference
 */
export default function DarkModeInit() {
  useEffect(() => {
    async function initializeDarkMode() {
      // First, check localStorage for immediate UI update
      const localDarkMode = typeof window !== 'undefined' 
        ? localStorage.getItem('darkMode') === 'true'
        : false;

      // Apply to HTML element immediately based on localStorage
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        const html = document.documentElement;
        if (localDarkMode) {
          html.classList.add('dark');
        } else {
          html.classList.remove('dark');
        }
      }

      // Then check database for user preference (if authenticated)
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data, error } = await supabase
            .from('users')
            .select('dark_mode_enabled')
            .eq('id', user.id)
            .single();

          if (!error && data?.dark_mode_enabled !== undefined) {
            const dbDarkMode = data.dark_mode_enabled;
            
            // Sync HTML class and localStorage with database preference
            if (typeof window !== 'undefined' && typeof document !== 'undefined') {
              const html = document.documentElement;
              if (dbDarkMode) {
                html.classList.add('dark');
                localStorage.setItem('darkMode', 'true');
              } else {
                html.classList.remove('dark');
                localStorage.setItem('darkMode', 'false');
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading dark mode preference:', error);
      }
    }

    initializeDarkMode();
  }, []);

  return null;
}
