---
name: flow-init
description: "[flow suite v2 — STUB, not yet implemented] Bootstrap the flow workflow in any repo: scan the repo for stack, scripts and base branch, interview only for what the scan cannot settle, then write a schema-valid .claude/backlog-workflow.json and initialise a Backlog.md project when none exists. Part of the flow-* suite alongside flow-plan and flow-deliver. Invoked as /flow-init."
disable-model-invocation: true
---

# flow-init — bootstrap the flow workflow in a repo (STUB)

> **Status: not yet implemented.** This is a placeholder skeleton created by DIP-7.4 so the
> substance story (DIP-7.8) has a home. It performs no work yet. Do not rely on it.

## Intended scope (delivered by DIP-7.8)

`flow-init` makes the flow-* suite usable in a repo of any stack, without the user answering
questions the repo already answers:

1. **Scan** the repo for package manager and lockfile (node/bun, python, go, rust, java, php,
   ruby, dotnet), existing lint/test/build scripts, the base branch, and whether a Backlog.md
   project already exists — reusing the `verify-detect` logic shipped in the workflow CLI
   (`bin/backlog-workflow.ts`), never re-deriving detection here.
2. **Interview** only for what the scan cannot settle — task prefix (proposed from the repo name),
   `parallelism.maxAgents`, worktree on/off, `pr.mode`, reviewer model — one question at a time,
   each with a recommendation.
3. **Write** a `.claude/backlog-workflow.json` that passes `backlog-workflow validate`, and run
   `backlog init` with the resolved flags when no backlog exists (never re-initialising one, never
   flipping `auto_commit` off `false`).
4. **Guard** against clobbering an existing config without confirmation, and **print** the resolved
   verify command list so the user can see what delivery will run before trusting it.

## Contracts it shares

- Config schema + CLI: `bin/backlog-workflow.ts`, `src/workflow/` (DIP-7.3).
- Story standard the planned backlog must meet: `../flow-plan/reference/story-standard.md`.
