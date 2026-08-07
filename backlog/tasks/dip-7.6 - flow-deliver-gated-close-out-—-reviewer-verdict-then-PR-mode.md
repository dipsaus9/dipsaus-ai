---
id: DIP-7.6
title: 'flow-deliver: gated close-out — reviewer verdict then PR mode'
status: To Do
assignee: []
created_date: '2026-08-07 10:49'
updated_date: '2026-08-07 10:49'
labels:
  - story
dependencies:
  - DIP-7.2
  - DIP-7.4
  - DIP-7.5
references:
  - skills/flow-deliver/SKILL.md
  - skills/flow-deliver/reference/review-and-pr.md
parent_task_id: DIP-7
priority: high
type: feature
ordinal: 45000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The end of a delivery run stops being "push and print a link". After the last green commit, an independent reviewer sees the diff and the story's contract and returns a verdict; a blocking verdict stops the push and re-enters the implement loop under a hard cap. Then PR mode decides between printing the compare link and opening a draft PR.

This is what makes an unattended run trustworthy: the acceptance criteria are checked by something that did not write the code.

Type: deliverable
Branch: DIP-7.6/gated-close-out
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 After the final green commit, flow-deliver spawns the reviewer agent with the story diff plus the story's outcome, acceptance criteria and References, and nothing else
- [ ] #2 A blocking verdict prevents the push and re-enters the implement loop; rounds are capped per DIP-7.2 and the cap escalates to the user rather than looping further
- [ ] #3 The reviewer's verdict and findings are appended to the task notes through the CLI, so the record survives the session
- [ ] #4 PR mode is honoured: link prints the compare URL exactly as today, create runs `gh pr create --draft` with the story outcome and acceptance criteria as the body
- [ ] #5 Missing or unauthenticated gh degrades to link mode with an explicit message, and never fails the story
- [ ] #6 review.enabled false skips the gate entirely and the run behaves as it does today
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Wire the reviewer invocation and verdict parsing per DIP-7.2's frozen format.
2. Add the blocking-verdict loop with the cap and escalation.
3. Append verdict to notes.
4. Add PR mode branching with gh detection and degradation.
5. Add the review-disabled bypass.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Edits the same SKILL.md as DIP-7.5, so it depends on it and the two never run in parallel — that is deliberate, not an oversight.

The gh opt-in reverses a hard rule in CLAUDE.md ("never gh/glab/host APIs"). The rule is relaxed in the cutover story; until then, keep create mode off by default so nothing changes for this repo mid-epic.

Verify: run a story end to end with review enabled and a deliberately unmet acceptance criterion, and confirm the push is blocked.
<!-- SECTION:NOTES:END -->
