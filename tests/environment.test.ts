import test from 'node:test';
import assert from 'node:assert/strict';
import { assertServerEnvironment, inspectEnvironment } from '../src/lib/environment';

const validEnvironment = {
  DATABASE_URL: 'postgresql://scentiq:password@localhost:5432/scentiq_dev',
  DIRECT_URL: 'postgresql://scentiq:password@localhost:5432/scentiq_dev',
  AUTH_SECRET: 'a-unique-development-secret-with-32-chars',
  AUTH_URL: 'http://localhost:3000',
  NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
  SCENTIQ_ENVIRONMENT: 'development',
  MAINTENANCE_MODE: 'off',
  ORDERING_DISABLED: 'false',
  NODE_ENV: 'development',
} as NodeJS.ProcessEnv;

test('environment validation accepts a complete local setup', () => {
  assert.doesNotThrow(() => assertServerEnvironment(validEnvironment));
  assert.equal(inspectEnvironment(validEnvironment).filter((check) => check.status === 'fail').length, 0);
});

test('environment validation lists missing keys without secret values', () => {
  assert.throws(
    () => assertServerEnvironment({ NODE_ENV: 'development' }),
    /DATABASE_URL.*DIRECT_URL.*AUTH_URL.*NEXT_PUBLIC_SITE_URL.*AUTH_SECRET/
  );
});

test('production URLs require HTTPS based on the ScentIQ target, not the local build mode', () => {
  const checks = inspectEnvironment({ ...validEnvironment, SCENTIQ_ENVIRONMENT: 'production' });
  assert.equal(checks.find((check) => check.key === 'AUTH_URL')?.status, 'fail');
  assert.equal(checks.find((check) => check.key === 'NEXT_PUBLIC_SITE_URL')?.status, 'fail');
});

test('hosted environments reject local database hosts', () => {
  const checks = inspectEnvironment({ ...validEnvironment, SCENTIQ_ENVIRONMENT: 'staging' });
  assert.equal(checks.find((check) => check.key === 'DATABASE_URL')?.status, 'fail');
  assert.equal(checks.find((check) => check.key === 'DIRECT_URL')?.status, 'fail');
});
