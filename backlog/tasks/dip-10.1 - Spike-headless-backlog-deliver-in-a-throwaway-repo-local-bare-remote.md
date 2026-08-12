---
id: DIP-10.1
title: 'Spike: headless backlog-deliver in a throwaway repo + local bare remote'
status: To Do
assignee: []
created_date: '2026-08-12 06:51'
updated_date: '2026-08-12 06:51'
labels:
  - story
dependencies: []
references:
  - tests/eval/deliver/reference/harness.md
parent_task_id: DIP-10
priority: medium
type: spike
ordinal: 60000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prove the harness shape before building on it. The load-bearing unknown: can claude -p headless invoke the backlog-deliver PLUGIN skill — with its CLI (bin/backlog-workflow.ts), guard hooks and story-reviewer agent all available — inside a throwaway git repo with a local bare remote as origin, and drive a full readiness-gate -> worktree -> implement/verify/commit -> reviewer -> push run producing a pushed <id>/<slug> branch?

Type: spike
Branch: DIP-10.1/deliver-eval-harness-spike
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Documented result, with the run transcript, of a headless backlog-deliver run completing end to end in a throwaway git repo whose origin is a local bare repo, producing a pushed <id>/<slug> branch
- [ ] #2 How the plugin (skill + CLI + hooks + agent) is made available to the headless run is recorded (e.g. plugin install, or skills copied + config), with the exact setup the fixtures will reuse
- [ ] #3 The fixture-case shape is fixed: starter repo contents, the ready story, the .claude/backlog-workflow.json, the local bare remote, and teardown
- [ ] #4 Go/no-go on the throwaway-repo + local-bare-remote sandbox, recorded in tests/eval/deliver/reference/harness.md and approved by the user
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Build one throwaway repo + bare remote + a trivial ready story + config. 2. Drive backlog-deliver headless (claude -p) with the plugin available; observe gate/worktree/commit/push. 3. Record setup + fixture shape. 4. Write the harness doc, get approval, close.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Type: spike — recorded decision, no code gates. Reuse sandbox.ts / claude.ts patterns. Key risks: plugin availability in a headless throwaway repo; the guard hook firing correctly there; nested reviewer subagent in headless mode. If headless can't invoke a plugin skill, record the fallback (copy skills + point config) so 10.2+ can proceed.
<!-- SECTION:NOTES:END -->
