/**
 * next-intl configuration file (root level)
 * This file is required by next-intl for App Router.
 * Locale is read from the locale cookie (set by middleware); no [locale] segment.
 */

import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { defaultLocale, isValidLocale, getMessages, type Locale } from '@/lib/i18n';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('locale')?.value;
  const validLocale: Locale =
    localeCookie && isValidLocale(localeCookie) ? (localeCookie as Locale) : defaultLocale;

  return {
    locale: validLocale,
    messages: await getMessages(validLocale),
  };
});
