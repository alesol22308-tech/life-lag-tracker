'use client';

import { useContext } from 'react';
import { ThemeContext } from '@/components/ThemeProvider';

/**
 * Hook to access and control the theme
 * Must be used within a ThemeProvider
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}
