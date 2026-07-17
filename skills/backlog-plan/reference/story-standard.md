# Story standard

The contract every backlog story must meet. `backlog-plan` produces stories that satisfy it;
`backlog-deliver` refuses to start a story that violates the **required** items. Stories are
written **for an AI to read and write** — structured, explicit, unambiguous. No prose that
only a human can disambiguate.

A **story** is an executable subtask. A **task** is its parent epic (a coarse grouping, not
picked up directly).

## Required — every story

1. **One outcome.** A single shippable slice. If the title needs "and", split into two stories.
2. **Concrete title.** States *what* + *where* (area/files). No vague verbs ("improve", "handle").
3. **Done-when.** ≥1 objective, checkable pass/fail criterion. Never "works well" / "looks good".
   Each criterion is something a machine or a command can decide.
4. **Depends-on.** Real ordering by story id; no hidden prerequisites.
5. **Pickup-sized.** Completable in one sitting. Epic-sized ⇒ it is a *task*, not a story.
6. **Verifiable.** How you would *prove* it: a command, a test, or an observable behaviour.
   (This is what lets the delivery skill self-check honestly.)
7. **Declared scopes.** ≥1 file or directory path the story will touch, concrete enough that two
   stories' scopes can be compared for overlap **before** either is picked up. Lives in the doc's
   **Affected area** and mirrors to the subtask's `--scope`. An unscoped story cannot be safely
   handed to a parallel agent — see below.
8. **Named branch.** The exact branch delivery will cut: `<PREFIX>-<n>/<slug>`, in the doc's
   **Branch** section. Planned, not improvised at delivery time — see below.

## Scopes — the parallel-safety contract

Scopes exist so two agents can be told, before either writes a line, that their stories collide.

- **Path-shaped and comparable.** `hooks/dad-joke/config.ts`, or a directory like
  `skills/backlog-plan/`. Prose like "the config" or "the notification logic" is useless to an
  overlap check — reject it.
- **Overlap rule.** Two scopes collide if either path is a **prefix** of the other.
  `hooks/dad-joke/config.ts` collides with itself and with `hooks/dad-joke/`; it does not collide
  with `skills/backlog-plan/`.
- **Dependency edges do not imply file independence.** Two stories can be perfectly parallel on
  paper and still both rewrite the same file. A picker that only checks `depends-on` hands them out
  together and produces a guaranteed conflict. Scopes are what catch it.

## Branch — one story, one branch

The story's id owns a branch, and the branch is planned with the story:

```
<PREFIX>-<n>/<slug>            e.g.  DIP-12/parallel-agent-cap
```

- `<PREFIX>-<n>` is the id verbatim, uppercase, first. No type prefix in front of it
  (`feat/DIP-12/…` is wrong). The id-first shape is what makes a branch traceable back to a story
  by name alone, and what lets `backlog-deliver` detect "this story is already in progress" with a
  plain `git branch --list '<PREFIX>-<n>/*'`.
- `<slug>` — 2–4 words from the title, lowercase-hyphenated, no id repeated.
- **Planned, not improvised.** If delivery derives the slug itself, two runs of the same story can
  produce two different branches and the in-progress check silently misses. Planning it freezes it.
- One branch per story, never shared and never reused. `git` forbids a branch `DIP-12` alongside
  `DIP-12/slug` (a ref cannot be both file and directory) — the `<n>/` shape reserves the namespace.

## Optional — add when useful

- **Technical notes** — implementation guidance, constraints, links, gotchas.
- **`needs-refinement`** — the story is not yet ready; do not pick up until refined.
- **`needs-info`** — an open question blocks readiness; capture it, ask, resolve before pickup.
- **`Type: spike`** — a research/decision story. Its done-when is "question answered / decision
  recorded with rationale", not "tests pass". Delivery resolves it via web search + interview.

## Story id — `[PREFIX-n]`

- Every story carries a JIRA-style id: `[PREFIX-n]`, embedded at the front of the title:
  `[DIP-12] <scope>`.
- `PREFIX` is the per-project key (see `standards-schema.md`), e.g. `DIP`.
- `n` is the story's **native subtask number** (`subtask_012` → `DIP-12`). Derived, never
  hand-assigned — so it cannot drift. `subtask_012` stays the canonical id the CLI operates on;
  `[DIP-12]` is the handle the AI reads in the title and the companion doc.
- **Only stories (subtasks) get a `[PREFIX-n]` id.** Epics keep their native `task_NNN` + a title,
  to avoid `DIP-12` ambiguity between a `task_012` and a `subtask_012`.

## Where content lives

A subtask has no free-form description field, so rich content lives in a **companion doc**:

- `.backlog/stories/<PREFIX>-<n>.md` — the AI-first story spec (single source of truth for
  content). See `story-template.md` for the fixed headings.
- The native subtask mirrors only the *schedulable* bits: `--title` (with `[PREFIX-n]`),
  `--done-when`, `--depends-on`, `--scope`, `--risk`.

## Readiness

A story is **ready** when: all eight required items hold, and it is neither `needs-refinement`
nor carrying unresolved `needs-info` / open questions. `backlog-deliver`'s readiness gate
checks exactly this before touching code.
