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
`--claude-bin`, `--out`, `--verbose` (A/B: print both arm prompts + both review-call
prompts), `--timeout <seconds>` (agentic apply runs; default 900 — review/judge
single-shot calls keep their own 480 s budget). Runs that fail on a timeout or CLI
error are retried once each, sequentially, after the full matrix has drained (the
matrix is the backoff — transient outage windows close before the pass starts);
a successful retry replaces the failed record and carries `retried: true` in the
results JSON, a double failure keeps both errors. `retries` in `runner/config.ts`
(0 disables). Defaults live in `runner/config.ts`.
If a shell wrapper shadows `bun` (exit 127), use the binary directly:
`~/.bun/bin/bun run test:eval`.

## Cost expectations (defaults: 25 cases, K=5, one model)

- **review**: ~225 single-shot calls per model — two calls per Good-twin fixture
  (detection: Bad+Demo; precision: Good alone) since the DIP-3.1 leak split. Hard-tier
  fixtures are multi-file, so their calls carry noticeably more tokens.
- **apply**: ~125 *agentic* runs per model (the model edits files — several × a review
  call) plus up to ~105 judge votes on composition fixtures. Each run's final sandbox
  is preserved under `runner/results/artifacts/<mode>-<run-id>/` (git-ignored) for
  human review; every `ApplyRunRecord` carries `durationMs`.
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

## Known limitations (2026-07-31, post DIP-3 baseline refresh)

First baselines on the leak-free harness (split review calls, no Good in the apply
sandbox, rule-announcing comments stripped, hard tier added; K=5, claude-sonnet-5).
The detection ceiling is gone — sub-100% rates below are real measurements, not
leak artifacts.

**Review — genuine detection gaps** (all runs completed, no infra noise):

- `state.colocate` 2/5 — weakest rule in the corpus.
- `srp.presentational` 3/5 — the model *sees* the component but labels it
  `srp.mixed-concerns` instead (mislabeling, not blindness).
- `state.prop-drilling` on `customer-dashboard` 3/5 (5/5 on the isolated fixture —
  drilling hides in multi-violation context).
- `comp.slots-over-config` 3/5 on its own fixture, 4/5 on `dashboard-panel`.
- `boundary.hardwired-render` and `srp.jsx-depth-cap` 4/5 (high-severity, so any
  miss shows as a threshold violation).
- **FP pattern**: `srp/loc-cap`'s Bad draws `srp.mixed-concerns` +
  `comp.regions-as-slots` in every run (not in `alsoAcceptable`). Good twins stayed
  clean in all runs, so the precision gate is unaffected.

**Apply — strong except composition judging** (24/25 fixtures at 4/5 or 5/5 after
the 2026-08-04 DIP-4.4 reset; all of srp and state at 5/5 except `jsx-depth-cap`
and `props-cap` at 4/5). The judged fixtures (composition + hard) were re-measured
after the DIP-4.2 final-VERDICT parse fix and the DIP-4.3 style-boolean rubric
criterion:

- `hard/support-inbox` 1/5 → **5/5** — the old rate was entirely the style-boolean
  rubric ambiguity; with the explicit NOT-a-violation criterion the compound
  refactors pass as they should. (4/5 in the DIP-5.2 re-measure — one-run variance.)
