---
id: DIP-7.6
title: 'flow-deliver: gated close-out — reviewer verdict then PR mode'
status: Done
assignee: []
created_date: '2026-08-07 10:49'
updated_date: '2026-08-07 14:15'
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
- [x] #1 After the final green commit, flow-deliver spawns the reviewer agent with the story diff plus the story's outcome, acceptance criteria and References, and nothing else
- [x] #2 A blocking verdict prevents the push and re-enters the implement loop; rounds are capped per DIP-7.2 and the cap escalates to the user rather than looping further
- [x] #3 The reviewer's verdict and findings are appended to the task notes through the CLI, so the record survives the session
- [x] #4 PR mode is honoured: link prints the compare URL exactly as today, create runs `gh pr create --draft` with the story outcome and acceptance criteria as the body
- [x] #5 Missing or unauthenticated gh degrades to link mode with an explicit message, and never fails the story
- [x] #6 review.enabled false skips the gate entirely and the run behaves as it does today
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

Delivered as flow-deliver behaviour (SKILL.md only; no runtime code -> no new tests; gates green). Added a 'Review gate' as Step 4's real exit condition: spawn subagent dipsaus-ai:story-reviewer with ONLY the diff (git diff base...HEAD + changed paths) + story outcome/ACs/References; parse the JSON verdict {verdict, criteria, scopeViolations, findings}; block iff any criterion met:false OR scopeViolations non-empty; blocking findings re-enter the Step 4 loop, capped at 3 rounds then escalate to user (no push); verdict appended to task notes; review.enabled:false (or no config) skips the gate. Step 6 gained pr.mode: link prints compare URL (default), create probes command -v gh + gh auth status then gh pr create --draft (body = outcome + ACs), either probe fails -> degrade to link with reason, never fails the story. Flagged create as the single documented exception to git-contract.md's 'git CLI only, never gh' — reconciliation of git-contract.md + CLAUDE.md deferred to DIP-7.11 (out of this story's References). Report step (Step 7) made pr-mode-aware. Reviewer agent itself ships in DIP-7.9.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
flow-deliver now gates the push on an independent review and honours a per-repo PR mode. A new review gate at the end of the implement loop spawns dipsaus-ai:story-reviewer with only the diff and the story contract, blocks the push when an acceptance criterion is unmet or a file was touched outside References, loops that back into implementation capped at 3 rounds then escalates to the user, and records the verdict in the task notes. Step 6 reads pr.mode: link prints the compare URL as before; create runs gh pr create --draft with the outcome + ACs as the body, probing gh first and degrading to link (never failing the story) when gh is missing or unauthenticated. create is the one documented exception to the 'git CLI only' rule, with the contract/CLAUDE.md wording reconciled at cutover (DIP-7.11). review.enabled:false preserves today's behaviour. The reviewer agent ships in DIP-7.9.
<!-- SECTION:FINAL_SUMMARY:END -->
