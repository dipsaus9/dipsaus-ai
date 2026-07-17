# `.backlog/standards.json` — project config

Per-project config both skills read. **Written only when something can't be inferred.** A vanilla
frontend repo needs at most `{ "prefix": "DIP" }`; everything else is derived.

## Schema

```jsonc
{
  // REQUIRED once chosen. The JIRA-style story prefix. Human-picked, then frozen.
  "prefix": "DIP",

  // OPTIONAL. The repo's baseline verify commands, run for every story during delivery.
  // A single string, OR a list run in order (ALL must pass). Omit to auto-detect from
  // package.json scripts (see resolution below). Omit entirely on a repo with no checks —
  // delivery falls back to per-story done-when + self-review.
  "verify": ["bun run lint", "bun run typecheck", "bun run test"],

  // OPTIONAL. Delivery gates. Absent → the safe defaults shown.
  "gates": {
    "tdd": false,                     // require a failing test before code
    "plan_gate": false,               // require plan approval before implementing
    "external_review": null           // e.g. "/codex:review --wait"; null = self-review only
  }
}
```

## What is NOT configurable — the git contract

`gates.commit` and `gates.deliver` no longer exist. Branching, committing and delivery are a
**fixed contract** owned by `backlog-deliver` (see its `## Git contract`), identical in every repo:

- one branch per story, named `<PREFIX>-<n>/<slug>`, cut from the base;
- commits on that branch are **autonomous** — no approval — and **every commit is green**
  (verify runs immediately before each one);
- **one push** at the end, and the human opens the PR from a printed compare link;
- **git CLI only** — never `gh` / `glab` / a host API.

A repo that wants a different git workflow does not get one by config; it changes the skill.

## Base branch resolution

The branch a story is cut from and compared against: `.backlog/config.toml` `default_branch`,
else the remote's default branch. Not a `standards.json` field.

## Prefix derivation

When no `prefix` is set, `backlog-plan` proposes one and asks the user to confirm before freezing:

1. From `package.json` `name` (or the git remote repo name): take the initials of hyphen/scope
   segments, or the first 3–4 letters, uppercased. `dipsaus-ai` → `DIP`; `acme-web` → `AW` or `ACME`.
2. Present the proposal, let the user override, then write `{ "prefix": "<chosen>" }`.

## Verify resolution (delivery)

`verify` is one command or a **list** of commands. Order used by `backlog-deliver`:

1. `standards.json` `verify` if present → run **each** command in order; all must pass.
2. Else **auto-detect from `package.json` scripts** → build the list from those that exist, in this
   order: `lint`, `typecheck`, `test`, `build`. Run each (all must pass). **Skip** long/interactive/
   billed scripts by name: `test:eval`, `e2e`, anything matching `*:watch` or `*:dev`.
3. Else (no config, no package.json scripts) → **degrade**: rely on per-story `Verify` /
   `Done-when` + self-review. Never a hard failure; the skill uses a pipeline if one exists.

Per-story `Verify` (in the story doc) runs **in addition to** the global list — story-specific
proof on top of the repo baseline.

## Story-doc location

Companion docs live at `.backlog/stories/<PREFIX>-<n>.md` (see `story-template.md`).
