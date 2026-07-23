/**
 * Product Completion Score — pure logic, no UI. Perfume Studio's product
 * editor will call this to show "72% complete" plus which fields are
 * missing, per the spec. Kept as a service (not baked into a component) so
 * it can also run in bulk — e.g. an admin dashboard widget listing every
 * incomplete product — without duplicating the rule set.
 */

export type ProductCompletionInput = {
  nameAr: string | null | undefined;
  nameEn: string | null | undefined;
  descriptionAr: string | null | undefined;
  descriptionEn: string | null | undefined;
  brandId: string | null | undefined;
  categoryId?: string | null;
  price: unknown;
  stock: number | null | undefined;
  metaTitleEn: string | null | undefined;
  metaTitleAr?: string | null;
  metaDescriptionEn: string | null | undefined;
  metaDescriptionAr?: string | null;
  mainImageId?: string | null;
  longevity?: string | null;
  projection?: string | null;
  sillage?: string | null;
  media?: { length: number } | null;
  notes?: { length: number } | null;
  tags?: { length: number } | null;
};

const REQUIRED_FIELDS: {
  key: keyof ProductCompletionInput;
  label: string;
  check: (p: ProductCompletionInput) => boolean;
}[] = [
  { key: 'nameAr', label: 'Arabic and English names', check: (p) => !!p.nameAr && !!p.nameEn },
  { key: 'brandId', label: 'Brand', check: (p) => !!p.brandId },
  { key: 'categoryId', label: 'Category', check: (p) => !!p.categoryId },
  { key: 'price', label: 'Price', check: (p) => p.price != null },
  { key: 'stock', label: 'Stock', check: (p) => p.stock != null },
  { key: 'mainImageId', label: 'Main image', check: (p) => !!p.mainImageId || (p.media?.length ?? 0) > 0 },
  { key: 'descriptionAr', label: 'Arabic and English descriptions', check: (p) => !!p.descriptionAr && !!p.descriptionEn },
  { key: 'notes', label: 'Fragrance notes', check: (p) => (p.notes?.length ?? 0) > 0 },
  { key: 'tags', label: 'Tags', check: (p) => (p.tags?.length ?? 0) > 0 },
  { key: 'metaTitleAr', label: 'SEO title', check: (p) => !!p.metaTitleAr || !!p.metaTitleEn },
  { key: 'metaDescriptionAr', label: 'SEO description', check: (p) => !!p.metaDescriptionAr || !!p.metaDescriptionEn },
  { key: 'longevity', label: 'Performance values', check: (p) => !!p.longevity && !!p.projection && !!p.sillage },
];

export function getCompletionScore(perfume: ProductCompletionInput) {
  const missing = REQUIRED_FIELDS.filter((f) => !f.check(perfume)).map((f) => f.label);
  const percent = Math.round(((REQUIRED_FIELDS.length - missing.length) / REQUIRED_FIELDS.length) * 100);

  return { percent, missing };
}
