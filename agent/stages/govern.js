// GOVERN stage (compliance) - the paperwork that makes a project shippable:
// MIT license in place and declared, README that documents setup, CI config
// present, and hygiene rules in .gitignore.
import { join } from 'node:path';
import { readText, result } from './util.js';

export function checkCompliance(texts) {
  const findings = [];
  let hardFail = false;
  const license = texts.license;
  if (!license || !license.includes('MIT License') || !license.includes('Permission is hereby granted')) {
    findings.push('LICENSE file missing or not an MIT license text.');
    hardFail = true;
  }
  let pkg = null;
  try { pkg = JSON.parse(texts.pkg || ''); } catch { /* handled below */ }
  if (!pkg) {
    findings.push('package.json missing or invalid JSON.');
    hardFail = true;
  } else if (pkg.license !== 'MIT') {
    findings.push(`package.json license is "${pkg.license}", expected "MIT".`);
    hardFail = true;
  }
  if (!texts.readme || !/##\s*(setup|getting started|installation)/i.test(texts.readme)) {
    findings.push('README.md has no Setup / Getting Started section.');
  }
  if (!texts.ci) findings.push('.gitlab-ci.yml not found - no visible pipeline definition.');
  const gitignore = texts.gitignore || '';
  if (!/node_modules/.test(gitignore)) findings.push('.gitignore does not exclude node_modules.');
  if (!/^\.env$/m.test(gitignore) && !/\.env/.test(gitignore)) findings.push('.gitignore does not exclude .env files.');
  return { findings, hardFail };
}

export async function run(ctx) {
  const texts = {
    license: readText(join(ctx.root, 'LICENSE')),
    pkg: readText(join(ctx.root, 'package.json')),
    readme: readText(join(ctx.root, 'README.md')),
    ci: readText(join(ctx.root, '.gitlab-ci.yml')),
    gitignore: readText(join(ctx.root, '.gitignore')),
  };
  const { findings, hardFail } = checkCompliance(texts);
  if (hardFail) return result('govern', 'Govern (compliance)', 'fail', findings);
  if (findings.length) return result('govern', 'Govern (compliance)', 'warn', findings);
  return result('govern', 'Govern (compliance)', 'pass',
    ['MIT license present and declared, README documents setup, CI config present, .gitignore hygiene OK.']);
}
