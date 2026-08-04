---
id: DIP-5
title: 'Epic: composition micro-examples — discriminators and gates must not survive'
status: Done
assignee: []
created_date: '2026-08-04 11:52'
updated_date: '2026-08-04 14:51'
labels:
  - epic
dependencies: []
ordinal: 32000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The clean A/B and the DIP-4.4 reset isolated one remaining model habit behind both sub-bar composition rates: the discriminator or gate prop survives the refactor — either verbatim (variant on Root, variant-compound 3/5) or renamed into a semantic gate (density hiding Subtitle, dashboard-panel 3/5). One compact SKILL.md micro-example teaches that the prop must die; a filtered re-measure of composition and hard, both modes, verifies whether it moved the rates.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 SKILL.md carries one compact composition micro-example showing the discriminator/gate prop removed, within the token budget
- [x] #2 Composition and hard baselines re-measured in both modes after the change, approved and committed, with a README verdict on whether the rates moved
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Both stories delivered. The 533-byte SKILL.md micro-example (DIP-5.1) moved exactly the rates it targeted: variant-compound apply 3/5 -> 5/5, dashboard-panel 3/5 -> 4/5, with zero judge splits on those rubrics in the DIP-5.2 re-measure. Follow-up surfaced, not part of this epic: comp.slots-over-config is now the weakest fixture (apply 3/5, detection 2/5, sole holder of all 8 judge 2-1 verdicts) and needs a DIP-4.3-style rubric clarification.
<!-- SECTION:FINAL_SUMMARY:END -->
