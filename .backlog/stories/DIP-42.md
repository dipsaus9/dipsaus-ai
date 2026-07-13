# [DIP-42] backlog-deliver auto-detects a linked worktree and adapts its readiness gate

Type: deliverable
Status: ready

## Outcome
A Claude launched with `claude --worktree` can actually run `/backlog-deliver` — today the readiness
gate aborts on exactly the setup the epic depends on.

## Done-when
- `backlog-deliver` detects parallel mode by comparing `git rev-parse --git-common-dir` with `git rev-parse --git-dir`: different paths mean a linked worktree
- In a worktree, the readiness gate **accepts** being on a story branch rather than aborting, and does **not** require being on the base branch
- In a worktree, Step 2 skips `git switch -c <branch>` because the worktree already *is* the story branch; it claims the story and proceeds straight to the contract restatement
- A solo run on `main` is unchanged in behaviour: same gate, same branch creation, same commit flow. **No new invocation flags are introduced**
- A dirty working tree still aborts in **both** modes — worktree mode relaxes the branch check, never the uncommitted-changes check
- The skill establishes `BACKLOG_ROOT=$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")` and **every** `backlog` CLI call runs with that cwd, in both modes
- The dirty-tree gate **ignores** `.backlog/{tasks,subtasks}.yaml` and `.backlog/id-counters.json` churn in the main checkout — that state is shared, expected to be dirty, and never staged by a worktree agent

## Depends-on
- DIP-40 (the spike decides what the gate must do about `.backlog` state)

## Affected area
- `skills/backlog-deliver/SKILL.md`

## Verify
- Solo regression: run `/backlog-deliver <id>` on `main` in the normal checkout and confirm the flow
  is identical to today — gate, branch creation, commit, push
- Parallel: `claude --worktree`, then `/backlog-deliver <id>` inside it. The gate must pass, no
  branch is created, and the story is claimed
- Negative: dirty the tree inside the worktree and confirm the gate **still aborts**
- `bun run lint && bun run typecheck && bun run test`

## Technical notes
The exact lines that break today, in `skills/backlog-deliver/SKILL.md` Step 1:

> 3. **Clean git + on the base branch**, up to date. Uncommitted changes → abort.
> 4. **Not already in progress** — not already `running` / claimed, no existing story branch.

A `claude --worktree` session starts **on a story branch, in a fresh linked worktree**. Both checks
fire. The gate rejects precisely the state it is supposed to support.

Detection, and why this one:

```bash
[ "$(git rev-parse --git-common-dir)" != "$(git rev-parse --git-dir)" ]  # => linked worktree
```

In the main checkout both resolve to the same `.git`. In a linked worktree, `--git-dir` is
`.git/worktrees/<name>` while `--git-common-dir` stays `.git`. This is the standard, scriptable
test; do not sniff the path for `/worktrees/` or parse `git worktree list`.

**Relax the branch check, never the dirty check.** Uncommitted changes in a worktree are just as
dangerous as on main — the agent would commit someone else's half-finished work. The only thing
worktree mode changes is *which branch is acceptable* and *who creates it*.

The "not already claimed" check does not go away — it gets **stronger** and moves to DIP-43, which
reserves the story via `backlog claim start`. Keep the check here; let DIP-43 replace its
implementation.

Note the skill already gestures at this: Step 2 says "If the backlog uses `isolated_worktree`
scheduling, respect the worktree it owns." `config.toml` *does* set
`branch_strategy = "isolated_worktree"`. This story turns that hint into actual behaviour.

### BACKLOG_ROOT — added by DIP-40's decision

DIP-40 proved the backlog CLI resolves `.backlog` by walking up from **`cwd`**, *not* from
`repos[].path` (which is pinned to an absolute path to the main checkout and is simply not used for
this). Run from a worktree, the CLI therefore reads and writes the **worktree's own** `.backlog/` —
giving each agent a private, branch-local, divergent copy of the shared backlog, invisible claims,
and a guaranteed `tasks.yaml` merge conflict.

The fix, and the reason it is *this* story's job: nothing else can happen until the skill knows
where the real backlog lives.

```bash
BACKLOG_ROOT=$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")
```

Verified in both modes — in the main checkout it resolves to the checkout itself, so **solo mode
needs no special case**. Every `backlog` invocation in the skill runs from `BACKLOG_ROOT`; none runs
from the worktree.

Consequence for the dirty gate: the main checkout will now *always* carry uncommitted
`.backlog/{tasks,subtasks}.yaml` + `id-counters.json` churn while agents are running. That is normal
and is **not** the agent's uncommitted work — the gate must ignore exactly those paths, and only
those. A dirty *worktree* still aborts, unchanged.

## Open questions
none
