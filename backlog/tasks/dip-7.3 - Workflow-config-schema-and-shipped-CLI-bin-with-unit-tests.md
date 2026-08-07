---
id: DIP-7.3
title: Workflow config schema and shipped CLI (bin/) with unit tests
status: Done
assignee: []
created_date: '2026-08-07 10:49'
updated_date: '2026-08-07 12:46'
labels:
  - story
dependencies: []
references:
  - src/workflow/
  - bin/
  - tests/unit/
  - package.json
parent_task_id: DIP-7
priority: high
type: feature
ordinal: 42000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Per-repo workflow settings get a real home and a deterministic reader: .claude/backlog-workflow.json validated by a zod schema, plus a bun CLI the plugin ships. Agents stop re-deriving rules from prose — they run a command and get an answer.

This is the story that makes collision refusal and any-stack verify detection deterministic rather than model-dependent, so both deliver stories and both other skills depend on it.

Type: deliverable
Branch: DIP-7.3/workflow-config-cli
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 zod schema covers parallelism.maxAgents, worktree (enabled, path, install, includeGitignored), verify command list, pr mode (link|create), review (enabled, model, maxRounds) and backlog (dir, prefix); unknown keys are rejected with a readable field-level error
- [x] #2 `validate` exits non-zero with a field-level message on an invalid config and exits zero on a valid one
- [x] #3 `collisions <id>` prints every To Do / In Progress story whose References prefix-collide with the given story's, and exits non-zero when any exist
- [x] #4 `verify-detect` resolves an ordered verify command list from the repo itself for at least node/bun, python, go and rust, and returns an empty list without erroring in a repo with no manifest
- [x] #5 Unit tests cover schema accept and reject, prefix collision including the directory-prefix case, and verify-detect per stack; `bun run lint`, `bun run typecheck` and `bun run test` are green
- [x] #6 The CLI runs from the installed plugin via ${CLAUDE_PLUGIN_ROOT} with no build step
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Schema module first, with its tests — it is the contract everything else reads.
2. Prefix-collision function + tests (reuse the overlap rule already written in the story standard).
3. verify-detect + tests, one detector per manifest type.
4. CLI entrypoint in bin/ wiring the three, argument parsing last.
5. package.json script for local invocation.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
CLAUDE.md: runtime code ships with unit tests. That applies here and the acceptance criteria enforce it — pure-logic units only, no LLM calls, CI-safe.

The prefix-collision rule already exists in prose in skills/backlog-plan/reference/story-standard.md § Scope: two paths collide if either is a prefix of the other. Port it exactly; do not invent a second definition.

zod v4 and @types/bun are already dependencies — no new deps expected. If one is genuinely needed, say so in the report rather than adding it quietly.

Verify: bun run lint && bun run typecheck && bun run test, plus running each subcommand against this repo by hand.

Delivered. src/workflow/{schema,collisions,verify-detect}.ts (pure) + bin/backlog-workflow.ts (impure glue: fs + backlog CLI). Schema is zod-strict with unrecognized_keys expanded to field-level paths (e.g. 'pr.mode', 'oops'). Collision uses SEGMENT-based prefix (not raw string) so hooks/dad-joke does not collide with hooks/dad-joke-2. verify-detect: node from package.json scripts (lint/typecheck/test/build, pm from lockfile), python (pytest, +ruff if [tool.ruff]), go, rust; empty list for no manifest. 17 new unit tests; full suite 198 pass; lint (no new warnings) + typecheck green. Manual e2e in-repo: verify-detect -> bun run lint/typecheck/test; validate rejects bad pr mode + unknown key with field paths; collisions DIP-7.5 -> DIP-7.4/7.6/7.11 (all covered by dep edges). No new deps (zod v4 + @types/bun already present).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Shipped the workflow config schema and the backlog-workflow CLI. src/workflow/ holds three pure, unit-tested modules: a zod-strict schema for .claude/backlog-workflow.json that rejects unknown keys with field-level paths; a segment-based References prefix-collision check ported verbatim from the story standard (so hooks/dad-joke does not falsely collide with hooks/dad-joke-2); and stack-aware verify detection for node/bun, python, go and rust that returns [] for an unrecognised repo. bin/backlog-workflow.ts wires them into validate / collisions / verify-detect subcommands, running via ${CLAUDE_PLUGIN_ROOT}/bin with no build step. 17 new tests (198 total green); lint and typecheck clean; all three subcommands verified by hand against this repo. Unblocks DIP-7.5-7.8, 7.10, 7.11.
<!-- SECTION:FINAL_SUMMARY:END -->
