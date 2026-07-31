---
id: DIP-3.2
title: 'Apply-mode leak fix, artifacts dir, timeout raise'
status: Done
assignee: []
created_date: '2026-07-31 08:19'
updated_date: '2026-07-31 10:26'
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
- [x] #1 createSandbox excludes Good.tsx (alongside expected.json); buildApplyPrompt file list never names Good.tsx
- [x] #2 No behavior.test.tsx in any fixture imports from ./Good; island suite (bun run test:eval:fixtures) green pre-refactor
- [x] #3 Before destroySandbox, sandbox source files are copied to tests/eval/runner/results/artifacts/<run-id>/<fixture>-run<k>/; path is git-ignored; README documents it
- [x] #4 Every ApplyRunRecord carries durationMs; timeout default 900000ms for apply, overridable via --timeout; README cost table updated
- [x] #5 Unit tests cover sandbox exclusion and artifact copy (tmpdir-based, deterministic); repo gates green
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Sweep fixtures for Good imports in behavior tests (known: composition/config-soup); replace with local helpers or Demo-rendered equivalents. 2. Sandbox filter + prompt file list. 3. Artifacts copy in the finally path before destroy. 4. durationMs + timeout config/flag. 5. Docs + unit tests.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Timeout evidence: 24/25 skill-arm composition A/B runs died at 480s; 900s is a bet — durationMs data from DIP-3.8 confirms or corrects it. Artifacts are per-invocation (run-id = results-file timestamp); no pruning policy yet — manual cleanup.

Sweep was 20 fixtures, not just config-soup as planned — every behavior test had a Good parity case. good.test.tsx is excluded from the sandbox by the same isSandboxExcluded rule (any *.test.* except behavior.test.tsx), so DIP-3.7 hard-tier fixtures can add island-only tests freely. Artifacts include timeout/failure runs — the partial edits are often the most informative for reviewing why a run died.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Apply mode no longer leaks the answer: createSandbox excludes Good.tsx, Good/ directories and island-only test files (isSandboxExcluded), and buildApplyPrompt filters Good twins from the file list. All 20 behavior tests that imported ./Good were split — behavior.test.tsx keeps only Bad/Demo assertions (it ships into the sandbox), the Good parity assertions moved to a sibling good.test.tsx per fixture; island suite green at 45 tests. Every ApplyRunRecord now carries durationMs; agentic runs use applyTimeoutMs (default 900s, overridable via --timeout <seconds>) while review/judge keep the 480s single-shot budget. Each run's final sandbox state is snapshotted to tests/eval/runner/results/artifacts/<mode>-<run-id>/<fixture>-<model>-run<k>/ (git-ignored) before destruction, including CLI-failure runs; A/B nests per-arm subdirectories. READMEs and unit tests updated (156 green).
<!-- SECTION:FINAL_SUMMARY:END -->
