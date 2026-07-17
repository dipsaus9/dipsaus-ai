# Backlog.md config + verify resolution

What both skills read from the environment, and what is deliberately **not** configurable.
There is no separate standards file — Backlog.md's own `backlog/config.yml` plus the repo's
`package.json` carry everything.

## `backlog/config.yml` — the keys that matter

Written by `backlog init`; change via `backlog config` (interactive) — not by hand.

```yaml
task_prefix: "DIP"        # the story id prefix — human-picked at init, then frozen
statuses: ["To Do", "In Progress", "Done"]
auto_commit: false        # MUST stay false — backlog-deliver owns every commit
default_status: "To Do"
```

- **`task_prefix`** — the story id prefix. Set once at
  `backlog init --task-prefix <PREFIX>`; propose from the repo name (`dipsaus-ai` → `DIP`,
  `acme-web` → `AW` or `ACME`) and ask the user to confirm before initializing.
- **`auto_commit: false`** — non-negotiable. If a repo's config has it `true`, stop and ask: the
  git contract (green-per-commit, scoped staging, id-referenced messages) cannot hold if the
  backlog tool commits by itself.
- **`statuses`** — the skills use exactly `To Do` (plannable), `In Progress` (claimed), `Done`
  (delivered). Custom statuses are fine for humans but the skills never set anything else.

## What is NOT configurable — the git contract

Branching, committing and delivery are a **fixed contract** owned by `backlog-deliver` (see its
`## Git contract`), identical in every repo:

- one branch per story, named `<id>/<slug>`, cut from the base;
- commits on that branch are **autonomous** — no approval — and **every commit is green**
  (verify runs immediately before each one);
- **one push** at the end, and the human opens the PR from a printed compare link;
- **git CLI only** — never `gh` / `glab` / a host API.

A repo that wants a different git workflow does not get one by config; it changes the skill.

## Base branch resolution

The branch a story is cut from and compared against: the remote's default branch
(`git symbolic-ref refs/remotes/origin/HEAD`, else `git remote show origin`); no remote → ask.

## Verify resolution (delivery)

Order used by `backlog-deliver`:

1. **Auto-detect from `package.json` scripts** → build the list from those that exist, in this
   order: `lint`, `typecheck`, `test`, `build`. Run each (all must pass). **Skip**
   long/interactive/billed scripts by name: `test:eval`, `e2e`, anything matching `*:watch` or
   `*:dev`.
2. Else (no package.json / no scripts) → **degrade**: rely on the story's acceptance criteria +
   per-story Verify steps (in its notes) + self-review. Never a hard failure; use the language's
   own pipeline if one exists.

Per-story Verify steps (in the task's notes) run **in addition to** the baseline — story-specific
proof on top of the repo's checks.

## Where stories live

Tasks are markdown files under `backlog/tasks/` (`dip-1.1 - <slug>.md`), created and mutated
**only via the CLI**. Reads always use `--plain` (or `--json`); never parse the TUI, never edit
the files by hand.
