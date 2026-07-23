import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const checks = [];
const check = (name, ok, detail) => checks.push({ name, ok: Boolean(ok), detail });

const productAction = read('src/actions/product.ts');
const productForm = read('src/components/studio/ProductForm.tsx');
const newProduct = read('src/app/studio/products/new/page.tsx');
const topbar = read('src/components/studio/StudioTopbar.tsx');
const catalogAction = read('src/actions/catalog.ts');
const roadmap = read('docs/final-implementation-roadmap.md');

check('Product create and edit routes', exists('src/app/studio/products/[id]/page.tsx') && /ProductForm/.test(newProduct), 'Both routes must use the real editor.');
check('Server-authorized product mutations', /requirePermission\(productId \? 'products\.edit' : 'products\.create'\)/.test(productAction) && /products\.publish/.test(productAction), 'Create, edit and publish permissions are required.');
check('Audited initial inventory', /applyInventoryMovement/.test(productAction) && /INITIAL_STOCK/.test(productAction), 'Initial stock must be a movement, not a silent scalar write.');
check('Structured product editor', /Fragrance profile/.test(productForm) && /Performance & usage/.test(productForm) && /title="8\. SEO"/.test(productForm), 'Editor must cover the core product lifecycle.');
check('No unfinished product placeholder', !/isn.t built yet|substantial piece of UI|eventually belong to/i.test(`${newProduct}\n${productAction}`), 'Release-critical routes cannot advertise missing implementation.');
check('Catalog management', /createBrand/.test(catalogAction) && /updateBrand/.test(catalogAction) && /archiveBrand/.test(catalogAction) && /createCategory/.test(catalogAction) && /updateCategory/.test(catalogAction), 'Brands and categories need real mutations.');
check('Functional Studio mobile navigation', /STUDIO_NAV/.test(topbar) && /md:hidden/.test(topbar) && /roleHasPermission/.test(topbar), 'Mobile admins need role-aware navigation.');
check('Functional Studio search', /action="\/studio\/products"/.test(topbar) && /name="q"/.test(topbar), 'Topbar search must submit a real query.');
check('All roadmap phases recorded', Array.from({ length: 27 }, (_, phase) => roadmap.includes(`| ${phase} |`)).every(Boolean), 'Phases 0 through 26 must have a status.');
check('Environment launch gates remain explicit', /environment-gated/i.test(roadmap) && /private staging/i.test(roadmap), 'External launch work must not be reported as already complete.');

console.log('\nScentIQ Step 28 roadmap audit\n');
for (const item of checks) console.log(`${item.ok ? 'PASS' : 'FAIL'}  ${item.name}${item.ok ? '' : ` — ${item.detail}`}`);
const failed = checks.filter((item) => !item.ok);
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed.`);
if (failed.length) process.exit(1);
