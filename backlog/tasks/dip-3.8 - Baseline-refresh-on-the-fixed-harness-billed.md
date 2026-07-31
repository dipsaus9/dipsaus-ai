---
id: DIP-3.8
title: Baseline refresh on the fixed harness (billed)
status: To Do
assignee: []
created_date: '2026-07-31 08:20'
labels:
  - story
dependencies:
  - DIP-3.1
  - DIP-3.2
  - DIP-3.3
  - DIP-3.4
  - DIP-3.5
  - DIP-3.6
  - DIP-3.7
references:
  - tests/eval/baseline/
  - tests/eval/README.md
parent_task_id: DIP-3
ordinal: 24000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fresh review and apply baselines on the leak-free harness, fixed skill, and enriched corpus — the first trustworthy regression floor. README known-limitations rewritten from the new data (timeout section expected to shrink or vanish; durationMs distribution reported to validate the 900s choice).

Type: deliverable
Branch: DIP-3.8/baseline-refresh
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Full review run and full apply run executed on the user explicit command; both baselines written via --update-baseline, approved by the user, committed
- [ ] #2 README known-limitations section rewritten from actual results; durationMs distribution summarized with a verdict on the 900s timeout
- [ ] #3 Judge 2-1 instability count reported in the story implementation notes
- [ ] #4 Repo gates green
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Cost approx one full review matrix plus ~130 agentic apply runs on the grown corpus. Baseline diff policy (named regressions) applies from the new baseline forward; old baselines superseded, kept in git history.
<!-- SECTION:NOTES:END -->
