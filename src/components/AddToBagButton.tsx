'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/store/cart-store';
import { useToast } from '@/components/ui/ToastProvider';
import type { Locale } from '@/lib/i18n';

export default function AddToBagButton({
  item,
  label,
  disabled,
  className,
  redirectTo,
  lang = 'ar',
}: {
  item: {
    perfumeId: string;
    slug: string;
    nameEn: string;
    nameAr: string;
    price: number;
    brandName: string;
    sourceCollectionId?: string;
  };
  label: string;
  disabled?: boolean;
  className?: string;
  /** If set (e.g. "/ar/checkout"), navigates there right after adding — powers "Buy Now". */
  redirectTo?: string;
  lang?: Locale;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const router = useRouter();
  const [added, setAdded] = useState(false);
  const { showToast } = useToast();

  function handleClick() {
    addItem(item);
    if (redirectTo) {
      router.push(redirectTo);
      return;
    }
    setAdded(true);
    showToast({
      message: lang === 'ar' ? 'تمت إضافة العطر إلى السلة.' : 'Perfume added to your cart.',
      action: { label: lang === 'ar' ? 'عرض السلة' : 'View cart', href: `/${lang}/cart` },
    });
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <button type="button" disabled={disabled} onClick={handleClick} className={className}>
      {added ? '✓' : label}
    </button>
  );
}
