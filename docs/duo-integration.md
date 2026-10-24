# How Shipwright plugs into the GitLab Duo Agent Platform

Shipwright's stage engine is deliberately usable three ways:

1. **CLI** - `node agent/run.js` (local or any CI system).
2. **GitLab CI** - `.gitlab-ci.yml` runs the same engine, one job per stage.
3. **MCP server** - `node mcp/server.js` exposes the checks as Model Context
   Protocol tools over stdio. GitLab Duo Agent Platform supports external
   MCP servers, so a Duo agent or flow can call these tools directly:
   `security_scan`, `code_review`, `compliance_check`, `release_readiness`.

## Intended Duo Flow (Assisted autonomy)

The flow below is the intended orchestration on GitLab. It is a design
draft: validate the exact YAML schema against the current GitLab Duo Agent
Platform documentation when enabling it on the GitLab project, because the
flow format is platform-versioned.

```yaml
# DRAFT - validate against current GitLab Duo flow schema before enabling.
name: shipwright-delivery-check
description: >
  On every merge request, run Shipwright's post-code checks through its MCP
  server, summarise the delivery readiness report on the MR, and wait for a
  human to approve before any release action is taken.
triggers:
  - merge_request_opened
  - merge_request_updated
steps:
  - tool: mcp.shipwright.release_readiness
    note: Runs all nine lifecycle stages and returns a summary.
  - tool: mcp.shipwright.security_scan
  - agent: summarise_findings_on_merge_request
    note: Posts the stage-by-stage report as an MR comment.
  - gate: human_approval
    note: >
      Assisted autonomy: the flow stops here. A maintainer approves before
      the release notes and version bump proposals are applied.
  - agent: apply_approved_release_actions
```

## What is real today vs platform-side

Real and verifiable in this repository: the stage engine, the CI pipeline
definition, the approval-gate CLI, and the MCP server (smoke-tested with
raw JSON-RPC). Platform-side and still to be enabled on GitLab: the Duo
flow registration, which needs the GitLab contributor onboarding and a Duo
-enabled project (see SUBMISSION.md checklist).
