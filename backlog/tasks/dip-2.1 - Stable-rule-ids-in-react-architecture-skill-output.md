---
id: DIP-2.1
title: Stable rule ids in react-architecture skill output
status: Done
assignee: []
created_date: '2026-07-17 14:16'
updated_date: '2026-07-23 08:53'
labels:
  - story
dependencies: []
references:
  - skills/react-architecture/SKILL.md
parent_task_id: DIP-2
ordinal: 4000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Every rule in the skill gets a stable kebab id (e.g. srp.loc-cap, boundary.deep-import, comp.config-soup, state.derived-effect) and review-mode output includes the id per finding, so eval grading matches on id + file instead of fragile prose. Ids are the contract between skill and harness; renaming one later is itself a regression-relevant change.

Type: deliverable
Branch: DIP-2.1/skill-rule-ids
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Every rule in SKILL.md Standards carries a unique stable id, visible in a rules table; ids are kebab, category-prefixed (srp., boundary., comp., state.)
- [x] #2 Review-mode output format requires the rule id in each finding entry, and the format example in SKILL.md shows it
- [x] #3 Apply-mode summary format references the same ids
- [x] #4 No rule's substance (caps, severities, wording of what is checked) changes in this story — ids only; diff shows additions, not semantic edits
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add Id column to hard-caps table (srp.loc-cap, srp.hooks-cap, srp.props-cap, srp.effects-cap, srp.jsx-depth-cap). 2. Append inline id token to every bullet rule: srp.mixed-concerns, srp.presentational; boundary.deep-import/foreign-logic/internal-state/hardwired-render; comp.regions-as-slots/config-soup/variant-compound/slots-over-config; state.server-fetch/derived-effect/colocate/prop-drilling/global-discipline. 3. Add Rule index table (id, severity, one-line rule) closing the Standards section — single machine-readable contract for the eval harness. 4. Review-mode finding format + example gain the id field; apply-mode summary line references the same ids. 5. Self-review diff: additions only, no semantic edits.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verify: bun run lint/typecheck/test (doc-only change, suite must stay green). Manual: read the diff — the only allowed changes are added id tokens and format spec lines.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Every rule in skills/react-architecture/SKILL.md now carries a stable kebab, category-prefixed id (srp., boundary., comp., state.) — inline at each rule, in the hard-caps table's new Id column, and in a new Rule index table (20 ids with severity + one-line rule) that is the machine-readable contract for the eval harness. Review-mode finding format and example now require the id per finding, and the apply-mode summary references the same ids. No rule substance changed — diff is additions of id tokens, the index table, and format spec lines only.
<!-- SECTION:FINAL_SUMMARY:END -->
