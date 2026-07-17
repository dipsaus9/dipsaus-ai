---
id: DIP-2.10
title: 'A/B mode: skill-on vs skill-off delta per rule category'
status: To Do
assignee: []
created_date: '2026-07-17 14:23'
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
- [ ] #1 --mode ab runs both arms with identical fixtures, model list and K; the only difference between arms is skill presence, and the runner prints both arm prompts on --verbose to prove it
- [ ] #2 Judge receives arm-anonymous output (order shuffled, no labels); blindness covered by a unit test of prompt assembly
- [ ] #3 Report shows per-category and per-model deltas with the underlying rates, and a plain-language summary of where the skill adds value or hurts
- [ ] #4 A/B results are stored beside but never diffed against the regression baseline (different question, different lifecycle)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Skill-off arm must still request the same output format (ids from DIP-2.1) so the parser works — format instruction is shared harness scaffolding, present in both arms; only the standards content differs. That isolates the skill's substance, not its formatting.
<!-- SECTION:NOTES:END -->
