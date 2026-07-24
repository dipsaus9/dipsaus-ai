---
id: DIP-2.11
title: 'Eval wiring, docs and first approved baseline'
status: Done
assignee: []
created_date: '2026-07-17 14:23'
updated_date: '2026-07-24 07:20'
labels:
  - story
dependencies:
  - DIP-2.3
  - DIP-2.4
  - DIP-2.5
  - DIP-2.7
  - DIP-2.8
  - DIP-2.9
  - DIP-2.10
references:
  - package.json
  - README.md
  - tests/eval/
parent_task_id: DIP-2
ordinal: 14000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The harness becomes a product: package.json gains test:eval (excluded from CI and from deliver-verify by its name), tests/eval/README.md documents the full workflow (island contract, label schema, commands, flags, cost expectations, baseline update policy, judge pin policy), the repo README points to it, and the first real baseline is generated with the user present and committed after their approval. Closes the epic.

Type: deliverable
Branch: DIP-2.11/eval-docs-baseline
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 package.json test:eval runs the runner; bun run test / CI provably unaffected; deliver-skill verify skips it by name convention
- [x] #2 tests/eval/README.md documents workflow end to end: commands, flags, label schema, thresholds, baseline policy, judge pin policy, expected cost per full run
- [x] #3 First full review+apply baseline generated on the user's command, approved by the user, committed via --update-baseline; regressions demonstrably detectable (a deliberate temporary skill edit flips a named regression, then reverted)
- [x] #4 Repo README + manifest descriptions updated where the repo surface changed (CLAUDE.md rule: package.json/plugin.json/marketplace.json drift)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. package.json: test:eval -> bun tests/eval/runner/run.ts (the runner; skipped by deliver-verify by name, absent from CI); island vitest suite becomes test:eval:fixtures (extra script names are never auto-run by verify). 2. tests/eval/README.md becomes the end-to-end workflow doc: mode/flag command table, thresholds (high K/K, med-low 80%, apply.pass 80%), baseline update policy (only --update-baseline via PR; filtered updates merge), judge pin policy (exact id + rubric text changes = baseline reset), cost expectations (~23 cases x K=5: ~115 review calls/model, ~115 agentic apply runs/model + up to ~105 judge votes; ab doubles it). 3. Repo README: Development section gains the eval harness; no plugin-surface change so plugin.json/marketplace.json/package.json descriptions stay (AC4 = 'where changed'). 4. Commit wiring+docs, then STOP (constraint 5): user runs review + apply --update-baseline with me watching, approves, I commit the baselines. 5. Falsifiability: temporary SKILL.md edit (drop one rule), filtered billed rerun must print the named regression, revert, rerun clean. 6. Close epic DIP-2 on this branch (all 11 stories + epic ACs), push, report. CLAUDE.md Architecture addendum flagged as follow-up (outside References).
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Baseline generation costs real money and needs the user watching — delivery must stop and ask before the full run (deliver-skill constraint 5, out-of-band action). The falsifiability check (deliberate skill edit -> named regression -> revert) mirrors the DIP-1.1 guard-breaking pattern: a regression detector that cannot fire is not a detector.

Wiring + docs committed (9280fa3). AC1 proof: test script untouched, unit suite 13 files/141 green, CI scripts unchanged; test:eval now the runner, island suite at test:eval:fixtures. AC4: plugin surface unchanged — manifests deliberately untouched; repo README Development section points at the harness. CLAUDE.md Architecture addendum for tests/eval flagged as follow-up (outside this story's References). Stopped before baseline generation per constraint 5 — billed, user must be present.

First billed review run (2026-07-23, claude-sonnet-5, K=5, 115 calls): verdict FAIL 15 violations — every one traced to line-anchor mismatch, not missed rules; re-scored on rule+file everything is 5/5 with zero good-twin FPs. User approved switching the matcher to rule+file (line = anchor documentation); lineTolerance removed from config/report; run findings now retained in results JSON for offline re-scoring. Stale pre-change baseline on disk intentionally not committed — user reruns --update-baseline with the new matcher.

Apply baseline attempt 1: all 115 CLI calls failed instantly — claude's --allowedTools is variadic and ate the positional prompt; review mode never hit it (no extraArgs). Fixed by writing the prompt to stdin (flag-order-proof) and surfacing stderr in failure records (the 'exit code 1'-only errors made this needlessly hard to diagnose). Verified with a one-call live repro before and after.

Falsifiability demonstrated 2026-07-24: temporarily deleting srp.props-cap from SKILL.md (caps table + Rule index, working tree only) flipped 'REGRESSION srp.props-cap on srp/props-cap/Bad.tsx @ claude-sonnet-5: 5/5 -> 0/5', VERDICT FAIL, exit 1; reverting restored 5/5, no regressions, PASS. Baselines committed (2ca0aea) after user approval: review 30/31 at 5/5 (state.derived-effect honest 3/5, observed flaky), apply 14/23 >=4/5 with the API-pinning fixture flaw documented as known limitation. User chose accept + follow-up story for the apply fixture redesign.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Harness productized: bun run test:eval drives the runner (island suite moved to test:eval:fixtures; CI and deliver-verify provably untouched), tests/eval/README.md documents the full workflow (commands, flags, thresholds, baseline + judge-pin policies, cost expectations, known limitation), repo README points to it, plugin manifests deliberately unchanged (no plugin-surface drift). First approved baselines committed after user sign-off: review 30/31 rule×fixture entries at 5/5 with state.derived-effect at its honest observed 3/5; apply 14/23 fixtures >=4/5, with composition/props-cap/god-component at an honest 0/5 caused by behavior tests pinning the prop API the rules require changing — documented as a known limitation, spawning DIP-2.12. Delivery hardened the harness with three real-run fixes approved en route: matcher now scores rule+file (line = anchor documentation; first run showed line anchoring is model-unstable), prompts delivered via stdin (variadic --allowedTools ate the positional prompt), results JSON retains findings + truncated transcripts for offline re-scoring. Falsifiability proven: deleting srp.props-cap from SKILL.md flipped a named regression (5/5 -> 0/5, exit 1); reverting restored PASS. Epic DIP-2 left open pending DIP-2.12 (apply-fixture redesign + baseline refresh + first real A/B answer).
<!-- SECTION:FINAL_SUMMARY:END -->
