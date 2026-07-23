---
id: DIP-2.2
title: 'Fixture island: isolated eval project with react + testing-library'
status: Done
assignee: []
created_date: '2026-07-17 14:17'
updated_date: '2026-07-23 09:02'
labels:
  - story
dependencies: []
references:
  - tests/eval/
  - package.json
  - vitest.config.ts
  - tsconfig.json
parent_task_id: DIP-2
ordinal: 5000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
tests/eval/ becomes a self-contained island: own tsconfig (react-jsx, strict), own vitest project 'eval' with jsdom, devDeps react/@types/react/@testing-library/react/jsdom — fully excluded from CI's unit run, repo typecheck and repo lint, because fixtures deliberately violate the repo's own standards. A seed bad/good fixture pair with a passing render test proves the island compiles, renders and tests independently.

Type: deliverable
Branch: DIP-2.2/fixture-island
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 devDeps added: react, react-dom, @types/react, @types/react-dom, @testing-library/react, jsdom; bun install clean
- [x] #2 tests/eval/ has its own tsconfig; repo bun run typecheck ignores tests/eval and stays green; a type error inside a fixture does NOT fail repo typecheck (proven by temporary breakage during delivery)
- [x] #3 vitest gains an 'eval' project (jsdom) covering tests/eval; bun run test (unit project) does not pick up eval tests — proven by test file counts
- [x] #4 oxlint ignores tests/eval/fixtures; bun run lint green with a deliberately rule-violating fixture present
- [x] #5 Seed pair fixtures/seed/{Bad,Good}.tsx + a render test pass under an on-command eval-project vitest invocation documented in tests/eval/README.md
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. bun add -d react react-dom @types/react @types/react-dom @testing-library/react jsdom. 2. tests/eval/tsconfig.json: standalone, react-jsx, strict, DOM libs, includes ts+tsx. 3. Root tsconfig exclude += tests/eval (root include is **/*.ts so tsx was already invisible; exclusion makes island explicit and covers stray .ts). 4. vitest.config.ts: add eval project (jsdom, tests/eval/**/*.test.{ts,tsx}); unit project untouched. 5. oxlint: existing 'fixtures' ignorePattern already matches tests/eval/fixtures (gitignore semantics) — prove with violating fixture, add explicit pattern only if red. 6. Seed fixtures/seed/Bad.tsx (state.derived-effect violation) + Good.tsx (clean twin) + seed.test.tsx render test via RTL. 7. package.json test:eval script (skipped by CI/verify by name); tests/eval/README.md island contract. 8. Prove AC2/AC3: temporary type error in fixture -> repo typecheck green; test-file counts unit vs eval.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Careful: vitest 'projects' already in use — add project, do not disturb unit. Repo typecheck exclusion via tsconfig exclude. Verify beyond baseline: run unit + eval suites separately, show eval tests absent from bun run test output. safe-chain broken on this machine — use full binary paths in any docs/scripts (~/.bun/bin/bun).

Proofs: temporary type error in Bad.tsx -> repo typecheck green, island tsc -p tests/eval exit 2. Unit run 6 files/91 tests (eval absent); eval run 1 file/2 tests. Lint green with state.derived-effect-violating Bad.tsx present (existing 'fixtures' ignorePattern covers tests/eval/fixtures — gitignore semantics, no oxlint change needed). Gotcha: RTL auto-cleanup needs global afterEach — eval vitest project sets globals: true, else rendered DOM leaks across tests.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
tests/eval is now a self-contained fixture island: devDeps react/react-dom/@types/react/@types/react-dom/@testing-library/react/jsdom; own strict react-jsx tsconfig (repo typecheck excludes tests/eval — proven by a temporary fixture type error that left repo tsc green while tsc -p tests/eval failed); vitest 'eval' project with jsdom + globals (RTL auto-cleanup) run on command via bun run test:eval, invisible to CI's unit run (6 files/91 tests unchanged vs 1 file/2 tests eval); oxlint's existing 'fixtures' ignorePattern already covers tests/eval/fixtures so lint stays green with a rule-violating fixture. Seed pair fixtures/seed/{Bad,Good}.tsx (state.derived-effect violation vs clean twin) renders under a passing RTL test; tests/eval/README.md documents the island contract and invocation.
<!-- SECTION:FINAL_SUMMARY:END -->
