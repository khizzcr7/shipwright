// SECURE stage - scans the tree for committed secrets and credential-shaped
// strings. The scanner's own file is excluded (it contains the patterns).
import { basename, join } from 'node:path';
import { walkFiles, isTextFile, readText, rel, result } from './util.js';

export const SECRET_PATTERNS = [
  { re: /AKIA[0-9A-Z]{16}/, label: 'AWS access key id' },
  { re: /ghp_[A-Za-z0-9]{30,}/, label: 'GitHub personal access token' },
  { re: /github_pat_[A-Za-z0-9_]{20,}/, label: 'GitHub fine-grained token' },
  { re: /glpat-[A-Za-z0-9_-]{15,}/, label: 'GitLab personal access token' },
  { re: /sk-[A-Za-z0-9]{20,}/, label: 'API secret key (sk-...)' },
  { re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, label: 'private key block' },
  { re: /(?:api[_-]?key|secret|token|password)\s*[:=]\s*["'][A-Za-z0-9_\-./+=]{12,}["']/i, label: 'hardcoded credential assignment' },
];

export function scanText(text) {
  const hits = [];
  for (const { re, label } of SECRET_PATTERNS) {
    if (re.test(text)) hits.push(label);
  }
  return hits;
}

export async function run(ctx) {
  const findings = [];
  let filesScanned = 0;
  for (const file of walkFiles(ctx.root)) {
    if (!isTextFile(file)) continue;
    if (basename(file) === 'security.js') continue; // the scanner definition itself
    const text = readText(file);
    if (text == null) continue;
    filesScanned += 1;
    for (const label of scanText(text)) {
      findings.push(`${rel(ctx.root, file)} - possible ${label}`);
    }
  }
  if (findings.length) {
    return result('secure', 'Security Scan', 'fail', findings, { filesScanned });
  }
  return result('secure', 'Security Scan', 'pass',
    [`No credential-shaped strings found in ${filesScanned} text file(s).`], { filesScanned });
}

export const _selfPath = join('agent', 'stages', 'security.js');
