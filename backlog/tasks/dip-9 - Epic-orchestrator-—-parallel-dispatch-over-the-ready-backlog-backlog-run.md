---
id: DIP-9
title: 'Epic: orchestrator — parallel dispatch over the ready backlog (backlog-run)'
status: Done
assignee: []
created_date: '2026-08-09 15:22'
updated_date: '2026-08-11 11:03'
labels:
  - epic
dependencies: []
priority: high
ordinal: 55000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The orchestrator deferred from DIP-7 (recorded as DIP-8.1): a new suite skill, backlog-run, that turns single-story delivery into parallel dispatch. It reads the backlog, picks the N ready non-colliding stories (N = parallelism.maxAgents), presents the batch for one approval, then spawns N subagent workers — each isolation: worktree running backlog-deliver on one story — and reports mixed per-story outcomes. This is the "full agentic mode" from the original brief.

Decisions (grilled 2026-08-09): worker = subagent isolation:worktree running backlog-deliver; orchestrator = new skill backlog-run; dispatch = present-batch-then-autonomous; N = parallelism.maxAgents; failure = isolate-and-continue, report mixed. Mechanics from DIP-7.1/7.2 are reused (claim = branch ref, worktree per story, collisions via the CLI).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 backlog-run selects the N ready, non-colliding stories (N = parallelism.maxAgents) and never double-claims or dispatches a colliding pair
- [x] #2 It presents the batch for one approval, then dispatches N subagent-worktree workers autonomously and reports mixed per-story outcomes with PR links
- [x] #3 A failed worker is isolated (branch/worktree left, cleanly unclaimed) without sinking the batch
- [x] #4 backlog-run is registered in the suite (README, CLAUDE.md, manifests) and the N-worker subagent-worktree model is proven safe before the skill relies on it
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Delivered the parallel orchestrator across 3 stories. DIP-9.1 (spike) proved the subagent-worker model — nested subagents work (a worker can spawn the story-reviewer) and N concurrent worktree workers commit safely to distinct branches — and refined it: workers are plain subagents so backlog-deliver owns the <id>/<slug> worktree (the built-in isolation:worktree names branches wrong). DIP-9.2 shipped skills/backlog-run/SKILL.md: select the N ready non-colliding unclaimed stories (N = parallelism.maxAgents), present the batch for one approval, dispatch one backlog-deliver worker per story, serialize pushes, isolate failures, report mixed outcomes. DIP-9.3 registered it in README, CLAUDE.md and the three manifests. The suite is now four skills (init/plan/deliver/run). Constraint carried forward: the first real backlog-run is a supervised trial, since no two independent ready stories existed to exercise a full concurrent real run in the spike.
<!-- SECTION:FINAL_SUMMARY:END -->
