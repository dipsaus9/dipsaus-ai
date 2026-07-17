---
id: DIP-2.3
title: 'SRP, caps and feature-boundary fixture pairs with labels'
status: To Do
assignee: []
created_date: '2026-07-17 14:17'
labels:
  - story
dependencies:
  - DIP-2.1
  - DIP-2.2
references:
  - tests/eval/fixtures/srp/
parent_task_id: DIP-2
ordinal: 6000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Minimal bad/good fixture pairs for every category-1 rule: the five hard caps (LOC 150, hooks 5, props 6, useEffect 2, nesting 5), mixed-concerns SRP, presentational-vs-logic split, and the four feature-boundary rules (deep imports, foreign domain logic, cross-feature state/types, hardwired child rendering). Each bad fixture isolates ONE violation and carries an expected-findings label file (rule id from DIP-2.1 + file + line) and behavior tests; each good twin is borderline-but-clean (a false-positive trap, e.g. exactly 150 LOC, exactly 6 props) and labels empty. Plus one realistic god-component fixture violating several category-1 rules at once, multi-labeled. Labels are AI-drafted; the user approves them in PR review — the PR body must state that explicitly.

Type: deliverable
Branch: DIP-2.3/srp-fixtures
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every category-1 rule has a bad fixture (single isolated violation) + good twin under tests/eval/fixtures/srp/; cap-rule twins sit exactly at the cap boundary
- [ ] #2 Each bad fixture has an expected.json label file using DIP-2.1 rule ids with file+line, and behavior tests that pass pre-refactor
- [ ] #3 One realistic multi-violation component with a multi-entry label file
- [ ] #4 All fixtures compile under the eval tsconfig and all behavior tests pass in the eval vitest project; repo lint/typecheck/test untouched and green
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Label schema: decided here, documented in tests/eval/README.md section (schema shared by DIP-2.4/2.5 — they follow, not redefine). Line labels: prefer line-of-rule-trigger with a documented +/-2 tolerance for the matcher. Fixtures must be plausible product code (naming, domain), not synthetic foo/bar — detection difficulty should resemble real code. Verify: eval vitest project green; repo suite green.
<!-- SECTION:NOTES:END -->
