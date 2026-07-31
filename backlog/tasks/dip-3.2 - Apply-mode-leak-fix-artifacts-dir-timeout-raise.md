---
id: DIP-3.2
title: 'Apply-mode leak fix, artifacts dir, timeout raise'
status: In Progress
assignee: []
created_date: '2026-07-31 08:19'
updated_date: '2026-07-31 10:18'
labels:
  - story
dependencies:
  - DIP-2.12
references:
  - tests/eval/runner/apply.ts
  - tests/eval/runner/sandbox.ts
  - tests/eval/runner/config.ts
  - tests/eval/runner/report.ts
  - tests/eval/fixtures/**/behavior.test.tsx
  - .gitignore
  - tests/unit/eval-runner-sandbox.test.ts
parent_task_id: DIP-3
ordinal: 18000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The refactoring model never sees Good.tsx: sandbox excludes it, apply prompt lists only Bad/Demo/support files, and no behavior test imports Good. Every apply run has its refactored sources preserved in a git-ignored artifacts folder for human review, each run records its duration, and the apply timeout rises to 900s with a --timeout flag.

Type: deliverable
Branch: DIP-3.2/apply-leak-timeout
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 createSandbox excludes Good.tsx (alongside expected.json); buildApplyPrompt file list never names Good.tsx
- [ ] #2 No behavior.test.tsx in any fixture imports from ./Good; island suite (bun run test:eval:fixtures) green pre-refactor
- [ ] #3 Before destroySandbox, sandbox source files are copied to tests/eval/runner/results/artifacts/<run-id>/<fixture>-run<k>/; path is git-ignored; README documents it
- [ ] #4 Every ApplyRunRecord carries durationMs; timeout default 900000ms for apply, overridable via --timeout; README cost table updated
- [ ] #5 Unit tests cover sandbox exclusion and artifact copy (tmpdir-based, deterministic); repo gates green
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Sweep fixtures for Good imports in behavior tests (known: composition/config-soup); replace with local helpers or Demo-rendered equivalents. 2. Sandbox filter + prompt file list. 3. Artifacts copy in the finally path before destroy. 4. durationMs + timeout config/flag. 5. Docs + unit tests.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Timeout evidence: 24/25 skill-arm composition A/B runs died at 480s; 900s is a bet — durationMs data from DIP-3.8 confirms or corrects it. Artifacts are per-invocation (run-id = results-file timestamp); no pruning policy yet — manual cleanup.
<!-- SECTION:NOTES:END -->
