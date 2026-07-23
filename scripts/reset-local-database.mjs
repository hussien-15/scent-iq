import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { loadLocalEnvironment } from './load-local-env.mjs';

loadLocalEnvironment();

const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('Cannot reset: DIRECT_URL or DATABASE_URL is missing from .env.');
  process.exit(1);
}

let parsed;
try {
  parsed = new URL(databaseUrl);
} catch {
  console.error('Cannot reset: the database URL is invalid.');
  process.exit(1);
}

const localHosts = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
const databaseName = parsed.pathname.replace(/^\//, '').split('?')[0];
const environment = (process.env.SCENTIQ_ENVIRONMENT || 'development').toLowerCase();
if (
  !localHosts.has(parsed.hostname) ||
  databaseName !== 'scentiq_dev' ||
  !['development', 'local', 'test'].includes(environment)
) {
  console.error(
    'RESET BLOCKED: db:reset only accepts a local PostgreSQL host, database name scentiq_dev, and a development/local/test environment.'
  );
  console.error('It will never reset Supabase or another remote database. Follow DATABASE.md for remote migrations.');
  process.exit(1);
}

console.warn('Resetting local database scentiq_dev. All local development data will be deleted.');
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const migrate = spawnSync(pnpm, ['exec', 'prisma', 'migrate', 'reset', '--force', '--skip-seed'], { stdio: 'inherit' });
if (migrate.status !== 0) process.exit(migrate.status ?? 1);
const seed = spawnSync(pnpm, ['seed:dev'], { stdio: 'inherit' });
process.exit(seed.status ?? 1);
