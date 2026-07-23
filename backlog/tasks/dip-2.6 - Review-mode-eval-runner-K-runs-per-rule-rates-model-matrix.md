---
id: DIP-2.6
title: 'Review-mode eval runner: K runs, per-rule rates, model matrix'
status: Done
assignee: []
created_date: '2026-07-17 14:18'
updated_date: '2026-07-23 09:38'
labels:
  - story
dependencies:
  - DIP-2.1
  - DIP-2.2
  - DIP-2.3
references:
  - tests/eval/runner/
parent_task_id: DIP-2
ordinal: 9000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TS runner under tests/eval/runner/ drives headless claude CLI (claude -p, full binary path) to run the react-architecture skill in review mode over each fixture, K=5 times per fixture×model across a configurable Claude model matrix. Parses the id-bearing findings output (DIP-2.1 format), matches against expected.json (rule id + file + line tolerance), and reports per-rule detection/false-positive rates. Pass bars: high-severity rules 5/5, med/low >=4/5, zero findings on good twins. On-command only.

Type: deliverable
Branch: DIP-2.6/review-runner
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Runner invokes the skill via headless claude CLI with the skill content loaded, per fixture×model×K; models and K configurable via flags (--model repeatable, --runs), defaults in a checked-in eval config
- [x] #2 Findings parser consumes the DIP-2.1 output format; unparseable output counts as a failed run, never a crash
- [x] #3 Matcher scores per rule id: detection rate on bad fixtures (line tolerance documented), false-positive rate on good twins
- [x] #4 Pass verdict: high rules 5/5, med/low >=4/5, good twins zero findings in every run; violations listed per rule×fixture×model
- [x] #5 Results written as JSON + human terminal report; --filter narrows to fixture/rule subsets
- [x] #6 Not wired into CI or bun run test; runner has unit tests for parser+matcher (fed canned transcripts, no model calls) in the CI-safe unit project
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Modules under tests/eval/runner/: config.ts (models, K=5, line tolerance 2, thresholds high=1.0 med/low=0.8, rule->severity map mirroring the Rule index, judgeModel placeholder, claudeBin default ~/.local/bin/claude overridable via --claude-bin/CLAUDE_BIN); types.ts; fixtures.ts (discover fixtures/*/*/expected.json dirs, --filter substring match); prompt.ts (SKILL.md injected via --append-system-prompt — headless plugin-skill resolution not relied on, recorded in notes; fixture files inlined in the user prompt, no tool use, review-format-only output with NO_FINDINGS sentinel allowed); claude.ts (spawn full binary path, timeout, capture, nonzero exit = failed run); parser.ts (finding-line regex on DIP-2.1 format; no findings-lines and no clean-statement = failed run, never crash); matcher.ts (rule+file+line-tolerance matching, alsoAcceptable neither required nor punished, FP on empty-expected files); score.ts+report.ts (per rule x fixture x model rates, verdict: high K/K, med/low >=ceil(0.8K), good twins zero FP every run; JSON to runner/results/ [dir-local .gitignore] + terminal table); run.ts (parseArgs: --model repeatable, --runs, --filter, --claude-bin, --out; exports runReview for DIP-2.7-2.10 strategy reuse). Unit tests (AC6, unit project): tests/unit/eval-runner-parser.test.ts + eval-runner-matcher.test.ts on canned transcripts, no model calls. Not wired into CI. Smoke run is billed -> handed to user post-push with exact command.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Runner core is shared by DIP-2.7-2.10 — design for extension (modes as strategies). Skill loading in headless mode: verify how -p resolves plugin skills; if plugin loading is unreliable headless, inject SKILL.md content via --append-system-prompt and record the choice in notes. Parser/matcher unit tests belong to the unit vitest project (deterministic, no network). safe-chain: spawn full binary paths. Verify: repo suite green; one real smoke run on user command with --filter seed --runs 1 before closing.

Skill loading decision: SKILL.md content is injected via --append-system-prompt instead of relying on headless plugin-skill resolution — deterministic, model-agnostic, no plugin install required on the eval machine. Fixture files are inlined in the prompt (small files, no tool round-trips). claude binary found at ~/.local/bin/claude (2.1.218), not safe-chain wrapped.

Two toolchain gotchas fixed en route: (1) TS 6 does not auto-include workspace-root @types from a subdirectory -p project and @types/node was only transitive — both tsconfigs now pin types:[bun,node] and @types/node is a direct devDep; (2) customer-dashboard behavior test was flaky because the derived-effect antipattern commits one render late — assertion made async. Smoke run is billed and therefore left to the user: ~/.bun/bin/bun tests/eval/runner/run.ts --filter derived-effect --runs 1 (fixtures/seed has no expected.json so it is not a discoverable case; any labeled fixture works as smoke).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Review-mode eval runner under tests/eval/runner/: run.ts drives headless claude -p per fixture×model×K (defaults models=[claude-sonnet-5], K=5 in config.ts alongside the rule->severity map and pinned-judge placeholder; --model repeatable, --runs, --filter, --claude-bin, --out). SKILL.md injected via --append-system-prompt with fixture sources inlined — headless plugin resolution not relied on. parser.ts consumes the DIP-2.1 finding format, treating output with neither findings nor a clean statement as a failed run; matcher.ts scores rule id + file + ±2-line matches, ignores alsoAcceptable, and verdicts high K/K, med/low >=80%, good twins zero findings every run. JSON to git-ignored results/ + terminal table; exit 1 on fail. runReview() exported for DIP-2.7-2.10 reuse. 16 deterministic parser/matcher unit tests in the CI unit project (8 files/107 total); nothing wired into CI. Billed smoke run handed to the user.
<!-- SECTION:FINAL_SUMMARY:END -->
