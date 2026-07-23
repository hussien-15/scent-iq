'use client';

import { useEffect } from 'react';
import { recordRecentlyViewed, type RecentlyViewedItem } from '@/lib/recently-viewed';

export default function RecordRecentlyViewed({ item }: { item: RecentlyViewedItem }) {
  useEffect(() => {
    recordRecentlyViewed(item);
    // Runs once per product page visit — item identity (slug) is what matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.slug]);

  return null;
}
