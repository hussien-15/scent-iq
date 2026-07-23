'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { useWishlistStore, type WishlistItem } from '@/lib/store/wishlist-store';
import type { Locale } from '@/lib/i18n';
import { trackAnalyticsEvent } from '@/lib/analytics-client';
import { useToast } from '@/components/ui/ToastProvider';

export default function WishlistButton({
  item,
  lang,
  className,
  iconSize = 18,
}: {
  item: WishlistItem;
  lang: Locale;
  className?: string;
  iconSize?: number;
}) {
  const items = useWishlistStore((state) => state.items);
  const toggleItem = useWishlistStore((state) => state.toggleItem);
  const [mounted, setMounted] = useState(false);
  const { showToast } = useToast();

  useEffect(() => setMounted(true), []);

  const isSaved = mounted && items.some((saved) => saved.perfumeId === item.perfumeId);
  const label = isSaved
    ? lang === 'ar'
      ? 'إزالة من المفضلة'
      : 'Remove from wishlist'
    : lang === 'ar'
      ? 'أضف للمفضلة'
      : 'Add to wishlist';

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={isSaved}
      title={label}
      onClick={() => {
        toggleItem(item);
        trackAnalyticsEvent({
          event: isSaved ? 'WISHLIST_REMOVED' : 'WISHLIST_ADDED',
          perfumeId: item.perfumeId,
          value: item.price,
        });
        showToast({
          message: isSaved
            ? lang === 'ar'
              ? 'تمت الإزالة من المفضلة.'
              : 'Removed from your wishlist.'
            : lang === 'ar'
              ? 'تمت الإضافة إلى المفضلة.'
              : 'Added to your wishlist.',
        });
      }}
      className={className}
    >
      <Heart size={iconSize} className={isSaved ? 'fill-gold text-gold-bright' : undefined} aria-hidden="true" />
    </button>
  );
}
