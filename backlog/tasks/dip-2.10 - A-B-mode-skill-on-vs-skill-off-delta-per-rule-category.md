---
id: DIP-2.10
title: 'A/B mode: skill-on vs skill-off delta per rule category'
status: Done
assignee: []
created_date: '2026-07-17 14:23'
updated_date: '2026-07-23 13:01'
labels:
  - story
dependencies:
  - DIP-2.6
  - DIP-2.9
references:
  - tests/eval/runner/
parent_task_id: DIP-2
ordinal: 13000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Answers the epic's founding question: does the skill help at all. Same fixtures, same model, same K — one arm with the skill loaded, one arm with a neutral 'review/refactor this React code' prompt without it. Review arm scored against labels; apply arm graded mechanically + judged (judge blind to arm). Report: per-rule-category delta (detection, false positives, apply pass rates) plus verdict lines per model. On-demand mode, not part of every eval run.

Type: deliverable
Branch: DIP-2.10/ab-comparison
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 --mode ab runs both arms with identical fixtures, model list and K; the only difference between arms is skill presence, and the runner prints both arm prompts on --verbose to prove it
- [x] #2 Judge receives arm-anonymous output (order shuffled, no labels); blindness covered by a unit test of prompt assembly
- [x] #3 Report shows per-category and per-model deltas with the underlying rates, and a plain-language summary of where the skill adds value or hurts
- [x] #4 A/B results are stored beside but never diffed against the regression baseline (different question, different lifecycle)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. prompt.ts: buildControlSystemPrompt(ruleIds) — neutral 'experienced React reviewer' + the SAME output-format scaffolding and the bare rule-id vocabulary (no caps, severities, or criteria — only the standards content differs, per note); apply user prompt reworded arm-neutral ('the architecture standards from your instructions'). 2. runReview/runApply gain systemAppend override; runApply gains deferJudge + refactored-file snapshots on the run record (sandboxes are destroyed per run, so judging later needs captured sources). 3. runner/ab.ts: --mode ab = review both arms + apply both arms, identical fixtures/models/K; pending judge jobs from BOTH arms' mechanical passes collected, deterministically shuffled (seeded mulberry32 — no arm field ever reaches judgeRefactor, prompt blindness from DIP-2.9 reused), then executed and reattached. Delta report: per fixture-category (srp/composition/state) x model — detection-rate mean, FP count, apply pass rate, skill-minus-control deltas + plain-language summary lines (adds value / hurts / no signal). 4. run.ts: mode ab + --verbose printing both arm system prompts verbatim (AC1 proof); ab results to results/ab-*.json, baseline logic entirely skipped (AC4). 5. Unit tests: control-prompt contains format+ids but no standards markers, shuffle determinism + interleaving, delta computation + summary from canned arm reports.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Skill-off arm must still request the same output format (ids from DIP-2.1) so the parser works — format instruction is shared harness scaffolding, present in both arms; only the standards content differs. That isolates the skill's substance, not its formatting.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
A/B mode answers the epic's founding question: --mode ab runs review AND apply over identical fixtures, model list and K in two arms — skill loaded vs buildControlSystemPrompt, a neutral experienced-reviewer prompt carrying the same output-format scaffolding and the bare rule-id vocabulary (parser works on both arms) but zero standards content; --verbose prints both arm system prompts verbatim as proof. Apply judging is deferred (refactored sources snapshotted per run since sandboxes are destroyed) and both arms' jobs are judged in one deterministically shuffled (seeded mulberry32), arm-anonymous batch reusing DIP-2.9's blind prompt. computeAbReport emits per-category x per-model detection rates, FP counts and apply pass rates for both arms plus plain-language summary lines (improves / HURTS / no signal); results go to results/ab-*.json as kind ab-comparison, stored beside but never diffed against the regression baseline (run.ts ab path skips baseline logic entirely). 7 new unit tests (141 total): control-prompt isolation (format+ids present, standards markers and the word skill absent), shuffle determinism/integrity, delta+summary math from canned arm reports. One bug caught by tests: apply-only categories were dropped from the delta grid — fixed.
<!-- SECTION:FINAL_SUMMARY:END -->
