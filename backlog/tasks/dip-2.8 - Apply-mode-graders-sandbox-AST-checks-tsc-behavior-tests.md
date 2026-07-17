---
id: DIP-2.8
title: 'Apply-mode graders: sandbox, AST checks, tsc, behavior tests'
status: To Do
assignee: []
created_date: '2026-07-17 14:18'
labels:
  - story
dependencies:
  - DIP-2.6
references:
  - tests/eval/runner/
parent_task_id: DIP-2
ordinal: 11000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Apply-mode eval: copy a bad fixture into a tmpdir sandbox, run the skill in apply mode via headless claude CLI, then grade the refactored copy mechanically: AST-computed caps (LOC, hooks, props, useEffect count, JSX nesting) via the typescript compiler API, banned patterns absent (useEffect-fetch, derived-state-in-effect), eval tsconfig tsc green, and the fixture's behavior tests still passing against the refactored code. K runs and rates like review mode. Judge verdict arrives in DIP-2.9 — this story is the mechanical floor.

Type: deliverable
Branch: DIP-2.8/apply-graders
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Sandbox: fixture + its behavior test copied to tmpdir; skill runs there; originals never touched (asserted)
- [ ] #2 AST graders compute all five caps + banned-pattern checks using the typescript package already in devDeps; graders have CI-safe unit tests against hand-written before/after samples
- [ ] #3 Grade = caps within limits AND banned patterns absent AND tsc green AND behavior tests pass on the refactored copy; each sub-check reported separately per run
- [ ] #4 K=5 rates per fixture×model fold into the same results JSON and baseline diff as review mode
- [ ] #5 A refactor that breaks behavior tests or types is a failed run with the failing output captured in the report
- [ ] #6 Runner refuses to run apply mode against anything outside the sandbox path
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Sandbox lifecycle. 2. AST grader module + unit tests. 3. Behavior-test execution against sandbox (vitest run pointed at tmpdir). 4. Wire into runner strategies + results/baseline.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Behavior tests import the fixture by relative path — sandbox must preserve layout so tests resolve the refactored file. Nesting-depth and hooks-per-component need a real AST walk, not regex; count custom hook calls (use[A-Z]) at component scope. LOC = component body lines, mirror the skill's own definition; document the counting rules next to the grader.
<!-- SECTION:NOTES:END -->
