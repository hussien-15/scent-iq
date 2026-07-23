import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { loadLocalEnvironment } from './load-local-env.mjs';

loadLocalEnvironment();

const checks = [];
const add = (name, ok, message) => checks.push({ name, ok, message });
const value = (key) => process.env[key]?.trim() ?? '';
const placeholder = (input) => /replace-with|change-me|example\.com|STAGING_|PRODUCTION_/i.test(input);
const hosted = ['staging', 'production'].includes(value('SCENTIQ_ENVIRONMENT').toLowerCase());

function safeUrl(key, protocols) {
  const raw = value(key);
  if (!raw) return add(key, false, `${key} is missing.`);
  try {
    const url = new URL(raw);
    const validProtocol = protocols.includes(url.protocol);
    const secure = !hosted || url.protocol === 'https:' || protocols.includes('postgresql:');
    add(
      key,
      validProtocol && secure && !placeholder(raw),
      validProtocol && secure
        ? 'Configured without exposing its value.'
        : `${key} has an invalid protocol for this environment.`
    );
    return url;
  } catch {
    add(key, false, `${key} is not a valid URL.`);
  }
}

const environment = value('SCENTIQ_ENVIRONMENT').toLowerCase();
add('Environment', hosted, 'SCENTIQ_ENVIRONMENT must be staging or production for deployment.');
const databaseUrl = safeUrl('DATABASE_URL', ['postgresql:', 'postgres:']);
const directUrl = safeUrl('DIRECT_URL', ['postgresql:', 'postgres:']);
const authUrl = safeUrl('AUTH_URL', ['https:']);
const siteUrl = safeUrl('NEXT_PUBLIC_SITE_URL', ['https:']);

for (const key of ['AUTH_SECRET', 'REVALIDATION_SECRET']) {
  const secret = value(key);
  add(
    key,
    secret.length >= 32 && !placeholder(secret),
    `${key} must be unique, non-placeholder, and at least 32 characters.`
  );
}

if (authUrl && siteUrl)
  add(
    'Canonical origin',
    authUrl.origin === siteUrl.origin,
    'AUTH_URL and NEXT_PUBLIC_SITE_URL must use the same canonical origin.'
  );
for (const [key, url] of [
  ['DATABASE_URL', databaseUrl],
  ['DIRECT_URL', directUrl],
]) {
  if (!url) continue;
  add(
    `${key} remote host`,
    !['localhost', '127.0.0.1', '::1'].includes(url.hostname),
    `${key} must not target a local database during hosted deployment.`
  );
}

add(
  'Storage provider',
  value('STORAGE_PROVIDER') === 'cloudinary',
  'Production media must use the configured persistent Cloudinary provider.'
);
const cloudinary = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
for (const key of cloudinary)
  add(key, Boolean(value(key)) && !placeholder(value(key)), `${key} must be configured in hosting settings.`);
add(
  'Maintenance mode',
  ['off', 'ordering', 'storefront'].includes(value('MAINTENANCE_MODE').toLowerCase() || 'off'),
  'MAINTENANCE_MODE must be off, ordering, or storefront.'
);
add(
  'Ordering switch',
  ['true', 'false', ''].includes(value('ORDERING_DISABLED').toLowerCase()),
  'ORDERING_DISABLED must be true or false.'
);
add(
  'Public support channel',
  ['NEXT_PUBLIC_SUPPORT_WHATSAPP', 'NEXT_PUBLIC_SUPPORT_PHONE', 'NEXT_PUBLIC_SUPPORT_EMAIL'].some(
    (key) => Boolean(value(key)) && !placeholder(value(key))
  ),
  'Configure at least one real public WhatsApp, phone, or email channel.'
);

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
add(
  'pnpm lock',
  fs.existsSync('pnpm-lock.yaml') && packageJson.packageManager?.startsWith('pnpm@'),
  'pnpm-lock.yaml and an exact packageManager are required.'
);
add(
  'Single package manager',
  !fs.existsSync('package-lock.json') && !fs.existsSync('yarn.lock'),
  'Do not commit npm/yarn locks beside pnpm-lock.yaml.'
);
add(
  'Prisma migrations',
  fs.existsSync('prisma/migrations/migration_lock.toml') &&
    fs.readdirSync('prisma/migrations').some((name) => /^\d/.test(name)),
  'Reviewed migration history must be committed.'
);
const gitignore = fs.readFileSync('.gitignore', 'utf8');
add(
  'Secret ignore rules',
  gitignore.includes('.env') && gitignore.includes('!.env.production.example'),
  'Real environment files must remain ignored while safe templates stay committed.'
);
add(
  'Deployment docs',
  ['deployment.md', 'production-checklist.md', 'database-production.md', 'rollback.md', 'launch-checklist.md'].every(
    (name) => fs.existsSync(path.join('docs', name))
  ),
  'All production runbooks must be present.'
);

