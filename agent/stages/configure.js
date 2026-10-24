// CONFIGURE stage - every environment variable the code reads must be
// documented in .env.example, so configuration is reproducible for anyone
// (or any agent) deploying the project.
import { join } from 'node:path';
import { walkFiles, readText, rel, result } from './util.js';

export function documentedKeys(envExampleText) {
  const keys = new Set();
  for (const line of String(envExampleText || '').split('\n')) {
    const m = line.match(/^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=/);
    if (m) keys.add(m[1]);
  }
  return keys;
}

export function usedKeys(text) {
  const keys = new Set();
  for (const m of String(text || '').matchAll(/process\.env\.([A-Z][A-Z0-9_]*)/g)) {
    keys.add(m[1]);
  }
  return keys;
}

export async function run(ctx) {
  const example = readText(join(ctx.root, '.env.example'));
  if (example == null) {
    return result('configure', 'Configure', 'fail', ['.env.example not found - configuration is undocumented.']);
  }
  const documented = documentedKeys(example);
  const used = new Set();
  for (const file of walkFiles(ctx.root)) {
    if (!/\.(js|mjs|cjs|ts)$/.test(file)) continue;
    if (rel(ctx.root, file).startsWith('tests')) continue; // fixtures quote env reads as data
    const text = readText(file);
    if (text) for (const k of usedKeys(text)) used.add(k);
  }
  const findings = [];
  for (const k of used) {
    if (!documented.has(k)) findings.push(`${k} is read by the code but missing from .env.example`);
  }
  for (const k of documented) {
    if (!used.has(k)) findings.push(`${k} is documented in .env.example but not read by any code (stale?)`);
  }
  if (findings.length) {
    return result('configure', 'Configure', 'warn', findings, { used: used.size, documented: documented.size });
  }
  return result('configure', 'Configure', 'pass',
    [`Configuration documented: ${used.size} env var(s) used, all present in .env.example.`],
    { used: used.size, documented: documented.size });
}
