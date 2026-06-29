# dipsaus-ai

A personal, open-source toolkit of **skills + an MCP** for frontend / full-stack work
with Claude (or any AI CLI), packaged as a **single Claude Code plugin**. Every skill is
tested against the author's own standards by an **eval harness**, so a skill ships only
when it behaves the way it's expected to.

> Status: early scaffolding. Sections marked _(stub)_ are finalised in a later task.

## Why this exists

AI CLIs are only as good as the skills, plugins, and MCPs you give them. This repo is a
clean, reproducible home for mine — with one rule: **a skill isn't "done" until it passes
an eval against my standards**. The first skill, `react-architecture`, takes deliberately
bad React as input and is scored on how well it improves the architecture. New skills,
plugins, and MCPs get added over time, each with the same test-first bar.

- **One plugin, à-la-carte parts.** The whole repo installs as one Claude Code plugin, or
  you can install a single skill on its own.
- **Tested, not vibes.** A headless run + LLM-judge rubric gives each skill a 0–100 score
  (pass ≥ 80). Local-only, on demand.
- **Clean + bun-first.** bun · oxlint · Vitest · TypeScript. No npm publishing — GitHub only.

## Install

### Everything (the plugin) _(stub — verified in st_013)_

```bash
/plugin marketplace add dipsaus9/dipsaus-ai
/plugin install dipsaus-ai@dipsaus-ai
```

This installs all skills and the MCP at once.

### A single skill, standalone _(stub — verified in st_013)_

Copy just the skill folder into your user skills directory:

```bash
git clone https://github.com/dipsaus9/dipsaus-ai.git
cp -r dipsaus-ai/skills/react-architecture ~/.claude/skills/
```

### The MCP, standalone _(stub — verified in st_013)_

Register the example server in your MCP config (`.mcp.json`). Details once the MCP lands.

## Contents

| Type | Path | Notes |
|------|------|-------|
| Skills | `skills/` | one folder per skill (`SKILL.md` + inline standards) |
| MCP | `mcp/` | TypeScript MCP server(s) |
| Plugin manifest | `.claude-plugin/` | `plugin.json` + `marketplace.json` (repo root = the plugin) |
| Fixtures | `fixtures/` | inputs for skill evals (e.g. bad React) |
| Tests | `tests/` | `unit/` (CI-safe) + `eval/` (LLM-judge, local) |

## Development

```bash
bun install
bun run lint        # oxlint
bun run typecheck   # tsc --noEmit
bun run test        # Vitest unit (deterministic, CI-safe)
bun run test:eval   # Vitest eval (LLM-judge; uses your logged-in claude CLI, no API key)
```

Work is tracked with the `backlog` CLI under `.backlog/`. See `.claude/CLAUDE.md` for
architecture and conventions.

## License

[MIT](./LICENSE) © 2026 dipsaus9
