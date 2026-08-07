---
id: DIP-7.11
title: 'Cutover: rename flow-* over the old skills and update the docs and manifests'
status: To Do
assignee: []
created_date: '2026-08-07 10:49'
updated_date: '2026-08-07 10:49'
labels:
  - story
dependencies:
  - DIP-7.3
  - DIP-7.5
  - DIP-7.6
  - DIP-7.7
  - DIP-7.8
  - DIP-7.9
  - DIP-7.10
references:
  - skills/
  - .claude/CLAUDE.md
  - README.md
  - package.json
  - .claude-plugin/
parent_task_id: DIP-7
priority: medium
type: chore
ordinal: 50000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The v2 suite takes the names, the old skills are removed, and every document that describes the repo's surface is brought back into truth — including the two hard rules this epic deliberately changed: PR creation is no longer banned outright, and the standalone-copy guarantee no longer covers this suite.

Epic DIP-7 closes with this story.

Type: deliverable
Branch: DIP-7.11/flow-cutover
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 flow-init, flow-plan and flow-deliver are renamed to backlog-init, backlog-plan and backlog-deliver, replacing the old skills, and disable-model-invocation is removed
- [ ] #2 No orphaned reference/ files and no stale cross-references to the old skill paths remain anywhere in the repo
- [ ] #3 CLAUDE.md is updated: the PR rule becomes printed link by default with opt-in gh create, and the self-contained-skill guarantee is scoped to react-architecture with the suite documented as plugin-only
- [ ] #4 README documents the three modes, the config file, the guard hooks and the reviewer agent, including what installing the plugin now brings with it
- [ ] #5 package.json, .claude-plugin/plugin.json and .claude-plugin/marketplace.json descriptions all match the new surface
- [ ] #6 Deferred work is recorded in the backlog rather than left in conversation: the orchestrator that dispatches workers itself, an LLM eval harness for the workflow skills, and CI-side review
- [ ] #7 bun run lint, typecheck and test are green, and epic DIP-7 is closed on delivery
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. git mv the three skill folders over the old ones, removing what they replace.
2. Sweep for stale path references across the repo.
3. Update CLAUDE.md's two changed rules.
4. Update README and the three manifests.
5. Record the deferred items in the backlog.
6. Final verify, close the epic.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
This is the only story that touches the live skills, and it is the point of no return — after it, delivery of any further story runs on v2. Run it last and verify by delivering something with the renamed suite before closing the epic.

CLAUDE.md warns that the three manifest descriptions drift silently. All three are in scope here on purpose.

Verify: bun run lint && bun run typecheck && bun run test, plus a grep for the old skill paths returning nothing.
<!-- SECTION:NOTES:END -->
