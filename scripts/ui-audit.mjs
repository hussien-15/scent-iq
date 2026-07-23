import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const checks = [];
const add = (label, ok, detail) => checks.push({ label, ok, detail });
const publicCopy = `${read('src/dictionaries/ar.ts')}\n${read('src/dictionaries/en.ts')}`;

add(
  'Shared UI primitives',
  ['Button', 'EmptyState', 'ToastProvider', 'ConfirmDialog', 'StatusBadge'].every((name) =>
    exists(`src/components/ui/${name}.tsx`)
  ),
  'Buttons, feedback, empty states, confirmations and statuses use shared components.'
);
add(
  'Bilingual feedback provider',
  read('src/app/[lang]/layout.tsx').includes('ToastProvider') &&
    read('src/app/studio/layout.tsx').includes('ToastProvider'),
  'Storefront and Studio can show accessible feedback.'
);
add(
  'Real product signals',
  read('src/lib/product-card.ts').includes('availableStock: true') &&
    read('src/components/ProductCard.tsx').includes('Number(product.oldPrice) > Number(product.price)'),
  'Stock and discount badges are data-backed.'
);
add(
  'Mobile filter drawer',
  exists('src/components/shop/ShopFilterDrawer.tsx') &&
    read('src/app/[lang]/shop/page.tsx').includes('ShopFilterDrawer'),
  'Shop filters have a touch-friendly mobile surface.'
);
add(
  'Operational media library',
  exists('src/components/studio/MediaLibraryManager.tsx') && !exists('src/components/studio/StudioPlaceholder.tsx'),
  'Media is browseable/uploadable and obsolete placeholder UI is removed.'
);
add(
  'Honest customer copy',
  !/100% Authentic|أصالة 100%|مضمون 100%|delivery in 2.?4|التوصيل خلال 2.?4/i.test(publicCopy),
  'Public dictionaries avoid fake guarantees and fixed unverified delivery promises.'
);
add(
  'UI documentation',
  exists('docs/ui-polish-system.md') && exists('tests/ui-polish.test.ts'),
  'The design system and regression checks are documented.'
);

console.log('\nScentIQ Step 27 UI audit\n');
for (const check of checks) console.log(`${check.ok ? '[PASS]' : '[FAIL]'} ${check.label}: ${check.detail}`);
if (checks.some((check) => !check.ok)) {
  console.error('\nUI audit failed. Resolve every failed structural check.');
  process.exitCode = 1;
} else {
  console.log('\nUI audit passed. Complete visual checks with real catalog and delivery data before Live Mode.');
}
