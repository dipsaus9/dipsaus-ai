---
id: DIP-4
title: 'Epic: eval judging correctness and run resilience'
status: Done
assignee: []
created_date: '2026-08-03 05:52'
updated_date: '2026-08-04 08:11'
labels:
  - epic
dependencies: []
ordinal: 27000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-ups surfaced by the DIP-3.8 baseline refresh: transient API-outage failures self-heal via an end-of-run retry pass, judge votes record their final verdict instead of a mid-deliberation draft, the comp.config-soup rubric stops failing style-only boolean toggles the skill text permits, and the apply baseline is reset for judge-affected fixtures from clean data.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Failed eval runs retry once automatically at end of run; manual filtered re-runs no longer needed for transient failures
- [x] #2 parseJudgeVote records the judge's final verdict; the DIP-3.8 mismatch transcript is a regression test
- [x] #3 comp.config-soup rubric explicitly permits style-only boolean toggles, traceable to SKILL.md rule text
- [x] #4 Apply baseline entries for composition and hard fixtures re-measured after the judging fixes, approved and committed
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
All four stories delivered: end-of-run retry pass (DIP-4.1, healed nothing less than the DIP-3.9 outage would have), judge final-VERDICT parse fix (DIP-4.2), style-boolean rubric criterion with mechanical tiebreak (DIP-4.3), and the filtered judged-fixture baseline reset (DIP-4.4). Net effect: support-inbox 1/5 -> 5/5, variant-compound 2/5 -> 3/5, judge 2-1 instability 8 -> 1. Remaining composition gaps (variant-compound 3/5, dashboard-panel 3/5) share one cause — discriminator/gate props surviving refactors — and feed the planned SKILL.md micro-example story.
<!-- SECTION:FINAL_SUMMARY:END -->
