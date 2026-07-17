# [DIP-43] claim + scope-contention pickup: reserve the story, refuse file-colliding stories

Type: deliverable
Status: canceled

## Outcome
Two agents can never take the same story, and never take two stories that will fight over the same
files.

## Done-when
- Pickup reserves the story with `backlog claim start` **BEFORE any code is written and before `EnterWorktree` is called**, so two agents cannot take the same story
- Before claiming, the skill compares the candidate story's `scopes` against the scopes of all **ACTIVE** claims (`backlog claim list`) and **REFUSES** the story when they overlap, offering the next non-contended ready story instead
- The `DIP-37` / `DIP-38` case is the acceptance example: no dependency edge, but both declare `config.ts` and `on-post-tool-use.ts`. With one claimed, the other MUST be refused rather than handed to a second agent
- When no non-contended ready story exists, the skill says so and **STOPS**, rather than picking a contended one or inventing work
- The claim is released on completion **AND on abort** (`backlog claim finish`), so a failed run does not leave a story reserved until the 30-minute TTL expires
- The skill calls `backlog claim check --staged` **EXPLICITLY** before committing, as an in-lane self-guard. It cannot rely on `config.toml`'s `enforce_on_commit` / `auto_claim_on_commit` — **no pre-commit hook is installed**, so those settings are currently inert

## Depends-on
- DIP-41 (without declared scopes there is nothing to compare)
- DIP-42 (claims are only cross-agent visible once every CLI call runs from `BACKLOG_ROOT`)

## Affected area
- `skills/backlog-deliver/SKILL.md`

## Verify
- Two agents. Claim a story in A. In B, run `/backlog-deliver` with no id and confirm the claimed
  story is **not** offered
- With `DIP-37` claimed in A, confirm B **refuses** `DIP-38` on scope overlap and offers something
  else — this is the headline case
- Abort a run mid-flight (or fail the gate) and confirm the claim is released, not left to expire
- Confirm that when every ready story is contended, the skill stops and says so
- Stage an out-of-scope file and confirm `backlog claim check --staged` exits `1`
- `bun run lint && bun run typecheck && bun run test`

## Technical notes

### Claim BEFORE entering the worktree

Ordering matters. The claim is what makes the story *yours*; `EnterWorktree` is what makes the *files*
yours. Claiming second means two agents can both create a worktree for the same story before either
notices. Gate → contention check → `claim start` → **then** `EnterWorktree`.

### This story only works because of BACKLOG_ROOT

As originally conceived, this story was **unbuildable**. The backlog CLI stores claims in whichever
`.backlog/` it finds by walking up from `cwd`, so two agents in two worktrees get two private claims
dirs and are invisible to each other:

```
wt-a $ backlog claim start --path hooks/dad-joke/config.ts   →  Started claim claim_002
wt-b $ backlog claim list                                    →  No active claims.
wt-b $ backlog claim start --path hooks/dad-joke/config.ts   →  Started claim claim_001  (!!)
```

Two "exclusive" claims on the same file, independent id counters, no warning. Overlap detection is
real, but it only operates **within a single `.backlog/` directory**.

DIP-42's `BACKLOG_ROOT` rule fixes this: every `backlog` call runs from the main checkout, so there is
exactly **one** claims dir and `claim list` genuinely sees every agent. **Do not implement this story
until DIP-42 has landed** — without it the contention check silently passes everything, which is
worse than no check at all.

(Also: `.backlog/claims/` is gitignored and therefore absent from a fresh worktree, so `claim start`
there dies with `ENOENT … /.backlog/claims/active/claim_001.json`. Running from `BACKLOG_ROOT`
sidesteps that too — the main checkout already has the dirs.)

### Two distinct guards; do not collapse them into one

1. **Story-level** — `backlog claim start` reserves *this story*. Prevents two agents on the same id.
2. **Scope-level** — compare the candidate's `scopes` against every active claim's scopes. Prevents
   two agents on *different* stories that touch the same files.

Guard 2 is the one that earns this story. Dependency edges do **not** imply file independence: two
stories can be perfectly parallel on paper and still both rewrite `config.ts`. `DIP-37` and `DIP-38`
in this very backlog are exactly that, and a picker that only checks `depends_on` hands them out
together and produces a guaranteed conflict.

Overlap rule: two scopes collide if either path is a prefix of the other. `hooks/dad-joke/config.ts`
collides with itself and with `hooks/dad-joke/`; it does not collide with `skills/backlog-plan/`.

### Release on every exit path

`config.toml` sets `[claims] ttl_minutes = 30`, so a crashed agent's claim expires on its own — but
30 minutes of a story being un-pickable is a bad failure mode when the fix is to release it on the
way out. Release on **every** exit path, including abort and gate failure. A `finally`-shaped
discipline, not a happy-path one.

### `claim check --staged` is a real gate — but nothing calls it

`enforce_on_commit = true` and `auto_claim_on_commit = true` are set in `config.toml`, which reads
like the check is automatic. **It is not.** There is no pre-commit hook installed in `.git/hooks/` —
those settings are inert today. The skill must invoke the check itself.

It *is* a genuine exit-1 gate when invoked:

```
$ git add README.md && backlog claim check --staged      # claim scope = config.ts
Claim claim_001 does not cover all checked paths:
  - README.md
exit 1
```

Keep it as the **second** line of defence at commit time. It validates against the agent's *own*
claim ("did I stay in my lane") — it is not a substitute for refusing the pickup, because catching a
collision after the work is done wastes the work.

## Open questions
none
