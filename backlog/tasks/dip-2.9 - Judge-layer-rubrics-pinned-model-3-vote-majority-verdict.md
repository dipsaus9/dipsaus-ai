---
id: DIP-2.9
title: 'Judge layer: rubrics, pinned model, 3-vote majority verdict'
status: Done
assignee: []
created_date: '2026-07-17 14:23'
updated_date: '2026-07-23 11:43'
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
- [x] #1 Rubric file per judged rule under tests/eval/rubrics/, each with pass/fail criteria and 2+ worked examples (one pass, one fail)
- [x] #2 Judge invoked via headless claude CLI with the exact pinned model id from eval config; 3 votes, majority verdict, individual votes + reasoning captured in results JSON
- [x] #3 Apply-mode verdict = mechanical checks AND judge majority; judge-fail lists which rubric failed and the majority reasoning
- [x] #4 Judge prompt contains rubric + refactored code only — no skill-on/off or run-metadata leakage (blindness reused by DIP-2.10)
- [x] #5 Vote aggregation and prompt assembly have CI-safe unit tests (canned vote outputs)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. tests/eval/rubrics/: one md per judged rule (comp.regions-as-slots, comp.config-soup, comp.variant-compound, comp.slots-over-config) — pass/fail criteria + worked pass and fail examples; README documents versioning: rubric text or pinned judge id change = deliberate baseline reset. 2. runner/judge.ts: buildJudgePrompt(rubric, files) = rubric + refactored sources ONLY (real relative filenames — constant across A/B arms; zero run metadata: no model ids, no skill-on/off, no fixture labels); strict output contract VERDICT: pass|fail + REASONING; parseJudgeVote (unparseable = fail-safe fail vote, recorded); majorityVerdict over judgeVotes=3 with unanimous flag — 2-1 splits surface as judge-instability warnings in the report (the signal that later decides advisory demotion); judgeSandbox runs votes via invokeClaude with the exact pinned config.judgeModel. 3. apply.ts: judged rules = fixture's expected comp.* rules; judge runs only when mechanical checks pass (saves calls, verdict identical); overall pass = mechanical AND all judge majorities; judge-fail lists rubric + majority reasoning; votes+reasoning land in applyRuns JSON. 4. config.ts: judgeVotes, pin comment. 5. Unit tests: vote parsing (clean/garbled), majority math incl. fail-safe and unanimity, prompt blindness assertions (contains rubric+code, lacks metadata markers).
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Careful: judge is in the pass/fail path by explicit user choice — contain drift: pinned id, rubrics versioned, votes recorded. If majority verdicts flip across identical reruns on the same code, surface a judge-instability warning in the report; that signal decides whether the epic later demotes the judge to advisory. Changing rubric text = regression-relevant, baseline reset required (document in rubric README).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Judge layer: tests/eval/rubrics/ holds one rubric per composition rule (regions-as-slots, config-soup, variant-compound, slots-over-config) with pass/fail criteria and worked pass+fail examples; README pins the drift rules — changing the pinned judge id (config.judgeModel, exact id) or any rubric text demands a deliberate baseline reset in the same PR. runner/judge.ts sends rubric + refactored sources and nothing else (blindness asserted by unit test — no model ids, skill arms, or fixture labels; DIP-2.10 reuses it) to the pinned judge for judgeVotes=3 headless votes; strict VERDICT/REASONING contract, unparseable votes fail safe and are recorded. Apply verdict = mechanical checks AND judge majority (judge runs only after a mechanical pass, on fixtures expecting comp.* rules); judge-fails name rubric + majority reasoning, every vote + reasoning lands in applyRuns JSON, and 2-1 verdicts surface as judge-instability warnings in terminal + JSON — the signal for a later advisory demotion. 10 new unit tests (134 total).
<!-- SECTION:FINAL_SUMMARY:END -->