- `comp.variant-compound` 3/5 → **5/5** and `dashboard-panel` 3/5 → **4/5** after
  the DIP-5.1 SKILL.md micro-example ("the discriminator/gate prop must die, not
  get renamed") — **verdict: the micro-example moved exactly the rates it
  targeted.** Judge instability on those rubrics: zero.
- `comp.slots-over-config` is the new weak spot: apply 5/5 → **3/5**, review
  detection 3/5 → **2/5** (it was always the flakiest detection). One failure is
  a genuinely lazy refactor (`renderHeading`-style thunk props left on the API);
  the rest are borderline judge calls — all **8** 2–1 verdicts of the DIP-5.2
  re-measure sit on this one rubric (e.g. arguing an internal `events.length`
  conditional counts as gating). Next rubric-ambiguity candidate, same treatment
  as DIP-4.3 gave config-soup.

**Timeouts and the 900 s budget** — verdict: 900 s is ample, keep it. Completed
apply runs are bimodal-free: min 28 s, median 74 s, p90 126 s, max 325 s
(`god-component`); nothing landed between 325 s and the 900 s cap. The only
timeouts in the refresh were 9 *consecutive* runs during a ~30 min API outage
window (bracketed by an explicit `Connection closed mid-response` error); filtered
re-runs of those fixtures completed in 40–106 s and were merged into the baseline
per the filtered-update policy. Review calls saw the same congestion pattern
(16 timeouts at 480 s in the first pass, all clean on re-run). Since DIP-4.1 the
runner retries failed runs automatically at end of run, so a lone timeout heals
itself; a run that fails *twice* (`error` carrying a `| retry:` segment) survived
the retry spacing and is worth investigating — or re-running filtered — before
trusting its rate.

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

## The A/B answer (2026-08-03) — does the skill help?

**Yes, decisively where it claims to: the control arm cannot produce compound
refactors at all (0% composition apply), the skill arm lands them at 80%.**
Archived at `ab/ab-2026-08-03-repaired.json` (K=5, claude-sonnet-5; skill arm
reused from the DIP-3.8 baseline files via `--reuse-skill-arm`, control arm run
fresh — same corpus, same judge, judged control-only in the deferred batch).

| Category | Detection (skill / control) | False positives | Apply pass (skill / control) |
|---|---|---|---|
| composition | **91% / 77%** | 2 / 1 | **80% / 0%** |
| hard | 100% / 97% | 0 / 0 | 50% / 70% |
| srp | 95% / 88% | 71 / 60 | 97% / 97% |
| state | 88% / 93% | 1 / 3 | 100% / 97% |

Honest caveats, in the report's `repairs` field and here:

- **Repair provenance** — 12 control apply runs died on a mid-run session usage
  limit (11 in state, 1 in hard); those records were replaced from filtered
  re-runs and the report recomputed. The dramatic-looking raw "state apply
  63% → 100%" delta was that noise — healed control state apply is 97%.
- **hard apply 50% vs 70%** — driven by `support-inbox`, where the judge fails
  the skill arm's compound refactors on a style-only `compact` boolean (the
  DIP-4.3 rubric ambiguity). Re-measured after that fix lands.
- **srp false positives are high in both arms** (71 vs 60) — models pile extra
  findings onto srp Bad files regardless of the skill; the skill adds slightly
  more. Corpus-wide FP discipline is future work.
- **state detection dips with the skill** (88% vs 93%) — small but real; the
  skill's state rules cost a little recall vs a bare rule list.

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
- `anyOf` (on an `expected` entry) — the full accepted-name set when two rules
  *genuinely* describe the same seeded violation: a finding naming any listed id on
  the labeled file scores the hit. `rule` stays the canonical id (it names the
  baseline entry and resolves severity). Added in DIP-6.2 for
  `slots-over-config`, where regions-passed-as-render-config is both
  `comp.slots-over-config` and `comp.regions-as-slots` and 3 of 5 correct
  detections were scored as misses over the naming split. Use sparingly — an
  `anyOf` hides a naming distinction the skill claims to teach.

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
- `fixtures/hard/<name>/` — the **hard tier**: realistic multi-file feature folders
  (component + hooks + utils across files, 200–400 lines) with 2–4 violations buried in
  working, rule-clean code across ≥ 2 categories. Files carry real names
  (`CheckoutReview.tsx`, `InboxPanel.tsx`), not `Bad.tsx`; the Good exemplar lives in a
  `Good/` subtree (routed to the precision call and the judge exactly like `Good.tsx`).
  This is the corpus segment where detection is not at ceiling — small-tier fixtures
  isolate one rule for labeling precision, hard-tier fixtures measure discrimination.
- `*.test.tsx` — tests for the island itself, run under jsdom with
  `@testing-library/react`. Each fixture's `behavior.test.tsx` exercises only Bad/Demo
  (it ships into the apply sandbox, where the Good twin does not exist); the Good-twin
  parity assertions live in a sibling `good.test.tsx`, which — like `Good.tsx` itself
  and `expected.json` — never enters the sandbox.
