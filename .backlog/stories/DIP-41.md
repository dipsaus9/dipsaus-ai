# [DIP-41] backlog-plan sets scopes on every story; story standard requires them

Type: deliverable
Status: completed

## Outcome
Every story declares the files it will touch, so two agents can be told — before either writes a
line — that their stories collide.

## Done-when
- `reference/story-standard.md` adds **declared scopes** as a required field: the file/directory paths a story will touch, concrete enough to compute overlap between two stories
- `reference/story-template.md`'s **Affected area** section is defined as the source of the scopes, so the doc and the subtask's `scopes` field cannot drift
- `backlog-plan`'s materialize step sets `--scope` on every subtask it creates, derived from the story's Affected area
- The skill refuses to materialize a story with no scopes, the same way it refuses one with an empty done-when — an unscoped story cannot be safely picked up in parallel

## Depends-on
- none

## Affected area
- `skills/backlog-plan/SKILL.md`
- `skills/backlog-plan/reference/story-standard.md`
- `skills/backlog-plan/reference/story-template.md`

## Verify
- `bun run lint && bun run typecheck && bun run test` (skills are markdown; this just proves nothing else broke)
- Run `/backlog-plan` on a throwaway goal and confirm every created subtask has a non-empty `scopes`
  field in `.backlog/subtasks.yaml`
- Confirm the skill **refuses** to materialize when a story's Affected area is empty

## Technical notes
This is the unglamorous story that makes DIP-43 real. Scope-based contention is only as good as the
scope data, and most stories in this backlog today have empty `scopes` — so the contention check
would have nothing to compare and would silently pass everything.

The stories already carry an **Affected area** section in their companion docs (see any of
`DIP-28.md` … `DIP-39.md`), and it is already accurate. This story does not invent a new concept —
it promotes an existing doc section into a machine-readable field and makes it mandatory.

Keep scopes **path-shaped and comparable**: `hooks/dad-joke/config.ts`, or a directory like
`skills/backlog-plan/`. Two scopes overlap if either is a prefix of the other. Prose like "the
config" is useless to a contention check — reject it.

Worked example of why this matters, from the current backlog: `DIP-37` and `DIP-38` have **no
dependency edge**, so a dependency-only picker considers both ready and hands them to two agents.
But both declare `hooks/dad-joke/config.ts` and `hooks/dad-joke/on-post-tool-use.ts` in their
Affected area. With scopes populated, DIP-43 catches that before any code is written; without them,
the two agents discover it at merge time.

Do not retro-fill scopes for already-`completed` stories — pointless churn. Do consider backfilling
the `queued` ones (`DIP-35`…`DIP-39`, `DIP-40`…`DIP-45`, `DIP-48`), since those are the ones that
will actually be picked up in parallel. The stories of this epic already carry `--scope`, set during
planning — they are the worked example.

## Open questions
none
