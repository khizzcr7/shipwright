// Shared helpers for the Shipwright stage engine.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

export const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'reports']);
export const TEXT_EXTS = new Set([
  '.js', '.mjs', '.cjs', '.ts', '.json', '.md', '.yml', '.yaml',
  '.txt', '.html', '.css', '.env', '.example', '.sh', '.sol',
]);

/** Recursively list files under root, skipping noise directories. */
export function walkFiles(root, dir = root, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walkFiles(root, join(dir, entry.name), out);
    } else if (entry.isFile()) {
      out.push(join(dir, entry.name));
    }
  }
  return out;
}

export function isTextFile(path) {
  const dot = path.lastIndexOf('.');
  if (dot === -1) return false;
  return TEXT_EXTS.has(path.slice(dot).toLowerCase());
}

export function readText(path) {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return null;
  }
}

export function rel(root, path) {
  return relative(root, path);
}

export function fileSize(path) {
  try {
    return statSync(path).size;
  } catch {
    return 0;
  }
}

/** A stage result: status is 'pass' | 'warn' | 'fail'. */
export function result(stage, name, status, findings, metrics = {}) {
  return { stage, name, status, findings, metrics };
}
