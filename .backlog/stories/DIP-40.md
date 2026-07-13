# [DIP-40] configure the worktree environment: gitignore .claude/worktrees, pin worktree.baseRef, record the min Claude Code version

Type: deliverable
Status: completed

## Outcome
The repo is configured for Claude Code's **native** worktree system, so that when DIP-42 makes
`backlog-deliver` create worktrees, they land somewhere sane, branch from the right base, and do not
pollute the main checkout.

This is the foundation story. It is small, but every other story in the epic assumes it.

## Done-when
- `.claude/worktrees/` is added to `.gitignore`, so worktrees created under the repo root never show as untracked in the main checkout — otherwise they trip the dirty-tree gate and get swept into a `git add -A`
- `.claude/settings.json` (the **shared** file, not `settings.local.json`) explicitly sets `worktree.baseRef` to `"fresh"`, so every worktree branches from `origin/HEAD` rather than local `HEAD`. Relying on the default is not enough — pin it, because PR-per-story depends on branching from the remote
- A `.worktreeinclude` file copies `.claude/settings.local.json` into each new worktree, so a fresh worktree does not lose the per-user permission state (it is gitignored and therefore absent from a clean checkout)
- The minimum Claude Code version is recorded in `CLAUDE.md`: **v2.1.200**, below which project-scope plugins do NOT load inside a worktree — meaning this repo's own `/backlog-deliver` skill would be unavailable in exactly the place the epic needs it
- Verified by hand: create a worktree, then confirm `git status` in the main checkout is still clean

## Depends-on
- none

## Affected area
- `.gitignore`
- `.claude/settings.json`
- `.worktreeinclude` (new file)
- `.claude/CLAUDE.md`

## Verify
- `claude --worktree scratch-check` (or ask Claude to enter a worktree), then in the **main checkout**
  run `git status --short` — it must be **clean**. If `.claude/worktrees/` shows up as untracked, the
  gitignore entry is missing or wrong
- Inside the new worktree, confirm `.claude/settings.local.json` exists (proves `.worktreeinclude`
  worked) and that `git log -1` matches `origin/main`, not your local `HEAD` (proves `baseRef: fresh`)
- `bun run lint && bun run typecheck && bun run test`

## Technical notes

Per <https://code.claude.com/docs/en/worktrees>, Claude creates worktrees at
`.claude/worktrees/<name>/` on a branch named `worktree-<name>` — **inside the repo root**. That
location is the reason this story exists:

1. **It is inside the repo.** An unignored `.claude/worktrees/` makes every worktree appear as
   untracked files in the main checkout. DIP-42's readiness gate aborts on a dirty tree, so without
   this entry the epic's own gate would reject the epic's own setup. The docs say to gitignore it;
   this repo currently does not.
2. **`git add -A` in the main checkout would stage an entire worktree.** Actively destructive.

### `worktree.baseRef` — pin it, do not inherit it

Worktrees branch from `origin/HEAD` by default, falling back to local `HEAD` if no remote is
configured or the fetch fails. The setting accepts only `"fresh"` or `"head"` — not an arbitrary
git ref:

```json
{
  "worktree": {
    "baseRef": "fresh"
  }
}
```

`"fresh"` is what PR-per-story (DIP-44) needs: the branch starts from the remote's `main`, so the PR
is clean and mergeable and does not carry your unpushed local commits. Setting it explicitly means a
future contributor with a different local state gets the same behaviour. **Do not use `"head"`** —
it would make each agent's branch carry whatever happened to be in the operator's local `main`.

### Why `bun install` is NOT in this story

A fresh worktree has no `node_modules` (gitignored, and not copied). The tempting fix is to list
`node_modules` in `.worktreeinclude` — **do not**. A bun `node_modules` tree contains symlinks and
binaries that do not reliably survive a copy, and a subtly corrupted tree fails during `verify` in
ways that look like real code errors. Dependency install is an explicit `bun install` step inside
`backlog-deliver` (DIP-42), where it is visible and debuggable.

A `WorktreeCreate` hook was also considered and rejected: it **replaces Claude's default git worktree
logic entirely** (you reimplement creation yourself) and it disables `.worktreeinclude` processing.
Far too much blast radius for what is really just `bun install`.

## Open questions
none
