# tests/eval — the react-architecture eval harness

Everything needed to answer two questions about the `react-architecture` skill: *does it
still work after an edit* (regression baseline) and *does it help at all* (A/B). The
fixture corpus here **deliberately violates** the repo's own standards, so the island is
fenced off from every CI gate:

- **Typecheck** — `tests/eval` is excluded in the root `tsconfig.json`; this directory has
  its own `tsconfig.json` (strict, `react-jsx`, DOM libs). A type error in a fixture never
  fails `bun run typecheck`.
- **Lint** — `fixtures` is in `.oxlintrc.json` `ignorePatterns`, so rule-violating fixture
  code never fails `bun run lint`.
- **Unit tests** — CI's `bun run test` runs the `unit` vitest project only and never picks
  up files under `tests/eval`. (The runner's parser/matcher/judge/AB logic **is**
  unit-tested — deterministically, in `tests/unit/eval-runner-*.test.ts`.)

## Commands

| Command | What | Cost |
|---|---|---|
| `bun run test:eval` | review-mode eval, full matrix, diffs vs baseline | **billed** |
| `bun run test:eval --mode apply` | apply-mode eval (sandbox + graders + judge) | **billed**, agentic |
| `bun run test:eval --mode ab` | skill-on vs skill-off delta report | **billed**, ~2× |
| `bun run test:eval --update-baseline` | rewrite the committed baseline from this run | **billed** |
| `bun run test:eval:fixtures` | the island's own vitest suite (fixture behavior tests) | free, deterministic |

Flags: `--model` (repeatable), `--runs` (K), `--filter <substring of category/dir>`,
`--claude-bin`, `--out`, `--verbose` (A/B: print both arm prompts). Defaults live in
`runner/config.ts`. If a shell wrapper shadows `bun` (exit 127), use the binary directly:
`~/.bun/bin/bun run test:eval`.

## Cost expectations (defaults: 23 cases, K=5, one model)

- **review**: ~115 single-shot calls per model.
- **apply**: ~115 *agentic* runs per model (the model edits files — several × a review
  call) plus up to ~105 judge votes on composition fixtures.
- **ab**: everything above, twice.

Scale down first: `--filter derived-effect --runs 1` is a one-call smoke.

## Policies

- **Thresholds** (`runner/config.ts`): high-severity rules K/K, med/low ≥ 80%,
  `apply.pass` ≥ 80%, good twins zero findings in every run.
- **Baseline** — `baseline/review.json` + `baseline/apply.json` change **only** via
  `--update-baseline`, reviewed in a PR; filtered updates merge over the file. Any rate
  drop in a plain run is a named regression and fails the run. See `baseline/README.md`.
- **Judge pin** — the judge model is pinned by exact id (`judgeModel`); changing it or any
  rubric text under `rubrics/` requires a deliberate baseline reset in the same PR. See
  `rubrics/README.md`.
- **A/B results** are stored in `runner/results/` beside the baselines but never diffed
  against them.

## Known limitation (2026-07-24)

The apply baseline carries honest 0/5 rates on the composition fixtures, `srp/props-cap`
and `srp/god-component`: their behavior tests pin the **old prop API** that those very
rules require changing, so the refactor task is contradictory as posed — the model
keeps the legacy API (or wraps it) and the judge/caps grader rightly fails it.
`srp/jsx-depth-cap` (2/5) and `srp/loc-cap` (3/5) are genuine model findings, and
`state.derived-effect` review detection is observably flaky (3/5 in the baseline run).
Follow-up work: redesign behavior tests for API-changing fixtures to assert behavior
through a refactor-stable surface, then refresh the apply baseline.

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
  the skill's Rule index; `line` is the 1-based rule-trigger line, kept as **anchor
  documentation** for humans reviewing labels. The matcher scores on **rule + file
  only** — the first real eval run showed models find the right rule on the right file
  near-perfectly but anchor lines inconsistently (the props interface vs the signature,
  the first hook vs the over-cap hook), so no line window is stable across models.
- `alsoAcceptable` — rule ids (any line) that legitimately overlap the seeded violation
  (e.g. 7 props triggers both `srp.props-cap` and `comp.config-soup`). Reporting them is
  neither required nor punished.

Trigger-line conventions: caps label the first construct past the cap (6th hook, 3rd
`useEffect`, first element past depth 5) except LOC and props, which label the component
declaration / props signature; structural rules (`srp.mixed-concerns`,
`srp.presentational`) label the component declaration; boundary rules label the offending
import, store/context read, misplaced-logic start, or hardwired JSX element. Category-2
(`comp.*`) rules are structural and always label the component declaration. Category-3
(`state.*`) rules label the offending hook line (the fetching or deriving `useEffect`,
the misplaced `useState`, the global-store read) — except `state.prop-drilling`, which
labels the outermost silent intermediate's declaration, where the drilling starts.

Labels are AI-drafted and human-approved via PR review.

## Layout

- `fixtures/<group>/` — bad/good fixture pairs. The seed pair
  (`fixtures/seed/{Bad,Good}.tsx`) exists to prove the island compiles, renders and tests
  independently. `fixtures/srp/<rule>/` holds the labeled category-1 pairs (one directory
  per rule, plus `god-component/`), each with `expected.json` labels and a
  `behavior.test.tsx`; `fixtures/composition/<rule>/` holds the category-2 pairs the same
  way (plus `dashboard-panel/`, the multi-violation config-soup case);
  `fixtures/state/<rule>/` holds the category-3 pairs (plus `customer-dashboard/`, the
  multi-violation fetch + derived-state + drilling case).
- `*.test.tsx` — tests for the island itself, run under jsdom with
  `@testing-library/react`.
