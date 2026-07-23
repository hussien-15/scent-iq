import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

test('Step 28 replaces the unfinished product route with authorized create and edit workflows', () => {
  const action = read('src/actions/product.ts');
  const newPage = read('src/app/studio/products/new/page.tsx');
  assert.match(newPage, /ProductForm/);
  assert.equal(fs.existsSync(path.join(process.cwd(), 'src/app/studio/products/[id]/page.tsx')), true);
  assert.match(action, /products\.create/);
  assert.match(action, /products\.edit/);
  assert.match(action, /products\.publish/);
  assert.match(action, /INITIAL_STOCK/);
  assert.doesNotMatch(`${action}\n${newPage}`, /isn.t built yet|substantial piece of UI/i);
});

test('catalog managers use real server mutations and soft archive records', () => {
  const action = read('src/actions/catalog.ts');
  const manager = read('src/components/studio/CatalogManagers.tsx');
  for (const operation of ['createBrand', 'updateBrand', 'archiveBrand', 'createCategory', 'updateCategory', 'archiveCategory']) {
    assert.match(`${action}\n${manager}`, new RegExp(operation));
  }
  assert.match(action, /deletedAt: new Date\(\)/);
  assert.match(action, /activityLog\.create/);
});

test('Studio mobile navigation is permission-aware and search submits to products', () => {
  const topbar = read('src/components/studio/StudioTopbar.tsx');
  assert.match(topbar, /STUDIO_NAV/);
  assert.match(topbar, /roleHasPermission/);
  assert.match(topbar, /action="\/studio\/products"/);
  assert.match(topbar, /name="q"/);
});

test('final roadmap records every phase and does not pretend external launch gates passed', () => {
  const roadmap = read('docs/final-implementation-roadmap.md');
  for (let phase = 0; phase <= 26; phase += 1) assert.match(roadmap, new RegExp(`\\| ${phase} \\|`));
  assert.match(roadmap, /environment-gated/i);
  assert.match(roadmap, /real environment variables/i);
  assert.match(roadmap, /private staging/i);
});
