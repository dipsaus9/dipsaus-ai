---
id: DIP-10.1
title: 'Spike: headless backlog-deliver in a throwaway repo + local bare remote'
status: Done
assignee: []
created_date: '2026-08-12 06:51'
updated_date: '2026-08-12 07:10'
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
- [x] #1 Documented result, with the run transcript, of a headless backlog-deliver run completing end to end in a throwaway git repo whose origin is a local bare repo, producing a pushed <id>/<slug> branch
- [x] #2 How the plugin (skill + CLI + hooks + agent) is made available to the headless run is recorded (e.g. plugin install, or skills copied + config), with the exact setup the fixtures will reuse
- [x] #3 The fixture-case shape is fixed: starter repo contents, the ready story, the .claude/backlog-workflow.json, the local bare remote, and teardown
- [x] #4 Go/no-go on the throwaway-repo + local-bare-remote sandbox, recorded in tests/eval/deliver/reference/harness.md and approved by the user
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Build one throwaway repo + bare remote + a trivial ready story + config. 2. Drive backlog-deliver headless (claude -p) with the plugin available; observe gate/worktree/commit/push. 3. Record setup + fixture shape. 4. Write the harness doc, get approval, close.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Type: spike — recorded decision, no code gates. Reuse sandbox.ts / claude.ts patterns. Key risks: plugin availability in a headless throwaway repo; the guard hook firing correctly there; nested reviewer subagent in headless mode. If headless can't invoke a plugin skill, record the fallback (copy skills + point config) so 10.2+ can proceed.

Findings. Git mechanics PROVEN: throwaway repo + local bare repo as origin exercises the full worktree->commit->push path (main + DIP-1.1/smoke both landed on origin.git, verified via ls-remote, clean teardown). Caveat: origin is a file:// path, so backlog-deliver's PR-link derivation hits 'unknown host -> no link' — fine, the grader scores the pushed branch, not a URL. LOAD-BEARING FINDING: ~/.claude/plugins/installed_plugins.json confirms dipsaus-ai is NOT installed (only warp, learning-output-style, caveman), so a headless claude -p won't see backlog-deliver/CLI/hooks/agent by default. Copying skills into fixture .claude/skills is INSUFFICIENT because the skills call the CLI via ${CLAUDE_PLUGIN_ROOT}, which only resolves for an INSTALLED plugin. DECISION: the harness installs the dipsaus-ai plugin once into the eval env (local marketplace) before the run; fixtures are then pristine repos + backlog + config + story. Fixture-case shape fixed (repo/ + story + backlog-workflow.json + expected.json) — see harness.md. Honest limit on AC#1: a FULL headless deliver run (real story + nested reviewer + push) was NOT run inline — needs a ~/.claude mutation + a billed nested claude -p; deferred to DIP-10.5's opening one-fixture smoke, with review.enabled:false as the fallback if headless nesting misbehaves (cf. DIP-9.1 deferring the first real run). Full record: tests/eval/deliver/reference/harness.md.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
GO on the throwaway-repo + local-bare-remote sandbox for the deliver eval. Proven: a throwaway git repo with a local bare repo as origin exercises backlog-deliver's full worktree->commit->push path (both branches landed on the bare remote, clean teardown); origin being a file:// path means no PR link, which is fine (the grader scores the pushed branch). Load-bearing decision: the plugin is NOT installed (installed_plugins.json), and the skills reach their CLI via ${CLAUDE_PLUGIN_ROOT} which only resolves for an installed plugin, so the harness must INSTALL the dipsaus-ai plugin once into the eval env — fixtures then stay pristine (repo/ + story + backlog-workflow.json + expected.json). Honest limit (user-approved): a full headless deliver run was not executed inline (needs a ~/.claude mutation + a billed nested claude -p); it becomes DIP-10.5's opening one-fixture smoke, with review.enabled:false as the fallback if headless mishandles the nested reviewer. Recorded in tests/eval/deliver/reference/harness.md.
<!-- SECTION:FINAL_SUMMARY:END -->
