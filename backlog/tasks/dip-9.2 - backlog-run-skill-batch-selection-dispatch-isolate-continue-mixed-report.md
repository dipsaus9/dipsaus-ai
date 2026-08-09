---
id: DIP-9.2
title: 'backlog-run skill: batch selection, dispatch, isolate-continue, mixed report'
status: To Do
assignee: []
created_date: '2026-08-09 15:22'
updated_date: '2026-08-09 15:22'
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
- [ ] #1 Selection: picks stories that are To Do, dependencies Done, not needs-refinement/needs-info, unclaimed (no <id>/* branch), and mutually non-colliding via backlog-workflow collisions; capped at parallelism.maxAgents
- [ ] #2 Presents the selected batch (stories, branches, why non-colliding) and dispatches only after one explicit approval; then runs autonomously to completion
- [ ] #3 Dispatches one subagent per story (isolation: worktree) running backlog-deliver, honoring the DIP-9.1 nested-subagent and push-serialization constraints
- [ ] #4 A worker failure is isolated (branch/worktree left for inspection, story left unclaimed cleanly) and the remaining workers still finish
- [ ] #5 Reports mixed per-story outcomes: delivered + PR link, or failed + reason, one row per story
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Selection step against the CLI + dep graph + branch-ref claim check. 2. Present-batch gate. 3. Worker dispatch honoring DIP-9.1 constraints. 4. Isolate-and-continue failure handling. 5. Mixed report.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
No new runtime code — orchestrates the existing backlog-workflow CLI + subagents; no unit-test obligation. Reuse the readiness/collision rules from skills/backlog-deliver/reference/parallel-delivery.md rather than restating them. Failure policy is fixed (isolate+continue), not configurable.
<!-- SECTION:NOTES:END -->
