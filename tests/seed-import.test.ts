import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  parseProductImport,
  productImportTemplateCsv,
  validateProductImport,
  type ImportLookup,
} from '../src/services/product-import.service';

const lookup: ImportLookup = {
  brands: [{ id: 'brand-1', name: 'Lattafa', nameAr: 'لطافة', slug: 'lattafa', searchAliases: ['Latafa', 'لطافه'] }],
  categories: [{ id: 'category-1', nameEn: 'Unisex Perfumes', nameAr: 'عطور للجنسين', slug: 'unisex-perfumes' }],
  notes: [{ id: 'note-1', nameEn: 'Vanilla', nameAr: 'فانيليا', slug: 'vanilla' }],
  tags: [{ id: 'tag-1', name: 'Elegant', nameAr: 'أنيق', slug: 'elegant' }],
  media: [{ id: 'media-1', fileName: 'LAT-SAMPLE.webp', originalName: 'LAT-SAMPLE.webp' }],
  existingSkus: [],
  existingSlugs: [],
};

test('product CSV template is parseable and keeps bilingual quoted content', () => {
  const rows = parseProductImport(productImportTemplateCsv(), 'csv');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].NameEnglish, 'Verified Sample');
  assert.match(String(rows[0].DescriptionArabic), /وصف عربي/);
});

test('product import matches aliases and generates missing identifiers', () => {
  const report = validateProductImport([{
    NameArabic: 'عطر فانيليا', NameEnglish: 'Vanilla Test', Brand: 'Latafa', Category: 'عطور للجنسين',
    Price: '75000', Stock: '10', BottleSize: '100ml', TopNotes: 'فانيليا', Tags: 'Elegant',
    DescriptionArabic: 'وصف عربي', DescriptionEnglish: 'English description', SeoTitleArabic: 'عنوان',
    SeoDescriptionArabic: 'وصف بحث', ImageFileName: 'LAT-SAMPLE.webp', Status: 'PUBLISHED',
    Longevity: 'HIGH', Projection: 'MODERATE', Sillage: 'MODERATE',
  }], lookup);
  assert.equal(report.errorRows, 0);
  assert.equal(report.rows[0].brandId, 'brand-1');
  assert.match(report.rows[0].sku, /^SCENTIQ-LATTAFA-VANILLATEST-100ML$/);
  assert.equal(report.rows[0].effectiveStatus, 'PUBLISHED');
});

test('duplicates and missing catalog relationships block import', () => {
  const report = validateProductImport([{
    NameArabic: 'عطر', NameEnglish: 'Duplicate', Brand: 'Unknown', Category: 'Missing',
    Price: '-1', Stock: '1.5', SKU: 'USED-1', Slug: 'used-product',
  }], { ...lookup, existingSkus: ['USED-1'], existingSlugs: ['used-product'] });
  assert.equal(report.validRows, 0);
  assert.ok(report.duplicateRows >= 1);
  assert.ok(report.rows[0].issues.some((issue) => issue.field === 'Brand' && issue.severity === 'error'));
});

test('products without approved matched media remain draft', () => {
  const report = validateProductImport([{
    NameArabic: 'مكتمل', NameEnglish: 'Complete Except Media', Brand: 'Lattafa', Category: 'Unisex Perfumes',
    Price: '90000', Stock: '5', DescriptionArabic: 'وصف', DescriptionEnglish: 'Description', TopNotes: 'Vanilla',
    Tags: 'Elegant', SeoTitleArabic: 'عنوان', SeoDescriptionArabic: 'وصف', Status: 'PUBLISHED',
    Longevity: 'HIGH', Projection: 'HIGH', Sillage: 'HIGH',
  }], lookup);
  assert.equal(report.errorRows, 0);
  assert.equal(report.rows[0].effectiveStatus, 'DRAFT');
});

test('Step 23 seed source contains production guards and pending test reviews', () => {
  const system = readFileSync(join(process.cwd(), 'prisma/seed-system.ts'), 'utf8');
  const seed = readFileSync(join(process.cwd(), 'prisma/seed.ts'), 'utf8');
  const migration = readFileSync(join(process.cwd(), 'prisma/migrations/20260714020000_step23_seed_setup/migration.sql'), 'utf8');
  assert.match(system, /SEED_PRODUCTION_CONFIRM/);
  assert.match(system, /SCENTIQ_ENVIRONMENT/);
  assert.match(seed, /approvalStatus: 'PENDING'/);
  assert.doesNotMatch(seed, /approvalStatus: 'APPROVED'/);
  assert.doesNotMatch(migration, /DROP\s+(TABLE|COLUMN)/i);
  assert.match(migration, /ADD VALUE IF NOT EXISTS 'SMART_SEARCH'/);
});
