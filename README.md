# dipsaus-ai

An open-source toolkit of **skills, hooks, and an MCP** for working with Claude (or any AI
CLI), packaged as a **single Claude Code plugin**. Install the whole thing from GitHub, or
copy one skill into your own `~/.claude/skills/`.

Not published to npm. `bun` · `oxlint` · `Vitest` · `TypeScript`.

Requires [bun](https://bun.sh) on your PATH — both the MCP server and the hooks run as
TypeScript, with no build step.

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
| Hooks | `hooks/` | event handlers registered in `hooks/hooks.json`; `dad-joke/` tells you a joke on long turns |
| MCP | `mcp/` | TypeScript MCP server(s), run by bun; `example/` exposes a `hello` tool |
| Plugin manifest | `.claude-plugin/` | `plugin.json` + `marketplace.json` |
| Backlog | `backlog/` | work tracked with [Backlog.md](https://github.com/MrLesk/Backlog.md) — markdown tasks, `backlog` CLI |

Dev-only directories (`tests/`, `.claude/`) are ignored by the plugin loader.

### Skills

| Skill | Command | Does |
|-------|---------|------|
| `react-architecture` | — | Reviews (default) or refactors React/TypeScript components against strict architecture standards: single-responsibility hard caps, compound-component composition, state/data boundaries. |
| `backlog-plan` | `/backlog-plan` | Grills you into a well-formed backlog: an epic + AI-first stories meeting a story standard, then **materializes on approval** — parent task + subtasks with all content in the task files, via the Backlog.md CLI. |
| `backlog-deliver` | `/backlog-deliver DIP-1.1` | Drives **one** story from To Do to Done on its own `DIP-1.1/<slug>` branch: readiness gate → implement/verify/**commit** loop (autonomous, every commit green, acceptance criteria checked off as met) → one push → a file-by-file summary + a compare link **you** open the PR from. git CLI only, never `gh`. Handles `Type: spike` stories via a research + interview loop. |

## The dad-joke hook

When a turn runs long, Claude tells you a dad joke while you wait. It renders to *you* — the
joke never enters Claude's context, so it can't derail the work.

```
🥁 Why did the developer go broke?
He used up all his cache.
```

The joke is styled so it reads as a joke, not another log line: always the 🥁 marker and the
setup/punchline structure, plus a **bold yellow punchline** in colour-capable terminals. With
colour off the output is plain text — no stray escape codes.

**Install.** It ships with the plugin — `/plugin install dipsaus-ai@dipsaus-ai` and it's on.
No configuration needed.

To run it standalone without the plugin, copy the folder and register the two entrypoints
yourself in `.claude/settings.json` (adjust the paths):

```bash
git clone https://github.com/dipsaus9/dipsaus-ai.git
cp -r dipsaus-ai/hooks/dad-joke ~/.claude/hooks/dad-joke
```

```jsonc
{
  "hooks": {
    "UserPromptSubmit": [
      { "hooks": [{ "type": "command", "command": "bun \"$HOME/.claude/hooks/dad-joke/on-user-prompt-submit.ts\"" }] }
    ],
    "PostToolUse": [
      { "matcher": "*", "hooks": [{ "type": "command", "command": "bun \"$HOME/.claude/hooks/dad-joke/on-post-tool-use.ts\"" }] }
    ]
  }
}
```

**Configuration.** All knobs are env vars, all optional:

| Variable | Default | Does |
|----------|---------|------|
| `DAD_JOKE_THRESHOLD_MS` | `30000` | How long a turn must run before the first joke. |
| `DAD_JOKE_COOLDOWN_MS` | `60000` | Minimum gap between jokes within a turn. |
| `DAD_JOKE_DISABLE` | *(unset)* | Set to `1` to switch the hook off entirely. |
| `DAD_JOKE_NO_COLOR` | *(unset)* | Set to `1` to drop the ANSI colour and render the joke as plain text (marker and structure stay). |
| `NO_COLOR` | *(unset)* | The [no-color.org](https://no-color.org) convention, also honoured: **any non-empty value** disables colour — including `NO_COLOR=0`, unlike this hook's own flags. |
| `DAD_JOKE_API` | *(unset)* | Set to `1` to fetch live jokes from [icanhazdadjoke.com](https://icanhazdadjoke.com) instead of the bundled pool. Off by default, so there is **no network call in the default path**. Bounded by an 800 ms timeout (`DAD_JOKE_API_TIMEOUT_MS`) and falls back silently to the bundled pool on any failure. |

So a 5-minute turn yields roughly 5 jokes, not 50. Set any of these in your shell or in
`.claude/settings.json` under `env`.

> **Set the `DAD_JOKE_*` flags to `1`, not `false`.** For `DAD_JOKE_DISABLE`,
> `DAD_JOKE_NO_COLOR` and `DAD_JOKE_API`, any non-empty value other than `0` counts as "on" —
> so `DAD_JOKE_DISABLE=false` would *disable* the jokes, the opposite of what it reads like.
> `0` is the one honoured "no" value. `NO_COLOR` is the deliberate exception: it follows the
> cross-tool convention, where any non-empty value — even `0` — kills the colour.

**Known limitation, by design.** No Claude Code hook is timer-driven, so "the turn is taking a
while" is approximated by the tool loop: a joke fires on the first tool call *after* the
threshold has passed. **A long turn with zero tool calls — pure extended thinking — stays
silent.** In practice long turns are tool loops, so this is rarely felt, but you should not
have to discover it by reading the source.

A broken hook can never break your session: both entrypoints wrap their entire body and always
exit 0. A malformed payload, a corrupt state file, a missing `jokes.json`, or an API timeout
costs you a joke and nothing else.

## Backlog workflow skills

`backlog-plan` and `backlog-deliver` turn [Backlog.md](https://github.com/MrLesk/Backlog.md)
(markdown-native tasks, `backlog` CLI) into a standards-driven, AI-runnable workflow in **any**
repo — install the plugin and they work everywhere. They form a loop: **plan** a backlog, then
**deliver** its stories one at a time.

```
/backlog-plan             → interview → draft epic + stories → approve → materialize (To Do)
/backlog-deliver DIP-1.1  → gate → branch DIP-1.1/<slug> → implement → verify → commit (loop)
                            → push once → summary + PR link (you open it)
                            (a spike spawns new stories, feeding back into the plan)
```

**Story standard** — every story: one outcome · concrete title · objective acceptance criteria ·
real dependencies · pickup-sized · verifiable · declared scope (References) · a named branch.
Optional: plan/notes, `needs-refinement`, `needs-info`, `Type: spike`. Ids are Backlog.md's own
(epic `DIP-4` → stories `DIP-4.1`, `DIP-4.2`), and all content lives in the task file itself —
written only via the CLI, never by hand. Full contract: `skills/backlog-plan/reference/`.

**Git contract** — fixed, not configurable, enforced by `backlog-deliver`:

- one branch per story, `<id>/<slug>` (`DIP-1.1/two-tier-joke-formatter`), cut from the base;
- commits on that branch are **autonomous** — no approval — split small when it helps, and
  **verify runs green immediately before every commit**. No WIP commits;
- **one push** at the end, then a summary of what changed and why, and a compare link;
- **you open the PR.** The skill uses the **git CLI only** — never `gh`, `glab`, or a host API.

**Config** — Backlog.md's own `backlog/config.yml` carries everything (`task_prefix` picked once
at init; `auto_commit` must stay `false` — the delivery skill owns every commit). Verify is
auto-detected from `package.json` scripts (`lint`/`typecheck`/`test`/`build`), falling back to
per-story checks + self-review — so a repo with no pipeline still works.

## Roadmap

Everything above is what ships today. Planned work lives in the backlog under `backlog/`
— epics and their stories, each with acceptance criteria — and is kept current there
rather than mirrored into this README. Browse `backlog/tasks/`, or run `backlog task list
--plain` with [Backlog.md](https://github.com/MrLesk/Backlog.md).

## Development

```bash
bun install
bun run lint        # oxlint (correctness = error)
bun run typecheck   # tsc --noEmit
bun run test        # Vitest unit — deterministic, CI-safe
```

CI (`.github/workflows/ci.yml`) runs exactly those three on push to `main` and on every PR.

The `react-architecture` skill has its own **eval harness** under `tests/eval/` — a
labeled fixture corpus, a runner driving headless `claude` calls (review scoring,
sandboxed apply grading with an LLM judge, skill-on/off A/B), and a committed regression
baseline. It is billed and strictly on-command (`bun run test:eval`), never part of CI —
see `tests/eval/README.md` for the full workflow.

Work is tracked with [Backlog.md](https://github.com/MrLesk/Backlog.md) under `backlog/`. See
`.claude/CLAUDE.md` for architecture and working conventions.

## License

[MIT](./LICENSE) © 2026 dipsaus9
