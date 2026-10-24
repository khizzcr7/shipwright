# Shipwright - an assisted post-code delivery agent

**GitLab Transcend Hackathon - "Life After Code" - Path A (Start Fresh) - Assisted autonomy**

Code generation is solved. What happens next is the challenge: code review,
security scanning, testing, compliance, deployment readiness, monitoring.
Shipwright automates that post-code half of the DevSecOps lifecycle with a
stage engine a human stays in charge of: analysis is automatic, every
state-changing action is proposed and waits for a person's approval.

## What it does

One command runs nine lifecycle stages against any Node project:

| Stage | Check |
| --- | --- |
| plan | Reads `ROADMAP.md`, reports milestones done vs open |
| create | Static code review: debug leftovers, unresolved markers, oversized files |
| verify | Runs the test suite and reports pass/fail counts |
| package | Builds a SHA-256 content manifest of everything that would ship |
| secure | Scans the tree for committed secrets and credential-shaped strings |
| release | Drafts release notes and proposes a version bump (approval-gated) |
| configure | Verifies every env var the code reads is documented in `.env.example` |
| monitor | Boots the service and probes its health endpoint |
| govern | Compliance: MIT license in place and declared, README setup docs, CI config, `.gitignore` hygiene |

It writes a delivery readiness report (`reports/delivery-report.md` and
`.json`) and ends with a clear READY / NOT READY verdict.

Three ways to run the same engine:

- **CLI** - `node agent/run.js` (with an interactive approval gate, or
  `--approve` / `--ci`).
- **GitLab CI** - `.gitlab-ci.yml` defines one job per lifecycle stage,
  each running the same engine, so pipeline history shows the automation
  stage by stage.
- **MCP server** - `node mcp/server.js` exposes `security_scan`,
  `code_review`, `compliance_check`, and `release_readiness` as Model
  Context Protocol tools over stdio, ready for a GitLab Duo agent or flow
  to call. See `docs/duo-integration.md`.

The repo also contains a tiny zero-dependency demo service (`src/app.js`)
that the pipeline ships and the monitor stage probes, so the whole loop is
provable end to end.

## Setup

Requirements: Node.js 20 or newer. There are no dependencies to install.

```bash
git clone <this repo>
cd shipwright
npm test               # 7 unit tests for the stage engine
node agent/run.js      # full nine-stage run with approval prompts
node agent/run.js --ci # report-only run (what CI does)
npm start              # the demo service on http://localhost:3000
node mcp/server.js     # MCP server on stdio (for Duo / MCP clients)
```

## Autonomy level: Assisted

Shipwright never mutates a project silently. The release stage drafts
release notes and a version bump as proposals; the orchestrator asks for
explicit approval per action before applying anything (and applies nothing
in CI mode). That maps to the hackathon's **Assisted** level: the agent
proposes, the human approves every step.

## Theme fit

"Life After Code" is about everything after code generation. Shipwright
touches all nine DevSecOps lifecycle stages - plan, create, verify,
package, secure, release, configure, monitor, govern - with working checks
in each, an approval-gated flow on top, and an MCP bridge into the GitLab
Duo Agent Platform.

## Honest status

Working and verified locally: the stage engine, the test suite, the CI
pipeline definition, the approval gate, and the MCP server (JSON-RPC
smoke-tested). Platform-side setup that happens on GitLab itself:
registering the Duo flow in `docs/duo-integration.md` with a Duo-enabled
project. The flow YAML there is a design draft to validate against the
current Duo documentation when enabling.

## License

MIT - see `LICENSE`. Copyright (c) 2026 Muhammad Khizar.
