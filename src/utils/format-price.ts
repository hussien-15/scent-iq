/**
 * Single source of truth for price formatting — used by ProductCard, the
 * product page, and (later) cart/checkout, so a currency change or locale
 * adjustment happens in one place instead of scattered `.toFixed(2)` calls.
 */
import type { MoneyValue } from '@/types';

export function formatPrice(value: MoneyValue, currency = 'IQD'): string {
  const amount = typeof value === 'number' ? value : Number(value.toString());

  if (currency === 'IQD') {
    return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount)} د.ع`;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
