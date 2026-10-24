// VERIFY stage - runs the project test suite (node --test) and reports counts.
import { spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { result } from './util.js';

export async function run(ctx) {
  const testFiles = readdirSync(join(ctx.root, 'tests'))
    .filter((f) => f.endsWith('.test.js'))
    .map((f) => join('tests', f));
  const child = spawn(process.execPath, ['--test', ...testFiles], { cwd: ctx.root });
  let out = '';
  child.stdout.on('data', (d) => { out += d; });
  child.stderr.on('data', (d) => { out += d; });
  const code = await new Promise((resolve) => child.on('close', resolve));
  const pass = Number((out.match(/# pass (\d+)/) || [])[1] ?? (out.match(/pass (\d+)/) || [])[1] ?? 0);
  const fail = Number((out.match(/# fail (\d+)/) || [])[1] ?? (out.match(/fail (\d+)/) || [])[1] ?? 0);
  if (code === 0) {
    return result('verify', 'Verify (tests)', 'pass',
      [`Test suite green: ${pass} passing, ${fail} failing.`], { testsPass: pass, testsFail: fail });
  }
  return result('verify', 'Verify (tests)', 'fail',
    [`Test suite failed (exit ${code}): ${pass} passing, ${fail} failing.`, ...out.trim().split('\n').slice(-8)],
    { testsPass: pass, testsFail: fail });
}
