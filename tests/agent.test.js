// Unit tests for the Shipwright stage engine (node --test).
// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { scanText, run as securityRun } from '../agent/stages/security.js';
import { documentedKeys, usedKeys } from '../agent/stages/configure.js';
import { nextPatch } from '../agent/stages/release.js';
import { checkCompliance } from '../agent/stages/govern.js';
import { run as reviewRun } from '../agent/stages/review.js';
import { run as planRun } from '../agent/stages/plan.js';

function tmpProject(files) {
  const dir = mkdtempSync(join(tmpdir(), 'shipwright-test-'));
  for (const [name, content] of Object.entries(files)) {
    const path = join(dir, name);
    mkdirSync(join(path, '..'), { recursive: true });
    writeFileSync(path, content);
  }
  return dir;
}

// Fake secrets are assembled at runtime so no credential-shaped literal
// ever lands in this repository (the security stage scans this repo too).
const FAKE_AWS_KEY = 'AKIA' + 'IOSFODNN7EXAMPLE';
const FAKE_GITLAB_TOKEN = 'glpat-' + 'a1b2c3d4e5f6a7b8c9d0';

test('security scanText flags credential-shaped strings', () => {
  assert.ok(scanText(`const k = "${FAKE_AWS_KEY}";`).includes('AWS access key id'));
  assert.ok(scanText(`token: ${FAKE_GITLAB_TOKEN}`).includes('GitLab personal access token'));
  assert.deepEqual(scanText('const greeting = "hello world";'), []);
});

test('security stage fails a dirty tree and passes a clean one', async () => {
  const dirty = tmpProject({ 'app.js': `const key = "${FAKE_AWS_KEY}";\n` });
  const dirtyRes = await securityRun({ root: dirty, reportOnly: true });
  assert.equal(dirtyRes.status, 'fail');

  const clean = tmpProject({ 'app.js': 'export const x = 1;\n' });
  const cleanRes = await securityRun({ root: clean, reportOnly: true });
  assert.equal(cleanRes.status, 'pass');
});

test('configure key extraction', () => {
  assert.deepEqual([...documentedKeys('PORT=3000\n# comment\nHOST=x\n')], ['PORT', 'HOST']);
  assert.deepEqual([...usedKeys('const p = process.env.PORT; const h = process.env.HOST;')], ['PORT', 'HOST']);
});

test('release nextPatch bumps the patch version', () => {
  assert.equal(nextPatch('0.1.0'), '0.1.1');
  assert.equal(nextPatch('1.2.9'), '1.2.10');
});

test('govern compliance: good paperwork passes, missing MIT fails', () => {
  const good = checkCompliance({
    license: 'MIT License\n\nPermission is hereby granted, free of charge',
    pkg: JSON.stringify({ license: 'MIT' }),
    readme: '# X\n\n## Setup\n\nnpm test\n',
    ci: 'stages: [verify]\n',
    gitignore: 'node_modules/\n.env\n',
  });
  assert.equal(good.hardFail, false);
  assert.deepEqual(good.findings, []);

  const bad = checkCompliance({ license: null, pkg: '{}', readme: '', ci: null, gitignore: '' });
  assert.equal(bad.hardFail, true);
  assert.ok(bad.findings.length >= 3);
});

test('review stage warns on leftover debug output', async () => {
  const dir = tmpProject({ 'index.js': 'console.log("debug");\n' });
  const res = await reviewRun({ root: dir, reportOnly: true });
  assert.equal(res.status, 'warn');
  assert.ok(res.findings[0].includes('console.log'));
});

test('plan stage counts roadmap milestones', async () => {
  const dir = tmpProject({ 'ROADMAP.md': '# R\n- [x] done one\n- [ ] open one\n' });
  const res = await planRun({ root: dir, reportOnly: true });
  assert.equal(res.status, 'pass');
  assert.equal(res.metrics.milestonesDone, 1);
  assert.equal(res.metrics.milestonesOpen, 1);
});
