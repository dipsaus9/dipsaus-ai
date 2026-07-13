# dipsaus-ai

An open-source toolkit of **skills, hooks, and an MCP** for working with Claude (or any AI
CLI), packaged as a **single Claude Code plugin**. Install the whole thing from GitHub, or
copy one skill into your own `~/.claude/skills/`.

Not published to npm. `bun` · `oxlint` · `Vitest` · `TypeScript`.

## Install

### Everything (the plugin)

In Claude Code:

```
/plugin marketplace add dipsaus9/dipsaus-ai
/plugin install dipsaus-ai@dipsaus-ai
```

`dipsaus-ai@dipsaus-ai` is `<plugin>@<marketplace>` — both are named `dipsaus-ai`.
This registers every skill (`skills/`) and the example MCP (`.mcp.json`) at once. The MCP
entry uses `${CLAUDE_PLUGIN_ROOT}`, so its path resolves wherever the plugin is installed.
Requires [bun](https://bun.sh) on your PATH — the MCP server runs as TypeScript, no build
step.

### A single skill, standalone

Each skill is self-contained (`SKILL.md`, standards inline), so copy just the folder into
your user skills directory — no plugin, no build:

```bash
git clone https://github.com/dipsaus9/dipsaus-ai.git
cp -r dipsaus-ai/skills/react-architecture ~/.claude/skills/
```

### The MCP, standalone

Clone, install deps, then point your MCP config at an absolute path (outside the plugin
there is no `${CLAUDE_PLUGIN_ROOT}`):

```bash
git clone https://github.com/dipsaus9/dipsaus-ai.git
cd dipsaus-ai && bun install   # pulls @modelcontextprotocol/sdk + zod
```

```jsonc
// ~/.claude.json or a project .mcp.json — "mcpServers" entry:
{
  "mcpServers": {
    "dipsaus-example": {
      "command": "bun",
      "args": ["/absolute/path/to/dipsaus-ai/mcp/example/server.ts"]
    }
  }
}
```

The server exposes one `hello` tool.

## Contents

The repo root **is** the plugin: plugin components must live inside the plugin directory,
so `skills/`, `mcp/`, and `.mcp.json` sit at the root alongside `.claude-plugin/`.

| Type | Path | Notes |
|------|------|-------|
| Skills | `skills/` | one folder per skill: `SKILL.md` (+ optional `reference/`) |
| MCP | `mcp/` | TypeScript MCP server(s), run by bun; `example/` exposes a `hello` tool |
| Plugin manifest | `.claude-plugin/` | `plugin.json` + `marketplace.json` |
| Backlog | `.backlog/` | work tracked with the [`backlog` CLI](https://github.com/osmove/backlog) |

Dev-only directories (`tests/`, `.claude/`) are ignored by the plugin loader.

### Skills

| Skill | Command | Does |
|-------|---------|------|
| `react-architecture` | — | Reviews (default) or refactors React/TypeScript components against strict architecture standards: single-responsibility hard caps, compound-component composition, state/data boundaries. |
| `backlog-plan` | `/backlog-plan` | Grills you into a well-formed backlog: an epic + AI-first stories meeting a story standard, then **materializes on approval** — subtasks, companion docs, config. |
| `backlog-deliver` | `/backlog-deliver DIP-12` | Drives **one** story `[PREFIX-n]` from queued to done: readiness gate → guarded implement/self-check/verify loop → commit (id-referenced) → branch + push. Handles `Type: spike` stories via a research + interview loop. |

## Backlog workflow skills

`backlog-plan` and `backlog-deliver` turn the [`backlog` CLI](https://github.com/osmove/backlog)
into a standards-driven, AI-runnable workflow in **any** repo — install the plugin and they
work everywhere. They form a loop: **plan** a backlog, then **deliver** its stories one at a
time.

```
/backlog-plan            → interview → draft epic + [DIP-n] stories → approve → materialize
/backlog-deliver DIP-12  → gate → implement → verify → commit + push
                           (a spike spawns new [DIP-n] stories, feeding back into the plan)
```

**Story standard** — every story: one outcome · concrete title · objective `done-when` ·
real `depends-on` · pickup-sized · verifiable. Optional: technical notes, `needs-refinement`,
`needs-info`, `Type: spike`. Each carries a JIRA-style id `[PREFIX-n]` (derived from the
subtask number) and a companion doc `.backlog/stories/<PREFIX>-<n>.md`. Full contract:
`skills/backlog-plan/reference/`.

**Config** — auto-inferred; write only what can't be. `.backlog/standards.json`:

```jsonc
{
  "prefix": "DIP",                                  // JIRA-style story key (asked once)
  "verify": ["bun run lint", "bun run typecheck"],  // optional; else auto-detected from package.json
  "gates": { "commit": "require-approval", "deliver": "push" }  // optional; safe defaults shown
}
```

Verify falls back to `package.json` scripts (`lint`/`typecheck`/`test`/`build`), then to
per-story checks + self-review — so a repo with no pipeline still works.

## Roadmap

Everything above is what ships today. Planned work lives in the backlog under `.backlog/`
— epics and their stories, each with acceptance criteria — and is kept current there
rather than mirrored into this README. Browse `.backlog/stories/`, or run `backlog status`
with the [`backlog` CLI](https://github.com/osmove/backlog).

## Development

```bash
bun install
bun run lint        # oxlint (correctness = error)
bun run typecheck   # tsc --noEmit
bun run test        # Vitest unit — deterministic, CI-safe
```

CI (`.github/workflows/ci.yml`) runs exactly those three on push to `main` and on every PR.

Work is tracked with the `backlog` CLI under `.backlog/`. See `.claude/CLAUDE.md` for
architecture and working conventions.

## License

[MIT](./LICENSE) © 2026 dipsaus9
