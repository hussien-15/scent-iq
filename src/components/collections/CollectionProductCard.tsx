'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, ShoppingBag, Star, X } from 'lucide-react';
import ScentBottle from '@/components/ScentBottle';
import WishlistButton from '@/components/WishlistButton';
import { useCartStore } from '@/lib/store/cart-store';
import { formatPrice } from '@/utils/format-price';
import { localized } from '@/utils/localized';
import { trackCollectionEvent } from './CollectionTracker';
import type { Locale } from '@/lib/i18n';
import type ar from '@/dictionaries/ar';

export type CollectionCardProduct = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  price: number;
  oldPrice: number | null;
  currency: string;
  concentration: string | null;
  availability: 'IN_STOCK' | 'OUT_OF_STOCK' | 'PREORDER' | 'HIDDEN' | 'DISCONTINUED';
  stock: number;
  available: number;
  hasVariants: boolean;
  avgRating: number | null;
  brand: { name: string; nameAr: string | null };
  media?: Array<{ url: string; altText: string | null; width: number | null; height: number | null }>;
  featuredLabelEn?: string | null;
  featuredLabelAr?: string | null;
  featuredReasonEn?: string | null;
  featuredReasonAr?: string | null;
};

export default function CollectionProductCard({
  product,
  collectionId,
  lang,
  dict,
  featured = false,
}: {
  product: CollectionCardProduct;
  collectionId: string;
  lang: Locale;
  dict: typeof ar;
  featured?: boolean;
}) {
  const addItem = useCartStore((state) => state.addItem);
  const [added, setAdded] = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const name = localized(lang, product.nameEn, product.nameAr);
  const brandName = localized(lang, product.brand.name, product.brand.nameAr);
  const image = product.media?.[0];
  const label = localized(lang, product.featuredLabelEn ?? '', product.featuredLabelAr) || null;
  const reason = localized(lang, product.featuredReasonEn ?? '', product.featuredReasonAr) || null;
  const unavailable = product.availability === 'OUT_OF_STOCK' || product.availability === 'HIDDEN' || product.availability === 'DISCONTINUED' || product.available <= 0;
  const availabilityLabel = product.availability === 'PREORDER'
    ? dict.collections.availability.preorder
    : unavailable
      ? dict.collections.availability.outOfStock
      : dict.collections.availability.inStock;

  function quickAdd() {
    if (unavailable) return;
    if (product.hasVariants) {
      window.location.assign(`/${lang}/product/${product.slug}`);
      return;
    }
    addItem({
      perfumeId: product.id,
      slug: product.slug,
      nameEn: product.nameEn,
      nameAr: product.nameAr,
      price: product.price,
      brandName,
      sourceCollectionId: collectionId,
      maxAvailable: product.available,
    });
    trackCollectionEvent(collectionId, 'ADD_TO_CART', product.id);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  }

  return (
    <article className={`group relative hairline rounded-sm transition-colors hover:border-gold/40 ${featured ? 'w-64 shrink-0 snap-start md:w-auto' : ''}`}>
      <Link
        href={`/${lang}/product/${product.slug}`}
        prefetch={false}
        onClick={() => trackCollectionEvent(collectionId, 'PRODUCT_CLICK', product.id)}
        className="block"
      >
        <div className="relative">
          {image ? <div className="relative aspect-[4/5] w-full overflow-hidden bg-gold/[0.04]"><Image src={image.url} alt={image.altText || name} fill sizes="(max-width: 480px) 50vw, (max-width: 1024px) 33vw, 25vw" quality={72} className="object-contain p-3 transition-transform duration-300 motion-safe:group-hover:scale-[1.03]" /></div> : <ScentBottle className="aspect-[4/5] w-full" />}
          {label && <span className="absolute start-3 top-3 rounded-full bg-gold px-3 py-1 text-[10px] font-medium text-ink">{label}</span>}
        </div>
        <div className="space-y-1 p-4 pb-3">
          <div className="flex items-center justify-between gap-2">
            <p className="eyebrow truncate">{brandName}</p>
            <span className={`text-[10px] ${unavailable ? 'text-smoke' : 'text-emerald-300'}`}>{availabilityLabel}</span>
          </div>
          <h3 className="font-display text-base text-parchment">{name}</h3>
          {reason && <p className="line-clamp-2 min-h-10 text-xs leading-5 text-smoke">{reason}</p>}
          <div className="flex items-center justify-between gap-2 pt-2">
            {product.avgRating ? (
              <span className="flex items-center gap-1 text-xs text-smoke"><Star size={12} className="fill-gold text-gold" />{product.avgRating.toFixed(1)}</span>
            ) : <span />}
            <span className="flex items-baseline gap-2">
              {product.oldPrice != null && <span className="text-[10px] text-smoke line-through">{formatPrice(product.oldPrice, product.currency)}</span>}
              <span className="font-display text-sm text-gold-bright">{formatPrice(product.price, product.currency)}</span>
            </span>
          </div>
        </div>
      </Link>

      <div className="absolute end-2 top-2 flex flex-col gap-2 opacity-100 md:opacity-0 md:transition-opacity md:group-hover:opacity-100 md:focus-within:opacity-100">
        <WishlistButton
          lang={lang}
          item={{
            perfumeId: product.id,
            slug: product.slug,
            nameEn: product.nameEn,
            nameAr: product.nameAr,
            price: product.price,
            oldPrice: product.oldPrice,
            concentration: product.concentration,
            brandNameEn: product.brand.name,
            brandNameAr: product.brand.nameAr,
          }}
          iconSize={14}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-ink/85 text-parchment backdrop-blur hover:text-gold-bright"
        />
        <button
          type="button"
          onClick={() => {
            trackCollectionEvent(collectionId, 'PRODUCT_CLICK', product.id);
            setQuickViewOpen(true);
          }}
          aria-label={dict.collections.viewDetails}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-ink/85 text-parchment backdrop-blur hover:text-gold-bright"
        >
          <Eye size={14} />
        </button>
      </div>

      <button
        type="button"
        disabled={unavailable}
        onClick={quickAdd}
        className="mx-4 mb-4 flex min-h-11 w-[calc(100%_-_2rem)] items-center justify-center gap-2 rounded-full border border-gold/40 px-3 py-2 text-xs text-gold-bright transition-colors hover:bg-gold/10 disabled:cursor-not-allowed disabled:border-ink-line disabled:text-smoke"
      >
        <ShoppingBag size={14} />
        {product.hasVariants ? dict.collections.viewDetails : added ? dict.collections.added : dict.collections.quickAdd}
      </button>

      {quickViewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={name}>
          <div className="relative grid w-full max-w-2xl overflow-hidden rounded-sm border border-ink-line bg-ink md:grid-cols-2">
            <button type="button" onClick={() => setQuickViewOpen(false)} aria-label="Close" className="absolute end-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-ink/80 text-parchment"><X size={16} /></button>
            {image ? <div className="relative aspect-square min-h-64 w-full bg-gold/[0.04]"><Image src={image.url} alt={image.altText || name} fill sizes="(max-width: 767px) calc(100vw - 2rem), 320px" quality={80} className="object-contain p-5" /></div> : <ScentBottle className="aspect-[4/4] h-full min-h-64 w-full" />}
            <div className="flex flex-col justify-center p-6 md:p-8">
              <p className="eyebrow">{brandName}</p>
              <h3 className="mt-2 font-display text-3xl text-parchment">{name}</h3>
              <p className="mt-3 text-xs text-smoke">{product.concentration ?? ''} · {availabilityLabel}</p>
              <p className="mt-5 font-display text-xl text-gold-bright">{formatPrice(product.price, product.currency)}</p>
              {reason && <p className="mt-4 text-sm leading-6 text-smoke">{reason}</p>}
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={quickAdd} disabled={unavailable} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gold px-5 py-3 text-xs font-medium text-ink disabled:opacity-40"><ShoppingBag size={14} />{product.hasVariants ? dict.collections.viewDetails : added ? dict.collections.added : dict.collections.quickAdd}</button>
                <Link href={`/${lang}/product/${product.slug}`} className="flex flex-1 items-center justify-center rounded-full border border-ink-line px-5 py-3 text-xs text-parchment hover:border-gold/40">{dict.collections.viewDetails}</Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
