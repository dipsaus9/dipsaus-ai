# Review-mode eval runner

Drives headless `claude -p` to run the `react-architecture` skill in review mode over
every labeled fixture, K times per fixture × model, and scores the id-bearing findings
against each directory's `expected.json` (matched on **rule id + file** — the labeled
line is anchor documentation only; `alsoAcceptable` neither required nor punished).

**On-command only — every invocation makes real, billed model calls.** Never wired into
CI or `bun run test`.

## Usage

```bash
bun run test:eval                                  # full matrix, defaults
bun run test:eval --filter derived-effect --runs 1 # one-call smoke
bun run test:eval --model claude-sonnet-5 --model claude-haiku-4-5-20251001
```

(`bun run test:eval` is the package script for `bun tests/eval/runner/run.ts`; use the
full bun binary path if a shell wrapper shadows `bun`.)

Flags: `--model` (repeatable), `--runs`, `--filter` (substring of `category/dir`),
`--claude-bin` (default `~/.local/bin/claude`, or `CLAUDE_BIN`), `--out` (JSON path),
`--update-baseline` (rewrite `tests/eval/baseline/review.json` from this run — the only
way the baseline changes; commit the result via PR).
Defaults live in `config.ts` — including the rule → severity map (mirrors the skill's
Rule index) and the pinned judge model placeholder for the judge layer.

## Mechanics

- The skill's `SKILL.md` is injected via `--append-system-prompt`; fixture sources are
  inlined in the prompt. No plugin installation or tool use is involved, so runs are
  deterministic in shape and work on any machine with a `claude` binary.
- Output parsing follows the skill's review format (`- [sev] \`rule.id\` file:line — …`).
  A run whose output has no findings and no explicit clean statement counts as a
  **failed run** (hurts detection), never a crash.
- Pass verdict: high-severity rules need K/K detection, med/low ≥ 80%, and good twins
  (files labeled with empty `expected`) must produce zero findings in every run.

## Apply mode

`--mode apply` copies each bad fixture (its `expected.json` excluded, so labels never
reach the model) into a fresh `os.tmpdir()` sandbox — repo `node_modules` symlinked in,
standalone tsconfig/vitest configs generated — runs the skill in apply mode there with
edit tools (`--permission-mode acceptEdits`), then grades the refactored copy
mechanically, each sub-check reported per run:

1. **originals untouched** — the fixture directory is content-hashed before and after;
2. **caps** — AST-computed LOC / hooks / props / effects / JSX depth per component
   (counting rules documented in `ast.ts`, LOC = declaration-to-closing-brace span);
3. **banned patterns** — derived-state-in-effect (direct setter call in an effect body)
   and effect-fetch (setter + await/`.then`/`fetch` in an effect subtree) via real AST
   walks — subscription and timer effects stay clean;
4. **tsc** — strict typecheck of the sandbox;
5. **behavior tests** — the fixture's `behavior.test.tsx`, restored from a pristine copy
   first so a model that edits the test cannot grade itself green.

A failing sub-check fails the run with the failing output captured in the report. Pass
rates fold into the same results/baseline machinery as review mode under the pseudo-rule
`apply.pass` (pass bar 80%), against the separate `tests/eval/baseline/apply.json`.
Every grading entry point refuses paths outside the OS tmpdir.

### Judge layer

For fixtures whose expected findings include `comp.*` rules, a mechanical pass is
followed by an LLM judge — the composition quality an AST cannot measure. Per rule:
the rubric from `tests/eval/rubrics/<rule>.md` plus the refactored sources (and nothing
else — no run metadata, no skill-arm information; DIP-2.10 reuses this blindness) go to
the **pinned** judge model (`judgeModel` in `config.ts`), 3 votes, majority decides.
The apply verdict is mechanical checks AND judge majority; judge failures name the
rubric and majority reasoning, and every individual vote + reasoning lands in the
results JSON. Non-unanimous (2–1) verdicts surface as `judge-instability` warnings.
Changing the pinned judge id or any rubric text requires a deliberate baseline reset —
see `tests/eval/rubrics/README.md`.

## A/B mode — does the skill help at all?

`--mode ab` runs review **and** apply over the same fixtures, model list and K twice:
once with the skill loaded, once with a neutral "experienced React reviewer" system
prompt. The control arm keeps the same output-format scaffolding and the bare rule-id
vocabulary (the parser must work on both arms) but none of the skill's standards content
— what differs is the skill's substance, not its formatting. `--verbose` prints both
arm system prompts verbatim.

Judging stays arm-blind: both arms' mechanical-pass refactors are collected, shuffled
deterministically, and judged in one anonymous batch — the judge prompt (rubric + code
only) never carries arm information.

The report shows per-category × per-model detection rates, false-positive counts and
apply pass rates for both arms, plus plain-language summary lines naming where the skill
adds value or hurts. Results land in `results/ab-*.json` — stored beside, but **never
diffed against**, the regression baseline (different question, different lifecycle).

## Baseline regression diff

When `tests/eval/baseline/review.json` exists, every plain run diffs its per-rule rates
against it: a rate drop is a named regression
(`state.derived-effect on state/derived-effect/Bad.tsx @ claude-sonnet-5: 5/5 -> 3/5`)
and fails the run, as does an in-scope baseline entry the run no longer produces. New
rules/fixtures are additions, not regressions. A `--filter` run compares only entries in
its own scope; differing K is compared as a proportion but flagged. See
`tests/eval/baseline/README.md`.

## Output

Human table + verdict on the terminal; full JSON written to `results/` (git-ignored)
or `--out`. Exit code 1 on a failing verdict.

Parser and matcher have deterministic unit tests in `tests/unit/` (canned transcripts,
no model calls) — those run in CI; this runner never does.
