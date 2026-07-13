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
- DIP-42 (claims are only cross-agent visible once every CLI call runs from `BACKLOG_ROOT`)

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

### Read DIP-40 first — this story only works because of BACKLOG_ROOT

As originally written, this story was **unbuildable**. DIP-40 proved that `backlog claim` stores
claims in whichever `.backlog/` the CLI finds by walking up from `cwd`, so two agents in two
worktrees get two private claims dirs and are invisible to each other:

```
wt-a $ backlog claim start --path hooks/dad-joke/config.ts   →  Started claim claim_002
wt-b $ backlog claim list                                    →  No active claims.
wt-b $ backlog claim start --path hooks/dad-joke/config.ts   →  Started claim claim_001  (!!)
```

Two "exclusive" claims on the same file, no warning. The overlap check is real but only operates
*within one* `.backlog/` dir.

DIP-42's `BACKLOG_ROOT` rule fixes this: every `backlog` call runs from the main checkout, so there
is exactly **one** claims dir and `claim list` genuinely sees every agent. **Do not implement this
story until DIP-42 has landed** — without it the contention check silently passes everything, which
is worse than no check at all.

(Also from DIP-40: `.backlog/claims/` is gitignored and therefore absent in a fresh worktree, so
`claim start` there dies with `ENOENT … /.backlog/claims/active/claim_001.json`. Running from
`BACKLOG_ROOT` sidesteps that too — the main checkout already has the dirs.)

### Two distinct guards; do not collapse them into one:

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

`enforce_on_commit = true` and `auto_claim_on_commit = true` are already set. **DIP-40 confirmed
`backlog claim check --staged` is a real gate**, not a warning — it exits `1` on an out-of-scope
staged path and `0` when in scope:

```
$ git add README.md && backlog claim check --staged      # claim scope = config.ts
Claim claim_001 does not cover all checked paths:
  - README.md
exit 1
```

So keep it as the **second** line of defence at commit time. It is not a substitute for refusing the
pickup — it validates against the agent's *own* claim ("did I stay in my lane"), and catching a
collision after the work is done wastes the work.

## Open questions
none
