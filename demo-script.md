# Demo video script - Shipwright (must stay under 3 minutes)

Target length: about 2 minutes 20 seconds. Record the terminal full-screen,
font large. No third-party trademarks or music (hackathon rule).

## 0:00 - 0:20 - The problem
"Code generation is solved. What happens after the code is written -
review, tests, security, compliance, release - is still manual. Shipwright
is an assisted delivery agent that automates those post-code stages, and
never changes anything without a human approving it."

## 0:20 - 1:10 - Full pipeline run
Run: `node agent/run.js`
Narrate as stages scroll: "One command runs all nine DevSecOps stages:
plan, code review, tests, packaging with content hashes, a secrets scan,
release notes, configuration checks, a live health probe, and license
compliance. Here the verdict is READY, and the agent has drafted release
notes and a version bump - but look: both are only proposals."

## 1:10 - 1:40 - The Assisted gate
Answer `y` to one proposal, `n` to the other.
"This is the Assisted level of autonomy: analysis is automatic, mutations
are proposed, and a person approves each one. Nothing ships silently."

## 1:40 - 2:05 - GitLab CI
Show `.gitlab-ci.yml`, then the GitLab pipeline page for the project.
"The same engine runs inside GitLab CI, one job per lifecycle stage, so
the pipeline history shows the automation working stage by stage."

## 2:05 - 2:25 - Duo + MCP
Show `mcp/server.js` / the tools list briefly.
"Shipwright also speaks MCP, so a GitLab Duo agent or flow can call these
same checks as tools and post the readiness summary on a merge request."

## 2:25 - 2:40 - Close
"Shipwright: life after code, handled - with a human still in charge of
the decisions that matter. MIT licensed, link below."
