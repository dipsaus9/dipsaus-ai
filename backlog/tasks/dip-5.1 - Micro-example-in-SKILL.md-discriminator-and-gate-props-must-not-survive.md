---
id: DIP-5.1
title: 'Micro-example in SKILL.md: discriminator and gate props must not survive'
status: To Do
assignee: []
created_date: '2026-08-04 11:52'
labels:
  - story
dependencies: []
references:
  - skills/react-architecture/SKILL.md
parent_task_id: DIP-5
ordinal: 33000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The composition section gains one compact before/after micro-example showing a variant/gate prop refactored away: the public API keeps no discriminator, optional parts are composed by the caller, and no renamed semantic prop gates rendering. Covers both observed failure modes in one block — variant surviving on a root/shared part, and a visibility flag renamed into a semantic gate.

Type: deliverable
Branch: DIP-5.1/composition-micro-example
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The composition section contains one before/after micro-example (a variant or showX prop on the before side; compound parts with no surviving discriminator or gate on the after side) with an explicit line that renaming the flag to a semantic prop that gates rendering is still a violation
- [ ] #2 All 20 rule ids, severities, and the output contract are byte-identical; SKILL.md grows at most 1 KB versus current main
- [ ] #3 Repo gates green
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Place the block under category 2, adjacent to the variant-compound and config-soup rules it illustrates. 2. Before: MetricCard with variant plus a showX-style flag. 3. After: MetricCard.Kpi / MetricCard.Trend, subtitle composed in by the caller. 4. One closing line: a prop that only re-skins an always-rendered element is fine; a prop that decides what renders is the antipattern under any name. 5. Byte-count check against the 1 KB cap.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Motivating data (2026-08-04 reset): variant-compound 3/5 — judges cite variant surviving on Root or a shared section part; dashboard-panel 3/5 — judges cite a density prop making Subtitle return null. Token discipline: DIP-3.3 trimmed the skill 15 percent; this is one block, not a set. The A/B showed prose alone already carries composition apply to 80 percent — this example targets the specific half-applied pattern, not general teaching.
<!-- SECTION:NOTES:END -->
