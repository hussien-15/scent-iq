import fs from 'node:fs';
import process from 'node:process';
import { loadLocalEnvironment } from './load-local-env.mjs';

loadLocalEnvironment();

const checks = [];
const add = (name, ok, message) => checks.push({ name, ok, message });
const majorNode = Number(process.versions.node.split('.')[0]);

add('Node.js', majorNode >= 20 && majorNode < 25, `${process.version}; ScentIQ supports Node 20, 22, or 24 LTS.`);
add('pnpm', Boolean(process.env.npm_config_user_agent?.startsWith('pnpm/')), 'Run this command with pnpm doctor.');
const required = ['DATABASE_URL', 'DIRECT_URL', 'AUTH_SECRET', 'AUTH_URL', 'NEXT_PUBLIC_SITE_URL'];
const envFileExists = fs.existsSync('.env') || fs.existsSync('.env.local');
const injectedEnvironment = required.every((key) => Boolean(process.env[key]?.trim()));
add(
  '.env file',
  envFileExists || injectedEnvironment,
  envFileExists
    ? 'Local environment file found.'
    : injectedEnvironment
      ? 'Required values were injected by the current environment.'
      : 'Copy .env.example to .env before local setup.'
);
for (const key of required)
  add(key, Boolean(process.env[key]?.trim()), process.env[key] ? 'Configured.' : `Missing ${key}.`);

const authSecret = process.env.AUTH_SECRET ?? '';
if (authSecret)
  add(
    'AUTH_SECRET strength',
    authSecret.length >= 32 && !authSecret.includes('replace-with'),
    'Use a unique value of at least 32 characters.'
  );

for (const key of ['DATABASE_URL', 'DIRECT_URL', 'AUTH_URL', 'NEXT_PUBLIC_SITE_URL']) {
  const value = process.env[key];
  if (!value) continue;
  try {
    const url = new URL(value);
    const expected =
      key.endsWith('_URL') && !key.includes('DATABASE') && key !== 'DIRECT_URL'
        ? ['http:', 'https:']
        : ['postgresql:', 'postgres:'];
    add(`${key} format`, expected.includes(url.protocol), `Protocol is ${url.protocol}`);
  } catch {
    add(`${key} format`, false, 'Value is not a valid URL.');
  }
}

const adminParts = ['SEED_ADMIN_NAME', 'SEED_ADMIN_EMAIL', 'SEED_ADMIN_PASSWORD'].filter((key) =>
  Boolean(process.env[key]?.trim())
);
add(
  'Seed admin configuration',
  adminParts.length === 0 || adminParts.length === 3,
  adminParts.length === 0 ? 'Development defaults will be used.' : `${adminParts.length}/3 fields configured.`
);

console.log('\nScentIQ local environment doctor\n');
for (const check of checks) console.log(`${check.ok ? '[PASS]' : '[FAIL]'} ${check.name}: ${check.message}`);

if (process.argv.includes('--database') && checks.every((check) => check.ok)) {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const [admins, settings, roles, permissions] = await Promise.all([
      prisma.user.count({ where: { role: 'ADMIN', adminRole: 'SUPER_ADMIN', adminStatus: 'ACTIVE' } }),
      prisma.siteSetting.count(),
      prisma.adminRole.count(),
      prisma.permission.count(),
    ]);
    console.log('[PASS] PostgreSQL connection: Prisma connected successfully.');
    console.log(
      `${admins > 0 ? '[PASS]' : '[FAIL]'} Super Admin: ${admins > 0 ? 'Active account found.' : 'Run the appropriate seed mode.'}`
    );
    console.log(`${settings > 0 ? '[PASS]' : '[FAIL]'} Core settings: ${settings} rows found.`);
    console.log(
      `${roles > 0 && permissions > 0 ? '[PASS]' : '[FAIL]'} RBAC seed: ${roles} roles and ${permissions} permissions found.`
    );
    if (admins === 0 || settings === 0 || roles === 0 || permissions === 0) process.exitCode = 1;
  } catch (error) {
    console.error(
      '[FAIL] PostgreSQL connection: Cannot connect. Check that PostgreSQL is running and both database URLs are correct.'
    );
    if (process.env.NODE_ENV === 'development')
      console.error(`       ${error instanceof Error ? error.name : 'Database error'}`);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

if (checks.some((check) => !check.ok)) {
  console.error('\nFix the failed checks, then run pnpm doctor again. See docs/troubleshooting.md.');
  process.exitCode = 1;
} else if (!process.argv.includes('--database')) {
  console.log('\nEnvironment looks ready. Run pnpm doctor:db to test PostgreSQL and seed health.');
}
