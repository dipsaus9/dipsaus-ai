---
id: DIP-3.3
title: 'Skill rule fixes, modest trim, label overlap'
status: Done
assignee: []
created_date: '2026-07-31 08:19'
updated_date: '2026-07-31 11:52'
labels:
  - story
dependencies:
  - DIP-2.12
references:
  - skills/react-architecture/SKILL.md
  - tests/eval/fixtures/composition/config-soup/expected.json
  - tests/eval/fixtures/composition/dashboard-panel/expected.json
  - tests/eval/fixtures/composition/slots-over-config/expected.json
parent_task_id: DIP-3
ordinal: 19000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
SKILL.md stops hurting where measured: state.global-discipline rewritten (detection 1/5 with skill vs 5/5 control — the text suppresses the rule), comp.variant-compound vs comp.config-soup boundary sharpened (variant = one enum prop switching layout; config-soup = many independent knobs), overall wording tightened for a 15-25% byte reduction. Genuine rule overlap on composition fixtures becomes alsoAcceptable instead of false positives.

Type: deliverable
Branch: DIP-3.3/skill-fixes-labels
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 state.global-discipline section rewritten with a stated hypothesis (in the PR/commit body) for why the old text suppressed detection; rule id unchanged
- [x] #2 Variant/config boundary stated crisply in both rule sections; rule ids unchanged; Rule index ids stay in sync with runner/config.ts RULES
- [x] #3 SKILL.md byte count reduced 15-25% (from 8617 bytes) with no rule dropped and severities unchanged
- [x] #4 comp.variant-compound added to alsoAcceptable for composition/config-soup (Bad + Demo), composition/dashboard-panel (Bad + Demo), composition/slots-over-config (Bad + Demo) — matching the observed FP cluster
- [x] #5 Repo gates green
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Read global-discipline section against transcripts of the misses (A/B results JSON has them). 2. Rewrite both rule sections. 3. Trim pass. 4. Label edits. 5. Gates.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Any skill text change invalidates baselines — reset lands in DIP-3.8. Plugin manifests (package.json, plugin.json, marketplace.json) untouched — skill surface (name/purpose) unchanged.

Key evidence for DIP-3.9: the entire skill-HURTS-state-detection A/B signal (75% vs 100%) was timeout noise — 8 of the skill arm's review failedRuns were 480s timeouts concentrated in state fixtures. Review-mode timeouts exist too, not just apply-mode ones; if they recur in DIP-3.8, consider a review-call retry or a higher single-shot budget as follow-up.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
SKILL.md trimmed 8617 -> 7320 bytes (15.1%) with all 20 rule ids, severities and output contracts unchanged. comp.variant-compound vs comp.config-soup boundary sharpened: variant-compound fires only on an enum-like discriminator prop switching a reused component between shapes; independent boolean/knob props are config-soup; both only when both patterns are present. comp.variant-compound added to alsoAcceptable on config-soup (Bad+Demo), dashboard-panel (Demo; Bad already had it) and slots-over-config (Bad+Demo). state.global-discipline: investigation falsified the suppression premise — the A/B 1/5 was four 480s review-call timeouts (both full review runs are 5/5 with the skill), so per user decision the section got a clarity pass only, with the hypothesis recorded in the commit body. Gates + island suite green.
<!-- SECTION:FINAL_SUMMARY:END -->
