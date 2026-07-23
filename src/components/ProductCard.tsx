import Link from 'next/link';
import Image from 'next/image';
import ScentBottle from './ScentBottle';
import WishlistButton from './WishlistButton';
import TrackedProductLink from './TrackedProductLink';
import { formatPrice } from '@/utils/format-price';
import { localized } from '@/utils/localized';
import type { ProductCardData } from '@/types';
import type { Locale } from '@/lib/i18n';
import ProductCardQuickAdd from './ProductCardQuickAdd';

export type { ProductCardData };

export default function ProductCard({
  product,
  lang,
  recommendationType,
}: {
  product: ProductCardData;
  lang: Locale;
  recommendationType?: string;
}) {
  const name = localized(lang, product.nameEn, product.nameAr);
  const brandName = localized(lang, product.brand.name, product.brand.nameAr);
  const hasDiscount = product.oldPrice != null && Number(product.oldPrice) > Number(product.price);
  const discountPercent = hasDiscount ? Math.round((1 - Number(product.price) / Number(product.oldPrice)) * 100) : 0;
  const unavailable =
    product.availableStock != null
      ? product.availableStock <= 0 || ['OUT_OF_STOCK', 'HIDDEN', 'DISCONTINUED'].includes(product.availability ?? '')
      : false;
  const lowStock =
    !unavailable &&
    product.availableStock != null &&
    product.lowStockThreshold != null &&
    product.availableStock <= product.lowStockThreshold;
  const image = product.mainImage ?? product.media?.[0];
  const href = `/${lang}/product/${product.slug}`;
  const cardContent = (
    <>
      {image ? (
        <span className="relative block aspect-[4/5] w-full overflow-hidden bg-gold/[0.04]">
          <Image
            src={image.url}
            alt={image.altText || name}
            fill
            sizes="(max-width: 480px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-3 transition-transform duration-300 motion-safe:group-hover:scale-[1.03]"
          />
        </span>
      ) : (
        <ScentBottle className="aspect-[4/5] w-full" />
      )}
      <div className="space-y-1 p-3 sm:p-4">
        <p className="eyebrow truncate">{brandName}</p>
        <h3 className="line-clamp-2 min-h-12 font-display text-base leading-6 text-parchment sm:text-lg">{name}</h3>
        <div className="flex flex-col gap-1 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <span className="min-h-5 text-xs text-smoke sm:text-sm">{product.concentration ?? ''}</span>
          <span className="flex min-h-6 items-baseline gap-2">
            {hasDiscount && (
              <span className="text-[11px] text-smoke line-through">{formatPrice(product.oldPrice!)}</span>
            )}
            <span className="font-display text-base text-gold-bright">{formatPrice(product.price)}</span>
          </span>
        </div>
        {hasDiscount && (
          <p className="pt-1 text-[11px] text-emerald-300">
            {lang === 'ar' ? `خصم ${discountPercent}٪` : `${discountPercent}% off`}
          </p>
        )}
      </div>
    </>
  );

  return (
    <article className="product-card-lift group relative hairline overflow-hidden rounded-xl bg-ink-soft/35 transition-[border-color,transform,box-shadow] duration-200 hover:border-gold/40">
      {recommendationType ? (
        <TrackedProductLink
          href={href}
          perfumeId={product.id}
          recommendationType={recommendationType}
          className="block"
        >
          {cardContent}
        </TrackedProductLink>
      ) : (
        <Link href={href} prefetch={false} className="block">
          {cardContent}
        </Link>
      )}

      {(unavailable || lowStock) && (
        <span
          className={`absolute start-2 top-2 rounded-full border px-2.5 py-1 text-[10px] backdrop-blur ${unavailable ? 'border-red-300/25 bg-ink/90 text-red-200' : 'border-amber-300/25 bg-ink/90 text-amber-100'}`}
        >
          {unavailable ? (lang === 'ar' ? 'غير متوفر' : 'Out of stock') : lang === 'ar' ? 'كمية محدودة' : 'Low stock'}
        </span>
      )}

      <WishlistButton
        lang={lang}
        item={{
          perfumeId: product.id,
          slug: product.slug,
          nameEn: product.nameEn,
          nameAr: product.nameAr,
          price: Number(product.price),
          oldPrice: product.oldPrice == null ? null : Number(product.oldPrice),
          concentration: product.concentration,
          brandNameEn: product.brand.name,
          brandNameAr: product.brand.nameAr,
        }}
        iconSize={16}
        className="absolute end-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-ink/85 text-parchment opacity-100 backdrop-blur transition-all hover:text-gold-bright md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
      />
      <ProductCardQuickAdd
        lang={lang}
        href={href}
        hasVariants={(product._count?.variants ?? 0) > 0}
        unavailable={unavailable}
        inventoryKnown={product.availableStock != null}
        variantsKnown={product._count != null}
        item={{
          perfumeId: product.id,
          slug: product.slug,
          nameEn: product.nameEn,
          nameAr: product.nameAr,
          price: Number(product.price),
          brandName,
          maxAvailable: product.availableStock,
        }}
      />
    </article>
  );
}
