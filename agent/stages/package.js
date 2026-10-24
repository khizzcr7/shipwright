// PACKAGE stage - builds a content-addressed artifact manifest of everything
// that would ship, so a release is reproducible and auditable.
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { walkFiles, rel, fileSize, result } from './util.js';

export async function run(ctx) {
  const files = walkFiles(ctx.root).filter((f) => !rel(ctx.root, f).startsWith('reports'));
  const entries = files.map((f) => ({
    path: rel(ctx.root, f),
    bytes: fileSize(f),
    sha256: createHash('sha256').update(readFileSync(f)).digest('hex'),
  }));
  const totalBytes = entries.reduce((sum, e) => sum + e.bytes, 0);
  const manifest = { generatedAt: new Date().toISOString(), fileCount: entries.length, totalBytes, files: entries };
  if (!ctx.reportOnly) {
    mkdirSync(join(ctx.root, 'dist'), { recursive: true });
    writeFileSync(join(ctx.root, 'dist', 'manifest.json'), JSON.stringify(manifest, null, 2));
  }
  return result('package', 'Package', 'pass',
    [`Artifact manifest covers ${entries.length} file(s), ${totalBytes} bytes total, SHA-256 per file.`],
    { fileCount: entries.length, totalBytes });
}
