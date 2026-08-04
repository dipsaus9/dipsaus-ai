---
id: DIP-4.4
title: Filtered apply-baseline reset for judged fixtures (billed)
status: Done
assignee: []
created_date: '2026-08-03 05:53'
updated_date: '2026-08-04 08:11'
labels:
  - story
dependencies:
  - DIP-4.1
  - DIP-4.2
  - DIP-4.3
references:
  - tests/eval/baseline/apply.json
  - tests/eval/README.md
parent_task_id: DIP-4
ordinal: 31000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
With the judge parser fixed and the config-soup rubric clarified, the apply baseline entries for judge-scored fixtures (composition and hard tiers, 7 fixtures, ~35 agentic runs) are re-measured and merged over the baseline. srp and state fixtures grade mechanically and are untouched. Expected movement: hard/support-inbox up from 1/5, composition/variant-compound up from 2/5.

Type: deliverable
Branch: DIP-4.4/judged-baseline-reset
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Apply runs with --filter composition and --filter hard executed on the user explicit command with --update-baseline; merged baseline approved by the user and committed
- [x] #2 tests/eval/README.md known-limitations updated: support-inbox and variant-compound entries restated from the new data
- [x] #3 Judge 2-1 instability count of the re-run recorded in the story implementation notes
- [x] #4 Repo gates green
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Gate on explicit user go (billed). 2. Run apply mode twice with --filter composition and --filter hard, both --update-baseline (filtered merge). 3. Diff old vs new entries, present for approval. 4. README known-limitations restated; 2-1 count to notes.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Cost: ~35 agentic runs + judge votes (about a quarter of a full apply matrix). Retry pass (DIP-4.1) protects the run from outage windows. Filtered-update merge policy per tests/eval/baseline/README.md.

Decision hook from the DIP-3.9 A/B: after this reset, read comp.variant-compound's fresh apply rate. If it still sits at or below 3/5, plan a follow-up story 'micro-example for variant-compound in SKILL.md' — a 3-4 line before/after signature sketch showing the variant prop must NOT survive on Root (the observed failure mode: model builds compound parts but keeps variant='kpi' on the root). Skill text change implies another baseline reset + filtered A/B spot-check. Secondary candidate if srp FPs stay high in review runs: negative examples / alsoAcceptable label sweep (control arm had 60 FPs too, so partly corpus work, not skill text).

Reset results (2026-08-04, ~40 agentic runs incl. srp/hardwired-render matched by the 'hard' substring filter — harmless 5/5 merge): support-inbox 1/5 -> 5/5 (rubric fix was the whole story), variant-compound 2/5 -> 3/5 (parse fix recovered the artifact vote; remaining failures genuine variant-prop survival -> micro-example story justified per the decision hook), dashboard-panel 4/5 -> 3/5 (new honest failures: density prop gates Subtitle rendering — the new mechanical tiebreak correctly classifies it as part-gating), regions-as-slots 4/5 -> 5/5. Judge 2-1 instability count: 1 (slots-over-config run 1), down from 8 in the DIP-3.8 full run. Zero failed runs, retry pass never triggered.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Filtered apply-baseline reset delivered on user command: composition + hard re-measured (~40 agentic runs, zero failures, retry never needed) under the fixed judge parser and clarified rubric. support-inbox 1/5 -> 5/5, variant-compound 2/5 -> 3/5, dashboard-panel 4/5 -> 3/5 (honest new failures: renamed part-gating props), regions-as-slots 4/5 -> 5/5. Judge 2-1 count: 1 (was 8). Baseline approved by the user and committed; README known-limitations restated. Follow-up justified per the decision hook: composition micro-examples in SKILL.md (discriminator/gate props must not survive), covering both variant-compound and dashboard-panel failure modes.
<!-- SECTION:FINAL_SUMMARY:END -->
