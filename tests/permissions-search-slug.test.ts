import test from 'node:test';
import assert from 'node:assert/strict';
import { roleHasPermission } from '../src/lib/permissions';
import { searchScore } from '../src/utils/search-match';
import { slugCandidate, slugify } from '../src/utils/slug';

test('RBAC grants only role-owned permissions', () => {
  assert.equal(roleHasPermission('INVENTORY_MANAGER', 'inventory.adjust'), true);
  assert.equal(roleHasPermission('INVENTORY_MANAGER', 'admin_users.manage'), false);
  assert.equal(roleHasPermission('VIEWER', 'products.edit'), false);
});

test('Arabic search ignores common letter variants and diacritics', () => {
  const perfume = {
    nameEn: 'Oud Royal',
    nameAr: 'عُود إماراتي',
    brand: { name: 'ScentIQ', nameAr: 'سنت آي كيو' },
    notes: [{ note: { nameEn: 'Amber', nameAr: 'عنبر' } }],
  };
  assert.ok(searchScore(perfume, 'عود اماراتي') > 0);
  assert.ok(searchScore(perfume, 'عنبر') > 0);
});

test('slug utility is deterministic and supplies collision candidates', () => {
  assert.equal(slugify('  Royal Oud 2026  '), 'royal-oud-2026');
  assert.equal(slugCandidate('Royal Oud', 1), 'royal-oud-2');
});
