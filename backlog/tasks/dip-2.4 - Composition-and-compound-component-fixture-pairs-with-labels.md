---
id: DIP-2.4
title: Composition and compound-component fixture pairs with labels
status: To Do
assignee: []
created_date: '2026-07-17 14:17'
labels:
  - story
dependencies:
  - DIP-2.1
  - DIP-2.2
references:
  - tests/eval/fixtures/composition/
parent_task_id: DIP-2
ordinal: 7000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Minimal bad/good pairs for category-2 rules: regions-as-config-props vs slots, config-soup that demands a compound API (boolean flags, variant maps, >6 props with shared part-state), reused-in-2+-shapes must-be-compound, and children/slots-over-render-config. Good twins are legitimately prop-driven one-offs — the exact cases the skill must NOT flag. Same label schema and behavior-test rules as DIP-2.3; user approves labels in PR review.

Type: deliverable
Branch: DIP-2.4/composition-fixtures
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every category-2 rule has a bad fixture + good twin under tests/eval/fixtures/composition/, good twins being legitimate prop-driven designs
- [ ] #2 Each bad fixture has expected.json (DIP-2.1 ids, file+line) and passing behavior tests
- [ ] #3 One realistic config-soup component (multi-violation, multi-labeled)
- [ ] #4 All fixtures compile and behavior tests pass in the eval project; repo suite untouched and green
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Follows the label schema defined by DIP-2.3 — do not fork it. Composition rules are judgment-heavy: bad fixtures must be unambiguous violations (the judge layer, not review scoring, handles grey areas later). Behavior tests for compound-refactor candidates should assert rendered output for at least 2 usage shapes so apply-mode refactors are genuinely constrained.
<!-- SECTION:NOTES:END -->
