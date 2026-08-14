# dipsaus-ai

An open-source toolkit of **skills, hooks, an MCP, and a workflow CLI** for working with Claude
(or any AI CLI), packaged as a **single Claude Code plugin**. Install the whole thing from GitHub,
or copy a self-contained skill into your own `~/.claude/skills/`.

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
This registers every skill (`skills/`), the hooks (`hooks/`), the reviewer agent (`agents/`), the
workflow CLI (`bin/`) and the example MCP (`.mcp.json`) at once. Paths use `${CLAUDE_PLUGIN_ROOT}`,
so they resolve wherever the plugin is installed. Requires [bun](https://bun.sh) on your PATH —
everything runs as TypeScript, no build step.

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
| Hooks | `hooks/` | event handlers registered in `hooks/hooks.json`; `dad-joke/` tells you a joke on long turns; `backlog-guard/` is a PreToolUse git guard for the backlog workflow |
| Agents | `agents/` | subagent definitions; `story-reviewer.md` is the backlog-deliver review gate |
| CLI | `bin/` | `backlog-workflow.ts` — config validate, References-collision, verify-detect (read by the backlog-* skills) |
| MCP | `mcp/` | TypeScript MCP server(s), run by bun; `example/` exposes a `hello` tool |
| Plugin manifest | `.claude-plugin/` | `plugin.json` + `marketplace.json` |
| Backlog | `backlog/` | work tracked with [Backlog.md](https://github.com/MrLesk/Backlog.md) — markdown tasks, `backlog` CLI |

Dev-only directories (`tests/`, `.claude/`) are ignored by the plugin loader.

### Skills

| Skill | Command | Does |
|-------|---------|------|
| `react-architecture` | — | Reviews (default) or refactors React/TypeScript components against strict architecture standards: single-responsibility hard caps, compound-component composition, state/data boundaries. Self-contained — copy the folder out. |
| `backlog-init` | `/backlog-init` | Bootstraps the workflow in any repo: scans stack/scripts/base-branch, interviews only the gaps, writes a validated `.claude/backlog-workflow.json`, and runs `backlog init` when no backlog exists. |
| `backlog-plan` | `/backlog-plan` | Grills you into a well-formed backlog: an epic + AI-first stories meeting a story standard, then **materializes on approval** via the Backlog.md CLI. Also **amends** an existing story and **refuses cross-epic scope collisions**. |
| `backlog-deliver` | `/backlog-deliver DIP-1.1` | Drives **one** story from To Do to Done in an isolated git worktree on its `DIP-1.1/<slug>` branch: readiness gate → implement/verify/**commit** loop (autonomous, every commit green) → **independent reviewer gate** → one push → PR per the repo's `pr.mode` (printed link, or opt-in draft via `gh`). Handles `Type: spike` via research + interview. |
| `backlog-run` | `/backlog-run` | Orchestrates **parallel** delivery: selects the N ready, non-colliding, unclaimed stories (N = `parallelism.maxAgents`), presents the batch for one approval, then dispatches one `backlog-deliver` worker per story (each in its own worktree), isolates any failure, and reports mixed per-story outcomes. |

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

## Backlog workflow (init · plan · deliver · run)

Four skills turn [Backlog.md](https://github.com/MrLesk/Backlog.md) (markdown-native tasks,
`backlog` CLI) into a standards-driven, AI-runnable workflow in **any** repo, of any stack. Unlike
`react-architecture`, this suite is **plugin-only** — the skills share a bun CLI
(`bin/backlog-workflow.ts`), guard hooks (`hooks/backlog-guard/`) and a reviewer agent
(`agents/story-reviewer.md`), so install the plugin rather than copying a folder.

```
/backlog-init             → scan repo → interview gaps → write .claude/backlog-workflow.json (+ backlog init)
                            → empty repo? interview purpose → README + one bootstrap commit
/backlog-plan             → challenge the goal → interview → draft epic + stories → approve
                            → materialize on a plan/<epic-id> branch (PR per pr.mode)
/backlog-deliver DIP-1.1  → gate (claim + collisions) → auto-isolate + branch DIP-1.1/<slug>
                            (main checkout when quiet, git worktree when busy)
                            → implement → verify → commit (loop) → reviewer gate → push once
                            → PR per pr.mode (printed link, or opt-in draft via gh)
/backlog-run              → select N ready non-colliding stories → approve batch
                            → dispatch N backlog-deliver workers (one per story, own worktree)
                            → isolate failures → mixed per-story report
```

**Story standard** — every story: one outcome · concrete title · objective acceptance criteria ·
real dependencies · pickup-sized · verifiable · declared scope (References) · a named branch.
Optional: plan/notes, `needs-refinement`, `needs-info`, `Type: spike`. Ids are Backlog.md's own
(epic `DIP-4` → stories `DIP-4.1`, `DIP-4.2`); all content lives in the task file, written only via
the CLI. `backlog-plan` also **amends** a story and **refuses cross-epic References collisions**.
Full contract: `skills/backlog-plan/reference/`.

**Auto-isolated, parallel-safe delivery** — isolation is **auto-detected**, not a config flag:
`backlog-deliver` works in the main checkout when the repo is quiet and cuts its own `git worktree`
when it is busy (another story already in flight), so several
agents can run at once. Pickup is refused when a story is already claimed (its `<id>/<slug>` branch
exists) or when its References collide with an in-flight story (`backlog-workflow collisions <id>`).
The run-vs-deliver split: **deliver** isolates only under detected concurrency, whereas **run**
(below) dispatches N workers at once and therefore **always** isolates. See
`skills/backlog-deliver/reference/parallel-delivery.md`.

**Parallel orchestration** — `/backlog-run` is the dispatcher: it selects the N ready, non-colliding,
unclaimed stories (N = `parallelism.maxAgents`), presents the batch for one approval, then runs one
`backlog-deliver` worker per story (each a plain subagent owning its own worktree), serializing the
pushes and isolating any failure so a stuck story never sinks the batch. See
`skills/backlog-run/reference/orchestration.md`.

**Review gate** — before the push, an independent `story-reviewer` subagent sees only the diff and
the story contract and returns a JSON verdict; an unmet acceptance criterion or a scope violation
**blocks the push** and re-enters the loop (capped, then escalates). See
`skills/backlog-deliver/reference/review-and-pr.md`.

**Git + PR contract** — one branch per story, `<id>/<slug>`, cut from the base; commits are
**autonomous** and **verify runs green before every commit** (no WIP commits); **one push** at the
end. PR opening is per-repo via `pr.mode`: **`link`** (default) prints a compare link you open with
the **git CLI only, no `gh`**; **`create`** opts into `gh pr create --draft`, degrading to a link
when `gh` is missing. The contract is enforced by the `backlog-guard` PreToolUse hook, which blocks
commits on the base branch, `git add -A`, base-branch pushes, `--no-verify`, and `gh`/`glab` in
link mode — and no-ops in any repo without a workflow config.

**Config** — per-repo settings live in `.claude/backlog-workflow.json` (schema + reader in
`bin/backlog-workflow.ts`): `parallelism.maxAgents`, `worktree` (`path` / `install` /
`includeGitignored` — isolation itself is auto-detected, with no on/off flag), `verify`,
`pr.mode`, `review`, `backlog`. `backlog-init` writes and validates it. Backlog.md's own `backlog/config.yml` still
carries `task_prefix` and must keep `auto_commit: false` (delivery owns every commit). Verify
commands are resolved by `backlog-workflow verify-detect` (node/bun, python, go, rust), falling
back to per-story checks + self-review — so a repo with no pipeline still works.

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
