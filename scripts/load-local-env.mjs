import fs from 'node:fs';
import path from 'node:path';

function unquote(value) {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1).replaceAll('\\n', '\n');
  }
  return trimmed.replace(/\s+#.*$/, '').trim();
}

export function loadLocalEnvironment(directory = process.cwd()) {
  for (const name of ['.env', '.env.local']) {
    const filename = path.join(directory, name);
    if (!fs.existsSync(filename)) continue;
    for (const line of fs.readFileSync(filename, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!match || process.env[match[1]] !== undefined) continue;
      process.env[match[1]] = unquote(match[2]);
    }
  }
}
