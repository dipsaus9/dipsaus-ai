---
id: DIP-10.3
title: Deterministic deliver grader with unit tests
status: To Do
assignee: []
created_date: '2026-08-12 06:52'
updated_date: '2026-08-12 06:52'
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
- [ ] #1 Grader reports pass/fail per dimension: branch name, verify green, all ACs checked, scope (no modified file outside References), reviewer verdict
- [ ] #2 Scope check reuses the References prefix rule (segment-based) from src/workflow/collisions.ts rather than a second definition
- [ ] #3 Unit tests cover each dimension's pass and fail; bun run lint, typecheck and test are green
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Grader module reading a run result + fixture expected outcome. 2. Reuse pathsCollide/referencesCollide for the scope check. 3. Per-dimension scorecard. 4. Unit tests.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Runtime code -> unit tests required (CLAUDE.md). Import the collision helpers from src/workflow/collisions.ts; do not reimplement the prefix rule.
<!-- SECTION:NOTES:END -->
