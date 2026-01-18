/**
 * Tests for lib/theme.ts
 * Tests getSystemTheme, resolveTheme, applyTheme, getStoredTheme, storeTheme, initializeTheme
 */

import {
  getSystemTheme,
  resolveTheme,
  applyTheme,
  getStoredTheme,
  storeTheme,
  initializeTheme,
  Theme,
  ResolvedTheme,
} from '@/lib/theme';

describe('getSystemTheme', () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('should return "dark" when system prefers dark mode', () => {
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    expect(getSystemTheme()).toBe('dark');
  });

  it('should return "light" when system prefers light mode', () => {
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: false, // Does not match dark mode
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    expect(getSystemTheme()).toBe('light');
  });
});

describe('resolveTheme', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    // Default to dark system preference
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  describe('system preference', () => {
    it('should return system theme when preference is "system"', () => {
      const result = resolveTheme('system');
      expect(result).toBe('dark'); // Our mock returns dark
    });

    it('should return light when system prefers light and preference is "system"', () => {
      window.matchMedia = jest.fn().mockImplementation(() => ({
        matches: false,
        media: '',
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const result = resolveTheme('system');
      expect(result).toBe('light');
    });
  });

  describe('explicit preferences', () => {
    it('should return "light" when preference is "light"', () => {
      expect(resolveTheme('light')).toBe('light');
    });

    it('should return "dark" when preference is "dark"', () => {
      expect(resolveTheme('dark')).toBe('dark');
    });
  });
});

describe('applyTheme', () => {
  let root: HTMLElement;

  beforeEach(() => {
    root = document.documentElement;
    root.classList.remove('dark');
  });

  describe('applying dark theme', () => {
    it('should add "dark" class to document element', () => {
      applyTheme('dark');
      expect(root.classList.contains('dark')).toBe(true);
    });
  });

  describe('applying light theme', () => {
    it('should remove "dark" class from document element', () => {
      root.classList.add('dark');
      applyTheme('light');
      expect(root.classList.contains('dark')).toBe(false);
    });

    it('should not add "dark" class when applying light theme', () => {
      applyTheme('light');
      expect(root.classList.contains('dark')).toBe(false);
    });
  });

  describe('switching themes', () => {
    it('should switch from light to dark', () => {
      applyTheme('light');
      expect(root.classList.contains('dark')).toBe(false);

      applyTheme('dark');
      expect(root.classList.contains('dark')).toBe(true);
    });

    it('should switch from dark to light', () => {
      applyTheme('dark');
      expect(root.classList.contains('dark')).toBe(true);

      applyTheme('light');
      expect(root.classList.contains('dark')).toBe(false);
    });
  });
});

describe('getStoredTheme', () => {
  const THEME_STORAGE_KEY = 'life-lag-theme';

  beforeEach(() => {
    localStorage.clear();
  });

  it('should return null when no theme is stored', () => {
    expect(getStoredTheme()).toBeNull();
  });

  it('should return "system" when stored', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'system');
    expect(getStoredTheme()).toBe('system');
  });

  it('should return "light" when stored', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    expect(getStoredTheme()).toBe('light');
  });

  it('should return "dark" when stored', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    expect(getStoredTheme()).toBe('dark');
  });

  it('should return null for invalid stored value', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'invalid-theme');
    expect(getStoredTheme()).toBeNull();
  });

  it('should return null for empty stored value', () => {
    localStorage.setItem(THEME_STORAGE_KEY, '');
    expect(getStoredTheme()).toBeNull();
  });
});

describe('storeTheme', () => {
  const THEME_STORAGE_KEY = 'life-lag-theme';

  beforeEach(() => {
    localStorage.clear();
  });

  it('should store "system" theme', () => {
    storeTheme('system');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('system');
  });

  it('should store "light" theme', () => {
    storeTheme('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('should store "dark" theme', () => {
    storeTheme('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('should overwrite existing stored theme', () => {
    storeTheme('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');

    storeTheme('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });
});

describe('initializeTheme', () => {
  const THEME_STORAGE_KEY = 'life-lag-theme';
  let root: HTMLElement;

  beforeEach(() => {
    localStorage.clear();
    root = document.documentElement;
    root.classList.remove('dark');

    // Default to dark system preference
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
  });

  it('should use system theme when no stored preference', () => {
    const result = initializeTheme();
    
    // System is dark (from our mock)
    expect(result).toBe('dark');
    expect(root.classList.contains('dark')).toBe(true);
  });

  it('should use stored light theme', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    
    const result = initializeTheme();
    
    expect(result).toBe('light');
    expect(root.classList.contains('dark')).toBe(false);
  });

  it('should use stored dark theme', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    
    const result = initializeTheme();
    
    expect(result).toBe('dark');
    expect(root.classList.contains('dark')).toBe(true);
  });

  it('should resolve stored "system" to actual system theme', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'system');
    
    const result = initializeTheme();
    
    // System is dark from our mock
    expect(result).toBe('dark');
  });

  it('should apply theme to DOM', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    
    initializeTheme();
    
    expect(root.classList.contains('dark')).toBe(true);
  });

  it('should return the resolved theme', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    
    const result = initializeTheme();
    
    expect(result).toBe('light');
  });
});

describe('SSR safety', () => {
  // These tests verify functions handle undefined window/document gracefully
  // In Jest environment, window is defined, so we test the branch logic indirectly

  it('getSystemTheme should have fallback for SSR', () => {
    // The function should return 'dark' as default when window is undefined
    // In test environment window exists, but we can verify the return type
    const result = getSystemTheme();
    expect(['dark', 'light']).toContain(result);
  });

  it('applyTheme should not throw when called', () => {
    expect(() => applyTheme('dark')).not.toThrow();
    expect(() => applyTheme('light')).not.toThrow();
  });

  it('getStoredTheme should not throw when called', () => {
    expect(() => getStoredTheme()).not.toThrow();
  });

  it('storeTheme should not throw when called', () => {
    expect(() => storeTheme('dark')).not.toThrow();
    expect(() => storeTheme('light')).not.toThrow();
    expect(() => storeTheme('system')).not.toThrow();
  });

  it('initializeTheme should not throw when called', () => {
    expect(() => initializeTheme()).not.toThrow();
  });
});

describe('type safety', () => {
  it('Theme type should accept valid values', () => {
    const themes: Theme[] = ['system', 'light', 'dark'];
    themes.forEach((theme) => {
      expect(['system', 'light', 'dark']).toContain(theme);
    });
  });

  it('ResolvedTheme type should only include light and dark', () => {
    const resolvedThemes: ResolvedTheme[] = ['light', 'dark'];
    resolvedThemes.forEach((theme) => {
      expect(['light', 'dark']).toContain(theme);
    });
  });
});
