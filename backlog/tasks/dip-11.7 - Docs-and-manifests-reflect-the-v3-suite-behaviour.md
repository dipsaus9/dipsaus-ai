---
id: DIP-11.7
title: 'Docs and manifests: reflect the v3 suite behaviour'
status: Done
assignee: []
created_date: '2026-08-14 11:07'
updated_date: '2026-08-14 13:25'
labels:
  - story
dependencies:
  - DIP-11.1
  - DIP-11.3
  - DIP-11.4
  - DIP-11.5
  - DIP-11.6
references:
  - README.md
  - .claude/CLAUDE.md
  - .claude-plugin/plugin.json
  - .claude-plugin/marketplace.json
  - package.json
parent_task_id: DIP-11
type: docs
ordinal: 74000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Update the user-facing surface for v3: README, .claude/CLAUDE.md architecture, and the three manifest descriptions to reflect the removed worktree.enabled key, auto-detected isolation, the empty-repo init bootstrap, and the clarified run-vs-deliver split.

Type: deliverable
Branch: DIP-11.7/docs-suite-v3
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 README documents auto-isolation, the empty-repo init bootstrap and the run-vs-deliver distinction, with no stale worktree.enabled reference remaining
- [x] #2 .claude/CLAUDE.md Architecture reflects the removed config key and auto-isolation
- [x] #3 The three manifest (package.json, .claude-plugin/plugin.json, .claude-plugin/marketplace.json) descriptions are consistent with v3
- [x] #4 A grep for worktree.enabled across docs and manifests returns nothing
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
After the behavioural stories settle, sweep docs and manifests; grep-verify no worktree.enabled remains.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Depends on the five behaviour stories so it describes the final state. Verify: bun run test/lint/typecheck still green plus the grep check.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Swept the user-facing surface for the v3 suite. README now documents auto-detected isolation (no on/off flag), the empty-repo backlog-init bootstrap, backlog-plan's challenge-the-goal + plan/<epic-id> materialize, and the run-vs-deliver split, with the deliver/run flow diagram updated. .claude/CLAUDE.md Architecture gained an isolation-is-auto-detected bullet. The three manifest descriptions (package.json, plugin.json, marketplace.json) were aligned to 'auto-isolated delivery, empty-repo bootstrap, worktree-parallel orchestrator'. A grep for the removed config key across docs and manifests returns nothing.
<!-- SECTION:FINAL_SUMMARY:END -->
