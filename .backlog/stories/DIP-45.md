# [DIP-45] document the parallel workflow: claude --worktree, claims, scopes, integration lock, max_agents

Type: deliverable
Status: ready

## Outcome
An operator can run several Claudes against this backlog without reading the skill's source to
find out how it behaves.

## Done-when
- `backlog-deliver`'s `SKILL.md` documents parallel mode: how it is auto-detected, how the gate differs in a worktree, and that the skill still owns exactly **one** story from claim to delivery
- Documentation shows the actual operator workflow: launching N Claudes with `claude --worktree`, each running `/backlog-deliver`, and what each agent does on completion
- The claim + scope contention model is documented, including what happens when **every** ready story is contended
- The `max_agents` ceiling in `.backlog/config.toml` (currently `2`) is documented as the cap on concurrent agents, so an operator who launches 5 Claudes understands what governs them

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
README claimed an eval harness that had been deleted, across four separate manifests, and removing
it took a dedicated pass. Write this from the merged skill, not from this epic's intent. If DIP-40
forced a different design than planned, the docs describe the design that shipped.

`max_agents = 2` in `config.toml` is the current ceiling and the most likely thing to surprise
someone: launching five Claudes does not give you five concurrent runs. Document the knob, say
plainly where it lives, and note that raising it is a config edit — do not raise it as part of this
story.

Worth stating plainly, since it is the operator's mental model:

```
main checkout          → plan, review, integrate
claude --worktree A    → /backlog-deliver DIP-x  → claim → build → verify → lock → rebase → re-verify → merge
claude --worktree B    → /backlog-deliver DIP-y  → refused if DIP-y's scopes collide with DIP-x's
```

Cover the failure modes an operator will actually hit, not just the happy path: every ready story is
contended (agent stops, says so); a story goes to `review` after a post-rebase verify failure (a
human decides); a crashed agent's claim expires after the 30-minute TTL.

CLAUDE.md's "Working agreement" currently says **"Review before commit … wait for approval before
`git commit`. Never auto-commit at end of a story."** Parallel agents that self-merge are in obvious
tension with that rule. Resolve it explicitly in the docs — either the rule is scoped to solo
sessions, or parallel mode carries an explicit exception — rather than leaving two documents that
contradict each other.

## Open questions
none
