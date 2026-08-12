---
id: DIP-10.3
title: Deterministic deliver grader with unit tests
status: Done
assignee: []
created_date: '2026-08-12 06:52'
updated_date: '2026-08-12 07:23'
labels:
  - story
dependencies:
  - DIP-10.1
references:
  - tests/eval/runner/deliver-grade.ts
  - tests/unit/
parent_task_id: DIP-10
priority: medium
type: feature
ordinal: 62000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A grader that scores a completed headless deliver run against its fixture, deterministically: correct <id>/<slug> branch, verify green, every acceptance criterion checked off, no file changed outside declared References (modified-file vs References prefix rule), and a passing reviewer verdict. Produces a per-case scorecard.

Type: deliverable
Branch: DIP-10.3/deliver-grader
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Grader reports pass/fail per dimension: branch name, verify green, all ACs checked, scope (no modified file outside References), reviewer verdict
- [x] #2 Scope check reuses the References prefix rule (segment-based) from src/workflow/collisions.ts rather than a second definition
- [x] #3 Unit tests cover each dimension's pass and fail; bun run lint, typecheck and test are green
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Grader module reading a run result + fixture expected outcome. 2. Reuse pathsCollide/referencesCollide for the scope check. 3. Per-dimension scorecard. 4. Unit tests.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Runtime code -> unit tests required (CLAUDE.md). Import the collision helpers from src/workflow/collisions.ts; do not reimplement the prefix rule.

Delivered tests/eval/runner/deliver-grade.ts (pure) + tests/unit/deliver-grade.test.ts (9 tests). Five dimensions per Scorecard: branch (==expected <id>/<slug>), verify (green), acs (all expected checked), scope (no modifiedFile outside References), review (verdict==pass; n/a-pass when the fixture set reviewEnabled:false). Scope reuses pathsCollide from src/workflow/collisions (AC#2) — segment-prefix, so src/feature-2 is not covered by src/feature. Cross-boundary import (tests/eval/runner -> src/workflow, consumed by tests/unit) typechecks + tests green; 219 total. gradeDeliverRun takes a captured DeliverRunResult + DeliverExpected (from the fixture expected.json, DIP-10.2) and returns per-dimension pass/detail + overall pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Shipped the deterministic deliver grader: tests/eval/runner/deliver-grade.ts scores a completed headless backlog-deliver run against its fixture's expected outcome across branch name, verify-green, ACs-checked, scope (no file changed outside declared References), and reviewer verdict, returning a per-dimension scorecard plus an overall pass. The scope check reuses pathsCollide from src/workflow/collisions rather than a second prefix definition, so it matches the delivery gate exactly; review is treated as n/a when a fixture disables it. 9 unit tests cover every dimension's pass and fail (219 total green, lint + typecheck clean). Consumes the DeliverExpected shape that DIP-10.2 fixtures emit and DIP-10.5 wires in.
<!-- SECTION:FINAL_SUMMARY:END -->
