# dipsaus-ai

Open-source toolkit of Claude / AI-CLI **skills + one MCP**, packaged as a **single Claude
Code plugin** via a marketplace. GitHub-hosted, not published to npm.

## Architecture
- **Repo root IS the single plugin.** `.claude-plugin/{plugin,marketplace}.json` at root;
  `skills/` and `.mcp.json` at root (plugin components must live inside the plugin dir).
- Install everything: `/plugin marketplace add dipsaus9/dipsaus-ai`.
- Install one skill standalone: copy `skills/<name>/` into `~/.claude/skills/`.
- Stack: **bun** (pkg manager/runtime), **oxlint** (lint), **Vitest** (test),
  **TypeScript** (`tsc --noEmit`). Dev dirs (`tests/`, `.claude/`) are ignored by the
  plugin loader.
- Skills are self-contained: `SKILL.md` carries the standards inline, so a skill folder
  works when copied out of the repo. Optional `reference/` for long-form contracts.
- Every manifest description (`package.json`, `.claude-plugin/plugin.json`,
  `.claude-plugin/marketplace.json`) is user-facing. When the repo's surface changes,
  update all three — they drift silently otherwise.

## Worktrees
This repo is configured for Claude Code's [native worktrees](https://code.claude.com/docs/en/worktrees).
**Minimum Claude Code version: `2.1.200`** — below it, project-scope plugins do not load inside a
worktree, so this repo's own skills would be missing exactly where they're needed.

- Worktrees land at `.claude/worktrees/<name>/` on branch `worktree-<name>`. Claude owns both names.
  The directory is git-ignored — it is a checkout, not a source.
- `worktree.baseRef` is pinned to `"fresh"` in the shared `.claude/settings.json`: every worktree
  branches from `origin/HEAD`, never from your local `HEAD`.
- `.worktreeinclude` copies `.claude/settings.local.json` into each new worktree. It deliberately
  does **not** copy `node_modules` — run `bun install` in a fresh worktree before anything else.

## Planned work — read the backlog, not this file
This file describes what **exists**. Anything not yet built lives in `.backlog/`, which is
the single source of truth for it and changes as stories are planned and delivered — never
mirror it here.

Before starting work, read the current state: `backlog status`, then the epic and the story
doc at `.backlog/stories/<PREFIX>-<n>.md`. New component types (e.g. a `hooks/` directory)
arrive that way — the epic's acceptance criteria and the stories' `done-when` carry the
design constraints. Treat them as binding, and add the resulting conventions to Architecture
above only once the code is on disk.

The **story standard** (what makes an item ready, `[PREFIX-n]` ids, done-when, deps, companion
docs) is owned by this repo's own `backlog-plan` / `backlog-deliver` skills — see
`skills/backlog-plan/reference/`. Use the skills rather than driving the CLI by hand.

## Commands
```bash
bun install          # install deps (bun is the sole package manager)
bun run lint         # oxlint (correctness=error)
bun run typecheck    # tsc --noEmit
bun run test         # Vitest unit — deterministic, CI-safe
```
CI runs exactly these three. Note `test` currently passes with **no test files**
(`--passWithNoTests`) — the suite was removed in `968212f`, so `bun run test` green
currently proves nothing. Any story that adds runtime code must add unit tests with it.

## Working agreement
- **Review before commit.** Finish the work, run lint/typecheck/test, summarise the diff,
  and wait for approval before `git commit`. Never auto-commit at end of a story.
- **Git identity.** Use the user's own git config — never pass `-c user.name`/`-c user.email`.
- **Per-user state.** `.claude/settings.local.json` is git-ignored; `settings.json` is shared.
