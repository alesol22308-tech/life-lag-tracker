/**
 * next-intl configuration file (root level)
 * This file is required by next-intl for App Router
 */

import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale, isValidLocale, getMessages, Locale } from '@/lib/i18n';

export default getRequestConfig(async ({ locale }) => {
  // Validate locale
  const validLocale = isValidLocale(locale as string) ? (locale as Locale) : defaultLocale;

  return {
    locale: validLocale,
    messages: await getMessages(validLocale),
  };
});
