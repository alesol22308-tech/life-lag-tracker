/**
 * Internationalization configuration for Life-Lag
 * Uses next-intl for multi-language support
 */

import { getRequestConfig } from 'next-intl/server';

// Supported locales
export const locales = ['en', 'es', 'fr', 'pt'] as const;
export type Locale = (typeof locales)[number];

// Default locale
export const defaultLocale: Locale = 'en';

// Locale labels for UI
export const localeLabels: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  pt: 'Português',
};

// Locale flags for UI (optional visual enhancement)
export const localeFlags: Record<Locale, string> = {
  en: '🇬🇧',
  es: '🇪🇸',
  fr: '🇫🇷',
  pt: '🇧🇷',
};

/**
 * Check if a locale is valid
 */
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

/**
 * Get locale from various sources
 * Priority: cookie > header > default
 */
export function getLocaleFromRequest(request: Request): Locale {
  // Try to get from cookie
  const cookieHeader = request.headers.get('cookie') || '';
  const localeCookie = cookieHeader
    .split(';')
    .find((c) => c.trim().startsWith('locale='));
  if (localeCookie) {
    const locale = localeCookie.split('=')[1]?.trim();
    if (locale && isValidLocale(locale)) {
      return locale;
    }
  }

  // Try to get from Accept-Language header
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    const languages = acceptLanguage.split(',').map((lang) => {
      const [code] = lang.trim().split(';');
      return code.split('-')[0]; // Get base language code
    });

    for (const lang of languages) {
      if (isValidLocale(lang)) {
        return lang;
      }
    }
  }

  return defaultLocale;
}

/**
 * Get messages for a locale
 * Dynamically imports the appropriate locale file
 */
export async function getMessages(locale: Locale) {
  try {
    const messages = await import(`@/locales/${locale}.json`);
    return messages.default;
  } catch (error) {
    console.error(`Failed to load messages for locale: ${locale}`, error);
    // Fall back to English
    const fallback = await import('@/locales/en.json');
    return fallback.default;
  }
}

/**
 * next-intl request configuration
 * This is used by the NextIntlClientProvider
 */
export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming locale is valid
  const validLocale = isValidLocale(locale as string) ? (locale as Locale) : defaultLocale;

  return {
    locale: validLocale,
    messages: await getMessages(validLocale),
  };
});

/**
 * Format dimension name based on locale
 */
export function getDimensionName(dimension: string, locale: Locale = 'en'): string {
  const dimensionKeys: Record<string, Record<Locale, string>> = {
    energy: { en: 'Energy', es: 'Energía', fr: 'Énergie', pt: 'Energia' },
    sleep: { en: 'Sleep consistency', es: 'Consistencia del sueño', fr: 'Régularité du sommeil', pt: 'Consistência do sono' },
    structure: { en: 'Daily structure', es: 'Estructura diaria', fr: 'Structure quotidienne', pt: 'Estrutura diária' },
    initiation: { en: 'Starting tasks', es: 'Iniciar tareas', fr: 'Démarrer les tâches', pt: 'Iniciar tarefas' },
    engagement: { en: 'Engagement / follow-through', es: 'Compromiso / seguimiento', fr: 'Engagement / suivi', pt: 'Engajamento / acompanhamento' },
    sustainability: { en: 'Sustainable pace', es: 'Ritmo sostenible', fr: 'Rythme durable', pt: 'Ritmo sustentável' },
  };

  return dimensionKeys[dimension]?.[locale] || dimension;
}

/**
 * Format drift category based on locale
 */
export function getDriftCategoryName(category: string, locale: Locale = 'en'): string {
  const categoryKeys: Record<string, Record<Locale, string>> = {
    aligned: { en: 'Aligned', es: 'Alineado', fr: 'Aligné', pt: 'Alinhado' },
    mild: { en: 'Mild', es: 'Leve', fr: 'Léger', pt: 'Leve' },
    moderate: { en: 'Moderate', es: 'Moderado', fr: 'Modéré', pt: 'Moderado' },
    heavy: { en: 'Heavy', es: 'Intenso', fr: 'Important', pt: 'Intenso' },
    critical: { en: 'Critical', es: 'Crítico', fr: 'Critique', pt: 'Crítico' },
  };

  return categoryKeys[category]?.[locale] || category;
}
