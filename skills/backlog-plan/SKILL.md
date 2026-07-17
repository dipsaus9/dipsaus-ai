---
name: backlog-plan
description: Interview the user into a well-formed backlog for any repo using Backlog.md (MrLesk/Backlog.md) + Claude. Runs a grill-style, one-question-at-a-time session, decomposes the work into an epic + AI-first stories that meet the story standard (native DIP-n.m ids, acceptance criteria as done-when, dependencies, declared scopes via References, a named `<id>/<slug>` branch), then materializes it on approval — parent task + subtasks, all content in the task files via the CLI. Plans only: never cuts a branch or commits. Use when asked to "plan a backlog", "create stories", "grill me into a backlog", "break this down into stories", "set up the backlog", or invoked as /backlog-plan.
---

# backlog-plan — grill a well-formed backlog into existence

You turn a vague goal into a **standard-conformant backlog** the delivery skill can pick up
without guessing. You interview first, decompose second, and **materialize only on approval**.

Pairs with **`backlog-deliver`**, which executes one story end-to-end. This skill *writes* the
backlog those runs consume.

The backlog tool is **Backlog.md** ([MrLesk/Backlog.md](https://github.com/MrLesk/Backlog.md)):
markdown-native tasks in `backlog/tasks/`, driven entirely by the `backlog` CLI.

**Authority:** the project's `CLAUDE.md` / `AGENTS.md` apply at every step. Never override a hard
rule; on conflict, stop and ask. The CLI is the only writer — **never hand-edit files under
`backlog/`** (Backlog.md's own rule, and ours).

**Read first:**
- `reference/story-standard.md` — the contract every story must meet.
- `reference/story-template.md` — how each contract item maps onto a task's CLI-managed fields.
- `reference/config.md` — `backlog/config.yml` keys that matter + verify resolution.

---

## Golden rules

- **Draft, then materialize.** Nothing is written to the backlog until the user approves the whole
  tree. A half-finished interview must never leave partial tasks behind.
- **One question at a time.** Never batch. Each question carries **your recommended answer** and the
  trade-off. Prefer answering from the repo over asking (explore the codebase first).
- **Every story meets the standard.** Eight required items; flag anything unresolved with a
  `needs-refinement` / `needs-info` label rather than inventing scope.
- **No story ships unscoped.** Every story declares the paths it will touch as **References**
  (`--ref`). Scopes are what let two agents discover a collision *before* either writes a line —
  an unscoped story is unsafe to pick up in parallel, so materializing one is refused.
- **No story ships unbranched.** Every story's description names the branch delivery will cut,
  `<id>/<slug>` (`DIP-1.1/two-tier-joke-formatter`). You freeze it here so delivery can't
  improvise a different slug on a re-run — see `reference/story-standard.md` § Branch.
- **You plan; you never deliver.** This skill writes no code, cuts no branch, makes no commit. It
  leaves stories in **To Do** on the base branch. `backlog-deliver` owns the git contract end to end.
- **Stories are written for an AI to read and write** — explicit, structured, no human-only prose.

---

## Step 0 — Intake

1. Get the goal: what are we building / changing? One epic per invocation.
2. **Read the repo for context** (don't ask what the repo already tells you). Build a picture of the
   project before grilling:
   - `README.md` (and top-level docs) — what the project is, its vision, how it's run.
   - `CLAUDE.md` / `AGENTS.md` and `.cursor`/`.github` instructions — conventions and hard rules.
   - `package.json` — stack, scripts (for the verify default), dependencies; else the language's
     manifest (`pyproject.toml`, `go.mod`, `Cargo.toml`, …).
   - Directory layout + existing code near the goal — patterns to follow, prior art to reuse.
   - Existing backlog: `backlog task list --plain` and `backlog overview` — what's already planned
     or done, so the new epic fits and doesn't duplicate.
3. Detect the backlog environment:
   - `backlog/config.yml` exists → read `task_prefix`, `statuses`, `auto_commit`.
   - No backlog project → initialize one (ask the user to confirm the prefix first):
     `backlog init "<project>" --defaults --integration-mode cli --agent-instructions none
     --backlog-dir backlog --config-location folder --task-prefix <PREFIX>`.
   - The git remote (host + owner/repo) and default branch.

Use this context to ask sharper questions and to answer as many as possible yourself — a
well-read intake turns a long grill into a short one.

## Step 1 — Grill (the interview)

Walk the decision tree one question at a time, resolving dependencies between decisions in order.
For each question: state it, give **your recommended answer** with the reasoning, and let the user
decide. Explore the codebase to answer anything the repo already settles — don't ask what you can
read. Continue until scope, boundaries, and ordering are pinned.

Surface, and resolve or explicitly defer, every open question — an unresolved one becomes a
`needs-info` label on the story it blocks.

## Step 2 — Decompose against the standard

Turn the resolved design into an **epic + stories**:

- **Epic (parent task):** the coarse grouping, labelled `epic`. Description + acceptance criteria.
  Not picked up directly.
- **Stories (subtasks, `-p <epicId>`):** each meets `reference/story-standard.md` — one outcome,
  concrete title, objective done-when (acceptance criteria), real dependencies, pickup-sized,
  verifiable, **scoped** (References), **branched**. Split anything that needs "and".
- Mark research/decision work `Type: spike` (in the description). Mark not-yet-ready work with a
  `needs-refinement` / `needs-info` label instead of padding it with guesses.
- Order stories by real dependencies (`--dep`).
- **Then check the stories against each other for scope overlap.** Two stories with no dependency
  edge can still both rewrite the same file — the dependency graph will not tell you. Where
  References collide, either add the missing dependency edge or resplit so they don't, and say
  which you did. Leaving the collision in place means the two stories can never run in parallel.

## Step 3 — Draft each story's content

Draft, per story, everything Step 5 will pass to the CLI (see `reference/story-template.md` for
the exact field mapping):

- **Title** — concrete, what + where. No `[PREFIX-n]` prefix: the native id carries that.
- **Description** — the Outcome paragraph, then a `Type: deliverable | spike` line and a
  `Branch: <id>/<slug>` line. The id part stays a placeholder until Step 5 assigns real ids;
  the slug is frozen now: 2–4 words from the title, lowercase-hyphenated, no type prefix.
- **Acceptance criteria** (`--ac`, one per done-when item) — objective, checkable pass/fail.
- **References** (`--ref`, one per path) — the declared scope. Path-shaped
  (`hooks/dad-joke/config.ts`, `skills/backlog-plan/`), never prose.
- **Plan** (`--plan`) — the ordered implementation approach, when known.
- **Notes** (`--notes`) — technical notes, constraints, gotchas, per-story Verify steps.
- **Dependencies** (`--dep`) — by story id.
- **Priority / labels** as useful (`story` label on every story).

## Step 4 — Present the tree

Show the whole thing before writing anything: epic → stories with one-line outcomes, acceptance
criteria counts, dependency edges, **declared References**, **branch slugs**, and any
`needs-refinement` / `needs-info` flags. Call out any pair of stories whose References overlap, and
say whether you resolved it with a dependency edge or a resplit — that pair is the one that would
have broken a parallel run. Iterate with the user until they approve. **Do not materialize without
explicit approval.**

## Step 5 — Materialize (on approval)

**Preconditions — check every story before writing anything.** A story with no acceptance
criteria, no / prose-only References, or a missing / malformed Branch slug is **refused**: do not
create it, say which story failed and why, and resolve it with the user first. The three are what
make a story pickup-able — acceptance criteria decide when it is finished, References decide
whether it is safe to start, the branch decides where it lands.

Then, in order:

1. **Epic:**
   `backlog task create "Epic: <name>" -d "<description>" --ac "…" [--ac …] -l epic --plain`
   → note the assigned id (e.g. `DIP-4`).
2. **Each story, in dependency order** — one `create` carries everything:
   `backlog task create "<title>" -p <epicId> -d "<outcome + Type + Branch>" --ac "…" [--ac …]
   --ref <path> [--ref …] [--plan "…"] [--notes "…"] [--dep <storyId> …] -l story --plain`
   → note the assigned id (e.g. `DIP-4.1`), then finalize the branch line:
   `backlog task edit <id> -d "<same description with Branch: <id>/<slug>>"`.
   The description is the one field re-written after creation, because the branch embeds the id.
3. **Report:** list the created epic + story ids, each story's branch, and where the task files
   live (`backlog/tasks/`). Leave every story in **To Do** — and leave the working tree on the
   base branch. The delivery skill cuts the branches and makes the commits; you don't.

---

## Notes

- **Multi-line CLI input:** the CLI preserves input literally — `\n` sequences are NOT converted.
  Use real newlines inside quotes, or build the argument list programmatically (spawn with an args
  array) when the text is quoting-hostile. Avoid standalone `---` lines in any text field.
- **`--ac` / `--ref` / `--dep` are repeatable** on both `create` and `edit`. On `edit`, `--ac`
  *adds* criteria; remove with `--remove-ac <n>`.
- **Ids are native and immediate** — `create` prints the id; there is no backfill step. Epics get
  `DIP-n`; their subtasks get `DIP-n.m`.
- **`--plain` on every read** — never parse the interactive TUI output.
- One epic per run. Re-invoke to plan the next.
- If the repo has no `package.json` scripts, that's fine — stories still carry per-story Verify in
  their notes; delivery degrades to self-review (see `reference/config.md`).
