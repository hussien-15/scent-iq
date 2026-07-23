'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Minus, Plus, ShoppingBag, X } from 'lucide-react';
import { useCartStore, cartSubtotal } from '@/lib/store/cart-store';
import { formatPrice } from '@/utils/format-price';
import { localized } from '@/utils/localized';
import ScentBottle from '@/components/ScentBottle';
import { getDictionary, resolveLocale } from '@/lib/i18n';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/ToastProvider';

export default function CartPage(props: { params: Promise<{ lang: string }> }) {
  const rawParams = use(props.params);
  const params = { ...rawParams, lang: resolveLocale(rawParams.lang) };
  const dict = getDictionary(params.lang);
  const { items, removeItem, updateQuantity } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const { showToast } = useToast();
  useEffect(() => setMounted(true), []);

  if (!mounted)
    return (
      <div
        className="mx-auto max-w-4xl px-6 py-16"
        aria-busy="true"
        aria-label={params.lang === 'ar' ? 'جاري تحميل السلة' : 'Loading cart'}
      >
        <div className="skeleton-shimmer mb-10 h-12 w-44 rounded-lg" />
        <div className="grid gap-10 md:grid-cols-3">
          <div className="space-y-4 md:col-span-2">
            {[0, 1].map((item) => (
              <div key={item} className="skeleton-shimmer h-32 rounded-xl" />
            ))}
          </div>
          <div className="skeleton-shimmer h-40 rounded-xl" />
        </div>
      </div>
    );

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="mb-10 font-display text-4xl text-parchment">{dict.cart.title}</h1>

      {items.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title={dict.ui.empty.cartTitle}
          description={dict.ui.empty.cartDescription}
          action={{ label: dict.ui.empty.cartAction, href: `/${params.lang}/shop` }}
        />
      ) : (
        <div className="grid gap-10 md:grid-cols-3">
          <div className="space-y-4 md:col-span-2">
            {items.map((item) => (
              <div key={`${item.perfumeId}:${item.variantId ?? 'base'}`} className="hairline flex gap-4 rounded-sm p-4">
                <ScentBottle className="h-24 w-20 shrink-0 rounded-sm" />
                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="eyebrow">{item.brandName}</p>
                      <p className="font-display text-base text-parchment">
                        {localized(params.lang, item.nameEn, item.nameAr)}
                      </p>
                      {item.variantName && (
                        <p className="mt-1 text-xs text-gold-bright">
                          {item.variantName}
                          {item.variantSku ? ` · ${item.variantSku}` : ''}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        removeItem(item.perfumeId, item.variantId);
                        showToast({ message: dict.ui.toast.removedFromCart, type: 'info' });
                      }}
                      aria-label={dict.cart.remove}
                      className="text-smoke hover:text-parchment"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 rounded-full border border-ink-line px-2 py-1">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.perfumeId, item.quantity - 1, item.variantId)}
                        className="text-smoke hover:text-parchment"
                        aria-label="-"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-4 text-center text-xs text-parchment">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.perfumeId, item.quantity + 1, item.variantId)}
                        className="text-smoke hover:text-parchment"
                        aria-label="+"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <span className="font-display text-sm text-gold-bright">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="hairline h-fit rounded-sm p-6">
            <div className="mb-4 flex justify-between text-sm">
              <span className="text-smoke">{dict.cart.subtotal}</span>
              <span className="text-parchment">{formatPrice(cartSubtotal(items))}</span>
            </div>
            <Link
              href={`/${params.lang}/checkout`}
              className="block w-full rounded-full bg-gold py-3 text-center font-body text-sm font-medium text-ink transition-colors hover:bg-gold-bright"
            >
              {dict.cart.checkout}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
