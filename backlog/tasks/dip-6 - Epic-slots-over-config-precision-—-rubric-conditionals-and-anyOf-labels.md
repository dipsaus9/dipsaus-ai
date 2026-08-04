---
id: DIP-6
title: 'Epic: slots-over-config precision — rubric conditionals and anyOf labels'
status: To Do
assignee: []
created_date: '2026-08-04 17:52'
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
- [ ] #1 slots-over-config rubric explicitly permits data-driven slot selection; judged 2-1 splits on it drop in the re-measure
- [ ] #2 Label schema supports anyOf; slots-over-config detection scores either overlapping rule name
- [ ] #3 slots-over-config and dashboard-panel baselines re-measured in both modes, approved and committed, with a README verdict
<!-- AC:END -->
