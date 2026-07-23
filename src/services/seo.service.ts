export type SeoEntityType = 'product' | 'brand' | 'collection' | 'category' | 'note';

export const DEFAULT_SEO_TEMPLATES = {
  PRODUCT: {
    titleAr: '{productName} الأصلي من {brandName} | السعر والشراء في العراق',
    titleEn: '{productName} by {brandName} | Price & Delivery in Iraq',
    descriptionAr: 'اكتشف {productName} الأصلي من {brandName} عبر ScentIQ مع النوتات، الثبات، الفوحان، التقييمات، والدفع عند الاستلام داخل العراق.',
    descriptionEn: 'Explore {productName} by {brandName} at ScentIQ, including notes, performance, verified reviews, price, and cash on delivery in Iraq.',
  },
  BRAND: {
    titleAr: 'عطور {brandName} الأصلية | أشهر الإصدارات في العراق',
    titleEn: '{brandName} Perfumes | Popular Fragrances in Iraq',
    descriptionAr: 'تسوق عطور {brandName} الأصلية عبر ScentIQ واكتشف أشهر الإصدارات والتقييمات مع الدفع عند الاستلام والتوصيل داخل العراق.',
    descriptionEn: 'Shop original {brandName} perfumes at ScentIQ with popular releases, reviews, cash on delivery, and delivery across Iraq.',
  },
  COLLECTION: {
    titleAr: '{collectionName} | أفضل الاختيارات من ScentIQ',
    titleEn: '{collectionName} | ScentIQ Buying Guide',
    descriptionAr: 'دليل مختار بعناية حول {collectionName} مع مقارنة العطور والنوتات والثبات والاستخدام المناسب داخل العراق.',
    descriptionEn: 'A carefully selected {collectionName} guide with perfume comparisons, notes, performance, and practical buying advice.',
  },
  CATEGORY: {
    titleAr: '{categoryName} الأصلية | تسوق داخل العراق من ScentIQ',
    titleEn: '{categoryName} | Shop Perfumes in Iraq',
    descriptionAr: 'اكتشف أفضل {categoryName} عبر ScentIQ مع تفاصيل النوتات والثبات والتقييمات والدفع عند الاستلام داخل العراق.',
    descriptionEn: 'Discover {categoryName} at ScentIQ with notes, performance, reviews, and cash on delivery across Iraq.',
  },
  NOTE: {
    titleAr: 'عطور {noteName} | أفضل الاختيارات المتوفرة في العراق',
    titleEn: '{noteName} Perfumes | ScentIQ Iraq',
    descriptionAr: 'اكتشف عطور {noteName} المتوفرة عبر ScentIQ وقارن الروائح والثبات والاستخدامات والأسعار قبل الشراء داخل العراق.',
    descriptionEn: 'Explore {noteName} perfumes at ScentIQ and compare scent profiles, performance, occasions, and prices in Iraq.',
  },
} as const;

type SeoScoreInput = {
  nameAr?: string | null;
  slug?: string | null;
  metaTitleAr?: string | null;
  metaDescriptionAr?: string | null;
  metaTitleEn?: string | null;
  metaDescriptionEn?: string | null;
  keywords?: string[] | null;
  image?: string | null;
  descriptionAr?: string | null;
  secondaryContentAr?: string | null;
  faqs?: { length: number } | null;
  internalLinks?: number;
  altTextAr?: string | null;
};

export function getSeoScore(input: SeoScoreInput) {
  const checks = [
    { label: 'Arabic page name / H1', pass: Boolean(input.nameAr?.trim()), weight: 12 },
    { label: 'Stable readable slug', pass: Boolean(input.slug && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug)), weight: 8 },
    { label: 'Arabic SEO title', pass: Boolean(input.metaTitleAr && input.metaTitleAr.length >= 20 && input.metaTitleAr.length <= 70), weight: 14 },
    { label: 'Arabic meta description', pass: Boolean(input.metaDescriptionAr && input.metaDescriptionAr.length >= 70 && input.metaDescriptionAr.length <= 180), weight: 14 },
    { label: 'Arabic helpful content', pass: Boolean(input.descriptionAr && input.descriptionAr.length >= 140), weight: 14 },
    { label: 'Buying guide / supporting content', pass: Boolean(input.secondaryContentAr && input.secondaryContentAr.length >= 100), weight: 8 },
    { label: 'Relevant keywords', pass: (input.keywords?.length ?? 0) >= 3, weight: 7 },
    { label: 'Open Graph or primary image', pass: Boolean(input.image), weight: 8 },
    { label: 'Arabic image alt text', pass: Boolean(input.altTextAr), weight: 4 },
    { label: 'Useful FAQ', pass: (input.faqs?.length ?? 0) >= 2, weight: 6 },
    { label: 'Internal links', pass: (input.internalLinks ?? 0) >= 2, weight: 3 },
    { label: 'English metadata (secondary)', pass: Boolean(input.metaTitleEn && input.metaDescriptionEn), weight: 2 },
  ];
  const earned = checks.filter((check) => check.pass).reduce((sum, check) => sum + check.weight, 0);
  const total = checks.reduce((sum, check) => sum + check.weight, 0);
  return { percent: Math.round((earned / total) * 100), missing: checks.filter((check) => !check.pass).map((check) => check.label), checks };
}

export function applySeoTemplate(template: string, values: Record<string, string | null | undefined>) {
  return template.replace(/\{([a-zA-Z]+)\}/g, (match, key: string) => values[key]?.trim() || match);
}

export function keywordsFromForm(value: FormDataEntryValue | null) {
  return String(value ?? '').split(',').map((keyword) => keyword.trim()).filter(Boolean).slice(0, 30);
}

