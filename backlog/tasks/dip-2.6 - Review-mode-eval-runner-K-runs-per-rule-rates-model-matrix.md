---
id: DIP-2.6
title: 'Review-mode eval runner: K runs, per-rule rates, model matrix'
status: To Do
assignee: []
created_date: '2026-07-17 14:18'
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
- [ ] #1 Runner invokes the skill via headless claude CLI with the skill content loaded, per fixture×model×K; models and K configurable via flags (--model repeatable, --runs), defaults in a checked-in eval config
- [ ] #2 Findings parser consumes the DIP-2.1 output format; unparseable output counts as a failed run, never a crash
- [ ] #3 Matcher scores per rule id: detection rate on bad fixtures (line tolerance documented), false-positive rate on good twins
- [ ] #4 Pass verdict: high rules 5/5, med/low >=4/5, good twins zero findings in every run; violations listed per rule×fixture×model
- [ ] #5 Results written as JSON + human terminal report; --filter narrows to fixture/rule subsets
- [ ] #6 Not wired into CI or bun run test; runner has unit tests for parser+matcher (fed canned transcripts, no model calls) in the CI-safe unit project
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Eval config (models, K, thresholds, judge id placeholder). 2. claude CLI invocation wrapper (spawn, timeout, transcript capture). 3. Parser. 4. Matcher + scoring. 5. Report + JSON. 6. Unit tests for parser/matcher with canned outputs.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Runner core is shared by DIP-2.7-2.10 — design for extension (modes as strategies). Skill loading in headless mode: verify how -p resolves plugin skills; if plugin loading is unreliable headless, inject SKILL.md content via --append-system-prompt and record the choice in notes. Parser/matcher unit tests belong to the unit vitest project (deterministic, no network). safe-chain: spawn full binary paths. Verify: repo suite green; one real smoke run on user command with --filter seed --runs 1 before closing.
<!-- SECTION:NOTES:END -->
