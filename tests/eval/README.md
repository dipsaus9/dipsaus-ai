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

## Label schema

Each fixture directory carries an `expected.json` — the ground-truth labels the eval
harness grades against. The schema is owned here; fixture stories for other categories
follow it, never redefine it.

```json
{
  "files": {
    "Bad.tsx": {
      "expected": [{ "rule": "srp.loc-cap", "line": 41 }],
      "alsoAcceptable": ["comp.config-soup"]
    },
    "Good.tsx": { "expected": [], "alsoAcceptable": [] }
  }
}
```

- `files` — every fixture source file in the directory (tests excluded). Paths are
  relative to the directory. Listing a file with an empty `expected` means "expected
  clean": reporting any finding there is a false positive.
- `expected` — findings a correct review must produce: `rule` is a stable rule id from
  the skill's Rule index; `line` is the 1-based rule-trigger line. The matcher must
  accept a reported line within **±2** of the label.
- `alsoAcceptable` — rule ids (any line) that legitimately overlap the seeded violation
  (e.g. 7 props triggers both `srp.props-cap` and `comp.config-soup`). Reporting them is
  neither required nor punished.

Trigger-line conventions: caps label the first construct past the cap (6th hook, 3rd
`useEffect`, first element past depth 5) except LOC and props, which label the component
declaration / props signature; structural rules (`srp.mixed-concerns`,
`srp.presentational`) label the component declaration; boundary rules label the offending
import, store/context read, misplaced-logic start, or hardwired JSX element.

Labels are AI-drafted and human-approved via PR review.

## Layout

- `fixtures/<group>/` — bad/good fixture pairs. The seed pair
  (`fixtures/seed/{Bad,Good}.tsx`) exists to prove the island compiles, renders and tests
  independently. `fixtures/srp/<rule>/` holds the labeled category-1 pairs (one directory
  per rule, plus `god-component/`), each with `expected.json` labels and a
  `behavior.test.tsx`; category-2/3 pairs land in later stories.
- `*.test.tsx` — tests for the island itself, run under jsdom with
  `@testing-library/react`.
