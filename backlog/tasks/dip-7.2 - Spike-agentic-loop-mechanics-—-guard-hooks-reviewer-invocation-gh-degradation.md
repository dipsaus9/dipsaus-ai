---
id: DIP-7.2
title: >-
  Spike: agentic loop mechanics — guard hooks, reviewer invocation, gh
  degradation
status: To Do
assignee: []
created_date: '2026-08-07 10:49'
updated_date: '2026-08-07 10:49'
labels:
  - story
dependencies: []
references:
  - skills/flow-deliver/reference/review-and-pr.md
parent_task_id: DIP-7
priority: high
type: spike
ordinal: 41000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prove the three mechanisms the agentic close-out depends on, and freeze their contracts so DIP-7.6, DIP-7.9 and DIP-7.10 can be built in parallel without agreeing on anything at the last minute: a plugin PreToolUse hook that blocks the wrong git commands without blocking the delivery skill's own, a deterministic way for a skill to invoke a plugin-shipped reviewer agent, and gh detection that degrades instead of failing.

The risk being retired here is a guard hook that blocks legitimate delivery commits — which would break every story in the epic, including the ones fixing it.

Type: spike
Branch: DIP-7.2/agentic-loop-mechanics
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Evidence that a plugin-shipped PreToolUse hook can block a Bash git command, and that it exits 0 blocking nothing in a repo with no .claude/backlog-workflow.json
- [ ] #2 Confirmed that the guards do not block the delivery skill's own legitimate commit and push commands; the discriminating condition is written down precisely enough to implement
- [ ] #3 The mechanism a skill uses to invoke a plugin-shipped agent is verified and recorded, including how the agent is addressed and what context it does and does not receive
- [ ] #4 Review loop policy frozen: what counts as a blocking finding, the maximum number of review rounds, and what happens at the cap
- [ ] #5 The reviewer's verdict format is specified concretely enough that DIP-7.9 can emit it and DIP-7.6 can consume it without further negotiation
- [ ] #6 gh availability and auth detection decided, with the exact degradation-to-link behaviour recorded
- [ ] #7 Decision and rationale recorded in skills/flow-deliver/reference/review-and-pr.md, and explicitly approved by the user before the story closes
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Prototype a throwaway PreToolUse guard and probe which git invocations it sees; find the discriminating condition between a story-branch commit and a base-branch commit.
2. Verify the no-config no-op path.
3. Invoke a throwaway plugin agent from a skill context and record exactly how it is addressed and what it receives.
4. Decide the verdict schema and loop cap.
5. Probe gh present/absent/unauthenticated.
6. Write the reference doc, present, get approval, close.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Type: spike. Prototype hooks must not be left wired into hooks/hooks.json — DIP-7.10 owns that file.

The review cap matters: an uncapped reviewer loop is how an autonomous run burns a session without converging. Pick a small number and an explicit escalation, not "until it passes".

Verify: the reference doc answers every acceptance criterion with the command output or transcript that proves it.
<!-- SECTION:NOTES:END -->
