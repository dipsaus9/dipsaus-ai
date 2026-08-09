---
id: DIP-7
title: >-
  Epic: agentic delivery workflow v2 — parallel-safe delivery, gated review,
  any-stack init
status: Done
assignee: []
created_date: '2026-08-07 10:49'
updated_date: '2026-08-09 12:21'
labels:
  - epic
dependencies: []
priority: high
ordinal: 39000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The backlog-plan / backlog-deliver pair works but assumes one agent, one repo shape, and a human-opened PR. v2 turns it into a workflow: several agents deliver different stories at once from isolated git worktrees, refused at pickup when their declared References collide; an independent reviewer gates the push against the story's own acceptance criteria; PR creation is opt-in per repo; the git contract is enforced by hooks rather than by prose alone; and a new init mode makes the suite work in a repo of any stack instead of assuming package.json.

Built as flow-init / flow-plan / flow-deliver alongside the live skills, which stay untouched and usable throughout — the epic is delivered using them. A final cutover story renames the flow-* suite over the old skills. The suite becomes plugin-only: it ships a bun CLI (bin/), guard hooks (hooks/) and a reviewer agent (agents/), none of which survive copying a single skill folder out of the repo. react-architecture keeps the standalone-copy guarantee.

Two spikes lead, because the two load-bearing mechanics are unverified: whether one agent's claim is visible to another agent's worktree, and whether a plugin hook can block the wrong git commands without blocking the right ones.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A second agent can pick up a ready story in its own worktree while another story is in flight, and is refused at the gate when the two stories' References collide
- [x] #2 Delivery is gated by an independent reviewer that sees only the diff and the story contract; PR creation is opt-in per repo and degrades to a printed compare link when gh is unavailable
- [x] #3 flow-init produces a schema-valid config and a working backlog in a repo of any supported stack, with verify commands resolved from the repo rather than assumed
- [x] #4 The git contract is enforced by shipped hooks, not only by skill prose, and those hooks are inert in repos with no workflow config
- [x] #5 The suite is cut over to backlog-init / backlog-plan / backlog-deliver with the old skills removed, and CLAUDE.md, README and all three manifests updated to match
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Delivered the agentic delivery workflow v2 across 11 stories. Two spikes fixed the load-bearing mechanics (claim = branch ref not task status; guard hooks can gate git without blocking legitimate commits). The workflow CLI (bin/backlog-workflow.ts) makes config validation, References-collision and verify-detection deterministic. backlog-deliver picks up each story in an isolated git worktree behind a claim-aware, collision-checked readiness gate, gates the push on an independent story-reviewer subagent, and opens or prints a PR per pr.mode. backlog-plan gained amend mode and cross-epic collision refusal. backlog-init bootstraps any-stack repos. Guard hooks enforce the git contract (fail-open, no-op without config). The cutover renamed flow-* over the v1 skills, relaxed the PR ban and scoped the self-contained guarantee in CLAUDE.md (user-approved), and updated README + manifests. Follow-ups (orchestrator, eval harness, CI review) tracked in DIP-8.
<!-- SECTION:FINAL_SUMMARY:END -->
