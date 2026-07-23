import type { Locale } from '@/lib/i18n';

/**
 * Picks the field matching the active locale, falling back to English if
 * the Arabic value is missing (e.g. content not translated yet) rather than
 * rendering blank — a missing translation should degrade, not break.
 */
export function localized(
  lang: Locale,
  en: string,
  ar: string | null | undefined
): string {
  if (lang === 'ar' && ar) return ar;
  return en;
}
