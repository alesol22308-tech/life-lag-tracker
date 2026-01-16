/**
 * Theme system utilities
 * Handles theme detection, application, and persistence
 */

export type Theme = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'life-lag-theme';

/**
 * Get the system's preferred color scheme
 */
export function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark';
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  return mediaQuery.matches ? 'dark' : 'light';
}

/**
 * Resolve theme preference to actual theme
 * @param theme User's theme preference
 * @returns Actual theme to apply
 */
export function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
}

/**
 * Apply theme to the DOM
 * @param theme Theme to apply ('light' or 'dark')
 */
export function applyTheme(theme: ResolvedTheme): void {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

/**
 * Get theme from localStorage
 */
export function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && ['system', 'light', 'dark'].includes(stored)) {
      return stored as Theme;
    }
  } catch (error) {
    console.error('Error reading theme from localStorage:', error);
  }
  
  return null;
}

/**
 * Store theme in localStorage
 */
export function storeTheme(theme: Theme): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.error('Error storing theme to localStorage:', error);
  }
}

/**
 * Initialize theme on page load (call before React hydration for no flash)
 */
export function initializeTheme(): ResolvedTheme {
  const storedTheme = getStoredTheme() || 'system';
  const resolved = resolveTheme(storedTheme);
  applyTheme(resolved);
  return resolved;
}
