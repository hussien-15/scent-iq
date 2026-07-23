import Link from 'next/link';
import { Eye, Star } from 'lucide-react';
import ScentBottle from '@/components/ScentBottle';
import WishlistButton from '@/components/WishlistButton';
import { formatPrice } from '@/utils/format-price';
import { localized } from '@/utils/localized';
import type { Locale } from '@/lib/i18n';
import type { MoneyValue } from '@/types';

export type BestSellerData = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  price: MoneyValue;
  brand: { name: string; nameAr?: string | null };
  avgRating?: number | null;
};

export default function BestSellerCard({
  product,
  lang,
}: {
  product: BestSellerData;
  lang: Locale;
}) {
  const name = localized(lang, product.nameEn, product.nameAr);
  const brandName = localized(lang, product.brand.name, product.brand.nameAr);

  return (
    <article className="group relative w-56 shrink-0 snap-start hairline rounded-sm transition-colors hover:border-gold/40">
      <Link href={`/${lang}/product/${product.slug}`} prefetch={false} className="block">
        <ScentBottle className="aspect-[4/5] w-full" />
        <div className="space-y-1 p-4">
          <p className="eyebrow">{brandName}</p>
          <h3 className="font-display text-base text-parchment">{name}</h3>
          <div className="flex items-center justify-between pt-1">
            {product.avgRating ? (
              <span className="flex items-center gap-1 text-xs text-smoke">
                <Star size={12} className="fill-gold text-gold" />
                {product.avgRating.toFixed(1)}
              </span>
            ) : (
              <span />
            )}
            <span className="font-display text-sm text-gold-bright">
              {formatPrice(product.price)}
            </span>
          </div>
        </div>
      </Link>

      <div className="absolute end-2 top-2 flex flex-col gap-2 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
        <WishlistButton
          lang={lang}
          item={{
            perfumeId: product.id,
            slug: product.slug,
            nameEn: product.nameEn,
            nameAr: product.nameAr,
            price: Number(product.price),
            brandNameEn: product.brand.name,
            brandNameAr: product.brand.nameAr,
          }}
          iconSize={14}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-ink/80 text-parchment backdrop-blur hover:text-gold-bright"
        />
        <Link
          href={`/${lang}/product/${product.slug}`}
          aria-label={lang === 'ar' ? 'شوف تفاصيل العطر' : 'View perfume details'}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-ink/80 text-parchment backdrop-blur hover:text-gold-bright"
        >
          <Eye size={14} />
        </Link>
      </div>
    </article>
  );
}
