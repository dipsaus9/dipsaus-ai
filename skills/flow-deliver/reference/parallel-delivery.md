# Parallel delivery: worktree isolation and claim visibility

Decision record for DIP-7.1. Fixes the mechanics DIP-7.5 implements: how one agent's claim
becomes visible to another agent in a separate git worktree, and what the rewritten readiness
gate must therefore check. Every rule below is backed by a command run in this repo; the raw
output is quoted inline.

**Environment.** `backlog/config.yml` at decision time:

```
remote_operations: true
check_active_branches: true
active_branch_days: 30
auto_commit: false
```

---

## The load-bearing finding: task status does NOT propagate across worktrees

Backlog.md stores task state as files in the tree. A status change is a file edit committed on a
branch. **That commit is invisible to another worktree's `backlog` reads** — the reading worktree
resolves an existing task from its *own* checkout, and its copy wins.

### AC#1 — a committed-but-unpushed claim is invisible to a second worktree

Two worktrees off `main`, each on its own branch. Worktree A claims `DIP-7.2` (edits status to
`In Progress`) and commits it; **no push**. Worktree B reads the same task:

```
[A] committed on: exp/wt-A
    91f15aa claim DIP-7.2 (exp)
[B] branch: exp/wt-B
    backlog task DIP-7.2 --plain -> Status: ○ To Do      # B still sees To Do
    backlog task list --plain    -> (no In-Progress row for DIP-7.2)
```

**Answer: no.** Before the branch is pushed, the claim is not visible to a second worktree.

### It stays invisible after push + fetch

A pushes `exp/wt-A`; B fetches (`remote_operations: true`):

```
[A] pushed exp/wt-A
[B] git fetch origin
    backlog task DIP-7.2 --plain -> Status: ○ To Do      # unchanged after push+fetch
```

`backlog task <id>` resolves from the current checkout. When the task **exists** in your branch,
your branch's copy of its status is authoritative — the cross-branch scan does not override it
with a newer status committed on another branch.

### AC#2 — what check_active_branches / remote_operations / active_branch_days actually do

The cross-branch scan is a **union for existence, not a merge of state**:

- It makes a task that *exists on another active branch* show up in your listing — this is what
  lets Backlog.md warn about tasks created elsewhere.
- It does **not** reconcile the *status* of a task that already exists in your checkout. Our push
  test proves that: B never saw A's `In Progress`.
- `active_branch_days: 30` bounds "active" to branches with commits in the last 30 days; both
  throwaway branches were fresh and in-window, and status still didn't cross over — confirming the
  union is about existence, not state.
- `remote_operations: true` lets the scan consider remote branches after a fetch; it still only
  unions existence.

**Duplicate-task-ID risk (direct prior evidence).** Stale story branches have already produced the
duplicate-task-ID error in the Backlog.md browser in this project. That is the existence-union
biting: two branches each carrying a task file with the same id, both inside the active window, get
scanned together. The mechanism is the same one measured above — so the fix is **branch hygiene**,
not a config toggle:

- **Delete a story branch once its PR merges.** A merged-but-undeleted `<id>/<slug>` keeps the
  task file alive on a second branch and re-triggers the duplicate-id scan.
- The readiness gate below treats a live `<id>/*` branch as an in-flight claim; a stale one is a
  false positive that must be pruned, exactly as `main-forbids-force-push` / backlog-branch-hygiene
  already require after every merge.

### Consequence: the claim is the branch, not the status

Task status is a **human-readable marker**, not the machine claim. The reliable cross-worktree
signal is the one thing all worktrees of a repo genuinely share: the single `.git` directory and
its **refs**. A branch created in any worktree is visible from every other worktree immediately,
with no push:

```
# branch cut inside worktree A is listed from the main checkout, unpushed:
git branch --list 'exp/*'  ->  exp/wt-A  exp/wt-B
```

