// PLAN stage - reads ROADMAP.md and reports planned vs completed milestones.
import { join } from 'node:path';
import { readText, result } from './util.js';

export async function run(ctx) {
  const text = readText(join(ctx.root, 'ROADMAP.md'));
  if (!text) {
    return result('plan', 'Plan', 'fail', ['ROADMAP.md not found - no delivery plan to report.']);
  }
  const done = (text.match(/- \[x\]/gi) || []).length;
  const open = (text.match(/- \[ \]/g) || []).length;
  const findings = [`Roadmap present: ${done} milestone(s) done, ${open} open.`];
  if (open === 0) findings.push('No open milestones - plan a next milestone before the next release.');
  return result('plan', 'Plan', 'pass', findings, { milestonesDone: done, milestonesOpen: open });
}
