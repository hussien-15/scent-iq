import process from 'node:process';

const rawBase = process.env.QA_BASE_URL?.trim();
if (!rawBase) {
  console.error('QA_BASE_URL is required, for example https://staging.example.com.');
  process.exit(1);
}

let base;
try {
  base = new URL(rawBase);
} catch {
  console.error('QA_BASE_URL must be a valid absolute URL.');
  process.exit(1);
}
if (!['localhost', '127.0.0.1'].includes(base.hostname) && base.protocol !== 'https:') {
  console.error('Remote QA_BASE_URL must use HTTPS.');
  process.exit(1);
}

const results = [];
async function check(name, pathname, expected = [200], init = {}) {
  try {
    const response = await fetch(new URL(pathname, base), { redirect: 'manual', ...init });
    const ok = expected.includes(response.status);
    results.push({ name, ok, detail: `${response.status} ${pathname}`, response });
    return response;
  } catch (error) {
    results.push({ name, ok: false, detail: `${pathname}: ${error instanceof Error ? error.name : 'request failed'}` });
  }
}

await check('Arabic homepage', '/ar');
await check('English homepage', '/en');
await check('Arabic shop', '/ar/shop');
await check('English contact', '/en/contact');
await check('Robots', '/robots.txt');
await check('Sitemap', '/sitemap.xml');
await check('Not found boundary', '/en/step-26-smoke-missing', [404]);
const studio = await check('Anonymous Studio protection', '/studio/qa', [302, 303, 307, 308]);
if (studio) {
  const location = studio.headers.get('location') ?? '';
  const row = results.at(-1);
  if (row && !/\/admin\/login/.test(location)) {
    row.ok = false;
    row.detail += ' (did not redirect to admin login)';
  }
}
await check('Unauthorized revalidation', '/api/revalidate', [401, 403], {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ paths: ['/ar'] }),
});

console.log(`\nScentIQ smoke test — ${base.origin}\n`);
for (const result of results) console.log(`${result.ok ? '[PASS]' : '[FAIL]'} ${result.name}: ${result.detail}`);
if (results.some((result) => !result.ok)) {
  console.error('\nSmoke test failed. Record a bug and keep Live Mode blocked.');
  process.exitCode = 1;
} else {
  console.log('\nSmoke test passed. Continue device, browser, checkout and admin evidence collection.');
}
