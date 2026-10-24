// CREATE stage (code review) - static review heuristics over the source tree:
// leftover debug output, unresolved work markers, and oversized files.
// The review module itself is excluded: its rule table contains the very
// words it scans for. Test files are excluded: fixtures contain bad
// patterns on purpose.
import { basename } from 'node:path';
import { walkFiles, readText, rel, result } from './util.js';

const RULES = [
  { re: /console\.log\s*\(/, label: 'console.log left in code' },
  { re: /\bdebugger\b/, label: 'debugger statement left in code' },
  { re: /\b(TODO|FIXME|XXX|HACK)\b/, label: 'unresolved TODO/FIXME marker' },
];
const MAX_LINES = 400;

export async function run(ctx) {
  const findings = [];
  let filesScanned = 0;
  for (const file of walkFiles(ctx.root)) {
    if (!/\.(js|mjs|cjs|ts)$/.test(file)) continue;
    if (basename(file) === 'review.js') continue; // the rule table itself
    // Test fixtures intentionally contain bad patterns; they are not shipped code.
    if (rel(ctx.root, file).startsWith('tests')) continue;
    const text = readText(file);
    if (text == null) continue;
    filesScanned += 1;
    const lines = text.split('\n');
    for (const rule of RULES) {
      lines.forEach((line, i) => {
        if (rule.re.test(line)) {
          findings.push(`${rel(ctx.root, file)}:${i + 1} - ${rule.label}`);
        }
      });
    }
    if (lines.length > MAX_LINES) {
      findings.push(`${rel(ctx.root, file)} - ${lines.length} lines, over the ${MAX_LINES}-line review guideline`);
    }
  }
  const status = findings.length ? 'warn' : 'pass';
  if (!findings.length) findings.push(`Static review clean across ${filesScanned} source file(s).`);
  return result('create', 'Code Review', status, findings, { filesScanned });
}
