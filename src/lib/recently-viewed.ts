const KEY = 'scentiq:recently-viewed';
const MAX_ITEMS = 6;

export type RecentlyViewedItem = {
  slug: string;
  nameEn: string;
  nameAr: string;
  brandName: string;
  price: string;
};

export function recordRecentlyViewed(item: RecentlyViewedItem) {
  if (typeof window === 'undefined') return;

  try {
    const existing = getRecentlyViewed().filter((i) => i.slug !== item.slug);
    const updated = [item, ...existing].slice(0, MAX_ITEMS);
    window.localStorage.setItem(KEY, JSON.stringify(updated));
  } catch {
    // Storage can be unavailable (private browsing, quota) — not worth failing over.
  }
}

export function getRecentlyViewed(): RecentlyViewedItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
