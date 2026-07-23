import type { Locale } from './i18n';

const LABELS: Record<string, { en: string; ar: string }> = {
  // seasons
  summer: { en: 'Summer', ar: 'صيف' },
  winter: { en: 'Winter', ar: 'شتاء' },
  spring: { en: 'Spring', ar: 'ربيع' },
  autumn: { en: 'Autumn', ar: 'خريف' },
  // occasions
  office: { en: 'Office', ar: 'مكتب' },
  daily: { en: 'Daily', ar: 'يومي' },
  date: { en: 'Date Night', ar: 'موعد غرامي' },
  wedding: { en: 'Wedding', ar: 'زفاف' },
  formal: { en: 'Formal', ar: 'رسمي' },
  casual: { en: 'Casual', ar: 'كاجوال' },
  night: { en: 'Night', ar: 'سهرة' },
  travel: { en: 'Travel', ar: 'سفر' },
  // styles
  elegant: { en: 'Elegant', ar: 'أنيق' },
  luxury: { en: 'Luxury', ar: 'فخم' },
  fresh: { en: 'Fresh', ar: 'منعش' },
  sweet: { en: 'Sweet', ar: 'حلو' },
  dark: { en: 'Dark', ar: 'داكن' },
  modern: { en: 'Modern', ar: 'عصري' },
  classic: { en: 'Classic', ar: 'كلاسيكي' },
  // moods
  confident: { en: 'Confident', ar: 'واثق' },
  romantic: { en: 'Romantic', ar: 'رومانسي' },
  calm: { en: 'Calm', ar: 'هادئ' },
  bold: { en: 'Bold', ar: 'جريء' },
  // scent families
  woody: { en: 'Woody', ar: 'خشبي' },
  oriental: { en: 'Oriental', ar: 'شرقي' },
  aquatic: { en: 'Aquatic', ar: 'مائي' },
  oud: { en: 'Oud', ar: 'عود' },
  amber: { en: 'Amber', ar: 'عنبري' },
  smoky: { en: 'Smoky', ar: 'مدخّن' },
  floral: { en: 'Floral', ar: 'زهري' },
  // gender
  MASCULINE: { en: 'Men', ar: 'رجالي' },
  FEMININE: { en: 'Women', ar: 'نسائي' },
  UNISEX: { en: 'Unisex', ar: 'للجنسين' },
  // brand characteristics
  french: { en: 'French', ar: 'فرنسي' },
  arabic: { en: 'Arabic', ar: 'عربي' },
  designer: { en: 'Designer', ar: 'تصميم راقي' },
  niche: { en: 'Niche', ar: 'نيش' },
  traditional: { en: 'Traditional', ar: 'تقليدي' },
  premium: { en: 'Premium', ar: 'ممتاز' },
  minimalist: { en: 'Minimalist', ar: 'أقلّي' },
  innovative: { en: 'Innovative', ar: 'مبتكر' },
  affordable: { en: 'Affordable', ar: 'اقتصادي' },
};

/** Falls back to a capitalized version of the key if no label is registered. */
export function tagLabel(key: string, lang: Locale): string {
  const entry = LABELS[key.toLowerCase()];
  if (!entry) return key.charAt(0).toUpperCase() + key.slice(1);
  return lang === 'ar' ? entry.ar : entry.en;
}
