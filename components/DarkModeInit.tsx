'use client';

import { useEffect } from 'react';

/**
 * Client component to initialize dark mode on page load
 * Runs before React hydration to prevent flash
 */
export default function DarkModeInit() {
  useEffect(() => {
    // Check localStorage for dark mode preference
    const darkMode = typeof window !== 'undefined' 
      ? localStorage.getItem('darkMode') === 'true'
      : false;

    // Apply dark class to html element immediately
    if (darkMode && typeof document !== 'undefined') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return null;
}
