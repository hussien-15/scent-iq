import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const checks = [];
const add = (label, ok, detail) => checks.push({ label, ok, detail });

const schema = read('prisma/schema.prisma');
const setup = read('src/actions/setup.ts');
const permissions = read('src/lib/permissions.ts');
const pkg = JSON.parse(read('package.json'));
const english = read('src/dictionaries/en.ts');
const arabic = read('src/dictionaries/ar.ts');

add(
  'QA domain model',
  ['QaCheck', 'QaBug', 'LaunchApproval'].every((model) => new RegExp(`model\\s+${model}\\s+\\{`).test(schema)),
  'Prisma includes checks, defects and accountable approvals.'
);
add(
  'Additive migration',
  exists('prisma/migrations/20260714030000_step26_final_qa/migration.sql'),
  'The Step 26 migration is committed.'
);
add(
  'Server launch gate',
  setup.includes('getLaunchReadiness') && setup.includes('Live Mode is blocked by Final QA'),
  'Live Mode checks evidence-backed readiness on the server.'
);
add(
  'Protected Studio route',
  permissions.includes("['/studio/qa', 'qa.view']") &&
    read('src/app/studio/qa/page.tsx').includes("requirePermission('qa.view')"),
  'QA route and page require explicit permission.'
);
add(
  'Cache refresh coverage',
  read('src/actions/qa.ts').includes("'/studio/system-health'") &&
    read('src/actions/qa.ts').includes("'/studio/setup'"),
  'QA mutations refresh dependent operational screens.'
);
add(
  'Single package manager',
  exists('pnpm-lock.yaml') && !exists('package-lock.json') && pkg.packageManager?.startsWith('pnpm@'),
  'Release automation is locked to pnpm.'
);
add(
  'Public launch copy',
  !/hello@scentiq\.example|Checkout arrives in Phase 2|placeholder page|صفحة placeholder|لأغراض العرض التوضيحي/.test(
    `${english}\n${arabic}`
  ),
  'Known demo and placeholder launch claims are absent.'
);
add(
  'QA automation',
  Boolean(pkg.scripts?.['qa:smoke'] && pkg.scripts?.['qa:check']) && exists('tests/qa-readiness.test.ts'),
  'Audit, smoke, readiness and release checks are wired.'
);
add(
  'Failure surfaces and runbooks',
  [
    'src/app/global-error.tsx',
    'src/app/studio/error.tsx',
    'docs/qa-and-launch-readiness.md',
    'docs/bug-triage.md',
    'docs/post-launch-monitoring.md',
  ].every(exists),
  'Branded failure handling and launch procedures are present.'
);

console.log('\nScentIQ Step 26 QA audit\n');
for (const check of checks) console.log(`${check.ok ? '[PASS]' : '[FAIL]'} ${check.label}: ${check.detail}`);
if (checks.some((check) => !check.ok)) {
  console.error('\nQA audit failed. Resolve every failed structural check before release.');
  process.exitCode = 1;
} else {
  console.log('\nStructural QA audit passed. Human staging evidence and approvals are still required.');
}
