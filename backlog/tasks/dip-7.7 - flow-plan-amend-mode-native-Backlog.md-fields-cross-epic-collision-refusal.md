---
id: DIP-7.7
title: 'flow-plan: amend mode, native Backlog.md fields, cross-epic collision refusal'
status: To Do
assignee: []
created_date: '2026-08-07 10:49'
updated_date: '2026-08-07 10:49'
labels:
  - story
dependencies:
  - DIP-7.3
  - DIP-7.4
references:
  - skills/flow-plan/SKILL.md
  - skills/flow-plan/reference/
parent_task_id: DIP-7
priority: medium
type: feature
ordinal: 46000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
flow-plan gains the path that is missing today: delivery is told to "amend the story via backlog-plan" when scope drifts, but no amend mode exists, so the only way through is hand-driving the CLI — which both skills forbid. It also starts using Backlog.md's native fields instead of encoding them as prose, and checks collisions against the whole backlog rather than only the stories it is creating right now.

Type: deliverable
Branch: DIP-7.7/plan-amend-mode
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 An amend mode reopens one existing story and edits its criteria, References and dependencies through the CLI only, then reports exactly what changed
- [ ] #2 Amending a Done story is refused without explicit confirmation
- [ ] #3 Stories are created with native --type (spike, feature, chore, docs); the Type: description line is kept only for compatibility with the live deliver skill and its removal is noted as cutover work
- [ ] #4 Paths recorded via --modified-file are read back and compared against declared References, reporting any story that touched paths it never declared
- [ ] #5 Before materializing, plan runs the collisions check against every To Do and In Progress story and refuses on a collision that has no dependency edge, naming both stories
- [ ] #6 The existing refusals still hold: no acceptance criteria, prose-only References, or a missing/malformed Branch slug still block materialization
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add the collisions call to Step 5's preconditions.
2. Switch materialization to native --type.
3. Add amend mode as a distinct entry path with its own precondition list.
4. Add the References-vs-modified-file drift report.
5. Update the reference docs to match.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Amend mode is where scope creep gets legitimised safely — it must be as strict about the standard as creation is, or it becomes the hole through which unscoped stories enter.

Cross-epic collision is the gap that makes parallel pickup unsafe today: plan compares References only among siblings it is creating, so a new story can collide with an in-flight story from an older epic and nothing notices.

Verify: amend a story in this backlog and confirm the diff is exactly what was asked for; run the collisions check against a deliberately colliding draft.
<!-- SECTION:NOTES:END -->