console.log('\nScentIQ pre-deployment gate\n');
for (const check of checks) console.log(`${check.ok ? '[PASS]' : '[FAIL]'} ${check.name}: ${check.message}`);

if (checks.some((check) => !check.ok)) {
  console.error('\nDeployment blocked. Fix every failed check; no secret values were printed.');
  process.exitCode = 1;
} else {
  console.log(`\nConfiguration is ready for ${environment}. This command did not migrate, seed, or deploy anything.`);
}

if (process.argv.includes('--database') && process.exitCode !== 1) {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const [
      migrationRows,
      activeAdmins,
      demoOrders,
      demoReviews,
      demoCustomers,
      demoAnalytics,
      qaChecks,
      launchApprovals,
    ] = await Promise.all([
      prisma.$queryRaw`SELECT COUNT(*)::int AS count FROM "_prisma_migrations" WHERE finished_at IS NULL AND rolled_back_at IS NULL`,
      prisma.user.count({ where: { role: 'ADMIN', adminRole: 'SUPER_ADMIN', adminStatus: 'ACTIVE' } }),
      prisma.order.count({ where: { orderNumber: { startsWith: 'SIQ-DEMO-' } } }),
      prisma.review.count({ where: { comment: { startsWith: '[TEST DATA]' } } }),
      prisma.customer.count({ where: { notes: { contains: 'Development fixture' } } }),
      prisma.analyticsEvent.count({ where: { sessionId: { startsWith: 'step23-demo-' } } }),
      prisma.qaCheck.count(),
      prisma.launchApproval.count(),
    ]);
    const unfinishedMigrations = Number(migrationRows?.[0]?.count ?? 0);
    const fakeRows = demoOrders + demoReviews + demoCustomers + demoAnalytics;
    console.log(
      `${unfinishedMigrations === 0 ? '[PASS]' : '[FAIL]'} Migration table: ${unfinishedMigrations} unfinished migration${unfinishedMigrations === 1 ? '' : 's'}.`
    );
    console.log(
      `${activeAdmins > 0 ? '[PASS]' : '[FAIL]'} Super Admin: ${activeAdmins > 0 ? 'Active account found.' : 'No active Super Admin.'}`
    );
    console.log(
      `${fakeRows === 0 ? '[PASS]' : '[FAIL]'} Production trust data: ${fakeRows === 0 ? 'No Step 23 demo business rows found.' : `${fakeRows} demo rows must be removed before launch.`}`
    );
    console.log(
      `${qaChecks > 0 ? '[PASS]' : '[FAIL]'} QA framework: ${qaChecks} evidence check${qaChecks === 1 ? '' : 's'} seeded; results remain a separate human launch gate.`
    );
    console.log(
      `${launchApprovals === 8 ? '[PASS]' : '[FAIL]'} Launch approvals: ${launchApprovals}/8 approval areas seeded.`
    );
    if (unfinishedMigrations || !activeAdmins || fakeRows || !qaChecks || launchApprovals !== 8) process.exitCode = 1;
  } catch (error) {
    console.error(
      `[FAIL] Database verification: ${error instanceof Error ? error.name : 'Database error'}. No connection details were logged.`
    );
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}
