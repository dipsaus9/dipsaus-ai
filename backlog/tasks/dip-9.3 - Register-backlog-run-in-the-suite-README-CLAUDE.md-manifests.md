---
id: DIP-9.3
title: 'Register backlog-run in the suite: README, CLAUDE.md, manifests'
status: Done
assignee: []
created_date: '2026-08-09 15:22'
updated_date: '2026-08-11 11:03'
labels:
  - story
dependencies:
  - DIP-9.2
references:
  - skills/backlog-run/
  - README.md
  - .claude/CLAUDE.md
  - .claude-plugin/
  - package.json
parent_task_id: DIP-9
priority: medium
type: chore
ordinal: 58000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Document and register the new fourth suite skill so the repo surface matches. README (the init/plan/deliver flow gains run), CLAUDE.md component list, and all three manifest descriptions.

Type: deliverable
Branch: DIP-9.3/backlog-run-register
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 README documents /backlog-run (selection, batch gate, parallel dispatch, mixed report) in the backlog workflow section
- [x] #2 CLAUDE.md reflects backlog-run as part of the plugin-only suite
- [x] #3 package.json, .claude-plugin/plugin.json and .claude-plugin/marketplace.json descriptions mention the orchestrator
- [x] #4 bun run lint, typecheck and test are green; epic DIP-9 closed on delivery
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. README workflow section + diagram. 2. CLAUDE.md suite description. 3. Three manifest descriptions. 4. Verify, close epic.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Manifest descriptions drift silently (CLAUDE.md warns) — update all three. Depends on DIP-9.2 so the skill exists to document.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Registered backlog-run across the repo surface: README (workflow section header init·plan·deliver·run, flow diagram, skills-table row, and a Parallel orchestration paragraph), CLAUDE.md (backlog-run added to the plugin-only suite), and all three manifest descriptions (package.json, plugin.json, marketplace.json now name the init/plan/deliver/run orchestrator). Gates green. Closes epic DIP-9.
<!-- SECTION:FINAL_SUMMARY:END -->
