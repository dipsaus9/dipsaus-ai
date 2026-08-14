---
id: DIP-11
title: >-
  Epic: backlog-* suite v3 — auto-isolation, empty-repo bootstrap, sharper
  planning
status: Done
assignee: []
created_date: '2026-08-14 11:05'
updated_date: '2026-08-14 13:25'
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
- [x] #1 worktree.enabled is removed from the config schema and isolation is auto-detected across deliver, run and plan
- [x] #2 backlog-init bootstraps an empty repo (unborn HEAD) with a purpose README plus one init commit, pushing to main only when the repo was empty
- [x] #3 backlog-guard permits a base commit only on unborn HEAD and a base push only when the remote branch is absent, with all other base protection intact
- [x] #4 backlog-plan runs a challenge-the-goal step, treats spikes as a justification-gated opt-out, and materializes on a plan/<epic-id> branch
- [x] #5 README, CLAUDE.md and the three manifests reflect the v3 behaviour
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Delivered the backlog-* suite v3 across seven stories. DIP-11.1 removed worktree.enabled from the config schema (auto-detected isolation). DIP-11.2 taught backlog-guard to permit only the empty-repo bootstrap on base (commit on unborn HEAD, push when the remote branch is absent), all other base protection intact. DIP-11.4 made backlog-deliver auto-detect isolation (main checkout when quiet, worktree when busy) and DIP-11.6 dropped backlog-run's worktree.enabled precondition, making the run-vs-deliver split explicit (run always isolates). DIP-11.5 gave backlog-init an empty-repo bootstrap (purpose README + one guard-permitted base commit, pushed only when the remote base is absent). DIP-11.3 sharpened backlog-plan with a challenge-the-goal step, justification-gated opt-out spikes, and plan/<epic-id> materialize. DIP-11.7 swept README, CLAUDE.md and the three manifests to the v3 behaviour.
<!-- SECTION:FINAL_SUMMARY:END -->
