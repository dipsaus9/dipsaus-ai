---
id: DIP-3.9
title: 'One-time A/B answer, control arm only (billed)'
status: Done
assignee: []
created_date: '2026-07-31 08:21'
updated_date: '2026-08-03 11:18'
labels:
  - story
dependencies:
  - DIP-3.8
  - DIP-4.1
references:
  - tests/eval/runner/ab.ts
  - tests/eval/runner/run.ts
  - tests/eval/ab/
  - tests/eval/README.md
  - tests/unit/eval-runner-ab.test.ts
parent_task_id: DIP-3
ordinal: 25000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
--mode ab gains --reuse-skill-arm <results-file>: the skill arm is read from the DIP-3.8 archived run, only the control arm executes (about half cost). The resulting report is archived under tests/eval/ab/, README gets the per-category summary, and the epic closes with the headline answer to does-the-skill-help.

Type: deliverable
Branch: DIP-3.9/ab-rerun-answer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 --reuse-skill-arm loads a prior full run (review, apply and judge data) as the skill arm; validation rejects files from a mismatched corpus/config; unit-tested
- [x] #2 Control-arm run executed on the user explicit command; deltas computed per category; report JSON committed under tests/eval/ab/
- [x] #3 README per-category A/B summary added; epic DIP-3 final summary quotes the headline answer
- [x] #4 Repo gates green; epic closed on delivery of this story
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. loadReusedSkillArm in ab.ts: repeatable --reuse-skill-arm files, classify review/apply by key, merge records last-wins by fixture|model|run, reject config/coverage mismatch and surviving failed records, warn past 14 days, rebuild reports via aggregate/applyReport. 2. runAb reuseSkillArm option skips skill-arm execution; deferred judge batch becomes control-only automatically. 3. CLI flag in run.ts main. 4. Unit tests. 5. Billed control run on user go with the DIP-3.8 file set. 6. Archive report under tests/eval/ab/, README per-category summary, close epic DIP-3.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Reuse is legitimate here because arms share harness, corpus, skill text and config within one epic window; the flag warns when the reused file is older than N days. Deferred-judge path must judge control-arm comp refactors with the same exemplar prompt (DIP-3.4).

Scope amended at pickup: run.ts added to References (CLI flag parsing lives there; plan omitted it). No collision — no other open story references run.ts.

Run health: control arm hit a session usage limit mid-run — 12 apply runs died (11 state, 1 hard); DIP-4.1 retry pass fired but retried into the same limit window (double failures recorded correctly with both errors). Healed via 5 filtered --mode ab --filter re-runs with the reused skill arm; control review data was unaffected (0 failed review calls). Report recomputed from merged records via applyReport/computeAbReport; provenance in the archived report's repairs field. Also observed: one control run errored with the user's caveman-hook text in its output — user-level Claude settings/hooks leak into the spawned eval CLIs (affects both arms equally; candidate follow-up story: isolate eval CLI from user config). Judge 2-1 instability in the deferred control batch: reported 0 warnings in the control apply report.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
--reuse-skill-arm shipped (repeatable flag, last-wins record merge, local report recomputation, config/coverage/failure validation, 14-day age warning, 6 unit tests). Control arm executed on user command against the reused DIP-3.8 skill arm; 12 session-limit casualties healed via filtered re-runs; clean report archived at tests/eval/ab/ab-2026-08-03-repaired.json. Headline: the skill turns composition apply from 0% (control cannot produce compound refactors) to 80%, lifts composition detection 77->91% and srp 88->95%; costs are srp FPs 71 vs 60, a state detection dip 93->88%, and hard apply 50% vs 70% pending the DIP-4.3 rubric fix. README carries the per-category table. Epic DIP-3 closes with this story.
<!-- SECTION:FINAL_SUMMARY:END -->
