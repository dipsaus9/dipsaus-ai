---
id: DIP-2.3
title: 'SRP, caps and feature-boundary fixture pairs with labels'
status: Done
assignee: []
created_date: '2026-07-17 14:17'
updated_date: '2026-07-23 09:15'
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
- [x] #1 Every category-1 rule has a bad fixture (single isolated violation) + good twin under tests/eval/fixtures/srp/; cap-rule twins sit exactly at the cap boundary
- [x] #2 Each bad fixture has an expected.json label file using DIP-2.1 rule ids with file+line, and behavior tests that pass pre-refactor
- [x] #3 One realistic multi-violation component with a multi-entry label file
- [x] #4 All fixtures compile under the eval tsconfig and all behavior tests pass in the eval vitest project; repo lint/typecheck/test untouched and green
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Label schema (owned here): per-dir expected.json { files: { '<file>': { expected: [{rule, line}], alsoAcceptable: ['<rule-id>'] } } }; empty expected = clean trap; alsoAcceptable = legitimately-overlapping findings the matcher must not punish (e.g. 7 props triggers both srp.props-cap and comp.config-soup). Line = rule-trigger line, matcher tolerance +/-2; trigger conventions per rule documented in README. 2. Dir per rule under fixtures/srp/: loc-cap, hooks-cap, props-cap, effects-cap, jsx-depth-cap, mixed-concerns, presentational, deep-import, foreign-logic, internal-state, hardwired-render, god-component; boundary dirs carry mini feature (billing/ barrel) so deep-import isolates from internal-state/hardwired-render (those import via public API). 3. Plausible commerce domain (orders/billing/profile/catalog), no foo/bar. 4. Cap twins exactly at boundary (150 LOC span, 5 hooks, 6 props, 2 effects, depth 5); every bad fixture keeps all OTHER rules clean. 5. behavior.test.tsx per dir (RTL, jsdom) asserting user-visible behavior pre-refactor. 6. God component: props+hooks+effects+depth+mixed-concerns multi-label. 7. Verify: script-check LOC spans + trigger line numbers via grep; eval suite green; repo lint/typecheck/test untouched green.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Label schema: decided here, documented in tests/eval/README.md section (schema shared by DIP-2.4/2.5 — they follow, not redefine). Line labels: prefer line-of-rule-trigger with a documented +/-2 tolerance for the matcher. Fixtures must be plausible product code (naming, domain), not synthetic foo/bar — detection difficulty should resemble real code. Verify: eval vitest project green; repo suite green.

Trigger lines grep-verified against final files. loc-cap spans awk-verified: Bad 171, Good exactly 150. God component deliberately stays under LOC cap (5 labels: props/hooks/effects/mixed-concerns/depth + alsoAcceptable comp.config-soup, srp.presentational). Boundary dirs embed a mini billing feature; internal-state/hardwired-render import via the public barrel so deep-import stays isolated. React 19 idioms used (use(Context), <Context value>).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Labeled category-1 fixture corpus under tests/eval/fixtures/srp/: one dir per rule (loc-cap, hooks-cap, props-cap, effects-cap, jsx-depth-cap, mixed-concerns, presentational, deep-import, foreign-logic, internal-state, hardwired-render) each with a single-violation Bad.tsx, a borderline-clean Good.tsx sitting exactly on the cap (150-line span, 5 hooks, 6 props, 2 effects, depth 5), an expected.json label (DIP-2.1 rule id + grep-verified trigger line) and a passing behavior test; plus a multi-labeled god-component (5 findings). Label schema (per-file expected/alsoAcceptable, ±2 line tolerance, explicit-empty = clean trap) decided here and documented in tests/eval/README.md for DIP-2.4/2.5 to follow. Eval suite 13 files/25 tests green; repo lint/typecheck/unit untouched (6 files/91 tests). Labels are AI-drafted — user approves them in PR review.
<!-- SECTION:FINAL_SUMMARY:END -->
