// Shipwright delivery agent - orchestrator.
//
// Runs the nine post-code DevSecOps stages in GitLab's lifecycle order
// (plan, create, verify, package, secure, release, configure, monitor,
// govern), writes a delivery readiness report, and - this is the Assisted
// autonomy level - proposes every state-changing action and waits for a
// human go-ahead before applying any of them.
//
// Usage:
//   node agent/run.js                  run all stages, prompt per proposal
//   node agent/run.js --approve        run all stages, apply every proposal
//   node agent/run.js --ci             report only (CI mode), never prompt
//   node agent/run.js --stage secure   run a single stage (used by CI jobs)
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const STAGES = [
  ['plan', 'plan.js'],
  ['create', 'review.js'],
  ['verify', 'verify.js'],
  ['package', 'package.js'],
  ['secure', 'security.js'],
  ['release', 'release.js'],
  ['configure', 'configure.js'],
  ['monitor', 'monitor.js'],
  ['govern', 'govern.js'],
];

function parseArgs(argv) {
  const args = { ci: false, approve: false, stage: null };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--ci') args.ci = true;
    else if (argv[i] === '--approve') args.approve = true;
    else if (argv[i] === '--stage') args.stage = argv[++i];
  }
  return args;
}

const ICON = { pass: 'PASS', warn: 'WARN', fail: 'FAIL' };

async function main() {
  const args = parseArgs(process.argv.slice(2));
  // reportOnly is false for CLI runs: building dist/manifest.json is a
  // normal build artifact, not a state-changing proposal. The --ci flag
  // only guarantees "never prompt, never apply proposals".
  const ctx = { root, reportOnly: false };
  const selected = args.stage ? STAGES.filter(([id]) => id === args.stage) : STAGES;
  if (!selected.length) {
    process.stderr.write(`Unknown stage: ${args.stage}\n`);
    process.exit(2);
  }

  const results = [];
  const modules = new Map();
  for (const [id, file] of selected) {
    const mod = await import(new URL(`./stages/${file}`, import.meta.url));
    modules.set(id, mod);
    const res = await mod.run(ctx);
    results.push(res);
    process.stdout.write(`[${ICON[res.status]}] ${res.name} (${res.stage})\n`);
    for (const f of res.findings) process.stdout.write(`       - ${f}\n`);
    if (res.proposals) {
      for (const p of res.proposals) process.stdout.write(`       * proposed: ${p.description}\n`);
    }
  }

  // Delivery readiness report (always written for full runs).
  if (!args.stage) {
    const report = {
      generatedAt: new Date().toISOString(),
      autonomyLevel: 'Assisted',
      stages: results,
      ready: results.every((r) => r.status !== 'fail'),
    };
    mkdirSync(join(root, 'reports'), { recursive: true });
    writeFileSync(join(root, 'reports', 'delivery-report.json'), JSON.stringify(report, null, 2));
    const md = [
      '# Delivery Readiness Report',
      '',
      `Generated: ${report.generatedAt}`,
      `Autonomy level: **Assisted** (agent proposes, human approves)`,
      `Overall: **${report.ready ? 'READY' : 'NOT READY'}**`,
      '',
      ...results.flatMap((r) => [
        `## ${r.name} (${r.stage}) - ${ICON[r.status]}`,
        ...r.findings.map((f) => `- ${f}`),
        '',
      ]),
    ].join('\n');
    writeFileSync(join(root, 'reports', 'delivery-report.md'), md);
    process.stdout.write('\nReport written to reports/delivery-report.md and reports/delivery-report.json\n');
  }

  // Assisted approval gate: proposals are applied only after approval.
  const proposals = results.flatMap((r) =>
    (r.proposals || []).map((p) => ({ ...p, stageId: r.stage })));
  if (proposals.length && !args.ci) {
    let rl = null;
    for (const p of proposals) {
      let approved = args.approve;
      if (!approved && process.stdout.isTTY) {
        rl = rl || createInterface({ input: process.stdin, output: process.stdout });
        const answer = await rl.question(`\nApprove: ${p.description}? [y/N] `);
        approved = /^y(es)?$/i.test(answer.trim());
      }
      if (approved) {
        const mod = modules.get(p.stageId);
        const note = mod && mod.applyProposal ? await mod.applyProposal(ctx, p.id) : `No applier for ${p.id}`;
        process.stdout.write(`APPLIED: ${note}\n`);
      } else {
        process.stdout.write(`PENDING APPROVAL (not applied): ${p.description}\n`);
      }
    }
    if (rl) rl.close();
  }

  const failed = results.some((r) => r.status === 'fail');
  process.stdout.write(failed ? '\nOVERALL: NOT READY (a stage failed)\n' : '\nOVERALL: READY\n');
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  process.stderr.write(`shipwright agent error: ${err.stack || err.message}\n`);
  process.exit(2);
});
