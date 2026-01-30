'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { locales, defaultLocale, Locale, localeLabels, localeFlags } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/client';

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
  refreshFromDatabase: () => Promise<void>;
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
  console.log('[LanguageProvider] Initializing...');
  
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

  // Track if we've loaded from database to avoid multiple loads
  const [hasLoadedFromDatabase, setHasLoadedFromDatabase] = useState(false);

  // Load language preference from database on mount (gracefully handles missing column)
  const loadFromDatabase = useCallback(async () => {
    // Only load from database once on initial mount
    if (hasLoadedFromDatabase) {
      return;
    }

    console.log('[LanguageProvider] Starting to load language preference from database...');
    
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.log('[LanguageProvider] No authenticated user, using localStorage/default');
        setHasLoadedFromDatabase(true);
        return;
      }

      console.log('[LanguageProvider] User found, attempting to query database for language_preference...');
      
      // Try to query just the language_preference column
      const { data: userData, error } = await supabase
        .from('users')
        .select('language_preference')
        .eq('id', user.id)
        .single();

      // Handle errors gracefully - column might not exist
      if (error) {
        if (error.code === 'PGRST116') {
          console.log('[LanguageProvider] No language preference in database yet, using localStorage');
        } else if (error.message?.includes('column') || error.message?.includes('language_preference') || error.code === '42703' || error.code === '42883') {
          console.warn('[LanguageProvider] language_preference column does not exist in database. Using localStorage only.');
          console.warn('[LanguageProvider] To enable database sync, run migration 019_language_preference.sql');
        } else {
          console.warn('[LanguageProvider] Could not load from database:', error.message);
        }
        setHasLoadedFromDatabase(true);
        return; // Fall back to localStorage/default
      }

      // If we got data and it has a preference, use it (database is source of truth)
      if (userData?.language_preference) {
        const dbLocale = userData.language_preference as Locale;
        if (locales.includes(dbLocale)) {
          console.log('[LanguageProvider] Found language preference in database:', dbLocale);
          // Sync to localStorage and update state if different
          const currentLocale = localStorage.getItem('locale') as Locale | null;
          
          if (currentLocale !== dbLocale) {
            console.log(`[LanguageProvider] Syncing locale to database value: ${dbLocale} (was: ${currentLocale})`);
            localStorage.setItem('locale', dbLocale);
            setLocaleState(dbLocale);
            // Load messages for the new locale
            const newMessages = await loadMessages(dbLocale);
            setMessages(newMessages);
          } else {
            console.log('[LanguageProvider] Locale already in sync with database');
          }
        }
      } else {
        // No preference in database, check if localStorage has one and sync it to database
        const storedLocale = localStorage.getItem('locale') as Locale | null;
        if (storedLocale && locales.includes(storedLocale)) {
          console.log('[LanguageProvider] No database preference, but found in localStorage:', storedLocale);
          // Optionally sync localStorage to database (but don't block on it)
          supabase
            .from('users')
            .update({ language_preference: storedLocale })
            .eq('id', user.id)
            .then(({ error }) => {
              if (error) {
                console.warn('[LanguageProvider] Could not sync localStorage to database:', error.message);
              } else {
                console.log('[LanguageProvider] Synced localStorage preference to database');
              }
            });
        }
      }
      
      setHasLoadedFromDatabase(true);
    } catch (error: any) {
      console.warn('[LanguageProvider] Exception loading from database (using localStorage):', error?.message);
      setHasLoadedFromDatabase(true);
      // Silently fall back to localStorage - this is expected if column doesn't exist
    }
  }, [hasLoadedFromDatabase]);

  // Load from database on mount
  useEffect(() => {
    loadFromDatabase();
  }, [loadFromDatabase]);

  // Function to refresh from database (can be called manually)
  const refreshFromDatabase = useCallback(async () => {
    console.log('[LanguageProvider] Manual refresh from database requested');
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('[LanguageProvider] No authenticated user during refresh');
      return;
    }

    const { data: userData, error } = await supabase
      .from('users')
      .select('language_preference')
      .eq('id', user.id)
      .single();

    if (error) {
      console.warn('[LanguageProvider] Could not refresh from database:', error.message);
      return;
    }

    if (userData?.language_preference) {
      const dbLocale = userData.language_preference as Locale;
      if (locales.includes(dbLocale)) {
        const currentLocale = localStorage.getItem('locale') as Locale | null;
        if (currentLocale !== dbLocale) {
          console.log(`[LanguageProvider] Refreshing locale from ${currentLocale} to ${dbLocale}`);
          localStorage.setItem('locale', dbLocale);
          setLocaleState(dbLocale);
          loadMessages(dbLocale).then((newMessages) => {
            setMessages(newMessages);
          });
        }
      }
    }
  }, []);

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
        refreshFromDatabase,
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
