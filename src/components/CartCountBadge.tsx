'use client';

import { useEffect, useState } from 'react';
import { useCartStore, cartCount } from '@/lib/store/cart-store';

export default function CartCountBadge() {
  const items = useCartStore((s) => s.items);
  // Avoids a hydration mismatch: server always renders "no badge," client
  // reveals the real (possibly persisted) count only after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const count = mounted ? cartCount(items) : 0;
  if (count === 0) return null;

  return (
    <span className="absolute -end-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-medium text-ink">
      {count > 9 ? '9+' : count}
    </span>
  );
}
