# Story standard

The contract every backlog story must meet. `backlog-plan` produces stories that satisfy it;
`backlog-deliver` refuses to start a story that violates the **required** items. Stories are
written **for an AI to read and write** — structured, explicit, unambiguous. No prose that
only a human can disambiguate.

The backlog tool is **Backlog.md**: every task is a markdown file under `backlog/tasks/`,
created and mutated **only** through the `backlog` CLI. An **epic** is a parent task (labelled
`epic`, not picked up directly). A **story** is a subtask of an epic (`task create -p <epicId>`),
and gets a dotted native id: epic `DIP-4` → stories `DIP-4.1`, `DIP-4.2`, …

## Required — every story

1. **One outcome.** A single shippable slice. If the title needs "and", split into two stories.
2. **Concrete title.** States *what* + *where* (area/files). No vague verbs ("improve", "handle").
3. **Done-when = acceptance criteria.** ≥1 objective, checkable pass/fail criterion (`--ac`).
   Never "works well" / "looks good". Each criterion is something a machine or a command can
   decide. Delivery checks them off one by one (`--check-ac <n>`).
4. **Dependencies.** Real ordering by story id (`--dep`); no hidden prerequisites. Backlog.md
   validates that referenced tasks exist.
5. **Pickup-sized.** Completable in one sitting. Epic-sized ⇒ it is a *parent task*, not a story.
6. **Verifiable.** How you would *prove* it: a command, a test, or an observable behaviour —
   recorded in the story's notes when it goes beyond the repo's baseline verify.
   (This is what lets the delivery skill self-check honestly.)
7. **Declared scope = References.** ≥1 file or directory path the story will touch (`--ref`),
   concrete enough that two stories' References can be compared for overlap **before** either is
   picked up. An unscoped story cannot be safely handed to a parallel agent — see below.
8. **Named branch.** The exact branch delivery will cut: `<id>/<slug>`, on a `Branch:` line in
   the description. Planned, not improvised at delivery time — see below.

## Scope (References) — the parallel-safety contract

References exist so two agents can be told, before either writes a line, that their stories
collide.

- **Path-shaped and comparable.** `hooks/dad-joke/config.ts`, or a directory like
  `skills/backlog-plan/`. Prose like "the config" or "the notification logic" is useless to an
  overlap check — reject it.
- **Overlap rule.** Two paths collide if either is a **prefix** of the other.
  `hooks/dad-joke/config.ts` collides with itself and with `hooks/dad-joke/`; it does not collide
  with `skills/backlog-plan/`.
- **Dependency edges do not imply file independence.** Two stories can be perfectly parallel on
  paper and still both rewrite the same file. A picker that only checks dependencies hands them
  out together and produces a guaranteed conflict. References are what catch it.

## Branch — one story, one branch

The story's id owns a branch, and the branch is planned with the story:

```
<id>/<slug>            e.g.  DIP-1.1/two-tier-joke-formatter
```

- `<id>` is the native Backlog.md id verbatim, uppercase, dots included, first. No type prefix in
  front of it (`feat/DIP-1.1/…` is wrong). The id-first shape is what makes a branch traceable
  back to a story by name alone, and what lets `backlog-deliver` detect "this story is already in
  progress" with a plain `git branch --list '<id>/*'`.
- `<slug>` — 2–4 words from the title, lowercase-hyphenated, no id repeated.
- **Planned, not improvised.** If delivery derives the slug itself, two runs of the same story can
  produce two different branches and the in-progress check silently misses. Planning it freezes it.
- One branch per story, never shared and never reused. `git` forbids a branch `DIP-1.1` alongside
  `DIP-1.1/slug` (a ref cannot be both file and directory) — the `<id>/` shape reserves the
  namespace.

## Optional — add when useful

- **Plan / Notes** — implementation guidance, constraints, links, gotchas (`--plan` / `--notes`).
- **`needs-refinement` label** — the story is not yet ready; do not pick up until refined.
- **`needs-info` label** — an open question blocks readiness; capture the question in the notes,
  ask, resolve before pickup.
- **`Type: spike`** (description line) — a research/decision story. Its acceptance criteria state
  "question answered / decision recorded with rationale", not "tests pass". Delivery resolves it
  via web search + interview, and records findings in notes + final summary.

## Story id — native, never invented

- The id **is** Backlog.md's assigned id (`task_prefix` from `backlog/config.yml` + number):
  epic `DIP-4`, story `DIP-4.1`. It exists the moment `task create` returns — there is no
  backfill step and no separate `[PREFIX-n]` scheme.
- Reference it verbatim in commits (`feat(x): … (DIP-4.1)`), branches (`DIP-4.1/<slug>`), and
  conversation.
- **Epics are not picked up directly** — only stories (subtasks) are delivered.

## Where content lives

Everything lives **in the task itself**, written via the CLI — there are no companion docs:

| Contract item | Task field | CLI |
|---|---|---|
| Outcome, Type, Branch | Description | `-d` |
| Done-when | Acceptance criteria | `--ac`, checked via `--check-ac` |
| Scope | References | `--ref` |
| Ordering | Dependencies | `--dep` |
| Implementation approach | Plan | `--plan` |
| Technical notes, per-story Verify, open questions | Notes | `--notes`, `--append-notes` |
| Findings / what shipped | Final summary | `--final-summary` |

## Readiness

A story is **ready** when: all eight required items hold, and it carries neither a
`needs-refinement` nor a `needs-info` label, with no unresolved open questions in its notes.
`backlog-deliver`'s readiness gate checks exactly this before touching code.
