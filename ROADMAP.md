# Shipwright Roadmap

The plan stage of the delivery agent reads this file to report what is
planned, in progress, and done.

## Milestones

- [x] Stage engine: nine DevSecOps stage checks behind one orchestrator
- [x] Assisted approval gates for version bump, release notes, and tagging
- [x] MCP server exposing stage checks as tools for GitLab Duo agents
- [x] GitLab CI pipeline with one job per lifecycle stage
- [ ] Duo Flow definition validated on GitLab and enabled for the project
- [ ] Historical pipeline trend report (monitor stage, multi-run)
- [ ] Slack/issue summary posted automatically after each pipeline

## Delivery intent

Ship small, verify everything, and keep a human approving every action that
changes state. Analysis is automatic; mutations are proposed, never silent.
