---
id: DIP-2.8
title: 'Apply-mode graders: sandbox, AST checks, tsc, behavior tests'
status: Done
assignee: []
created_date: '2026-07-17 14:18'
updated_date: '2026-07-23 09:53'
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
- [x] #1 Sandbox: fixture + its behavior test copied to tmpdir; skill runs there; originals never touched (asserted)
- [x] #2 AST graders compute all five caps + banned-pattern checks using the typescript package already in devDeps; graders have CI-safe unit tests against hand-written before/after samples
- [x] #3 Grade = caps within limits AND banned patterns absent AND tsc green AND behavior tests pass on the refactored copy; each sub-check reported separately per run
- [x] #4 K=5 rates per fixture×model fold into the same results JSON and baseline diff as review mode
- [x] #5 A refactor that breaks behavior tests or types is a failed run with the failing output captured in the report
- [x] #6 Runner refuses to run apply mode against anything outside the sandbox path
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. runner/sandbox.ts: mkdtemp under os.tmpdir; copy fixture dir minus expected.json (labels must not leak to the model); symlink repo node_modules into sandbox + generate standalone tsconfig.json and vitest.config.mts there so tsc and vitest resolve react/jsdom from inside tmpdir; assertSandboxPath guard (realpath under tmpdir) used by every mutating/grading entry point (AC6); dir hashing to assert originals untouched (AC1); behavior.test.tsx restored from pristine copy after the model runs so a test-editing model cannot grade itself green. 2. runner/ast.ts (typescript compiler API): per capitalized function component — LOC = declaration-to-closing-brace span (mirrors fixture convention, documented), hooks = use-prefixed + bare use() calls in the component subtree, props = binding-pattern elements (fallback type-literal members), useEffect count, JSX max nesting; banned patterns from real AST walk: derived-state-in-effect = direct (non-nested) setter call in an effect body, effect-fetch = setter call anywhere in an effect subtree that also awaits/.then()s/fetch()es — subscription-return and timer-callback twins stay clean by construction. 3. runner/apply.ts: bad fixtures only (expected findings nonempty), K x model, fresh sandbox per run, claude -p in sandbox cwd with acceptEdits + Edit/Write/Read tools, grade = caps AND banned AND tsc AND behavior tests, sub-checks + failing output captured per run (AC3/5); rates fold into RuleScore as rule=apply.pass (file=-) so results JSON + baseline diff machinery from DIP-2.7 applies unchanged (AC4), pass bar med (>=80%) documented — judge layer (2.9) refines. 4. claude.ts gains cwd + extraArgs. 5. run.ts --mode review|apply. 6. vitest.config.ts eval project excludes **/results/** (sandboxes never picked up by test:eval) — outside References, mechanically required, noted. 7. Unit tests: ast graders on hand-written before/after samples + sandbox path guard. Billed apply smoke handed to user.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Behavior tests import the fixture by relative path — sandbox must preserve layout so tests resolve the refactored file. Nesting-depth and hooks-per-component need a real AST walk, not regex; count custom hook calls (use[A-Z]) at component scope. LOC = component body lines, mirror the skill's own definition; document the counting rules next to the grader.

Delivery-time corpus sweep (no model calls): graders run over every labeled fixture — all cap-violating Bads flagged with their exact designed values (loc=171, hooks=6/7, props=7/9, effects=3, depth=6/7), all Good twins and boundary/composition clean files silent, including the exactly-at-cap traps and the subscription/timer legitimate-effect twins. server-fetch Bad triggers both banned patterns (its setLoading(true) is itself a direct setter-in-effect) — correct for a post-refactor cleanliness grader. Sandbox resolution trick: node_modules symlink + generated standalone tsconfig/vitest.config.mts inside the tmpdir lets tsc and vitest run entirely against the sandbox. Billed apply smoke handed to user: ~/.bun/bin/bun tests/eval/runner/run.ts --mode apply --filter derived-effect --runs 1
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Apply-mode mechanical floor: runner --mode apply copies each bad fixture into an os.tmpdir sandbox (expected.json excluded so labels never reach the model; node_modules symlinked; standalone tsconfig/vitest configs generated), runs the skill headless with acceptEdits + Read/Edit/Write/Glob/Grep, restores the pristine behavior test, and grades per run: originals-untouched (dir hash), five AST-computed caps via the typescript API (counting rules documented in ast.ts), banned patterns (derived-state-in-effect, effect-fetch) via real AST walks that leave subscriptions/timers clean, sandbox tsc, and the fixture's behavior tests — each sub-check reported separately, failing output captured. K-rates fold into RuleScore as apply.pass (bar 80%, judge layer refines in DIP-2.9) against baseline/apply.json using DIP-2.7's diff unchanged; assertSandboxPath refuses anything outside tmpdir. 8 new unit tests (124 total, 11 files); eval vitest project excludes **/results/**. Corpus sweep validated graders against all 18 labeled fixtures with zero false positives.
<!-- SECTION:FINAL_SUMMARY:END -->
