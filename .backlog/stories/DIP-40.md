# [DIP-40] SPIKE: where does the backlog CLI write from inside a worktree, and do claims collide?

Type: spike
Status: completed

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

Experiment: two linked worktrees (`wt-a` on `spike-a`, `wt-b` on `spike-b`), both branched from
`f5d2315`, plus the main checkout. Throwaway `task_010` / `subtask_046` / `subtask_047` created for
the experiment and removed afterwards. All worktrees and spike branches deleted.

### 1. The CLI resolves `.backlog` from `cwd`, NOT from `repos[].path`

`config.toml` pins `repos[].path` and `checkout_path` to an absolute path to the main checkout, so
the plausible hypothesis was that a `backlog` command run anywhere would write *there*. **It does
not.** The CLI walks up from `cwd` and uses whichever `.backlog/` it finds first.

Evidence — `task_010` existed only in the main checkout's *uncommitted* working tree, so a worktree
checked out at `f5d2315` has a `subtasks.yaml` without it:

```
$ grep -c subtask_046 wt-a/.backlog/subtasks.yaml
0
$ cd wt-a && backlog status
Tasks: 9                       # main checkout reports 10
$ cd wt-a && backlog subtask list --task task_010
No subtasks yet.               # main checkout lists THROWAWAY A and B
```

The worktree sees backlog state **as committed on its own branch**, not live state.

Writes follow reads. `backlog subtask move subtask_035 running` from `wt-a` dirtied **wt-a's** files:

```
$ git -C wt-a status --short
 M .backlog/subtasks.yaml
 M .backlog/tasks.yaml
$ git -C <main> status --short
 (unchanged by the worktree's write)
```

So N agents in N worktrees each maintain a **private, divergent copy** of the shared backlog.

### 2. Claims are per-worktree and MUTUALLY INVISIBLE — this is the finding that matters

`backlog claim start` in `wt-a` reserving `hooks/dad-joke/config.ts`:

```
$ cd wt-a && backlog claim list
claim_002 | dipsaus-ai | spike-a | hooks/dad-joke/config.ts | until 2026-07-13T09:51:13Z

$ cd wt-b && backlog claim list
No active claims.              # <-- cannot see it

$ cd <main> && backlog claim list
No active claims.              # <-- cannot see it either
```

And therefore `wt-b` cheerfully takes an **exclusive** claim on the **same path**:

```
$ cd wt-b && backlog claim start --topic spike-b --path hooks/dad-joke/config.ts
Started claim claim_001        # note: independent id counter, no overlap warning
Scope:  hooks/dad-joke/config.ts
```

Two "exclusive" claims, same file, neither aware of the other. Overlap detection is real but only
operates **within a single `.backlog/` directory** — and each worktree has its own.

**As designed, DIP-43's premise is false: `backlog claim` cannot coordinate agents across
worktrees.** This is not a bug to work around later; it invalidates the mechanism the epic was
counting on.

### 3. `claim start` crashes outright in a fresh worktree

`.backlog/claims/` is gitignored ("ephemeral operational state — never commit"), so it is never
checked out into a new worktree, and the CLI does not `mkdir -p` it:

```
$ cd wt-a && backlog claim start --topic spike-a --path hooks/dad-joke/config.ts
ENOENT: no such file or directory, open '.../wt-a/.backlog/claims/active/claim_001.json'
```

The claims mechanism is *broken on arrival* in a `claude --worktree` session. (Finding 2 only became
observable after `mkdir -p .backlog/claims/{active,archive}` by hand.)

### 4. `claim check --staged` DOES enforce scope — locally

The one mechanism that works as advertised. Exit code is real, not just a warning:

```
$ git add README.md && backlog claim check --staged     # claim scope = config.ts
Claim claim_001 does not cover all checked paths:
  - README.md
exit 1

$ git add hooks/dad-joke/config.ts && backlog claim check --staged
Claim claim_001 covers 1 path(s).
exit 0
```

Useful as a **"did I stay in my lane"** self-guard for one agent. Useless as a cross-agent collision
detector, because it validates against the local worktree's own claim (finding 2).

### 5. The tracked YAML DOES conflict on merge — on a semantically empty timestamp

`subtasks.yaml` and `tasks.yaml` are git-tracked. Two branches, two status moves, simulated merge:

```
$ git merge-tree --write-tree --name-only spike-a spike-b
Auto-merging .backlog/subtasks.yaml
Auto-merging .backlog/tasks.yaml
CONFLICT (content): Merge conflict in .backlog/tasks.yaml
exit 1
```

