---
name: backlog-plan
description: Interview the user into a well-formed backlog for any repo using the backlog CLI (osmove/backlog) + Claude. Runs a grill-style, one-question-at-a-time session, decomposes the work into an epic + AI-first stories that meet the story standard ([PREFIX-n] ids, done-when, deps, companion docs), then materializes it on approval — subtasks, story docs, and .backlog/standards.json. Use when asked to "plan a backlog", "create stories", "grill me into a backlog", "break this down into stories", "set up the backlog", or invoked as /backlog-plan.
---

# backlog-plan — grill a well-formed backlog into existence

You turn a vague goal into a **standard-conformant backlog** the delivery skill can pick up
without guessing. You interview first, decompose second, and **materialize only on approval**.

Pairs with **`backlog-deliver`**, which executes one story end-to-end. This skill *writes* the
backlog those runs consume.

**Authority:** the project's `CLAUDE.md` / `AGENTS.md` apply at every step. Never override a hard
rule; on conflict, stop and ask. The backlog CLI is the source of truth — mutate it only via the
CLI, never by hand-editing `.backlog/*.yaml`.

**Read first:**
- `reference/story-standard.md` — the contract every story must meet.
- `reference/story-template.md` — the companion-doc format you write per story.
- `reference/standards-schema.md` — `.backlog/standards.json` + prefix/verify resolution.

---

## Golden rules

- **Draft, then materialize.** Nothing is written to the backlog until the user approves the whole
  tree. A half-finished interview must never leave partial subtasks behind.
- **One question at a time.** Never batch. Each question carries **your recommended answer** and the
  trade-off. Prefer answering from the repo over asking (explore the codebase first).
- **Every story meets the standard.** Six required items; flag anything unresolved as
  `needs-refinement` / `needs-info` rather than inventing scope.
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
   - Existing backlog: `backlog task list` / `backlog subtask list` and `.backlog/stories/` — what's
     already planned or done, so the new epic fits and doesn't duplicate.
3. Detect the backlog environment:
   - `backlog status` — confirm a project exists (`backlog init` if not).
   - The target `--repository` id (`backlog repositories list` or `.backlog/config.toml`).
   - `.backlog/standards.json` — read `prefix`, `verify`, `gates` if present.
   - The git remote (host + owner/repo).

Use this context to ask sharper questions and to answer as many as possible yourself — a
well-read intake turns a long grill into a short one.

## Step 1 — Establish the prefix

- If `standards.json` has a `prefix`, use it.
- Else propose one (see `standards-schema.md` derivation), **ask the user to confirm**, and remember
  it for Step 6. Do not write the file yet.

## Step 2 — Grill (the interview)

Walk the decision tree one question at a time, resolving dependencies between decisions in order.
For each question: state it, give **your recommended answer** with the reasoning, and let the user
decide. Explore the codebase to answer anything the repo already settles — don't ask what you can
read. Continue until scope, boundaries, and ordering are pinned.

Surface, and resolve or explicitly defer, every open question — an unresolved one becomes a story's
`needs-info`.

## Step 3 — Decompose against the standard

Turn the resolved design into an **epic + stories**:

- **Epic (task):** the coarse grouping. Give it a description + acceptance criteria.
- **Stories (subtasks):** each meets `reference/story-standard.md` — one outcome, concrete title,
  objective done-when, real depends-on, pickup-sized, verifiable. Split anything that needs "and".
- Mark research/decision work as `Type: spike`. Mark not-yet-ready work `needs-refinement` /
  `needs-info` instead of padding it with guesses.
- Order stories by real dependencies.

## Step 4 — Draft the companion docs

For each story, draft its `.backlog/stories/<PREFIX>-<n>.md` content using `story-template.md`
(the `<n>` is a placeholder until Step 6 assigns real subtask numbers). Draft the schedulable
fields too: title, done-when, depends-on, scope, risk.

## Step 5 — Present the tree

Show the whole thing before writing anything: epic → stories with proposed `[PREFIX-n]` ids,
one-line outcomes, done-when counts, dependency edges, and any `needs-refinement` / `needs-info`
flags. Iterate with the user until they approve. **Do not materialize without explicit approval.**

## Step 6 — Materialize (on approval)

Write everything atomically-ish, in order. `[PREFIX-n]` requires the native number, which only
exists after creation — so create, read the number, then backfill the id.

1. **Config:** if `prefix` was not already set, write `.backlog/standards.json`
   (`{ "prefix": "<chosen>" }` — plus `verify`/`gates` only if the user chose non-defaults).
2. **Epic:** `backlog task add --title "Epic: <name>" --description "…" --acceptance "…" [--acceptance …]`.
   Capture the `task_NNN` id.
3. **Each story, in dependency order:**
   - `backlog subtask add --task <epicId> --repository <repo> [--depends-on <subtaskId> …] --title "<plain title>"`
     → capture the assigned `subtask_NNN`.
   - Compute `[PREFIX-<N>]` from `N` and set the final title:
     `backlog subtask update subtask_NNN --title "[<PREFIX>-<N>] <scope>"`.
   - `backlog subtask update subtask_NNN --done-when "…" --done-when "…"` (add has no `--done-when`).
   - Set `--scope` / `--risk` on the add or via update as needed.
   - Write `.backlog/stories/<PREFIX>-<N>.md` from the drafted content (real id in the heading).
4. **Report:** list the created epic + `[PREFIX-n]` stories and where each doc lives. Leave stories
   `queued`; the delivery skill picks them up.

---

## Notes

- **Depends-on takes native subtask ids** (`subtask_012`), not `[PREFIX-12]`. Resolve the mapping
  when wiring dependencies.
- **`subtask add` has no `--done-when`** — always follow with `subtask update … --done-when`.
- One epic per run. Re-invoke to plan the next.
- If the repo has no `package.json` and no `verify`, that's fine — stories still carry per-story
  `Verify` in their docs; delivery degrades to self-review.
