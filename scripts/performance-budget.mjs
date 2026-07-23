import { readFile, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import path from 'node:path';

const manifestPath = path.join('.next', 'app-build-manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const fileSizes = new Map();

async function gzipBytes(file) {
  if (fileSizes.has(file)) return fileSizes.get(file);
  const local = path.join('.next', file.replace(/^\/_next\//, '').replace(/^\.next\//, ''));
  try {
    await stat(local);
    const bytes = gzipSync(await readFile(local)).byteLength;
    fileSizes.set(file, bytes);
    return bytes;
  } catch {
    return 0;
  }
}

const rows = [];
for (const [route, files] of Object.entries(manifest.pages ?? {})) {
  if (route.includes('/api/') || route.endsWith('/route')) continue;
  const uniqueJs = [...new Set(files.filter((file) => file.endsWith('.js')))];
  const bytes = (await Promise.all(uniqueJs.map(gzipBytes))).reduce((sum, value) => sum + value, 0);
  rows.push({ route, bytes });
}

rows.sort((a, b) => b.bytes - a.bytes);
console.log('Initial JavaScript budget (gzip)');
for (const row of rows.slice(0, 20)) console.log(`${String(Math.round(row.bytes / 1024)).padStart(4)} kB  ${row.route}`);

const failures = rows.filter((row) => {
  const budget = row.route.includes('/studio/') ? 350 * 1024 : 220 * 1024;
  return row.bytes > budget;
});
if (failures.length) {
  console.error('\nPerformance budget exceeded: public routes allow 220 kB gzip; Studio routes allow 350 kB.');
  process.exitCode = 1;
} else {
  console.log('\nAll initial-route JavaScript budgets passed.');
}
