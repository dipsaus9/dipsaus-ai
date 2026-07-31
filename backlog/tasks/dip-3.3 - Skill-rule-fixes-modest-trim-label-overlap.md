---
id: DIP-3.3
title: 'Skill rule fixes, modest trim, label overlap'
status: To Do
assignee: []
created_date: '2026-07-31 08:19'
updated_date: '2026-07-31 08:19'
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
- [ ] #1 state.global-discipline section rewritten with a stated hypothesis (in the PR/commit body) for why the old text suppressed detection; rule id unchanged
- [ ] #2 Variant/config boundary stated crisply in both rule sections; rule ids unchanged; Rule index ids stay in sync with runner/config.ts RULES
- [ ] #3 SKILL.md byte count reduced 15-25% (from 8617 bytes) with no rule dropped and severities unchanged
- [ ] #4 comp.variant-compound added to alsoAcceptable for composition/config-soup (Bad + Demo), composition/dashboard-panel (Bad + Demo), composition/slots-over-config (Bad + Demo) — matching the observed FP cluster
- [ ] #5 Repo gates green
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Read global-discipline section against transcripts of the misses (A/B results JSON has them). 2. Rewrite both rule sections. 3. Trim pass. 4. Label edits. 5. Gates.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Any skill text change invalidates baselines — reset lands in DIP-3.8. Plugin manifests (package.json, plugin.json, marketplace.json) untouched — skill surface (name/purpose) unchanged.
<!-- SECTION:NOTES:END -->
