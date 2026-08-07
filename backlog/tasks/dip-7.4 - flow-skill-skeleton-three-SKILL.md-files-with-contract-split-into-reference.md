---
id: DIP-7.4
title: >-
  flow-* skill skeleton: three SKILL.md files with contract split into
  reference/
status: To Do
assignee: []
created_date: '2026-08-07 10:49'
updated_date: '2026-08-07 10:49'
labels:
  - story
dependencies: []
references:
  - skills/flow-init/
  - skills/flow-plan/
  - skills/flow-deliver/SKILL.md
  - skills/flow-deliver/reference/git-contract.md
parent_task_id: DIP-7
priority: high
type: chore
ordinal: 43000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create flow-init, flow-plan and flow-deliver as the v2 namespace, so the substance stories have somewhere to land without touching the skills currently delivering this epic. flow-plan and flow-deliver reproduce today's behaviour exactly; the long-form contract moves out of the bodies into reference/ files read only at the step that needs them. flow-init is a declared stub.

Behaviour change is explicitly out of scope here — this story is structural, and the live skills must be byte-identical when it lands.

Type: deliverable
Branch: DIP-7.4/flow-skill-skeleton
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 skills/flow-init/SKILL.md, skills/flow-plan/SKILL.md and skills/flow-deliver/SKILL.md exist with valid frontmatter and disable-model-invocation: true, so neither can be auto-picked while the live skills are still in use
- [ ] #2 flow-plan and flow-deliver reproduce the behaviour of today's backlog-plan and backlog-deliver, with no behaviour change introduced in this story
- [ ] #3 Long-form contract material lives in reference/ files, and each SKILL.md body points at its reference only at the step that needs it
- [ ] #4 flow-init is a stub whose body states its intended scope and is explicitly marked not yet implemented
- [ ] #5 skills/backlog-plan/ and skills/backlog-deliver/ are byte-identical before and after this story, verified with git diff
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Copy backlog-plan -> flow-plan and backlog-deliver -> flow-deliver verbatim, then add disable-model-invocation.
2. Split the git contract out of flow-deliver's body into reference/git-contract.md.
3. Leave the two spike-owned reference files alone — they belong to DIP-7.1 and DIP-7.2.
4. Write the flow-init stub.
5. Confirm the live skills are untouched.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
disable-model-invocation is the safety mechanism for the whole epic: without it, two nearly identical skill descriptions sit in context and the model can pick the half-built one mid-delivery. It is removed only at cutover.

Do not create skills/flow-deliver/reference/parallel-delivery.md or review-and-pr.md here — DIP-7.1 and DIP-7.2 own those exact paths.

Verify: git diff --stat on skills/backlog-plan and skills/backlog-deliver shows nothing.
<!-- SECTION:NOTES:END -->
