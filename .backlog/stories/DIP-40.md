# [DIP-40] SPIKE: where does the backlog CLI write from inside a worktree, and do claims collide?

Type: spike
Status: ready

## Outcome
A recorded, evidence-backed answer to: **does the shared backlog survive N agents in N worktrees?**
Specifically where a CLI write lands, whether claims collide, whether `claim check` enforces scope,
and whether the tracked YAML conflicts on merge.

Every other story in this epic is designed against the answer. This story gets it before the design
is committed to.

## Done-when
- Recorded finding: when `backlog subtask move <id> running` runs with cwd inside a **linked worktree**, which file is mutated — the worktree's `.backlog/subtasks.yaml`, or the main checkout's (`config.toml` pins `repos[].path` to an absolute path)? Observed evidence pasted into the Findings section
- Recorded finding: do two concurrent `backlog claim start` calls from two different worktrees collide, queue, or silently both succeed? What does `backlog claim list` show across worktrees?
- Recorded finding: does `backlog claim check` actually reject staged paths outside the current claim's scope? Demonstrated by staging an out-of-scope file and observing the result
- Recorded finding: if `.backlog/*.yaml` **is** mutated in the worktree, does merging two story branches to main produce a YAML conflict? Demonstrated with two throwaway branches, or explicitly ruled out because writes land in the main checkout
- Decision recorded with rationale: whether `.backlog` mutable state stays tracked, gets gitignored, or is left to the main checkout — and what DIP-42 / DIP-43 / DIP-44 must therefore do

## Depends-on
- none

## Affected area
- `.backlog/stories/DIP-40.md` (the findings themselves)
- throwaway git worktrees + branches, deleted afterwards

No production file is modified. Scoped this way so the spike does not contend with any other story.

## Verify
Manual experiment. No automated verify — the deliverable is the recorded decision.

1. `git worktree add /tmp/wt-a -b spike-a` and `/tmp/wt-b -b spike-b`.
2. From `/tmp/wt-a`, run a **read** first (`backlog status`) to confirm the project resolves at all.
3. From `/tmp/wt-a`, move a throwaway subtask to `running`. Then `git status` in **both**
   `/tmp/wt-a` and the main checkout to see which `.backlog/subtasks.yaml` went dirty. This is the
   single most important observation in the spike.
4. Start a claim in `/tmp/wt-a`; start another in `/tmp/wt-b`. Run `backlog claim list` from each.
5. In one worktree, stage a file outside the claim's scope and run `backlog claim check`.
6. If (and only if) the YAML is mutated per-worktree: commit divergent YAML on both branches and
   attempt to merge both to a scratch branch, to see whether it conflicts.
7. Clean up: `git worktree remove`, delete the throwaway branches, restore any moved subtask.

**Use throwaway subtasks, not real ones.** Do not leave a real story stuck in `running`.

## Technical notes
The reason this is a spike and not an assumption:

`.backlog/subtasks.yaml` and `tasks.yaml` are **git-tracked**, and every status transition rewrites
them — we committed that file on all seven stories of `task_007`. If N agents each rewrite it in
their own worktree, they collide on merge.

**But** `config.toml` declares `repos[].path` and `checkout_path` as an **absolute path to the main
checkout**. So a `backlog` command run from `/tmp/wt-a` may resolve the project to the main checkout
and write *there* — leaving the worktree's own copy untouched. If that is what happens, the YAML
never diverges per-branch and there is nothing to conflict... but the main checkout accumulates
dirty `.backlog` state that nobody is committing, and an agent's `git add -A` in its worktree would
not pick it up.

Both outcomes are plausible and they imply **opposite designs**, which is exactly why guessing here
would be expensive.

Related: `.backlog/.gitignore` already excludes `claims/`, `runs/`, `worktrees/` as "ephemeral
operational state — never commit". So the claims mechanism is *designed* to be local and
uncommitted. The open question is whether the story **status** should have been too.

Also note `backlog claim gc` mentions "orphan `.git/backlog-context.json` pointers" — worktrees each
have their own `.git` file, so the claim context may well be per-worktree by construction. Confirm.

## Open questions
none

## Findings
<!-- filled in during delivery: observed writes, claim behaviour, conflict result, the decision -->
