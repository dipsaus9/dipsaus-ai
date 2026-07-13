# [DIP-44] PR-per-story delivery: push the worktree branch, open a PR, never touch main

Type: deliverable
Status: queued

## Outcome
A finished story leaves the agent as a **pull request** and nothing more. The agent never merges,
never fast-forwards `main`, and never force-pushes. Protection against two parallel stories breaking
each other is enforced by GitHub (DIP-48), not by a lock the skill has to get right.

## Done-when
- On success the agent commits on its worktree branch, pushes it, opens a PR titled `[PREFIX-n] <scope>`, and **STOPS**. It never merges to `main`, never fast-forwards `main`, and **NEVER** force-pushes
- The agent **NEVER stages** `.backlog/{tasks,subtasks}.yaml` or `.backlog/id-counters.json` — that state is owned by the main checkout and the worktree's copy is stale by construction, so a `git add -A` would hand `main` a regression that silently reverts another agent's status moves. It **DOES** commit `.backlog/stories/<PREFIX>-<n>.md` (one file per story, so they cannot collide)
- Protection against two stories that rebase cleanly but break each other **semantically** comes from `main`'s required check + up-to-date rule (DIP-48), **NOT** from a lock in the skill. The skill contains no `flock`, no rebase-retry loop, and no post-rebase re-verify
- The claim is released and the worktree exited on **EVERY** exit path, including failure. The agent never removes a worktree that holds unpushed commits — Claude's own cleanup **discards** commits, so the push must happen first
- If `gh` is absent the push still succeeds and the skill prints the compare URL; a missing CLI is never a story failure
- The **operator** — not the agent — commits the shared `.backlog` YAML from the main checkout as a `chore(backlog)` commit

## Depends-on
- DIP-42 (the agent must be in a worktree with a branch before it can push one)
- DIP-48 (the safety net must exist BEFORE agents start opening PRs — see below, this ordering is load-bearing)

## Affected area
- `skills/backlog-deliver/SKILL.md`

## Verify
- Two agents deliver two stories concurrently. Confirm: two branches pushed, two PRs open, `main`
  untouched by either agent, no force-push in the reflog
- **The load-bearing test.** Construct two stories that rebase cleanly but break each other
  semantically — e.g. one adds a field to the `Config` type, the other adds a *different* field to
  the same type plus a test asserting the object's exact shape via `toEqual`. Merge the first PR.
  Confirm the second PR is then **blocked as out-of-date**, and that after updating it, CI **fails**
  on the combination. Nothing untested reaches `main`
- Abort a run mid-flight and confirm the claim is released and the worktree is not left locked
- `bun run lint && bun run typecheck && bun run test`

## Technical notes

### What this story deleted, and why

The previous plan had the agent self-merge: `flock` → fetch → rebase → re-run the full verify suite
on the rebased result → fast-forward → push → unlock. Every piece of that was a reimplementation of
something the platform already does:

| Hand-rolled | Replaced by |
|---|---|
| `flock` on the shared `.git` to serialise integration | GitHub serialises merges into `main` |
| rebase onto latest `main` before merging | "Require branches to be up to date before merging" |
| re-run verify **on the rebased result** | required status check — the existing `pull_request` CI job |
| bounded retries when `main` moved underneath | the PR simply shows as out-of-date |

It also carried an unsolved hazard: **git refuses to update a branch checked out in another
worktree**, so an agent could not fast-forward local `main` at all. Under PR-per-story that question
disappears — the agent never touches `main`, locally or remotely.

**A clean rebase is not a passing rebase.** That insight was correct and still drives the design; it
is simply enforced server-side now. Two branches can rebase with zero conflict markers and still
produce a broken `main` (`DIP-37` adds `noColor` to `Config`, `DIP-38` adds `notifyEnabled` to the
same type; both rebase cleanly, and the combination fails `tsc` and an exhaustive `toEqual`
assertion). That exact failure already happened once, in `DIP-34`. **DIP-48 is what stops it — if
DIP-48 has not landed, this story's safety net does not exist.** Do not build this story first.

### Never stage the mutable backlog YAML

`.backlog` operational state is owned by the main checkout and written via `BACKLOG_ROOT` (DIP-42),
so the worktree's own copy is **stale by construction** and must never be committed. If an agent
does `git add -A`, it stages a stale `subtasks.yaml` / `tasks.yaml` and its PR silently reverts every
status move another agent made in the meantime.

Stage the story's source changes and `.backlog/stories/<PREFIX>-<n>.md` **explicitly**. Never the
YAML, never `id-counters.json`.

This is also what keeps the merge clean: the spike demonstrated that two branches making the *same
logical status change* still conflict, purely on a differing `updated_at` timestamp —

```
spike-a:  -    status: ready              spike-b:  -    status: ready
          +    status: in_progress                  +    status: in_progress
          -    updated_at: …T08:56:37.056Z          -    updated_at: …T08:56:37.056Z
          +    updated_at: …T09:20:42.513Z          +    updated_at: …T09:24:58.309Z
```

A four-minute difference on derived operational state. Because the worktree's YAML is never touched,
it never diverges, so it cannot conflict.

### Who commits the YAML, then?

**The operator, from the main checkout.** While agents run, the main checkout sits with an
uncommitted `.backlog/*.yaml` diff — that is the *expected* steady state, not a broken one. The
operator commits it as a `chore(backlog): …` straight to `main` when convenient (e.g. after merging
a PR). This honours `CLAUDE.md`'s review-before-commit rule and keeps the status history versioned,
with no race and no lock.

### Worktree cleanup — push before you leave

Claude's cleanup **discards uncommitted changes _and_ commits** when a worktree is removed. So the
order is non-negotiable: **commit → push → open PR → release claim → exit**. An agent that exits
before pushing can have its work swept. Claude holds a `git worktree lock` while the agent is
running, and sweeps agent-created worktrees only once they are older than `cleanupPeriodDays` **and**
have no uncommitted changes and no unpushed commits — so a pushed branch is safe.

Note `config.toml` sets `merge_strategy = "fast_forward"` and `delete_branch_after_merge = true`.
Those describe a self-merge flow the skill no longer performs; leave them, but do not build against
them — GitHub's merge settings are what actually govern.

### gh is not installed

`gh` is currently absent from this machine. DIP-48 installs it. Until then — and if it is ever
missing again — the skill pushes the branch and prints
`https://github.com/<owner>/<repo>/compare/main...<branch>?expand=1`. **A missing CLI is never a
story failure**; the work is safely pushed either way.

## Open questions
none
