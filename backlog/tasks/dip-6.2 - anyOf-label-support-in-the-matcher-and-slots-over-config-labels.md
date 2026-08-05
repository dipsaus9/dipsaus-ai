---
id: DIP-6.2
title: anyOf label support in the matcher and slots-over-config labels
status: Done
assignee: []
created_date: '2026-08-04 17:53'
updated_date: '2026-08-04 19:28'
labels:
  - story
dependencies: []
references:
  - tests/eval/runner/matcher.ts
  - tests/eval/runner/fixtures.ts
  - tests/eval/runner/types.ts
  - tests/eval/fixtures/composition/slots-over-config/expected.json
  - tests/eval/README.md
  - tests/unit/eval-runner-matcher.test.ts
parent_task_id: DIP-6
ordinal: 37000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The label schema and matcher accept an expected entry of the form { anyOf: [ruleA, ruleB], line } — a finding naming any listed rule on the right file scores the hit, so genuinely-overlapping rules stop punishing correct detections. slots-over-config's expected entry becomes anyOf [comp.slots-over-config, comp.regions-as-slots]. Plain rule entries stay valid unchanged.

Type: deliverable
Branch: DIP-6.2/anyof-label-support
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Matcher scores an expected anyOf entry as detected when a finding names any listed rule on the labeled file; plain rule entries behave byte-identically to before
- [x] #2 composition/slots-over-config expected.json uses anyOf [comp.slots-over-config, comp.regions-as-slots]; regions-as-slots removed from its alsoAcceptable
- [x] #3 README label-schema section documents anyOf with the overlap rationale; unit tests cover anyOf hit, anyOf miss, and plain-rule regression
- [x] #4 Repo gates green
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Type: ExpectedFinding gains optional anyOf; rule optional when anyOf present. 2. fixtures.ts label parsing passes it through. 3. matcher.ts scores hit when finding rule is in the entry's accepted set (rule or anyOf). 4. Baseline entry key: keep the first anyOf rule as the canonical id so baseline diffs stay stable. 5. Labels + README + tests.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Motivating data: slots-over-config detection runs 1-3 report comp.regions-as-slots on Bad.tsx — correct identification, wrong-name miss under single-rule scoring. Baseline entry naming must stay stable (rule field in RuleScore) — use the first anyOf member as canonical. Check how per-rule severity resolves (severityOf on canonical rule).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
anyOf shipped: ExpectedFinding gains optional anyOf (rule stays canonical for baseline keys + severity), matcher scores hits and dedupes noise across the accepted set, fixtures.ts needed no change (JSON passthrough). slots-over-config expected.json uses anyOf [slots-over-config, regions-as-slots] with regions-as-slots removed from alsoAcceptable. README schema section documents anyOf with a use-sparingly warning. 5 new matcher tests incl. canonical-key and plain-rule regression (179 total green).
<!-- SECTION:FINAL_SUMMARY:END -->
