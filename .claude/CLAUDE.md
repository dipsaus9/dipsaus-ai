# dipsaus-ai

Open-source toolkit of Claude / AI-CLI **skills, hooks, an MCP + a workflow CLI**, packaged as a
**single Claude Code plugin** via a marketplace. GitHub-hosted, not published to npm.

## Architecture
- **Repo root IS the single plugin.** `.claude-plugin/{plugin,marketplace}.json` at root;
  `skills/`, `hooks/`, `agents/`, `bin/` and `.mcp.json` at root (plugin components must live
  inside the plugin dir). `hooks/` holds the dad-joke hooks + the `backlog-guard` PreToolUse git
  guard; `agents/` holds the `story-reviewer` subagent; `bin/backlog-workflow.ts` is the workflow
  CLI (config schema/validate, References-collision, verify-detect) read by the backlog-* suite.
- Install everything: `/plugin marketplace add dipsaus9/dipsaus-ai`.
- Install one skill standalone: copy `skills/<name>/` into `~/.claude/skills/`.
- Stack: **bun** (pkg manager/runtime), **oxlint** (lint), **Vitest** (test),
  **TypeScript** (`tsc --noEmit`). Dev dirs (`tests/`, `.claude/`) are ignored by the
  plugin loader.
- Most skills are self-contained: `SKILL.md` carries the standards inline, so a skill folder
  works when copied out of the repo (e.g. `react-architecture`). The **backlog-\* workflow suite
  is the exception — plugin-only**: `backlog-init` / `backlog-plan` / `backlog-deliver` /
  `backlog-run` share a bun CLI (`bin/backlog-workflow.ts`), guard hooks (`hooks/backlog-guard/`)
  and a reviewer agent (`agents/story-reviewer.md`), none of which survive copying one skill folder
  out. `backlog-run` orchestrates parallel delivery (N `backlog-deliver` workers in worktrees).
  Optional `reference/` for long-form contracts.
- Every manifest description (`package.json`, `.claude-plugin/plugin.json`,
  `.claude-plugin/marketplace.json`) is user-facing. When the repo's surface changes,
  update all three — they drift silently otherwise.

## Planned work — read the backlog, not this file
This file describes what **exists**. Anything not yet built lives in `backlog/` — tracked with
[Backlog.md](https://github.com/MrLesk/Backlog.md), markdown tasks driven by the `backlog` CLI —
which is the single source of truth for it and changes as stories are planned and delivered —
never mirror it here.

Before starting work, read the current state: `backlog task list --plain`, then the epic and its
stories (`backlog task <id> --plain`, e.g. `DIP-1.1`). New component types (e.g. a `hooks/`
directory) arrive that way — the epic's acceptance criteria and the stories' acceptance criteria
carry the design constraints. Treat them as binding, and add the resulting conventions to
Architecture above only once the code is on disk. **Never hand-edit files under `backlog/`** —
the CLI is the only writer.

The **story standard** (what makes an item ready, native `DIP-n.m` ids, acceptance criteria,
dependencies, References-as-scope, frozen branch) is owned by this repo's own `backlog-plan` /
`backlog-deliver` skills — see `skills/backlog-plan/reference/`. Use the skills rather than
driving the CLI by hand.

## Commands
```bash
bun install          # install deps (bun is the sole package manager)
bun run lint         # oxlint (correctness=error)
bun run typecheck    # tsc --noEmit
bun run test         # Vitest unit — deterministic, CI-safe
```
CI runs exactly these three. The unit suite is real again (dad-joke hooks, the eval runner, and
the `backlog-workflow` CLI + `backlog-guard` decision logic are covered), so `bun run test` green
is meaningful. Any story that adds runtime code must add unit tests with it.

## Working agreement
- **Commit freely on a story branch; ask everywhere else.** On a `<id>/<slug>` branch
  (`DIP-1.1/two-tier-joke-formatter`) commit without approval — split into small commits when it
  helps, and run lint/typecheck/test green immediately **before each** commit. On `main` or
  any non-story branch, the old rule stands: summarise the diff and wait for approval.
- **PR opening is per-repo.** Default (`pr.mode: link`): push once, print the compare link, the
  human opens it — **git CLI only, no `gh`/`glab`/host APIs**. Opt-in (`pr.mode: create` in
  `.claude/backlog-workflow.json`): delivery may run `gh pr create --draft`, degrading to a printed
  link when `gh` is missing or unauthenticated. Full rules: `skills/backlog-deliver/SKILL.md`
  § Git contract + `reference/review-and-pr.md`.
- **Git identity.** Use the user's own git config — never pass `-c user.name`/`-c user.email`.
- **Per-user state.** `.claude/settings.local.json` is git-ignored; `settings.json` is shared.
