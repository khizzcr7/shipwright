# SUBMISSION - GitLab Transcend Hackathon "Life After Code" (Devpost)

Deadline: **Tue 27 Oct 2026, 18:00 PKT** (1:00 PM UTC).
Event: https://gitlab-transcend.devpost.com/ - $45,000 prize pool.
Entrant: Muhammad Khizar, solo, Devpost account khizar-akram-ka (already
registered for this hackathon on 14 Oct 2026).
Project: **Shipwright** - Path A (Start Fresh), autonomy level **Assisted**.
All project work is new, created 24 Oct 2026 for this hackathon.

## Verified hackathon requirements (from the official Devpost page, fetched 24 Oct 2026)

- Every project must use GitLab Duo Agent Platform features (agents,
  flows, or MCP clients).
- Submit: (1) the project, (2) a text description, (3) a PUBLIC GitLab
  project with all source code and run instructions, with an MIT License
  file visible at the top of the repo page in the About section, and
  visible CI/CD pipeline history, (4) a demo video under 3 minutes on
  YouTube, publicly visible, showing the automation running.
- Path A only: project must be new work created for this hackathon.
  Deployment optional (Google Cloud deployment = up to 0.2 bonus points;
  NOT claimed here).
- Judging: Technological Implementation, Design, Potential Impact,
  Innovation/Idea, Presentation.

## Draft Devpost description (paste into the submission form)

**Shipwright - the assisted delivery agent for life after code**

Code generation is solved. What happens next - review, testing, security
scanning, compliance, packaging, release, monitoring - is still a pile of
manual chores. Shipwright automates that post-code half of the DevSecOps
lifecycle, at the Assisted level of autonomy: the agent analyses
everything and proposes actions, and a human approves every change before
it happens.

One command runs nine real checks mapped to GitLab's nine lifecycle
stages: roadmap planning, static code review, the test suite, a SHA-256
package manifest, a committed-secrets scan, drafted release notes with a
proposed version bump, environment-configuration documentation checks, a
live health probe of the service, and license/CI compliance. It ends in a
delivery readiness report with a READY or NOT READY verdict, and - the
Assisted part - release mutations are applied only after explicit
per-action approval.

The same engine runs three ways: as a CLI, inside GitLab CI (this
repository's pipeline has one job per lifecycle stage, all running the
shipped engine), and as an MCP server exposing the checks as tools
(security_scan, code_review, compliance_check, release_readiness) that a
GitLab Duo agent or flow can call on a merge request and summarise for a
human approver.

Built with zero dependencies on Node's standard library, MIT licensed,
with a unit-tested stage engine and a demo service included so the full
loop - code written, then everything after code - runs end to end.

## Parent checklist - browser/platform steps (in order)

1. **TODAY - GitLab onboarding (time-critical):** Start the GitLab
   Transcend contributor onboarding at contributors.gitlab.com (linked
   from the hackathon page as "Start GitLab Transcend Hackathon
   contributor onboarding"). The page says approval takes about 24 hours,
   and the deadline is Tue 27 Oct 18:00 PKT - start this first.
2. **Create the GitLab project:** public project named `shipwright` on
   gitlab.com under Khizar's account. Push the staged upload copy
   (`~/workspace/small-cash/upload-staging/gitlab-transcend/`) to it -
   git push if a credential route exists, otherwise the web upload route
   used for the other repos. The MIT LICENSE is at the repo root so it
   shows in the About section.
3. **Confirm the pipeline runs:** after the push, open the project's CI/CD
   pipelines page and confirm the 10 jobs (one per stage plus the
   delivery_report job) run and pass - the submission requires visible
   pipeline history.
4. **Duo enablement (required-technology evidence):** on the GitLab
   project, connect the MCP server / register the Duo flow following
   `docs/duo-integration.md`, validating the flow YAML against the
   current Duo docs. If Duo access is not approved in time, the MCP
   server and its smoke-test evidence in this repo are the integration
   artefacts - say so plainly in the submission text rather than
   claiming a live Duo run that did not happen.
5. **Demo video:** record with `demo-script.md` (about 2:30, hard cap
   3:00), upload to YouTube as public, no third-party trademarks or
   copyrighted music.
6. **GitHub mirror (Khizar's standing rule):** create public repo
   `khizzcr7/shipwright` and web-upload the same staged copy.
7. **Submit on Devpost** before Tue 27 Oct 18:00 PKT: Path A, Assisted,
   paste the description above, add the GitLab project URL, the YouTube
   video URL, and the GitHub mirror URL. Do NOT claim the Google Cloud
   bonus (not deployed there) or the environmental prize (not opted in).

## Local verification log (24 Oct 2026)

- `npm test` - 7/7 unit tests pass.
- `node agent/run.js --ci` - all nine stages run, verdict READY, report
  written to reports/.
- MCP server smoke test - initialize, tools/list (4 tools), tools/call
  security_scan all answered correctly over stdio JSON-RPC.
- Built fresh on 24 Oct 2026; no code copied from Khizar's other
  hackathon projects (zero-dependency, Node standard library only).
