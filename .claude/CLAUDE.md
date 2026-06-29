# dipsaus-ai

Open-source toolkit of Claude / AI-CLI **skills + one MCP**, packaged as a **single
Claude Code plugin** via a marketplace. Core goal: an **eval harness that tests each
skill against the author's own standards**. GitHub-hosted, not published to npm.

## Architecture
- **Repo root IS the single plugin.** `.claude-plugin/{plugin,marketplace}.json` at root;
  `skills/` and `.mcp.json` at root (plugin components must live inside the plugin dir).
- Install everything: `/plugin marketplace add dipsaus9/dipsaus-ai`.
- Install one skill standalone: copy `skills/<name>/` into `~/.claude/skills/`.
- Stack: **bun** (pkg manager/runtime), **oxlint** (lint), **Vitest** (test),
  **TypeScript** (`tsc --noEmit`). Dev dirs (`fixtures/`, `tests/`, `.claude/`) are
  ignored by the plugin loader.
- Skill eval: headless runner (`AI_CLI ?? 'claude' -p`) runs a skill on a fixture, an
  LLM judge (also via `claude -p`) scores output against a rubric, assert score ≥ 80.
  **Local-only, on demand (`bun run test:eval`).** Uses the logged-in `claude` CLI session
  (subscription) — **no `ANTHROPIC_API_KEY` needed**. CI runs only oxlint + typecheck +
  Vitest unit.

## Backlog conventions (MANDATORY — applies to every item, now and in the future)
Work is tracked with the `backlog` CLI (`.backlog/`). Model: **task = epic**,
**subtask = executable story**. Every backlog item MUST have, before it is considered
ready:

1. **Clear statement of what needs to happen** — concrete, unambiguous scope.
   - Epics (tasks): in the `--description`.
   - Stories (subtasks): in a precise `--title` (subtasks have no description field).
2. **Acceptance criteria** — objective, checkable pass/fail conditions.
   - Epics: `--acceptance` (one flag per criterion).
   - Stories: `--done-when` (one flag per criterion).
3. **Dependencies** — `--depends-on` (stories) reflecting real ordering.

No item is "ready" with an empty acceptance/done-when list. When adding future skills,
plugins, or MCPs, follow this same structure.

## Commands
```bash
bun install          # install deps (bun is the sole package manager)
bun run lint         # oxlint (correctness=error; fixtures/ ignored)
bun run typecheck    # tsc --noEmit
bun run test         # Vitest unit project only — deterministic, CI-safe
bun run test:eval    # Vitest eval project — LLM-judge skill evals, local + billed
```
Backlog: `backlog status`, `backlog task plan <id>`, `backlog subtask move <id> <status>`
(statuses: queued · planned · running · waiting · review · completed · blocked · canceled).

## Working agreement
- **Review before commit.** Finish the work, run lint/typecheck/test, summarise the diff,
  and wait for approval before `git commit`. Never auto-commit at end of a story.
- **Git identity.** Use the user's own git config — never pass `-c user.name`/`-c user.email`.
- **Per-user state.** `.claude/settings.local.json` is git-ignored; `settings.json` is shared.
- **Eval auth.** `test:eval` drives the local `claude` CLI (logged-in session), so it needs
  no API key — but it does consume your subscription and is non-deterministic. Judge model
  via `JUDGE_MODEL` (default `sonnet`), skill runner via `AI_CLI`. Never run it in CI.
