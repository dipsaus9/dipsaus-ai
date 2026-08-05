---
id: DIP-6
title: 'Epic: slots-over-config precision — rubric conditionals and anyOf labels'
status: Done
assignee: []
created_date: '2026-08-04 17:52'
updated_date: '2026-08-05 09:22'
labels:
  - epic
dependencies: []
ordinal: 35000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The DIP-5.2 re-measure left comp.slots-over-config holding every judge 2-1 verdict and the weakest rates, for two separable reasons: judges read data-driven internal conditionals (events.length choosing the empty slot) as flag-gating even though the rubric's own pass example does exactly that, and detection scoring punishes correct findings that name the genuinely-overlapping comp.regions-as-slots instead. A rubric NOT-a-violation line fixes judging; anyOf label support fixes scoring; a small filtered re-measure verifies both.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 slots-over-config rubric explicitly permits data-driven slot selection; judged 2-1 splits on it drop in the re-measure
- [x] #2 Label schema supports anyOf; slots-over-config detection scores either overlapping rule name
- [x] #3 slots-over-config and dashboard-panel baselines re-measured in both modes, approved and committed, with a README verdict
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
All three stories delivered. The rubric NOT-a-violation criterion for data-driven slot selection (DIP-6.1) plus anyOf label support for genuinely-overlapping rule names (DIP-6.2) took slots-over-config from the corpus's weakest fixture (apply 3/5, detection 2/5, all 8 judge 2-1 verdicts) to 5/5 across both modes in the DIP-6.3 re-measure, with dashboard-panel apply also recovering to 5/5. Residual: 6 judge 2-1 splits with consistently correct majorities. The composition category now measures 4/5-5/5 everywhere with honest scoring.
<!-- SECTION:FINAL_SUMMARY:END -->
