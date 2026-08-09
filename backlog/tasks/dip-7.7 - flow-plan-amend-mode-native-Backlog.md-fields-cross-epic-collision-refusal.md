---
id: DIP-7.7
title: 'flow-plan: amend mode, native Backlog.md fields, cross-epic collision refusal'
status: Done
assignee: []
created_date: '2026-08-07 10:49'
updated_date: '2026-08-09 09:28'
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
- [x] #1 An amend mode reopens one existing story and edits its criteria, References and dependencies through the CLI only, then reports exactly what changed
- [x] #2 Amending a Done story is refused without explicit confirmation
- [x] #3 Stories are created with native --type (spike, feature, chore, docs); the Type: description line is kept only for compatibility with the live deliver skill and its removal is noted as cutover work
- [x] #4 Paths recorded via --modified-file are read back and compared against declared References, reporting any story that touched paths it never declared
- [x] #5 Before materializing, plan runs the collisions check against every To Do and In Progress story and refuses on a collision that has no dependency edge, naming both stories
- [x] #6 The existing refusals still hold: no acceptance criteria, prose-only References, or a missing/malformed Branch slug still block materialization
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

Delivered as flow-plan behaviour (SKILL.md only; no runtime code -> no new tests; collisions CLI already tested in 7.3; gates green). AC#1/#2: new '## Amend mode' — flow-plan amend <id> re-plans ONE story via CLI (--ac/--remove-ac/--ref/--dep/-d/--plan/--notes), refuses a Done story without explicit confirmation, re-checks the standard, re-runs collisions, reports old-vs-new. AC#3: Step 5.2 create adds native --type (spike|feature|chore|docs) and KEEPS the Type: description line for backlog-deliver's spike switch, with removal flagged as DIP-7.11 cutover work. AC#4: new '## References drift' section reads --modified-file back and compares to declared References (prefix rule), reporting undeclared paths. AC#5: Step 5 'Cross-epic collision precondition' compares each draft's References against every To Do/In Progress story before writing (manual, since drafts have no id) and refuses undep'd collisions naming both; Step 5.3 re-verifies each created id via bun ${CLAUDE_PLUGIN_ROOT}/bin/backlog-workflow.ts collisions <id>. AC#6: existing precondition refusals (no ACs / prose-only refs / bad Branch) retained unchanged.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
flow-plan gains the pieces the v2 workflow needs. A new amend mode (flow-plan amend <id>) re-plans a single story entirely through the CLI — refusing a Done story without confirmation, re-checking the standard, and re-running the collision check — which is the path delivery is told to use on a scope mismatch and that did not previously exist. Materialization now sets Backlog.md's native --type (keeping the redundant Type: line until the DIP-7.11 cutover so today's backlog-deliver still switches into its spike flow), and gained a cross-epic collision guard: each draft's References are compared against every To Do/In Progress story before anything is written, undep'd collisions are refused by name, and every created story is re-verified with the collisions CLI. A References-drift audit compares --modified-file against declared References. Only DIP-7.8 and the DIP-7.11 cutover remain.
<!-- SECTION:FINAL_SUMMARY:END -->
