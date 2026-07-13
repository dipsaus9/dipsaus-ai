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
- The agent **never stages** `.backlog/{tasks,subtasks}.yaml` or `.backlog/id-counters.json` from its worktree — that state is owned by the main checkout (DIP-40). Story docs (`.backlog/stories/*.md`) ARE still committed on the story branch
- Backlog **writes** (`subtask move`, `claim start/finish`) are serialized behind the same lock, so two agents cannot lost-update the shared `.backlog/*.yaml`

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

### Two additions from DIP-40's decision

**1. Never stage the mutable backlog YAML from a worktree.** DIP-40 established that `.backlog`
operational state is owned by the main checkout and written via `BACKLOG_ROOT` (DIP-42) — so the
worktree's own copy is stale by construction and must never be committed. If an agent does
`git add -A`, it will stage a stale `subtasks.yaml`/`tasks.yaml` and hand `main` a regression that
silently reverts another agent's status moves. Stage story files and `.backlog/stories/*.md`
explicitly; never the YAML, never `id-counters.json`.

This also *removes* the merge conflict DIP-40 demonstrated — the worktree's YAML never diverges
because it is never touched.

**2. Serialize backlog writes behind the same lock.** With one shared `.backlog/`, two agents calling
`backlog subtask move` at the same instant race on the same file and can lose an update. The window
is small (`max_agents = 2`, two status moves per story) but real. Reuse the integration flock rather
than inventing a second lock — take it around backlog *writes* too, not just the merge:

```bash
LOCK="$(git rev-parse --git-common-dir)/backlog-integration.lock"
flock "$LOCK" -c 'cd "$BACKLOG_ROOT" && backlog subtask move '"$ID"' completed'
```

Keep the critical section short — a write, not a whole verify run — so a status move never blocks
another agent's integration for long.

### KNOWN HAZARD — how does a worktree agent actually move `main`? (unsolved; solve it here)

DIP-40's decision has a consequence this story must confront head-on, and it is not obvious:

1. `main` is **checked out in the main checkout**. Git refuses to update a branch that is checked out
   in another worktree, so an agent sitting in worktree A **cannot** `git branch -f main` or
   `git push . HEAD:main`. The local fast-forward is not available to it.
2. The main checkout's working tree is now **permanently dirty** during parallel runs (the shared
   `.backlog/*.yaml` churn), so a naive `git -C "$BACKLOG_ROOT" pull --ff-only` in the main checkout
   is not clean either.

The likely shape — confirm it before building:

- The agent pushes to the **remote**: `git push origin HEAD:main`. This never touches the local
  `main` ref, so the checked-out-branch restriction does not apply. This is the fast-forward that
  matters, and it is what the lock serializes.
- The **local** `main` catches up separately (`git -C "$BACKLOG_ROOT" fetch` + a ff-only merge that
  tolerates the `.backlog` churn, or simply leaves local `main` behind until the operator pulls).

Also unresolved and in scope: **who commits the `.backlog` operational state?** Under DIP-40 the
agent must not stage it from its worktree, so if nobody commits it from the main checkout the status
history stops being versioned — and this project has been deliberately committing it. The most
plausible answer is that the integrating agent, **under the same lock**, commits `.backlog/*.yaml`
from `BACKLOG_ROOT` onto `main` as part of integration. Decide it explicitly; do not let it fall
between the stories.

If this turns out to need its own investigation, **stop and spin a spike** rather than guessing —
that is precisely the mistake DIP-40 was created to prevent.

## Open questions
none
