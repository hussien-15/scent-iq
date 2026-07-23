import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const schema = readFileSync(join(process.cwd(), 'prisma/schema.prisma'), 'utf8');
const migration = readFileSync(
  join(process.cwd(), 'prisma/migrations/20260714010000_step22_data_foundation/migration.sql'),
  'utf8'
);
const qaMigration = readFileSync(
  join(process.cwd(), 'prisma/migrations/20260714030000_step26_final_qa/migration.sql'),
  'utf8'
);

test('Step 22 schema exposes normalized platform foundations', () => {
  for (const model of [
    'AdminRole',
    'Permission',
    'AdminRolePermission',
    'AdminUserRole',
    'Customer',
    'ProductMedia',
    'HomepageSection',
    'Cart',
    'CartItem',
    'RecommendationLog',
    'SiteSetting',
    'AuditLog',
  ]) {
    assert.match(schema, new RegExp(`model\\s+${model}\\s+\\{`));
  }
});

test('content supports soft deletion and order history snapshots', () => {
  assert.match(schema, /model Perfume[\s\S]*?deletedAt\s+DateTime\?/);
  assert.match(schema, /model Brand[\s\S]*?deletedAt\s+DateTime\?/);
  assert.match(schema, /model Collection[\s\S]*?deletedAt\s+DateTime\?/);
  assert.match(schema, /model OrderItem[\s\S]*?productNameSnapshot\s+String\?/);
  assert.match(schema, /model OrderItem[\s\S]*?skuSnapshot\s+String\?/);
});

test('transition migration preserves settings and backfills existing orders', () => {
  assert.doesNotMatch(migration, /DROP COLUMN "value"/);
  assert.match(migration, /ALTER COLUMN "value" TYPE JSONB USING TO_JSONB\("value"\)/);
  assert.match(migration, /SIQ-LEGACY-/);
  assert.match(migration, /INSERT INTO "Customer"/);
});

test('Step 26 schema models evidence, bug triage and accountable approvals', () => {
  for (const model of ['QaCheck', 'QaBug', 'LaunchApproval']) {
    assert.match(schema, new RegExp(`model\\s+${model}\\s+\\{`));
  }
  for (const enumName of ['QaCheckStatus', 'QaBugSeverity', 'QaBugStatus', 'LaunchApprovalArea']) {
    assert.match(schema, new RegExp(`enum\\s+${enumName}\\s+\\{`));
  }
  assert.match(schema, /model QaBug[\s\S]*?reproductionSteps\s+String/);
  assert.match(schema, /model LaunchApproval[\s\S]*?area\s+LaunchApprovalArea\s+@unique/);
});

test('Step 26 migration is additive and starts trust evidence safely', () => {
  assert.match(qaMigration, /CREATE TABLE "QaCheck"/);
  assert.match(qaMigration, /CREATE TABLE "QaBug"/);
  assert.match(qaMigration, /CREATE TABLE "LaunchApproval"/);
  assert.match(qaMigration, /"status" "QaCheckStatus" NOT NULL DEFAULT 'NOT_TESTED'/);
  assert.match(qaMigration, /"approved" BOOLEAN NOT NULL DEFAULT false/);
  assert.doesNotMatch(qaMigration, /DROP TABLE|TRUNCATE|DELETE FROM/);
});
