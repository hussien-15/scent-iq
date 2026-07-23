import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WishlistItem = {
  perfumeId: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  price: number;
  oldPrice?: number | null;
  concentration?: string | null;
  brandNameEn: string;
  brandNameAr?: string | null;
};

type WishlistState = {
  items: WishlistItem[];
  toggleItem: (item: WishlistItem) => void;
  removeItem: (perfumeId: string) => void;
  clear: () => void;
};

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      toggleItem: (item) => {
        const exists = get().items.some((saved) => saved.perfumeId === item.perfumeId);
        set({
          items: exists
            ? get().items.filter((saved) => saved.perfumeId !== item.perfumeId)
            : [item, ...get().items],
        });
      },

      removeItem: (perfumeId) =>
        set({ items: get().items.filter((item) => item.perfumeId !== perfumeId) }),

      clear: () => set({ items: [] }),
    }),
    { name: 'scentiq-wishlist' }
  )
);
