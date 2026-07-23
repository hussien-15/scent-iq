import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { trackAnalyticsEvent } from '@/lib/analytics-client';

export type CartItem = {
  perfumeId: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  price: number;
  brandName: string;
  variantId?: string;
  variantName?: string;
  variantSku?: string;
  maxAvailable?: number;
  sourceCollectionId?: string;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (perfumeId: string, variantId?: string) => void;
  updateQuantity: (perfumeId: string, quantity: number, variantId?: string) => void;
  clear: () => void;
};

/**
 * The cart itself — Zustand was installed back in Step 3 for exactly this
 * and hadn't been used until now. `persist` handles the "save cart locally
 * if user refreshes the page" requirement without any extra code; it uses
 * localStorage under the hood, which is the right call here (a real app,
 * not a claude.ai artifact — see CLAUDE.md-equivalent notes elsewhere in
 * this project about that distinction).
 */
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item, quantity = 1) => {
        const existing = get().items.find((i) => i.perfumeId === item.perfumeId && i.variantId === item.variantId);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.perfumeId === item.perfumeId && i.variantId === item.variantId
                ? {
                    ...i,
                    quantity: Math.min(i.quantity + quantity, item.maxAvailable ?? Number.MAX_SAFE_INTEGER),
                    sourceCollectionId: i.sourceCollectionId ?? item.sourceCollectionId,
                  }
                : i
            ),
          });
        } else {
          set({ items: [...get().items, { ...item, quantity }] });
        }
        trackAnalyticsEvent({
          event: 'ADD_TO_CART',
          perfumeId: item.perfumeId,
          collectionId: item.sourceCollectionId,
          value: item.price * quantity,
          metadata: { quantity, variantId: item.variantId ?? null },
        });
      },

      removeItem: (perfumeId, variantId) => {
        const removed = get().items.find((i) => i.perfumeId === perfumeId && i.variantId === variantId);
        set({ items: get().items.filter((i) => !(i.perfumeId === perfumeId && i.variantId === variantId)) });
        if (removed) trackAnalyticsEvent({
          event: 'REMOVE_FROM_CART', perfumeId, value: removed.price * removed.quantity,
          metadata: { quantity: removed.quantity, variantId: variantId ?? null },
        });
      },

      updateQuantity: (perfumeId, quantity, variantId) => {
        const previous = get().items.find((i) => i.perfumeId === perfumeId && i.variantId === variantId);
        set({
          items:
            quantity <= 0
              ? get().items.filter((i) => !(i.perfumeId === perfumeId && i.variantId === variantId))
              : get().items.map((i) => (i.perfumeId === perfumeId && i.variantId === variantId ? { ...i, quantity: Math.min(quantity, i.maxAvailable ?? Number.MAX_SAFE_INTEGER) } : i)),
        });
        if (previous && quantity <= 0) trackAnalyticsEvent({
          event: 'REMOVE_FROM_CART', perfumeId, value: previous.price * previous.quantity,
          metadata: { quantity: previous.quantity, variantId: variantId ?? null },
        });
      },

      clear: () => set({ items: [] }),
    }),
    { name: 'scentiq-cart' }
  )
);

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}
