# [DIP-42] backlog-deliver self-isolates via EnterWorktree, bootstraps with bun install, and runs every backlog call from BACKLOG_ROOT

Type: deliverable
Status: canceled

## Outcome
`/backlog-deliver DIP-n` isolates itself. It runs from the main checkout, gates, claims, and then
**creates its own worktree** via the `EnterWorktree` tool — no pre-launched terminals, no operator
ceremony, and one code path for solo and parallel runs alike.

## Done-when
- After the readiness gate passes, `backlog-deliver` calls the **`EnterWorktree`** tool ITSELF with name `<PREFIX>-<n>-<slug>`; Claude creates `.claude/worktrees/<PREFIX>-<n>-<slug>/` on branch `worktree-<PREFIX>-<n>-<slug>`. The operator never pre-launches `claude --worktree`
- Isolation is **UNCONDITIONAL** — solo and parallel runs take the same path. There is no dual-mode gate, no worktree-detection branch, and no new invocation flag
- Step 2's `git switch -c` is **DELETED**: the worktree already *is* the branch, and Claude owns its name. Commits and the PR still reference `[PREFIX-n]` even though the branch carries the `worktree-` prefix
- The skill runs `bun install` in the fresh worktree **BEFORE the first verify** — a worktree is a clean checkout with no `node_modules`, so lint/typecheck/test would otherwise fail on arrival in a way that looks like a real code error
- The skill establishes `BACKLOG_ROOT=$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")` and **EVERY** `backlog` CLI call runs with that cwd — in both the main checkout and a worktree, with no special case
- The readiness gate **ignores** `.backlog/{tasks,subtasks}.yaml` and `.backlog/id-counters.json` churn in the main checkout (that state is shared, expected to be dirty while agents run, and is never the agent's work). A genuinely dirty tree **STILL aborts**

## Depends-on
- DIP-40 (`.claude/worktrees/` must be gitignored and `baseRef` pinned before the skill starts creating worktrees)

## Affected area
- `skills/backlog-deliver/SKILL.md`

## Verify
- Run `/backlog-deliver <id>` from the main checkout. Confirm: a worktree appears at
  `.claude/worktrees/<PREFIX>-<n>-<slug>/`, the session is working inside it, `bun install` ran, and
  the verify suite passes **in the worktree**
- Confirm the main checkout's `git status` stays clean apart from the expected `.backlog/*.yaml`
  churn — and that the gate does not abort on that churn
- Negative: dirty the tree with a real source edit and confirm the gate **still aborts**
- Confirm `backlog subtask list` run from inside the worktree shows the **live** shared backlog, not
  a stale branch-local copy (this is the `BACKLOG_ROOT` proof)
- `bun run lint && bun run typecheck && bun run test`

## Technical notes

### What breaks today

`SKILL.md` Step 1 currently says:

> 3. **Clean git + on the base branch**, up to date. Uncommitted changes → abort.
> 4. **Not already in progress** — not already `running` / claimed, no existing story branch.

and Step 2 says `git switch -c <prefix>-<n>-<slug>`. Under the new model the skill **creates** the
worktree rather than living in one, so the base-branch check is fine at gate time (we are still in
the main checkout) — but the branch creation in Step 2 must go, because `EnterWorktree` already made
the branch.

### Claude owns the naming — do not fight it

Per <https://code.claude.com/docs/en/worktrees>, the worktree lives at `.claude/worktrees/<name>/`
on branch `worktree-<name>`. The skill only chooses `<name>`. Pass `DIP-42-worktree-gate` and you
get:

```
.claude/worktrees/DIP-42-worktree-gate/
  branch: worktree-DIP-42-worktree-gate
  commit: feat(skills): ... ([DIP-42])
  PR:     [DIP-42] backlog-deliver self-isolates ...
```

**Do not** `git switch -c` to a prettier name once inside. Claude's cleanup, its `git worktree lock`
while the agent runs, and its auto-sweep all key off the branch it created; renaming orphans that
bookkeeping, and the "no changes → auto-remove the worktree and its branch" path stops reflecting
where the work actually is. The `worktree-` prefix is cosmetic; the `[PREFIX-n]` id is still in the
branch, the commits, and the PR title, which is what actually matters.

### BACKLOG_ROOT — the rule that makes the whole epic work

**Observed, not assumed.** The backlog CLI resolves `.backlog` by walking **up from `cwd`**, *not*
from `config.toml`'s `repos[].path` (which is pinned to an absolute path to the main checkout and is
simply not used for this). Run from a worktree, the CLI reads and writes the **worktree's own**
`.backlog/` — giving each agent a private, branch-local, divergent copy of the shared backlog:

```
wt-a $ backlog status                       →  Tasks: 9    (main checkout reports 10)
wt-a $ backlog subtask list --task task_010 →  No subtasks yet.   (main lists two)
```

The worktree sees backlog state **as committed on its own branch**, not live state. Writes follow
reads: a `subtask move` from the worktree dirties the *worktree's* YAML and leaves the main
checkout's untouched.

The fix, and the reason it belongs to *this* story — nothing else can happen until the skill knows
where the real backlog lives:

```bash
BACKLOG_ROOT=$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")
```

Verified in **both** modes: in the main checkout it resolves to the checkout itself, so there is **no
special case** and no dual-mode logic. Every `backlog` invocation in the skill runs from it; none
runs from the worktree.

This single lever also fixes two other defects for free:

- **Claims become cross-agent visible.** With per-worktree `.backlog/` dirs, two worktrees each got
  their own claims dir and were invisible to one another — both took an "exclusive" claim on the same
  path, with independent id counters and no warning. One `.backlog/` means one claims dir, which is
  what makes DIP-43 buildable at all.
- **`claim start`'s ENOENT disappears.** `.backlog/claims/` is gitignored, so it is never checked out
  into a fresh worktree and the CLI does not `mkdir -p` it — `claim start` there dies with
  `ENOENT … /.backlog/claims/active/claim_001.json`. The main checkout already has the dirs.

### Consequence for the dirty gate

The main checkout will now **always** carry uncommitted `.backlog/{tasks,subtasks}.yaml` +
`id-counters.json` churn while agents are running. That is normal, it is shared state, and it is
**not** the agent's uncommitted work. The gate must ignore exactly those paths — and only those.
`.claude/worktrees/` is handled by DIP-40's gitignore entry, so it never reaches the gate.

### bun install is not optional

A worktree is a clean checkout: no `node_modules`. The verify suite is
`bun run lint && bun run typecheck && bun run test`, and all three need it. Skipping the install
produces failures that read like real code errors. Run it immediately after entering, before the
first verify, and treat a failed install as a hard stop.

## Open questions
none
