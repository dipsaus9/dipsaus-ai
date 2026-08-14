---
id: DIP-11
title: >-
  Epic: backlog-* suite v3 — auto-isolation, empty-repo bootstrap, sharper
  planning
status: To Do
assignee: []
created_date: '2026-08-14 11:05'
labels:
  - epic
dependencies: []
ordinal: 67000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Optimize the backlog-* suite along four threads: isolation becomes auto-detected (no config toggle), backlog-init can bootstrap an empty repo with a purpose README + first commit/push to main, backlog-plan interviews harder and rarely spikes and materializes on its own plan branch, and the guard permits only the empty-repo bootstrap on base.

Chosen approach over alternatives: auto-detect concurrency (A') instead of a static worktree.enabled flag or a per-session prompt. Isolation is correct by detection, needs no human toggle, and makes the run-vs-deliver split concrete (deliver isolates only when the repo is busy; run always isolates).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 worktree.enabled is removed from the config schema and isolation is auto-detected across deliver, run and plan
- [ ] #2 backlog-init bootstraps an empty repo (unborn HEAD) with a purpose README plus one init commit, pushing to main only when the repo was empty
- [ ] #3 backlog-guard permits a base commit only on unborn HEAD and a base push only when the remote branch is absent, with all other base protection intact
- [ ] #4 backlog-plan runs a challenge-the-goal step, treats spikes as a justification-gated opt-out, and materializes on a plan/<epic-id> branch
- [ ] #5 README, CLAUDE.md and the three manifests reflect the v3 behaviour
<!-- AC:END -->