So an agent claims a story by **cutting its `<id>/<slug>` branch**, and a second agent detects the
claim with `git branch --list '<id>/*'` + `git worktree list` — never by trusting task status read
from its own checkout. Setting status to `In Progress` still happens (it is the human-facing
record and lands in the story's own branch), but it is not what the gate keys on.

---

## AC#3 — worktree lifecycle

### Path convention

`<repo>/.worktrees/<id>/` — e.g. `.worktrees/DIP-7.5/`. One worktree per story, named by id.
`.worktrees/` is git-ignored so worktree checkouts never show up as changes in the main tree.

### Creation (claim + branch in one step)

```
git worktree add .worktrees/<id> -b <id>/<slug>   # from an up-to-date base
```

`-b` cuts the story branch as the worktree is created, so the branch matches the story's frozen
`Branch:` line verbatim and the claim ref exists atomically. (This is why the built-in
`claude --worktree` is unsuitable: it names the branch `worktree-<name>`, not `<id>/<slug>`.)

### Install step (per stack, from the workflow config, never guessed)

A fresh worktree has no `node_modules` / `.venv` / build cache. Run the stack's install inside it
before the first verify. Resolved from `.claude/backlog-workflow.json` (DIP-7.3), with these
defaults per detected manifest:

| Stack (manifest) | Install |
|---|---|
| `bun.lock` / `package.json` (bun) | `bun install` |
| `package-lock.json` | `npm ci` |
| `pnpm-lock.yaml` | `pnpm install --frozen-lockfile` |
| `uv.lock` / `pyproject.toml` | `uv sync` |
| `go.mod` | `go mod download` |
| `Cargo.toml` | `cargo fetch` |
| none detected | skip, no error |

This repo is bun: `bun install`.

### Gitignored files to copy

A fresh worktree does not carry git-ignored files the build needs. Copy only what an explicit
include list names (config key `worktree.includeGitignored`) — never a blanket copy, and
**never** `.env*` unless the list names it (secrets stay opt-in, per the deliver skill's secrets
rule). Empty list ⇒ copy nothing.

### Teardown (measured)

```
# dirty worktree — refused:
git worktree remove .worktrees/B
  -> fatal: '.../B' contains modified or untracked files, use --force to delete it
# clean worktree — removed, branch retained:
git worktree remove .worktrees/A   -> ok;  git branch --list exp/wt-A -> exp/wt-A
```

Rules:

- **Remove after the push, never with `--force`.** `git worktree remove <path>` refuses on a dirty
  tree — that refusal is the safety net. On refusal, **stop and surface the uncommitted changes**
  to the user; do not force. Uncommitted work at teardown means the loop exited wrong.
- **Keep the branch.** Removal retains `<id>/<slug>` so the pushed branch and its PR survive.
- Prune stale entries with `git worktree prune` if a checkout was deleted out of band.

---

## AC#4 — the rewritten readiness gate (ordered checklist for DIP-7.5)

The old gate required a clean tree **on the base branch** — impossible for a parallel run, and it
also blocked picking up a second story while a first was in flight. Replace it with a gate that is
per-worktree and claim-aware. In order:

1. **Base is resolvable and current.** `git symbolic-ref refs/remotes/origin/HEAD` gives the base;
   `git fetch` so the base tip and remote `<id>/*` refs are fresh. No remote ⇒ ask.
2. **Story is well-formed and ready** — the standard's eight items, no `needs-refinement` /
   `needs-info`, dependencies all `Done`. (Unchanged from today.)
3. **Not already claimed.** `git branch --list '<id>/*'` **and**
   `git ls-remote --heads origin '<id>/*'` **and** `git worktree list` are all empty of this id.
   A live branch = an in-flight claim ⇒ stop and ask. (A *stale merged* branch is a false positive
   — prune it per the branch-hygiene rule, then re-check.) This ref check, not task status, is the
   claim.
4. **No References collision with any in-flight story.** `backlog-workflow collisions <id>`
   (DIP-7.3) compares this story's References against every `To Do` / `In Progress` story and
   exits non-zero on a prefix overlap ⇒ stop. This is what makes two parallel pickups safe.
5. **The worktree can be created clean.** `.worktrees/<id>` does not already exist; the base is
   clean enough to branch from. The **main checkout's** working-tree state is irrelevant now — the
   story never touches it — so the gate no longer demands you stand on the base branch with a clean
   tree. Cleanliness is asserted for the *new worktree*, which is clean by construction.
6. **Claim atomically:** `git worktree add .worktrees/<id> -b <id>/<slug>`, then set status
   `In Progress` and commit it on that branch. The branch ref (step 3's signal) now exists for the
   next agent to see.

Worktree mode is config-gated: with `worktree.enabled: false` the skill delivers on a branch in
the main checkout exactly as today, and step 5 falls back to the classic "clean tree, on base"
check.

---

## Summary of decisions

- **Claim = the `<id>/<slug>` branch ref**, shared across worktrees via the one `.git`; detected
  with `git branch --list '<id>/*'`. Task status is a human marker, not the machine claim, because
  committed status does not propagate across worktrees (measured, AC#1/#2).
- **Cross-branch scan is existence-union only**; the duplicate-id risk is a branch-hygiene problem,
  fixed by deleting merged story branches, not by a config toggle (AC#2).
- **Worktree at `.worktrees/<id>`**, created with `-b <id>/<slug>`, installed per detected stack,
  gitignored files copied only from an explicit list, torn down after push **without `--force`**
  (dirty ⇒ stop and surface), branch retained (AC#3).
- **Gate keys on branch/worktree refs + a References-collision check**, not on the main checkout
  being clean on the base branch (AC#4).
