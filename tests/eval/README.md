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

## Known limitations (2026-07-24, post Demo-seam refresh)

The original API-pinning flaw is fixed: Demo-seam tests let apply refactors reshape
APIs, and the previously 0/5 fixtures now pass (`config-soup` and `props-cap` 5/5,
`god-component` 4/5). The refreshed apply baseline still carries honest sub-bar rates
with three distinct causes:

- **Timeout noise** — six runs died on the 240 s CLI timeout late in the run
  (`hooks-cap` 2/5, `internal-state` 3/5, one `god-component` miss are mostly this),
  understating those rates.
- **Genuine model/skill gaps** — `srp/effects-cap` (3/5, leaves 3 effects),
  `state/server-fetch` (3/5, once kept the antipattern, once broke behavior).
- **Judge strictness beyond the skill's text** — `variant-compound` 0/5: refactors
  remove the variant prop and build compound parts, but duplicate the shared shell,
  which the rubric fails while the skill never teaches shell extraction. Related:
  nine 2–1 judge verdicts accumulated in one run — the judge-instability signal.
  Changing rubric text (or teaching the skill shell extraction) is deliberate
  future work requiring a baseline reset.

`state.derived-effect` review detection also remains observably flaky (3/5 in the
review baseline).

## First A/B run (2026-07-25) — archived, headline contaminated

Archived at `ab/ab-2026-07-25T10-46-08-267Z.json` (both arms, K=5, claude-sonnet-5).
Per-category results:

| Category | Detection (skill / control) | False positives | Apply pass (skill / control) |
|---|---|---|---|
| composition | 94% / 100% | 9 / 8 | **0% / 60%** |
| srp | 100% / 99% | 2 / 1 | 93% / 100% |
| state | 75% / 100% | 0 / 0 | 93% / 100% |

**The headline ("skill hurts everything") is not trustworthy.** 24 of 25 skill-arm
composition apply runs died on the 480 s CLI timeout (plus one API error) and were
counted as failures — the control arm had zero errors. Skill-arm refactors are
bigger jobs (compound components), so the timeout selectively killed the skill arm.
Secondary caveats: the corpus sits at a detection ceiling (control ≈100%, fixtures
too thin to discriminate) and both arms shared the Good.tsx leak. Epic DIP-3 fixes
the harness (leak, timeout, corpus) and re-answers the question with a clean run.

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
  independently. Fixtures whose rules demand an API change additionally carry a
  **`Demo.tsx` caller seam**: the behavior test asserts only Demo's rendered output, the
  model may update Demo (product code, listed expected-clean in `expected.json`) but
  never the test — so behavior stays pinned while the component's API is free to change. `fixtures/srp/<rule>/` holds the labeled category-1 pairs (one directory
  per rule, plus `god-component/`), each with `expected.json` labels and a
  `behavior.test.tsx`; `fixtures/composition/<rule>/` holds the category-2 pairs the same
  way (plus `dashboard-panel/`, the multi-violation config-soup case);
  `fixtures/state/<rule>/` holds the category-3 pairs (plus `customer-dashboard/`, the
  multi-violation fetch + derived-state + drilling case).
- `*.test.tsx` — tests for the island itself, run under jsdom with
  `@testing-library/react`.
