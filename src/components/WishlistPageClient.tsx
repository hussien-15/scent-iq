'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import ScentBottle from '@/components/ScentBottle';
import { useWishlistStore } from '@/lib/store/wishlist-store';
import { useCartStore } from '@/lib/store/cart-store';
import { formatPrice } from '@/utils/format-price';
import { localized } from '@/utils/localized';
import type { Locale } from '@/lib/i18n';
import type ar from '@/dictionaries/ar';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/ToastProvider';

export default function WishlistPageClient({ lang, dict }: { lang: Locale; dict: typeof ar }) {
  const items = useWishlistStore((state) => state.items);
  const removeItem = useWishlistStore((state) => state.removeItem);
  const clear = useWishlistStore((state) => state.clear);
  const addItem = useCartStore((state) => state.addItem);
  const [mounted, setMounted] = useState(false);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [availability, setAvailability] = useState<
    Record<string, { available: number; availability: string; hasVariants: boolean; anyVariantAvailable: boolean }>
  >({});
  const [clearOpen, setClearOpen] = useState(false);
  const { showToast } = useToast();

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!mounted || items.length === 0) return;
    fetch(`/api/inventory/availability?ids=${encodeURIComponent(items.map((item) => item.perfumeId).join(','))}`)
      .then((response) => response.json())
      .then((data) =>
        setAvailability(
          Object.fromEntries(
            (data.success ? data.data.products : []).map(
              (product: {
                id: string;
                available: number;
                availability: string;
                hasVariants: boolean;
                anyVariantAvailable: boolean;
              }) => [product.id, product]
            )
          )
        )
      )
      .catch(() => setAvailability({}));
  }, [mounted, items]);

  if (!mounted) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4" aria-hidden="true">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="aspect-[3/5] animate-pulse rounded-sm bg-ink-soft" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title={dict.wishlist.emptyTitle}
        description={dict.wishlist.emptyDescription}
        action={{ label: dict.wishlist.browse, href: `/${lang}/shop` }}
      />
    );
  }

  function addToBag(perfumeId: string) {
    const item = items.find((saved) => saved.perfumeId === perfumeId);
    if (!item) return;
    const stock = availability[perfumeId];
    if (!stock || stock.available <= 0 || ['OUT_OF_STOCK', 'HIDDEN', 'DISCONTINUED'].includes(stock.availability))
      return;

    addItem({
      perfumeId: item.perfumeId,
      slug: item.slug,
      nameEn: item.nameEn,
      nameAr: item.nameAr,
      price: item.price,
      brandName: localized(lang, item.brandNameEn, item.brandNameAr),
      maxAvailable: stock.available,
    });
    setAddedId(perfumeId);
    showToast({
      message: dict.ui.toast.addedToCart,
      action: { label: dict.ui.buttons.viewCart, href: `/${lang}/cart` },
    });
    window.setTimeout(() => setAddedId(null), 1500);
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4 text-xs text-smoke">
        <span>
          {items.length} {dict.wishlist.savedCount}
        </span>
        <button
          type="button"
          onClick={() => setClearOpen(true)}
          className="text-gold-bright transition-colors hover:text-gold"
        >
          {dict.wishlist.clear}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
        {items.map((item) => {
          const name = localized(lang, item.nameEn, item.nameAr);
          const brandName = localized(lang, item.brandNameEn, item.brandNameAr);
          const isAdded = addedId === item.perfumeId;
          const stock = availability[item.perfumeId];
          const unavailable =
            !stock || stock.available <= 0 || ['OUT_OF_STOCK', 'HIDDEN', 'DISCONTINUED'].includes(stock.availability);

          return (
            <article key={item.perfumeId} className="group relative hairline rounded-sm">
              <Link href={`/${lang}/product/${item.slug}`} className="block">
                <ScentBottle className="aspect-[4/5] w-full" />
                <div className="space-y-1 p-4">
                  <p className="eyebrow">{brandName}</p>
                  <h2 className="font-display text-base text-parchment">{name}</h2>
                  <div className="flex items-baseline justify-between gap-2 pt-1">
                    <span className="text-xs text-smoke">{item.concentration ?? ''}</span>
                    <span className="font-display text-sm text-gold-bright">{formatPrice(item.price)}</span>
                  </div>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => {
                  removeItem(item.perfumeId);
                  showToast({ message: dict.ui.toast.removedFromWishlist, type: 'info' });
                }}
                aria-label={dict.wishlist.remove}
                title={dict.wishlist.remove}
                className="absolute end-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-ink/85 text-smoke backdrop-blur transition-colors hover:text-gold-bright"
              >
                <Trash2 size={15} />
              </button>

              {unavailable && stock?.hasVariants && stock.anyVariantAvailable ? (
                <Link
                  href={`/${lang}/product/${item.slug}`}
                  className="mx-4 mb-4 flex w-[calc(100%_-_2rem)] items-center justify-center gap-2 rounded-full border border-gold/40 px-3 py-2 text-xs text-gold-bright"
                >
                  <ShoppingBag size={14} />
                  {dict.product.inventory.chooseSize}
                </Link>
              ) : (
                <button
                  type="button"
                  disabled={unavailable}
                  onClick={() => addToBag(item.perfumeId)}
                  className="mx-4 mb-4 flex w-[calc(100%_-_2rem)] items-center justify-center gap-2 rounded-full border border-gold/40 px-3 py-2 text-xs text-gold-bright transition-colors hover:bg-gold/10 disabled:border-ink-line disabled:text-smoke"
                >
                  <ShoppingBag size={14} />
                  {unavailable
                    ? dict.product.inventory.outOfStock
                    : isAdded
                      ? dict.wishlist.addedToBag
                      : dict.wishlist.addToBag}
                </button>
              )}
            </article>
          );
        })}
      </div>
      <ConfirmDialog
        open={clearOpen}
        title={lang === 'ar' ? 'مسح جميع العناصر المحفوظة؟' : 'Clear all saved items?'}
        description={
          lang === 'ar'
            ? 'ستُزال جميع العطور من المفضلة. لا يؤثر ذلك في السلة.'
            : 'Every perfume will be removed from your wishlist. Your cart will not be affected.'
        }
        confirmLabel={lang === 'ar' ? 'مسح المفضلة' : 'Clear wishlist'}
        cancelLabel={dict.ui.buttons.cancel}
        danger
        onClose={() => setClearOpen(false)}
        onConfirm={() => {
          clear();
          setClearOpen(false);
          showToast({ message: lang === 'ar' ? 'تم مسح المفضلة.' : 'Wishlist cleared.', type: 'info' });
        }}
      />
    </>
  );
}
