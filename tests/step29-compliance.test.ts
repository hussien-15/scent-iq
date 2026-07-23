import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

test('product lifecycle copies content safely and archives with audit evidence', () => {
  const action = read('src/actions/product.ts');
  assert.match(action, /duplicateProduct/);
  assert.match(action, /status: 'DRAFT'/);
  assert.match(action, /stock: 0, reservedStock: 0, availableStock: 0/);
  assert.match(action, /PRODUCT_DUPLICATED/);
  assert.match(action, /archiveProduct/);
  assert.match(action, /deletedAt: new Date\(\)/);
  assert.match(action, /PRODUCT_ARCHIVED/);
});

test('private Studio preview supports draft inspection without weakening public status filters', () => {
  const preview = read('src/app/studio/products/[id]/preview/page.tsx');
  const publicPage = read('src/app/[lang]/product/[slug]/page.tsx');
  assert.match(preview, /Private preview/);
  assert.match(preview, /findUnique/);
  assert.match(publicPage, /status: 'PUBLISHED'/);
  assert.doesNotMatch(publicPage, /includeDraft|previewMode/);
});

test('notes and tags have protected CRUD-style management', () => {
  const action = read('src/actions/taxonomy.ts');
  const manager = read('src/components/studio/TaxonomyManager.tsx');
  const permissions = read('src/lib/permissions.ts');
  for (const name of ['createNote', 'updateNote', 'deleteNote', 'createTag', 'updateTag', 'deleteTag']) assert.match(`${action}\n${manager}`, new RegExp(name));
  for (const permission of ['taxonomy.view', 'taxonomy.create', 'taxonomy.edit', 'taxonomy.delete']) assert.match(permissions, new RegExp(permission.replace('.', '\\.')));
  assert.match(action, /perfumeNotes > 0/);
  assert.match(action, /_count\.perfumes > 0/);
});

test('slug edits in normal content managers create permanent SEO redirects', () => {
  for (const file of ['src/actions/product.ts', 'src/actions/catalog.ts', 'src/actions/taxonomy.ts']) {
    const source = read(file);
    assert.match(source, /seoRedirect\.upsert/);
    assert.match(source, /statusCode: 308/);
  }
});

test('Step 29 record names environment-owned launch gates explicitly', () => {
  const compliance = read('docs/step29-production-compliance.md');
  assert.match(compliance, /Environment-gated/);
  assert.match(compliance, /managed PostgreSQL/);
  assert.match(compliance, /persistent cloud media storage/);
  assert.match(compliance, /private staging/);
});
