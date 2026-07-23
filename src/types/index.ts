// Lightweight shapes for what the UI actually needs. These are structurally
// compatible with the real Prisma-generated types (Perfume, Brand), so once
// `npx prisma generate` runs against a real database these annotations stay
// valid — they just describe a subset of the full model.

export type MoneyValue = number | string | { toString(): string };

export type ProductCardData = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  price: MoneyValue;
  oldPrice?: MoneyValue | null;
  availability?: string;
  availableStock?: number;
  lowStockThreshold?: number;
  _count?: { variants: number };
  concentration?: string | null;
  scentFamilies: string[];
  brand: { name: string; nameAr?: string | null };
  mainImage?: {
    url: string;
    altText: string | null;
    width: number | null;
    height: number | null;
  } | null;
  media?: Array<{
    url: string;
    altText: string | null;
    width: number | null;
    height: number | null;
  }>;
};

export type BrandSummary = {
  id: string;
  slug: string;
  name: string;
  nameAr?: string | null;
  originCountry: string | null;
  story: string | null;
  storyAr?: string | null;
  _count?: { perfumes: number };
};
