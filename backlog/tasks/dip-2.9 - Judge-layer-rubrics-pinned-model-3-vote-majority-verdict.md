---
id: DIP-2.9
title: 'Judge layer: rubrics, pinned model, 3-vote majority verdict'
status: To Do
assignee: []
created_date: '2026-07-17 14:23'
labels:
  - story
dependencies:
  - DIP-2.8
references:
  - tests/eval/runner/
  - tests/eval/rubrics/
parent_task_id: DIP-2
ordinal: 12000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
LLM judge for what AST cannot grade: composition quality of apply-mode refactors (compound API shape, slot design, context usage) per the category-2 judgment rules. Rubric per judged rule checked into tests/eval/rubrics/, judge model pinned by exact id in eval config, 3 votes per verdict via headless claude CLI, majority decides. Judge verdict joins the mechanical checks in apply-mode pass/fail (per planning decision). Changing the pinned judge id requires a deliberate baseline reset.

Type: deliverable
Branch: DIP-2.9/judge-layer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Rubric file per judged rule under tests/eval/rubrics/, each with pass/fail criteria and 2+ worked examples (one pass, one fail)
- [ ] #2 Judge invoked via headless claude CLI with the exact pinned model id from eval config; 3 votes, majority verdict, individual votes + reasoning captured in results JSON
- [ ] #3 Apply-mode verdict = mechanical checks AND judge majority; judge-fail lists which rubric failed and the majority reasoning
- [ ] #4 Judge prompt contains rubric + refactored code only — no skill-on/off or run-metadata leakage (blindness reused by DIP-2.10)
- [ ] #5 Vote aggregation and prompt assembly have CI-safe unit tests (canned vote outputs)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Careful: judge is in the pass/fail path by explicit user choice — contain drift: pinned id, rubrics versioned, votes recorded. If majority verdicts flip across identical reruns on the same code, surface a judge-instability warning in the report; that signal decides whether the epic later demotes the judge to advisory. Changing rubric text = regression-relevant, baseline reset required (document in rubric README).
<!-- SECTION:NOTES:END -->
