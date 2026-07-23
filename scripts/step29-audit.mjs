import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const checks = [];
const check = (name, ok, detail) => checks.push({ name, ok: Boolean(ok), detail });

const middleware = read('src/middleware.ts');
const i18n = read('src/lib/i18n.ts');
const checkout = read('src/services/checkout.service.ts');
const order = read('src/services/order.service.ts');
const inventory = read('src/services/inventory.service.ts');
const productAction = read('src/actions/product.ts');
const taxonomyAction = read('src/actions/taxonomy.ts');
const permissions = read('src/lib/permissions.ts');
const productPage = read('src/app/[lang]/product/[slug]/page.tsx');
const seed = read('prisma/seed-system.ts');
const packageJson = JSON.parse(read('package.json'));

check('Arabic is the default locale', /defaultLocale(?:\s*:\s*Locale)?\s*=\s*['"]ar['"]/.test(i18n), 'The default storefront locale must be Arabic.');
check('Admin aliases preserve the Studio architecture', middleware.includes("pathname.startsWith('/admin/')") && middleware.includes('/studio'), 'Admin compatibility routes should redirect to protected Studio routes.');
check('Checkout recalculates authoritative totals', /getCheckoutTotals|calculateCheckout|subtotal/.test(checkout) && /deliveryFee/.test(checkout) && /prisma\.\$transaction/.test(checkout), 'Prices, delivery and order creation must be server-owned.');
check('Inventory is movement-based and transaction-safe', /newStock < 0/.test(inventory) && /inventoryMovement\.create/.test(inventory) && /Serializable/.test(order), 'Negative stock and unaudited changes must be blocked.');
check('Product lifecycle is operational', /duplicateProduct/.test(productAction) && /archiveProduct/.test(productAction) && /PRODUCT_DUPLICATED/.test(productAction) && /PRODUCT_ARCHIVED/.test(productAction), 'Products need safe duplicate and archive workflows.');
check('Product preview is private', exists('src/app/studio/products/[id]/preview/page.tsx') && /Private preview/.test(read('src/app/studio/products/[id]/preview/page.tsx')), 'Draft preview must live under protected Studio.');
check('Notes and tags are manageable', exists('src/app/studio/taxonomy/page.tsx') && /createNote/.test(taxonomyAction) && /updateNote/.test(taxonomyAction) && /createTag/.test(taxonomyAction) && /updateTag/.test(taxonomyAction), 'Taxonomy cannot require code edits.');
check('Taxonomy has granular permissions', ['taxonomy.view', 'taxonomy.create', 'taxonomy.edit', 'taxonomy.delete'].every((key) => permissions.includes(`'${key}'`)), 'Taxonomy mutations need server-side RBAC.');
check('In-use taxonomy records are protected', /perfumeNotes > 0/.test(taxonomyAction) && /tag\._count\.perfumes > 0/.test(taxonomyAction), 'Used notes/tags cannot be destructively deleted.');
check('Slug changes preserve SEO', /seoRedirect\.upsert/.test(productAction) && /seoRedirect\.upsert/.test(read('src/actions/catalog.ts')) && /seoRedirect\.upsert/.test(taxonomyAction), 'Normal content editors must create redirects after slug changes.');
check('Public product pages use ISR', /export const revalidate\s*=/.test(productPage) && !/force-dynamic/.test(productPage), 'SEO-heavy product pages should be incrementally revalidated.');
check('Production seed is honest', /Production setup needs SEED_ADMIN/.test(seed) && /includeDemoActivity/.test(seed), 'Production must not silently seed fake business activity.');
check('Operational documentation exists', ['local-development.md', 'environment-variables.md', 'database.md', 'troubleshooting.md', 'deployment.md', 'rollback.md'].every((file) => exists(`docs/${file}`)), 'Local and production operations must be documented.');
check('Step 29 compliance is release-wired', exists('docs/step29-production-compliance.md') && packageJson.scripts?.['step29:audit'] && packageJson.scripts?.['release:check']?.includes('step29:audit'), 'The specification audit must run before release.');

console.log('\nScentIQ Step 29 production specification audit\n');
for (const item of checks) console.log(`${item.ok ? 'PASS' : 'FAIL'}  ${item.name}${item.ok ? '' : ` — ${item.detail}`}`);
const failed = checks.filter((item) => !item.ok);
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed.`);
if (failed.length) process.exit(1);
