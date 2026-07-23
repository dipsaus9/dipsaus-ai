# Review-mode eval runner

Drives headless `claude -p` to run the `react-architecture` skill in review mode over
every labeled fixture, K times per fixture × model, and scores the id-bearing findings
against each directory's `expected.json` (rule id + file + line, ±2 tolerance,
`alsoAcceptable` neither required nor punished).

**On-command only — every invocation makes real, billed model calls.** Never wired into
CI or `bun run test`.

## Usage

```bash
~/.bun/bin/bun tests/eval/runner/run.ts                     # full matrix, defaults
~/.bun/bin/bun tests/eval/runner/run.ts --filter derived-effect --runs 1   # smoke
~/.bun/bin/bun tests/eval/runner/run.ts --model claude-sonnet-5 --model claude-haiku-4-5-20251001
```

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
