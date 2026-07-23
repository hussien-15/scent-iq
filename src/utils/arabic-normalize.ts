/**
 * Normalizes Arabic (and mixed Arabic/English) search input so that letter
 * variants, diacritics, and spacing differences don't cause a miss.
 * Applied to both the stored searchable text and the incoming query, so
 * "أنا الأبيض" and "انا الابيض" compare equal.
 */
export function normalizeArabic(input: string): string {
  return input
    .normalize('NFKC')
    // Strip Arabic diacritics (tashkeel) and tatweel.
    .replace(/[\u064B-\u0652\u0640]/g, '')
    // Letter-variant folding.
    .replace(/[إأآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[ىي]/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    // Collapse whitespace, lowercase (affects the English portion of mixed input).
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}
