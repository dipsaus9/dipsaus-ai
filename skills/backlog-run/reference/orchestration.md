# Orchestration mechanics: N parallel workers

Decision record for DIP-9.1. Proves the subagent-worker model `backlog-run` (DIP-9.2) is built on,
with evidence gathered in this repo. **Go**, with one refinement to the grilled decision and two
constraints DIP-9.2 must honor.

---

## AC#2 — nested subagents work (a worker can spawn the reviewer)

The biggest risk: a worker is a `backlog-deliver` run, and `backlog-deliver`'s review gate spawns
the `story-reviewer` subagent — a **subagent spawning a subagent**. Documentation was unclear on
depth. Measured:

```
main → general-purpose subagent → (nested) general-purpose subagent → returned "PONG"
```

The nested agent ran synchronously and returned cleanly, no error. **A worker can spawn the review
gate.** No fallback (orchestrator-runs-the-review) is needed.

## AC#1 / AC#3 — N concurrent workers isolate and commit safely

Two `isolation: worktree` subagents dispatched concurrently, each making an empty commit:

| | Worker A | Worker B |
|---|---|---|
| worktree | `.claude/worktrees/agent-a3cd…` | `.claude/worktrees/agent-a344…` |
| branch | `worktree-agent-a3cd…` | `worktree-agent-a344…` |
| commit sha | `9fb83d8…` | `a002f4a…` |
| `--git-common-dir` | main `.git` | main `.git` |

Both got their **own** worktree and branch, committed **concurrently** to the **shared object
store** with no interference or corruption. Git's model holds: each worktree has its own index and
HEAD; concurrent commits to distinct branch refs are safe.

> Full end-to-end `backlog-deliver` runs on two *real* stories were not possible now — the backlog
> has no two independent ready stories (DIP-9.2/9.3 are a dependency chain; DIP-8.2/8.3 are
> `needs-refinement`). The mechanism is proven with representative committing workers; the first
> real `backlog-run` should be treated as a **supervised trial** (see below).

## The refinement — do NOT use `isolation: worktree` for workers

The test exposed a conflict: the built-in `isolation: worktree` names the worker's branch
**`worktree-agent-<id>`**, but the git contract requires **`<id>/<slug>`**, and `backlog-deliver`
(DIP-7.5) **already creates its own** `.worktrees/<id>` worktree with `git worktree add -b <id>/<slug>`.
Using `isolation: worktree` on top of that is redundant *and* wrong on the branch name (the same
reason `claude --worktree` was rejected in DIP-7.1).

**Decision (refines the grilled choice):** `backlog-run` spawns **plain subagents** (no
`isolation`), each running `backlog-deliver` on one story. Each worker's `backlog-deliver` owns its
own worktree + `<id>/<slug>` branch exactly as it does for a solo run. Worktree isolation still
happens — it is done by `backlog-deliver`, not by the Agent harness — so the branch contract is
preserved and there is no double-worktree.

## Constraints DIP-9.2 must honor

1. **Workers are plain subagents; `backlog-deliver` owns the worktree.** Do not pass
   `isolation: worktree` to the worker Agent call.
2. **Serialize the final pushes.** Concurrent commits to distinct branches are safe, but concurrent
   `git push` of different branches can contend on the remote and on the shared `.git` refs.
   Workers should deliver in parallel but the orchestrator (or the workers via a simple gate) should
   **push one at a time**. The brief window where a worker runs `git worktree add` in the main
   checkout before entering its worktree is also a shared-`.git` operation — small, but another
   reason to not have all N hit git simultaneously at the very start.
3. **First real run is supervised.** Because a full two-real-story concurrent run could not be
   exercised here, the first `backlog-run` on a live backlog is a trial: watch the first batch to
   completion before trusting unattended dispatch.

## Go / no-go

**GO** on the subagent-worker model, with the refinement above: plain subagents, `backlog-deliver`
owns each worktree and the `<id>/<slug>` branch, pushes serialized, first run supervised. Nested
subagents (the review gate) are confirmed working, so no architectural fallback is required.
