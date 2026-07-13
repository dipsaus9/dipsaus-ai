# [DIP-43] claim + scope-contention pickup: reserve the story, refuse file-colliding stories

Type: deliverable
Status: ready

## Outcome
Two agents can never take the same story, and never take two stories that will fight over the same
files.

## Done-when
- Pickup reserves the story with `backlog claim start` **before any code is written**, so two agents cannot take the same story
- Before claiming, the skill compares the candidate story's `scopes` against the scopes of all **active** claims (`backlog claim list`) and **refuses** the story when they overlap, offering the next non-contended ready story instead
- The `DIP-37` / `DIP-38` case is the acceptance example: they have no dependency edge but both declare `config.ts` and `on-post-tool-use.ts`, so with one of them claimed the other MUST be refused rather than handed to a second agent
- When no non-contended ready story exists, the skill says so and **stops**, rather than picking a contended one or inventing work
- The claim is released on completion **and on abort** (`backlog claim finish`), so a failed run does not leave a story reserved until the 30-minute TTL expires

## Depends-on
- DIP-40 (does `claim start` actually behave across worktrees?)
- DIP-41 (without declared scopes there is nothing to compare)

## Affected area
- `skills/backlog-deliver/SKILL.md`

## Verify
- Two worktrees. Claim a story in A. In B, run `/backlog-deliver` with no id and confirm the claimed
  story is **not** offered
- With `DIP-37` claimed in A, confirm B **refuses** `DIP-38` on scope overlap and offers something
  else — this is the headline case
- Abort a run mid-flight (or fail the gate) and confirm the claim is released, not left to expire
- Confirm that when every ready story is contended, the skill stops and says so
- `bun run lint && bun run typecheck && bun run test`

## Technical notes
Two distinct guards; do not collapse them into one:

1. **Story-level** — `backlog claim start` reserves *this story*. Prevents two agents on the same id.
2. **Scope-level** — compare the candidate's `scopes` against every active claim's scopes. Prevents
   two agents on *different* stories that touch the same files.

Guard 2 is the one that earns this story. Dependency edges do **not** imply file independence: two
stories can be perfectly parallel on paper and still both rewrite `config.ts`. `DIP-37` and `DIP-38`
in this very backlog are exactly that, and a picker that only checks `depends_on` hands them out
together and produces a guaranteed conflict.

Overlap rule: two scopes collide if either path is a prefix of the other. `hooks/dad-joke/config.ts`
collides with itself and with `hooks/dad-joke/`; it does not collide with `skills/backlog-plan/`.

`config.toml` sets `[claims] ttl_minutes = 30`, so a crashed agent's claim expires on its own — but
30 minutes of a story being un-pickable is a bad failure mode when the fix is to release it on the
way out. **Release on every exit path, including abort and gate failure.** A `finally`-shaped
discipline, not a happy-path one.

`enforce_on_commit = true` and `auto_claim_on_commit = true` are already set, and `backlog claim
check` validates staged paths against the claim — DIP-40 confirms whether that actually fires. If it
does, it is a useful **second** line of defence at commit time, but it is not a substitute for
refusing the pickup: catching a collision after the work is done wastes the work.

## Open questions
none
