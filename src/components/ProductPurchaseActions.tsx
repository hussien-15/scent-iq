'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronDown, PackageX } from 'lucide-react';
import { useCartStore } from '@/lib/store/cart-store';
import { formatPrice } from '@/utils/format-price';
import type { Locale } from '@/lib/i18n';
import type ar from '@/dictionaries/ar';
import { useToast } from '@/components/ui/ToastProvider';

type Option = {
  variantId?: string;
  variantName?: string;
  sku: string;
  bottleSize: string | null;
  price: number;
  available: number;
  lowStockThreshold: number;
  availability: string;
};

export default function ProductPurchaseActions({
  product,
  options,
  lang,
  dict,
  mobile = false,
}: {
  product: { perfumeId: string; slug: string; nameEn: string; nameAr: string; brandName: string };
  options: Option[];
  lang: Locale;
  dict: typeof ar;
  mobile?: boolean;
}) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const { showToast } = useToast();
  const firstAvailable = options.find(
    (option) => option.available > 0 && !['OUT_OF_STOCK', 'HIDDEN', 'DISCONTINUED'].includes(option.availability)
  );
  const [selectedKey, setSelectedKey] = useState(firstAvailable?.variantId ?? options[0]?.variantId ?? 'base');
  const [added, setAdded] = useState(false);
  const selected = useMemo(
    () => options.find((option) => (option.variantId ?? 'base') === selectedKey) ?? options[0],
    [options, selectedKey]
  );
  if (!selected) return null;
  const unavailable =
    selected.available <= 0 || ['OUT_OF_STOCK', 'HIDDEN', 'DISCONTINUED'].includes(selected.availability);

  function add(redirect = false) {
    if (unavailable) return;
    addItem({
      ...product,
      price: selected.price,
      variantId: selected.variantId,
      variantName: selected.variantName ?? selected.bottleSize ?? undefined,
      variantSku: selected.sku,
      maxAvailable: selected.available,
    });
    if (redirect) router.push(`/${lang}/checkout`);
    else {
      setAdded(true);
      showToast({
        message: dict.ui.toast.addedToCart,
        action: { label: dict.ui.buttons.viewCart, href: `/${lang}/cart` },
      });
      window.setTimeout(() => setAdded(false), 1500);
    }
  }

  if (mobile) {
    return (
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {options.length > 1 && (
          <select
            value={selectedKey}
            onChange={(event) => setSelectedKey(event.target.value)}
            className="max-w-28 rounded-full border border-ink-line bg-ink px-2 py-2 text-xs text-parchment"
          >
            {options.map((option) => (
              <option key={option.variantId ?? 'base'} value={option.variantId ?? 'base'}>
                {option.bottleSize ?? option.variantName ?? option.sku}
              </option>
            ))}
          </select>
        )}
        <span className="shrink-0 font-display text-sm text-gold-bright">{formatPrice(selected.price)}</span>
        <button
          type="button"
          disabled={unavailable}
          onClick={() => add(false)}
          className="min-w-0 flex-1 rounded-full bg-gold py-3 text-sm font-medium text-ink disabled:opacity-40"
        >
          {unavailable ? dict.product.inventory.outOfStock : dict.product.addToBag}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {options.length > 1 && (
        <label className="relative block max-w-sm">
          <span className="eyebrow mb-2 block">{dict.product.inventory.chooseSize}</span>
          <select
            value={selectedKey}
            onChange={(event) => setSelectedKey(event.target.value)}
            className="w-full appearance-none rounded-sm border border-ink-line bg-ink px-4 py-3 pe-10 text-sm text-parchment focus:border-gold/50 focus:outline-none"
          >
            {options.map((option) => (
              <option
                key={option.variantId ?? 'base'}
                value={option.variantId ?? 'base'}
                disabled={option.available <= 0}
              >
                {option.variantName ?? option.bottleSize ?? option.sku} · {formatPrice(option.price)} ·{' '}
                {option.available > 0
                  ? `${option.available} ${dict.product.inventory.availableUnits}`
                  : dict.product.inventory.outOfStock}
              </option>
            ))}
          </select>
          <ChevronDown size={15} className="pointer-events-none absolute bottom-3.5 end-3 text-smoke" />
        </label>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={unavailable}
          onClick={() => add(false)}
          className="rounded-full bg-gold px-10 py-3 text-sm font-medium text-ink transition-colors hover:bg-gold-bright disabled:opacity-40"
        >
          {unavailable ? (
            <span className="flex items-center gap-2">
              <PackageX size={15} />
              {dict.product.inventory.outOfStock}
            </span>
          ) : added ? (
            <span className="flex items-center gap-2">
              <Check size={15} />
              {dict.product.inventory.added}
            </span>
          ) : (
            dict.product.addToBag
          )}
        </button>
        <button
          type="button"
          disabled={unavailable}
          onClick={() => add(true)}
          className="rounded-full border border-gold/50 px-10 py-3 text-sm font-medium text-gold-bright transition-colors hover:bg-gold/10 disabled:opacity-40"
        >
          {dict.product.buyNow}
        </button>
      </div>
      {!unavailable && selected.available <= selected.lowStockThreshold && (
        <p className="text-xs text-amber-200">
          {dict.product.inventory.onlyLeft.replace('{count}', String(selected.available))}
        </p>
      )}
      {!unavailable && (
        <p className="text-xs text-emerald-300">
          {dict.product.inventory.available} · {dict.product.inventory.delivery} · {dict.product.inventory.cod}
        </p>
      )}
    </div>
  );
}
