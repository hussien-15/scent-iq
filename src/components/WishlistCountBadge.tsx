'use client';

import { useEffect, useState } from 'react';
import { useWishlistStore } from '@/lib/store/wishlist-store';

export default function WishlistCountBadge() {
  const count = useWishlistStore((state) => state.items.length);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted || count === 0) return null;

  return (
    <span className="absolute -end-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-medium text-ink">
      {count > 9 ? '9+' : count}
    </span>
  );
}
