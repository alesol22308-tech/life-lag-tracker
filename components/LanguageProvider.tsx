'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { locales, defaultLocale, Locale, localeLabels, localeFlags } from '@/lib/i18n';

// Translation messages type
type Messages = Record<string, any>;

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
  messages: Messages;
  t: (key: string, params?: Record<string, string | number>) => string;
  locales: typeof locales;
  localeLabels: typeof localeLabels;
  localeFlags: typeof localeFlags;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Load messages for a locale
async function loadMessages(locale: Locale): Promise<Messages> {
  try {
    const messages = await import(`@/locales/${locale}.json`);
    return messages.default;
  } catch (error) {
    console.error(`Failed to load messages for locale: ${locale}`, error);
    const fallback = await import('@/locales/en.json');
    return fallback.default;
  }
}

// Get nested value from object using dot notation
function getNestedValue(obj: any, path: string): string | undefined {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Interpolate parameters into string
function interpolate(str: string, params?: Record<string, string | number>): string {
  if (!params) return str;
  return str.replace(/\{(\w+)\}/g, (_, key) => {
    return params[key]?.toString() ?? `{${key}}`;
  });
}

interface LanguageProviderProps {
  children: ReactNode;
  initialLocale?: Locale;
  initialMessages?: Messages;
}

export function LanguageProvider({ 
  children, 
  initialLocale = defaultLocale,
  initialMessages 
}: LanguageProviderProps) {
  console.log('[LanguageProvider] Initializing... (localStorage only)');
  
  // Get initial locale from localStorage or default
  const getInitialLocale = (): Locale => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('locale') as Locale | null;
      if (stored && locales.includes(stored)) {
        console.log('[LanguageProvider] Found locale in localStorage:', stored);
        return stored;
      }
    }
    console.log('[LanguageProvider] Using default locale:', initialLocale);
    return initialLocale;
  };

  const [locale, setLocaleState] = useState<Locale>(getInitialLocale());
  const [messages, setMessages] = useState<Messages>(initialMessages || {});
  const [isLoading, setIsLoading] = useState(!initialMessages);
  
  console.log('[LanguageProvider] Initial locale state:', locale);

  // Load messages for current locale
  useEffect(() => {
    if (!initialMessages) {
      loadMessages(locale).then((msgs) => {
        setMessages(msgs);
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, [initialMessages, locale]);

  // Language preference is now localStorage-only (database sync removed)

  // Function to set locale (saves to localStorage and updates state)
  const setLocale = useCallback(async (newLocale: Locale) => {
    if (!locales.includes(newLocale)) {
      console.warn('Invalid locale:', newLocale);
      return;
    }
    
    console.log('Setting locale to:', newLocale);
    setIsLoading(true);
    
    try {
      const newMessages = await loadMessages(newLocale);
      setMessages(newMessages);
      setLocaleState(newLocale);
      localStorage.setItem('locale', newLocale);
      
      // Set cookie for server-side detection
      document.cookie = `locale=${newLocale};path=/;max-age=31536000`;
      
      console.log('Locale updated successfully:', newLocale);
    } catch (error) {
      console.error('Error loading messages for locale:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Translation function
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const value = getNestedValue(messages, key);
    if (typeof value !== 'string') {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
    return interpolate(value, params);
  }, [messages]);

  // Don't render until messages are loaded
  if (isLoading && !initialMessages) {
    return null;
  }

  return (
    <LanguageContext.Provider
      value={{
        locale,
        setLocale,
        messages,
        t,
        locales,
        localeLabels,
        localeFlags,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Hook for getting translated text
export function useTranslation() {
  const { t, locale } = useLanguage();
  return { t, locale };
}
