---
id: DIP-9.2
title: 'backlog-run skill: batch selection, dispatch, isolate-continue, mixed report'
status: Done
assignee: []
created_date: '2026-08-09 15:22'
updated_date: '2026-08-11 10:48'
labels:
  - story
dependencies:
  - DIP-9.1
references:
  - skills/backlog-run/SKILL.md
parent_task_id: DIP-9
priority: high
type: feature
ordinal: 57000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The backlog-run skill (/backlog-run): read the backlog, select the N ready non-colliding stories, present the batch for one approval, dispatch N subagent-worktree workers each running backlog-deliver, isolate failures, and report mixed per-story outcomes. Honors the DIP-9.1 constraints.

Type: deliverable
Branch: DIP-9.2/backlog-run-skill
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Selection: picks stories that are To Do, dependencies Done, not needs-refinement/needs-info, unclaimed (no <id>/* branch), and mutually non-colliding via backlog-workflow collisions; capped at parallelism.maxAgents
- [x] #2 Presents the selected batch (stories, branches, why non-colliding) and dispatches only after one explicit approval; then runs autonomously to completion
- [x] #3 Dispatches one subagent per story (isolation: worktree) running backlog-deliver, honoring the DIP-9.1 nested-subagent and push-serialization constraints
- [x] #4 A worker failure is isolated (branch/worktree left for inspection, story left unclaimed cleanly) and the remaining workers still finish
- [x] #5 Reports mixed per-story outcomes: delivered + PR link, or failed + reason, one row per story
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Selection step against the CLI + dep graph + branch-ref claim check. 2. Present-batch gate. 3. Worker dispatch honoring DIP-9.1 constraints. 4. Isolate-and-continue failure handling. 5. Mixed report.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
No new runtime code — orchestrates the existing backlog-workflow CLI + subagents; no unit-test obligation. Reuse the readiness/collision rules from skills/backlog-deliver/reference/parallel-delivery.md rather than restating them. Failure policy is fixed (isolate+continue), not configurable.

Delivered as skills/backlog-run/SKILL.md (no runtime code -> no new tests; gates green). AC#3 wording note: the AC literally says 'isolation: worktree', but the DIP-9.1 spike (a dependency) REFINED that — the built-in isolation:worktree names branches worktree-agent-<id>, clashing with the <id>/<slug> contract that backlog-deliver already satisfies by creating its own .worktrees/<id>. So workers are PLAIN subagents and backlog-deliver owns the worktree; the AC's INTENT (each worker delivers in its own isolated worktree) is met, the mechanism differs from the literal wording per the approved spike. Implements: Step 1 selection (To Do, deps Done, not needs-refinement/needs-info, unclaimed via branch ref, non-colliding via backlog-workflow collisions + pairwise, capped at parallelism.maxAgents); Step 2 present-batch + one gate then autonomous; Step 3 dispatch plain subagents running backlog-deliver, push-serialization + supervised-first-run constraints; Step 4 isolate-and-continue (failed worker's worktree/branch left, story back to To Do); Step 5 mixed per-story report. Reference: skills/backlog-run/reference/orchestration.md + backlog-deliver/reference/parallel-delivery.md.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Shipped skills/backlog-run/SKILL.md, the parallel orchestrator. It selects the N ready, non-colliding, unclaimed stories (N = parallelism.maxAgents; claim = branch ref; collisions via the workflow CLI plus a pairwise batch check), presents the batch for one approval, then dispatches one plain subagent per story running backlog-deliver — each owning its own .worktrees/<id> worktree and <id>/<slug> branch per the DIP-9.1 decision (not the built-in isolation:worktree, which names branches wrong). Pushes are serialized, the first real run is supervised, a failed worker is isolated (worktree/branch left, story unclaimed) without sinking the batch, and outcomes are reported one row per story. Only DIP-9.3 (register in docs/manifests) remains to close epic DIP-9.
<!-- SECTION:FINAL_SUMMARY:END -->