The conflicting hunk is the punchline — **both branches made the *same logical change*** (the parent
epic went `ready` → `in_progress`); the only thing git could not reconcile is `updated_at`:

```
spike-a:  -    status: ready              spike-b:  -    status: ready
          +    status: in_progress                  +    status: in_progress
          -    updated_at: …T08:56:37.056Z          -    updated_at: …T08:56:37.056Z
          +    updated_at: …T09:20:42.513Z          +    updated_at: …T09:24:58.309Z
```

A four-minute timestamp difference on derived operational state. Note `subtasks.yaml` auto-merged
only by luck — the two edits happened to land in distant regions of the file. Adjacent subtask ids
would conflict there too.

### 6. DIP-42's detection test is sound

```
main checkout:  --git-common-dir = .git                    --git-dir = .git              (equal)
linked worktree: --git-common-dir = <main>/.git   --git-dir = <main>/.git/worktrees/wt-a  (differ)
```

---

## Decision

**All `backlog` CLI invocations run with `cwd` = the main checkout, in both solo and parallel mode.**
`.backlog` mutable state stays **tracked** and stays **owned by the main checkout**; it is neither
gitignored nor written from a worktree.

The main checkout is derived from inside any worktree with one portable expression:

```bash
BACKLOG_ROOT=$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")
```

Verified to resolve correctly in **both** modes — in the main checkout it yields the checkout itself,
so solo behaviour is unchanged and no branching logic is needed:

```
in main checkout:  BACKLOG_ROOT = /Users/…/dipsaus-ai
in linked worktree: BACKLOG_ROOT = /Users/…/dipsaus-ai
$ (cd "$BACKLOG_ROOT" && backlog subtask list --task task_009) | head -1
subtask_040 | … | running | [DIP-40] SPIKE…      # main's LIVE state, read from inside the worktree
```

### Rationale

This single lever fixes all four defects at once, which is why it beats the alternatives:

| Finding | Under the decision |
|---|---|
| 1 — divergent private state | One `.backlog/`. Agents read and write live, shared state. |
| 2 — invisible claims | One claims dir → **claims become cross-agent visible. DIP-43 works.** |
| 3 — `claim start` ENOENT | The main checkout already has `claims/active/`. Never hit. |
| 5 — YAML merge conflict | The worktree's `.backlog/*.yaml` is never touched, so it never diverges, so it cannot conflict. |

The alternatives were considered and rejected:

- **Gitignore the mutable YAML.** Kills the conflict but not the claims problem — each worktree still
  gets its own invisible claims dir, so DIP-43 stays unbuildable. It also throws away the shared,
  versioned backlog state the project has deliberately been committing.
- **Leave writes per-worktree and add a YAML merge driver.** Solves the *symptom* (finding 5) and
  none of the cause. Claims stay invisible; agents still act on stale, branch-local state.

### What DIP-42 / DIP-43 / DIP-44 must therefore do

- **DIP-42** — in addition to detecting the worktree, establish `BACKLOG_ROOT` and require **every**
  `backlog` CLI call in the skill to run from it. The dirty-tree gate must ignore `.backlog/*.yaml`
  in the main checkout (that churn is expected and is not the agent's).
- **DIP-43** — premise restored, unchanged in shape. `claim list` / `claim start` now genuinely see
  each other because they share one claims dir. Keep `claim check --staged` (finding 4) as the
  in-lane commit guard; it is a real exit-1 gate.
- **DIP-44** — the agent **must never stage `.backlog/{tasks,subtasks,id-counters}`** from its
  worktree. Story docs (`.backlog/stories/*.md`) are still authored and committed on the story
  branch — one file per story, so they do not collide. The integration lock in
  `$(git rev-parse --git-common-dir)/backlog-integration.lock` is still correct: all worktrees share
  the common `.git`.
- **Residual risk — folded into DIP-44 by decision.** With one shared `.backlog/`, two agents running
  `backlog subtask move` at the same instant race on the same YAML file (lost update). Status moves
  are rare and brief and `max_agents = 2`, so the window is small, but it is a real bug. DIP-44
  already introduces the integration flock; its scope is extended to guard backlog **writes** with
  the same lock rather than spinning a separate story.

### Follow-ups

No new stories. The decision is absorbed as amendments to three already-queued stories — DIP-42
(establish `BACKLOG_ROOT`, ignore main's `.backlog` churn in the dirty gate), DIP-43 (premise
restored; keep `claim check --staged` as the commit-time guard), and DIP-44 (never stage the
mutable YAML from a worktree; serialize backlog writes behind the integration lock).
