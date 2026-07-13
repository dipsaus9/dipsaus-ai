# [DIP-44] serialized rebase-and-retry integration: lock, rebase, re-verify, fast-forward

Type: deliverable
Status: ready

## Outcome
N agents finishing at once integrate to `main` one at a time, and nothing lands on `main` that was
not verified **in the exact combination being merged**.

## Done-when
- Integration is serialized: an agent acquires an **exclusive lock** before touching `main`, so N agents finishing at once integrate one at a time rather than racing a fast-forward that only the first can win
- The agent rebases its story branch onto the latest `origin/main` before merging
- The **full verify suite re-runs on the REBASED result**, before the fast-forward
- On a rebase conflict, or a verify failure after rebase, the agent releases the lock, moves the story to `review`, reports what failed, and **STOPS** — no indefinite retries, no automatic conflict resolution
- Retries are bounded (e.g. 3 attempts at re-acquiring the lock / re-rebasing when `main` moved underneath), after which the story goes to `review` and the agent stops
- The agent **NEVER** force-pushes and never rewrites `main`'s history; the lock is released on every exit path, including failure, so a crashed agent cannot deadlock the others

## Depends-on
- DIP-42 (parallel mode must be detected before integration behaves differently)

## Affected area
- `skills/backlog-deliver/SKILL.md`

## Verify
- Two agents finish near-simultaneously: confirm both land on `main`, one after the other, with no
  force-push and no lost commit
- **The load-bearing test.** Construct two branches that rebase cleanly but break each other
  semantically — e.g. one adds a field to a type, the other adds a different field to the same type
  and a test asserting the object's exact shape. Confirm the second agent's post-rebase verify
  **fails** and the story goes to `review` instead of merging
- Kill an agent mid-integration and confirm the lock is released and another agent can proceed
- Solo regression: a single agent on `main` integrates exactly as it does today
- `bun run lint && bun run typecheck && bun run test`

## Technical notes
**A clean rebase is not a passing rebase.** This is the whole reason the story exists, and the
easiest thing to get wrong.

Git resolves *textual* conflicts. It knows nothing about semantics. Two story branches can rebase
with zero conflict markers and still produce a broken `main`:

- `DIP-37` adds `noColor` to the `Config` type and updates `loadConfig`.
- `DIP-38` adds `notifyEnabled` to the same `Config` type and updates `loadConfig`.
- Both rebase cleanly (different lines). The combination fails `tsc`, and `dad-joke-trigger.test.ts`
  — which asserts `loadConfig({})` with an exhaustive `toEqual` — fails on the missing field.

That exact test already caught this once, in `DIP-34`. If the agent rebases and fast-forwards
without re-running verify, it pushes a combination **nobody ever tested** and `main` goes red.

So the order is non-negotiable: **lock → fetch → rebase → re-verify → fast-forward → push → unlock.**

Lock mechanism: a simple filesystem lock in the shared `.git` common dir (all worktrees share it) is
enough — e.g. `flock` on `$(git rev-parse --git-common-dir)/backlog-integration.lock`. It must be
released on **every** exit path, including a failed verify, a rebase conflict, and a crash. A lock
that leaks blocks every other agent until a human notices.

`config.toml` already sets `merge_strategy = "fast_forward"` and `delete_branch_after_merge = true`.
Fast-forward is correct *behind the lock* — after a successful rebase, `main` is by definition an
ancestor, so the merge is trivial. It is only a race without the lock.

**Never force-push.** If the rebase went wrong, the answer is `review` and a human, not `--force`.
An agent that force-pushes `main` can destroy another agent's merged work irrecoverably.

## Open questions
none
