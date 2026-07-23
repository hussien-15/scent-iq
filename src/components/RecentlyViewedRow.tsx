'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getRecentlyViewed, type RecentlyViewedItem } from '@/lib/recently-viewed';
import { formatPrice } from '@/utils/format-price';
import { localized } from '@/utils/localized';
import type ar from '@/dictionaries/ar';
import type { Locale } from '@/lib/i18n';

export default function RecentlyViewedRow({
  currentSlug,
  lang,
  dict,
}: {
  currentSlug: string;
  lang: Locale;
  dict: typeof ar;
}) {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  useEffect(() => {
    setItems(getRecentlyViewed().filter((i) => i.slug !== currentSlug));
  }, [currentSlug]);

  if (items.length === 0) return null;

  return (
    <section className="border-t border-ink-line pt-10">
      <p className="eyebrow mb-5">{dict.product.recentlyViewed}</p>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {items.map((item) => (
          <Link
            key={item.slug}
            href={`/${lang}/product/${item.slug}`}
            className="hairline w-40 shrink-0 rounded-sm p-3 transition-colors hover:border-gold/40"
          >
            <p className="eyebrow truncate">{item.brandName}</p>
            <p className="truncate font-display text-sm text-parchment">
              {localized(lang, item.nameEn, item.nameAr)}
            </p>
            <p className="mt-1 text-xs text-gold-bright">{formatPrice(item.price)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
