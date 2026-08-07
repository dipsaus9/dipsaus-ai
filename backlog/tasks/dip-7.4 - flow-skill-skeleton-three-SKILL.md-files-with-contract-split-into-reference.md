---
id: DIP-7.4
title: >-
  flow-* skill skeleton: three SKILL.md files with contract split into
  reference/
status: Done
assignee: []
created_date: '2026-08-07 10:49'
updated_date: '2026-08-07 13:19'
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
- [x] #1 skills/flow-init/SKILL.md, skills/flow-plan/SKILL.md and skills/flow-deliver/SKILL.md exist with valid frontmatter and disable-model-invocation: true, so neither can be auto-picked while the live skills are still in use
- [x] #2 flow-plan and flow-deliver reproduce the behaviour of today's backlog-plan and backlog-deliver, with no behaviour change introduced in this story
- [x] #3 Long-form contract material lives in reference/ files, and each SKILL.md body points at its reference only at the step that needs it
- [x] #4 flow-init is a stub whose body states its intended scope and is explicitly marked not yet implemented
- [x] #5 skills/backlog-plan/ and skills/backlog-deliver/ are byte-identical before and after this story, verified with git diff
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

Delivered structurally. flow-plan = verbatim cp of backlog-plan (SKILL.md + reference/{config,story-standard,story-template}.md), frontmatter changed only (name: flow-plan, disable-model-invocation: true, description prefixed [under construction]). flow-deliver/SKILL.md = cp of backlog-deliver with same frontmatter change; the '## Git contract' section extracted to reference/git-contract.md and replaced by a pointer read at Steps 2/4/6-7 (Step 6 push instruction kept — that is the delivery step, not the contract). flow-deliver/reference/parallel-delivery.md + review-and-pr.md (spike-owned) left untouched. flow-init/SKILL.md = declared stub, disable-model-invocation, states DIP-7.8 scope. Decision: body prose keeps backlog-plan/backlog-deliver names because the DIP-7.11 cutover renames flow-*->backlog-*, making the prose self-consistent then. AC#5 verified: git diff on skills/backlog-plan + skills/backlog-deliver is empty (byte-identical). lint/typecheck/test green (markdown-only change).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Scaffolded the flow-* v2 namespace without touching the live skills. flow-plan is a verbatim copy of backlog-plan (reference/ included); flow-deliver copies backlog-deliver with its git contract extracted into reference/git-contract.md (read at the steps that need it, pointer left in the body); flow-init is a declared stub scoping DIP-7.8. All three carry disable-model-invocation: true so they cannot be auto-picked while the live skills are still delivering the epic. Body prose intentionally keeps the backlog-* names, which become correct at the DIP-7.11 cutover rename. backlog-plan and backlog-deliver are byte-identical (git diff empty); repo gates green. Unblocks DIP-7.5, 7.6, 7.7.
<!-- SECTION:FINAL_SUMMARY:END -->
