---
id: DIP-2.2
title: 'Fixture island: isolated eval project with react + testing-library'
status: To Do
assignee: []
created_date: '2026-07-17 14:17'
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
- [ ] #1 devDeps added: react, react-dom, @types/react, @types/react-dom, @testing-library/react, jsdom; bun install clean
- [ ] #2 tests/eval/ has its own tsconfig; repo bun run typecheck ignores tests/eval and stays green; a type error inside a fixture does NOT fail repo typecheck (proven by temporary breakage during delivery)
- [ ] #3 vitest gains an 'eval' project (jsdom) covering tests/eval; bun run test (unit project) does not pick up eval tests — proven by test file counts
- [ ] #4 oxlint ignores tests/eval/fixtures; bun run lint green with a deliberately rule-violating fixture present
- [ ] #5 Seed pair fixtures/seed/{Bad,Good}.tsx + a render test pass under an on-command eval-project vitest invocation documented in tests/eval/README.md
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Deps. 2. tests/eval/tsconfig.json. 3. vitest project split (unit include unchanged; eval project with jsdom + its tsconfig). 4. Lint/typecheck exclusions. 5. Seed pair + render test. 6. tests/eval/README.md stub documenting the island contract.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Careful: vitest 'projects' already in use — add project, do not disturb unit. Repo typecheck exclusion via tsconfig exclude. Verify beyond baseline: run unit + eval suites separately, show eval tests absent from bun run test output. safe-chain broken on this machine — use full binary paths in any docs/scripts (~/.bun/bin/bun).
<!-- SECTION:NOTES:END -->
