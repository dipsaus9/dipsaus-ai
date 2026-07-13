# [DIP-48] harden main's ruleset: require the CI check and require branches up to date

Type: deliverable
Status: queued

## Outcome
`main` refuses any PR that has not been tested **in the exact combination being merged**. This is the
epic's entire safety net against two parallel stories that rebase cleanly and still break each other
— and it is enforced by GitHub, not by code we have to get right.

## Done-when
- `main`'s ruleset **requires the CI workflow status check** to pass before a PR can merge
- `main`'s ruleset **requires branches to be up to date** with `main` before merging, so a PR that has not been updated onto the latest `main` cannot land — this is the mechanism that re-tests the COMBINATION, replacing the hand-rolled rebase-and-re-verify lock
- Demonstrated with two throwaway branches that rebase cleanly but break each other semantically (one adds a field to a type; the other adds a different field plus a test asserting the object's exact shape): the second PR is **BLOCKED** until updated, and CI then **fails** on the updated combination
- `gh` is installed and authenticated, so `backlog-deliver` can open PRs directly instead of falling back to printing a compare URL
- Force-push to `main` remains blocked (already true — verified)

## Depends-on
- none

## Affected area
- GitHub repository ruleset for `main` (settings, not files)
- `.github/workflows/ci.yml` (only if the job needs a stable name to be referenced as a required check)

## Verify
Do this as a real experiment, not a settings screenshot:

1. Branch A: add a field to a type. Branch B: add a *different* field to the same type, plus a test
   asserting the object's exact shape with `toEqual`. Both branch from the same `main`.
2. Open both PRs. Confirm CI passes on each **individually** — this is the trap.
3. Merge A.
4. Confirm B is now **blocked as out-of-date** and cannot be merged.
5. Update B onto `main`. Confirm CI **fails** on the combination (`tsc` and/or the `toEqual`
   assertion).
6. Delete the throwaway branches.

If B could have merged at step 4, the ruleset is not configured and **DIP-44 has no safety net**.

## Technical notes

### Why this is a story and not a checkbox

DIP-44 deletes the agent-side integration lock, the rebase-and-retry loop, and the post-rebase
re-verify. All three existed to guarantee one thing: *nothing lands on `main` that was not verified in
the combination being merged*. That guarantee now lives **here**. If this story does not land, DIP-44
is not "slightly less safe" — it is actively dangerous, because the protection it assumes silently
does not exist.

This is why DIP-44 depends on DIP-48. Build this one first.

### The repo is already most of the way there

`.github/workflows/ci.yml` already runs on `pull_request`:

```yaml
on:
  push:
    branches: [main]
  pull_request:
jobs:
  ci:
    - run: bun install --frozen-lockfile
    - run: bun run lint
    - run: bun run typecheck
    - run: bun run test
```

That is **exactly** the verify suite the agent runs locally. So the required check does not need to
be written — it needs to be *required*. Two settings on the `main` ruleset:

- **Require status checks to pass** → select the `ci` job.
- **Require branches to be up to date before merging** → this is the load-bearing one. Without it, a
  green-but-stale PR merges and the combination is never tested.

A ruleset already exists on `main` (force-push is blocked — confirmed: `GH013: Cannot force-push to
this branch`). This story extends it.

### Caveat worth knowing

`bun run test` currently passes with **no test files** (`--passWithNoTests`), so a green CI proves
less than it looks like it does. The required check is still correct and necessary — but any story in
this epic that adds runtime code must add unit tests with it, or the safety net is a green light over
an empty room.

### gh

`gh` is not installed on this machine (`gh not found`). Install and authenticate it so
`backlog-deliver` can run `gh pr create` rather than printing a compare URL for a human to click.
This is a convenience, not a correctness requirement — DIP-44 must degrade gracefully without it.

## Open questions
none
