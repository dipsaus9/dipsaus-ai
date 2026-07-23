# tests/eval — fixture island

Self-contained eval project for the `react-architecture` skill harness. Fixtures here
**deliberately violate** the repo's own standards, so the island is fenced off from every
CI gate:

- **Typecheck** — `tests/eval` is excluded in the root `tsconfig.json`; this directory has
  its own `tsconfig.json` (strict, `react-jsx`, DOM libs). A type error in a fixture never
  fails `bun run typecheck`.
- **Lint** — `fixtures` is in `.oxlintrc.json` `ignorePatterns`, so rule-violating fixture
  code never fails `bun run lint`.
- **Unit tests** — CI's `bun run test` runs the `unit` vitest project only and never picks
  up files under `tests/eval`.

## Running the eval suite

On-command only, never in CI:

```bash
bun run test:eval        # vitest run --project eval (jsdom)
```

If a shell wrapper shadows `bun` (exit 127), call the binary directly:
`~/.bun/bin/bun run test:eval`.

## Layout

- `fixtures/<group>/` — bad/good fixture pairs. The seed pair
  (`fixtures/seed/{Bad,Good}.tsx`) exists to prove the island compiles, renders and tests
  independently; real labeled pairs land in later stories.
- `*.test.tsx` — tests for the island itself, run under jsdom with
  `@testing-library/react`.
