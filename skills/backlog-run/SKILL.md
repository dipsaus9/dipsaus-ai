---
name: backlog-run
description: Orchestrate parallel delivery over the ready backlog for any repo using Backlog.md (MrLesk/Backlog.md) + Claude. Reads the backlog, selects the N ready, non-colliding stories (N = parallelism.maxAgents), presents the batch for one approval, then dispatches N subagent workers — each running backlog-deliver on one story in its own git worktree — and reports mixed per-story outcomes with PR links. Isolates a failed worker without sinking the batch. The parallel counterpart to backlog-deliver's one-story-at-a-time flow. Use when asked to "run the backlog", "deliver the ready stories in parallel", "dispatch N workers", or invoked as /backlog-run.
---

# backlog-run — dispatch N parallel workers over the ready backlog

You are the **orchestrator**. You pick the ready, non-colliding stories, get one approval, then run
each as an independent `backlog-deliver` worker in its own git worktree, and report what happened.
You do **not** implement stories yourself — each worker does, exactly as a solo `backlog-deliver`
run would.

Pairs with **`backlog-deliver`** (one story, end to end) and **`backlog-plan`** (authors the
backlog). The mechanics you rely on are the DIP-9.1 decision in
**`reference/orchestration.md`** — read it; the load-bearing constraints are repeated inline below.

**Authority:** the project's `CLAUDE.md` / `AGENTS.md` apply. The CLI is the only writer of backlog
state. This skill requires a workflow config (`.claude/backlog-workflow.json`) — without one, run
`backlog-init` first, or deliver stories one at a time with `backlog-deliver`. There is no
`worktree.enabled` toggle to check (the key was removed in DIP-11.1): **`backlog-run` always
isolates every worker in its own git worktree**, because parallel workers cannot share the main
checkout. That is the run-vs-deliver split — see below.

**run vs deliver — who isolates when.** `backlog-deliver` **auto-detects** isolation (DIP-11.4): it
delivers in the main checkout when the repo is quiet and takes a worktree only under detected
concurrency. `backlog-run` has no such choice — it dispatches N workers at once, so it **always**
isolates, one `.worktrees/<id>` per worker. Concurrency is a given here, not a thing to detect.

---

## Golden constraints (from the DIP-9.1 spike — do not violate)

1. **Workers are plain subagents.** Spawn each worker with the Agent tool **without**
   `isolation: worktree`. Its `backlog-deliver` run creates its own `.worktrees/<id>` worktree with
   `git worktree add -b <id>/<slug>` (DIP-7.5) — the branch contract lives there. The built-in
   `isolation: worktree` would name the branch `worktree-agent-<id>` and collide with that, so it is
   **not** used here.
2. **Serialize the pushes.** Workers deliver in parallel, but a `git push` is a shared-`.git` /
   remote operation — **only one worker pushes at a time**. Parallel commits to distinct branches
   are safe; parallel pushes are not.
3. **The first real run is supervised.** The two-real-story concurrent path could not be exercised
   in the spike, so treat the first `backlog-run` on a live backlog as a trial: watch the first
   batch to completion before trusting unattended dispatch.

## Step 0 — Preconditions

1. **Config present.** Read `.claude/backlog-workflow.json` and note `parallelism.maxAgents`
   (= the cap **N**). No config → stop and tell the user to run `backlog-init` first (or deliver a
   single story with `backlog-deliver`). There is no `worktree.enabled` key to check — run always
   isolates.
2. **Clean base, up to date.** On the base branch, clean tree, `git fetch` so branch refs and the
   base tip are fresh. The workers each isolate into their own worktree, but the main checkout must
   be clean to dispatch from.

## Step 1 — Select the batch

Build the set of stories to run this round:

1. **Candidates** — `backlog task list -s "To Do" --plain`, keep only stories (not epics) that:
   are `To Do`, have **all dependencies `Done`**, carry **no** `needs-refinement` / `needs-info`
   label, and are **unclaimed** — no `<id>/*` branch locally or on the remote
   (`git branch --list '<id>/*'`, `git ls-remote --heads origin '<id>/*'`). The claim is the branch
   ref, never task status (DIP-7.1).
2. **Non-colliding** — a story enters the batch only if
   `bun "${CLAUDE_PLUGIN_ROOT}/bin/backlog-workflow.ts" collisions <id>` is clean **and** its
   References do not collide with any story **already in this batch** (compare pairwise with the
   same prefix rule). Skip a candidate that collides; take the next.
3. **Cap** — stop at **N = `parallelism.maxAgents`**. Order by priority then id so the batch is
   deterministic.

Empty batch → say so (nothing ready, or everything ready collides) and stop.

## Step 2 — Present the batch, then one gate

Show the selected batch and **wait for one approval**:

- each story id + title + its `<id>/<slug>` branch,
- **why the set is safe to run together** — the collision check passed and no two members' References
  overlap,
- the cap N and how many were held back (colliding / over the cap / claimed).

After the user approves **once**, run autonomously to completion — no per-worker prompts.

## Step 3 — Dispatch the workers

For each story in the approved batch, spawn **one plain subagent** (Agent tool, **no** `isolation`)
whose task is: *"Deliver story `<id>` with backlog-deliver, end to end — readiness gate, worktree,
implement/verify/commit loop, review gate, push, report. Return the outcome: delivered + PR link,
or failed + the reason and where it stopped."* Dispatch them concurrently.

- Each worker's `backlog-deliver` owns its `.worktrees/<id>` worktree and `<id>/<slug>` branch.
- **Push serialization:** ensure workers do not push simultaneously — either dispatch so only one is
  at the push step at a time, or have the report step reconcile. When in doubt, prefer a smaller N.
- Nested subagents are fine — a worker spawning the `story-reviewer` gate is proven to work
  (DIP-9.1).

## Step 4 — Isolate failures (don't sink the batch)

If a worker fails (verify won't go green, the review gate keeps blocking to its cap, or it hits its
iteration cap):

- **Isolate it** — leave its branch and worktree in place for inspection, and leave the story
  **unclaimed cleanly** (status back to `To Do`; do not mark it `In Progress`-stuck). Its worktree
  is *not* torn down — that is the evidence.
- **The other workers finish.** One failed story never stops the batch.

## Step 5 — Report (mixed outcomes)

One row per story in the batch:

```
| Story | Outcome | Branch / PR |
|---|---|---|
| DIP-4.1 | delivered | https://…/compare/main...DIP-4.1%2F<slug>?expand=1 |
| DIP-4.2 | failed: review gate blocked 3× on AC#2 | branch DIP-4.2/<slug> left for inspection |
```

Then: how many delivered vs failed, and — if any failed — the suggested next step (inspect the
left-over worktree/branch, or amend the story via `backlog-plan`). You open no PRs and merge
nothing; the human does.

---

## Notes

- **You orchestrate; workers implement.** All code, verify, git and CLI work happens inside each
  worker's `backlog-deliver` run, in its own worktree — the main checkout stays clean.
- **N is a cap, not a target.** Fewer ready non-colliding stories than N → run fewer. A smaller N is
  the simplest way to stay safe on the push-serialization constraint.
- **One epic's stories often serialize** by dependency, so a batch usually spans independent work.
- `--plain` on every backlog read; never parse the TUI.
