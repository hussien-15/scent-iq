import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ar from '../src/dictionaries/ar';
import en from '../src/dictionaries/en';
import { formatPrice } from '../src/utils/format-price';

function keys(value: unknown, prefix = ''): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  return Object.entries(value).flatMap(([key, child]) => {
    const current = prefix ? `${prefix}.${key}` : key;
    return child && typeof child === 'object' && !Array.isArray(child) ? [current, ...keys(child, current)] : [current];
  });
}

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

test('Arabic and English dictionaries expose the same UI keys', () => {
  assert.deepEqual(keys(en).sort(), keys(ar).sort());
});

test('IQD prices use consistent formatting without confusing decimals', () => {
  assert.equal(formatPrice(45000), '45,000 د.ع');
  assert.equal(formatPrice(55000.4), '55,000 د.ع');
  assert.equal(formatPrice(25, 'USD'), '$25.00');
});

test('shared feedback, empty-state, button and confirmation systems are installed', () => {
  ['Button.tsx', 'EmptyState.tsx', 'ToastProvider.tsx', 'ConfirmDialog.tsx', 'StatusBadge.tsx'].forEach((file) => {
    assert.equal(fs.existsSync(path.join(process.cwd(), 'src/components/ui', file)), true, `${file} is missing`);
  });
  assert.match(read('src/app/[lang]/layout.tsx'), /ToastProvider/);
  assert.match(read('src/app/studio/layout.tsx'), /ToastProvider/);
});

test('product card signals are derived from real price, inventory and variant data', () => {
  const card = read('src/components/ProductCard.tsx');
  const select = read('src/lib/product-card.ts');
  assert.match(card, /Number\(product\.oldPrice\) > Number\(product\.price\)/);
  assert.match(card, /product\.availableStock/);
  assert.match(select, /lowStockThreshold: true/);
  assert.match(select, /variants: true/);
});

test('customer copy avoids known fake guarantees and unfinished release language', () => {
  const copy = `${read('src/dictionaries/ar.ts')}\n${read('src/dictionaries/en.ts')}`;
  assert.doesNotMatch(copy, /100% Authentic|أصالة 100%|مضمون 100%|Phase 2|placeholder page/i);
});
