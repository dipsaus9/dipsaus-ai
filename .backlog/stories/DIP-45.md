# [DIP-45] document the parallel workflow: EnterWorktree, claims, scopes, PR-per-story, backlog ownership

Type: deliverable
Status: canceled

## Outcome
An operator can run several Claudes against this backlog without reading the skill's source to find
out how it behaves — and `CLAUDE.md` no longer contradicts what the skill actually does.

## Done-when
- `backlog-deliver`'s `SKILL.md` documents that it **ALWAYS** self-isolates via `EnterWorktree`, and that it owns exactly **one** story from claim to PR
- The operator workflow is documented: run `/backlog-deliver` N times against one backlog, what each agent does, and that **no pre-launched `claude --worktree` terminals are needed**
- The claim + scope contention model is documented, including what happens when **every** ready story is contended (the agent stops and says so)
- It is documented that `.backlog` operational state is owned by the **MAIN CHECKOUT** (`BACKLOG_ROOT`), that the main checkout therefore carries an uncommitted `.backlog/*.yaml` diff while agents run, that this is **EXPECTED rather than broken**, and that the operator commits it
- The `max_agents` ceiling in `.backlog/config.toml` (currently `2`) is documented as the cap on concurrent agents, so an operator who launches 5 Claudes understands what governs them
- `CLAUDE.md`'s working agreement ("Review before commit … never auto-commit at end of a story") is **RESOLVED explicitly**, not left contradicting the skill: the agent commits only on its own branch behind a PR, so nothing reaches `main` without human review. The rule is restated to say that, rather than leaving two documents that disagree

## Depends-on
- DIP-42
- DIP-43
- DIP-44

## Affected area
- `skills/backlog-deliver/SKILL.md`
- `README.md`
- `.claude/CLAUDE.md`

## Verify
- Read the documented workflow against the merged skill: every behaviour it describes exists, and
  every parallel behaviour that exists is described. No drift in either direction
- Follow the doc literally, from a cold start, and land two stories in parallel
- `bun run lint && bun run typecheck && bun run test`

## Technical notes

**Document only what the code does.** This repo has been burned by aspirational documentation — the
README claimed an eval harness that had been deleted, across four separate manifests, and removing it
took a dedicated pass. Write this from the *merged* skill, not from this epic's intent.

The operator's mental model, which is the thing worth writing down:

```
main checkout   → /backlog-deliver DIP-x   ┐
                → /backlog-deliver DIP-y   ┘  each gates, claims, then EnterWorktree

  .claude/worktrees/DIP-x-…/   bun install → build → verify → commit → push → PR → release claim → exit
  .claude/worktrees/DIP-y-…/   refused at pickup if DIP-y's scopes collide with DIP-x's

main checkout   → review + merge the PRs, then commit the .backlog YAML (chore(backlog))
```

Three things will surprise an operator, so state them plainly:

1. **The main checkout looks dirty while agents run.** `.backlog/{tasks,subtasks}.yaml` and
   `id-counters.json` carry uncommitted status moves, because every agent writes the *shared* backlog
   via `BACKLOG_ROOT`. This is correct. The operator commits it; agents never stage it.
2. **`max_agents = 2`** in `config.toml` is the ceiling. Launching five Claudes does not give five
   concurrent runs. Document the knob and where it lives; **do not raise it as part of this story.**
3. **Branches are named `worktree-DIP-n-<slug>`.** Claude owns that name, not the skill. The
   `[DIP-n]` id is still in the commits and the PR title.

### The CLAUDE.md contradiction — resolve it, do not paper over it

`CLAUDE.md` currently says:

> **Review before commit.** Finish the work, run lint/typecheck/test, summarise the diff, and wait for
> approval before `git commit`. Never auto-commit at end of a story.

An agent that commits and opens a PR without asking is in obvious tension with that. The resolution
is real, not a loophole, and it should be written as such: **the rule exists so that nothing reaches
`main` unreviewed.** Under PR-per-story it still doesn't — the agent commits only on its own
throwaway branch, behind a PR that a human merges. The review moved from the terminal to the PR; it
did not disappear.

Restate the working agreement to say exactly that. Do not leave two documents disagreeing and hope
the reader picks the right one.

### Failure modes to cover (not just the happy path)

- Every ready story is contended → the agent stops and says so.
- A crashed agent's claim expires after the 30-minute TTL (`config.toml`, `[claims] ttl_minutes`).
- CI fails on a PR after another PR merged first → the PR is blocked as out-of-date; a human decides.
- `gh` missing → the branch is still pushed and a compare URL is printed.

## Open questions
none
