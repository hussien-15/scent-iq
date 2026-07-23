'use client';

import Link from 'next/link';
import { Check, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import type { Locale } from '@/lib/i18n';
import { useCartStore } from '@/lib/store/cart-store';
import { useToast } from '@/components/ui/ToastProvider';

export default function ProductCardQuickAdd({
  lang,
  href,
  hasVariants,
  unavailable,
  inventoryKnown,
  variantsKnown,
  item,
}: {
  lang: Locale;
  href: string;
  hasVariants: boolean;
  unavailable: boolean;
  inventoryKnown: boolean;
  variantsKnown: boolean;
  item: {
    perfumeId: string;
    slug: string;
    nameEn: string;
    nameAr: string;
    price: number;
    brandName: string;
    maxAvailable?: number;
  };
}) {
  const addItem = useCartStore((state) => state.addItem);
  const { showToast } = useToast();
  const [added, setAdded] = useState(false);
  const arabic = lang === 'ar';

  if (!inventoryKnown || !variantsKnown) {
    return (
      <Link
        href={href}
        className="mx-3 mb-3 flex min-h-10 items-center justify-center rounded-full border border-ink-line px-3 text-xs text-smoke transition-colors hover:border-gold/45 hover:text-gold-bright"
      >
        {arabic ? 'عرض التفاصيل' : 'View details'}
      </Link>
    );
  }

  if (hasVariants) {
    return (
      <Link
        href={href}
        className="mx-3 mb-3 flex min-h-10 items-center justify-center rounded-full border border-gold/35 px-3 text-xs text-gold-bright transition-colors hover:border-gold hover:bg-gold/[0.06]"
      >
        {arabic ? 'اختر الحجم' : 'Choose size'}
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={unavailable}
      onClick={() => {
        addItem(item);
        setAdded(true);
        showToast({
          message: arabic ? 'تمت إضافة العطر إلى السلة.' : 'Perfume added to your cart.',
          action: { label: arabic ? 'عرض السلة' : 'View cart', href: `/${lang}/cart` },
        });
        window.setTimeout(() => setAdded(false), 1400);
      }}
      className="mx-3 mb-3 flex min-h-10 w-[calc(100%_-_1.5rem)] items-center justify-center gap-2 rounded-full border border-gold/35 px-3 text-xs text-gold-bright transition-colors hover:border-gold hover:bg-gold/[0.06] disabled:border-ink-line disabled:text-smoke"
    >
      {added ? <Check size={14} /> : <ShoppingBag size={14} />}
      {unavailable
        ? arabic
          ? 'غير متوفر'
          : 'Unavailable'
        : added
          ? arabic
            ? 'تمت الإضافة'
            : 'Added'
          : arabic
            ? 'إضافة سريعة'
            : 'Quick add'}
    </button>
  );
}
