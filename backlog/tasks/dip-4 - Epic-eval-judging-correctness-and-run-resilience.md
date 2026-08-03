---
id: DIP-4
title: 'Epic: eval judging correctness and run resilience'
status: To Do
assignee: []
created_date: '2026-08-03 05:52'
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
- [ ] #1 Failed eval runs retry once automatically at end of run; manual filtered re-runs no longer needed for transient failures
- [ ] #2 parseJudgeVote records the judge's final verdict; the DIP-3.8 mismatch transcript is a regression test
- [ ] #3 comp.config-soup rubric explicitly permits style-only boolean toggles, traceable to SKILL.md rule text
- [ ] #4 Apply baseline entries for composition and hard fixtures re-measured after the judging fixes, approved and committed
<!-- AC:END -->
