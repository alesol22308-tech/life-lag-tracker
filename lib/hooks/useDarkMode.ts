'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Hook to manage dark mode state
 * Syncs with localStorage and database
 */
export function useDarkMode() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage and database
  useEffect(() => {
    async function initializeDarkMode() {
      // First, check localStorage for immediate UI update
      const localDarkMode = typeof window !== 'undefined' 
        ? localStorage.getItem('darkMode') === 'true'
        : false;

      // Apply to HTML element immediately
      if (typeof window !== 'undefined') {
        const html = document.documentElement;
        if (localDarkMode) {
          html.classList.add('dark');
        } else {
          html.classList.remove('dark');
        }
        setIsDarkMode(localDarkMode);
      }

      // Then check database for user preference
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
            setIsDarkMode(dbDarkMode);
            
            // Sync HTML class and localStorage
            if (typeof window !== 'undefined') {
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
      } finally {
        setIsLoading(false);
      }
    }

    initializeDarkMode();
  }, []);

  const toggleDarkMode = async (enabled: boolean) => {
    setIsDarkMode(enabled);

    // Update localStorage immediately for instant UI update
    if (typeof window !== 'undefined') {
      const html = document.documentElement;
      if (enabled) {
        html.classList.add('dark');
        localStorage.setItem('darkMode', 'true');
      } else {
        html.classList.remove('dark');
        localStorage.setItem('darkMode', 'false');
      }
    }

    // Persist to database
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error } = await supabase
          .from('users')
          .update({ dark_mode_enabled: enabled })
          .eq('id', user.id);

        if (error) {
          console.error('Error saving dark mode preference:', error);
        }
      }
    } catch (error) {
      console.error('Error saving dark mode preference:', error);
    }
  };

  return {
    isDarkMode,
    toggleDarkMode,
    isLoading,
  };
}
