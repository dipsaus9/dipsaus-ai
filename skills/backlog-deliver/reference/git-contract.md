# Git contract (branches, commits, delivery)

The binding delivery contract for `backlog-deliver`. Read at Step 2 (cut the branch), before every
commit in Step 4, and at Steps 6–7 (push + PR link). Binding for every story; the spike flow
follows the same rules for its doc-only commits.

## Tooling

Use the **`git` CLI only** — `git switch`, `git add`, `git commit`, `git push`. **Never `gh`,
`glab`, `hub`, or a host's REST API**, for any purpose, even when installed and authenticated. You
never open the PR; you print a link and the human opens it.

## Branch — one story, one branch

```
<id>/<slug>            e.g.  DIP-1.1/two-tier-joke-formatter
```

- `<id>` is the story's native Backlog.md id, uppercase, verbatim (dots included). The branch is
  what ties the commits to the story — no other prefix scheme (`feat/`, `fix/`, `story/`) is
  allowed in front of it.
- `<slug>` — 2–4 words drawn from the story title: lowercase, hyphenated, no id repeated, no type
  prefix. Take it from the `Branch:` line in the task's description (`backlog-plan` writes it);
  derive it yourself only when the line is absent.
- Cut from an up-to-date base. In **worktree mode** (the default) the branch is cut as the worktree
  is created: `git worktree add <worktree.path>/<id> -b <id>/<slug> <base>` (see Step 2). With
  worktree mode disabled, cut it in place: `git switch <base> && git pull --ff-only`, then
  `git switch -c <id>/<slug>`. Either way the base is the remote's default branch
  (`git symbolic-ref refs/remotes/origin/HEAD`, else ask), and the resulting branch is `<id>/<slug>`
  verbatim.
- Never reuse a branch across stories. **Never commit a story on the base branch.** Before every
  commit, confirm `git branch --show-current` is this story's branch.

## Commits — autonomous, green, and split when it helps

Commits on the story branch need **no approval. Do not ask, do not present a diff for sign-off.**
In exchange, every commit is held to:

- **Green per commit.** Run the full resolved verify (below) immediately before **each** commit and
  it must pass. A red verify, or one you didn't run, means no commit. There are no WIP commits —
  every commit on the branch is a state that builds and passes.
- **Split when splitting helps the reader.** Prefer several small commits over one blob whenever the
  work has separable, independently revertible steps — a rename apart from the behaviour change it
  enables, a schema/config change apart from the code that reads it, a new utility apart from its
  first caller. One commit is right when the change is genuinely atomic. Never split so far that a
  commit can't stand alone and stay green.
- **Conventional Commits, id in the subject:**
  `feat(scheduler): cap concurrent agents (DIP-1.2)`. Body only when the *why* isn't obvious from
  the subject.
- **Stage only this story's paths** — its References, plus the story's own task file under
  `backlog/tasks/`. Never `git add -A` / `git add .`; never sweep in unrelated dirt. If unrelated
  changes appear, stop (the readiness gate should have caught them).
- Use the user's own git identity — never `-c user.name` / `-c user.email`. Never `--no-verify`.
- Never amend, rebase, or force-push anything already pushed. Fix forward with a new commit.

## Push — once, at the end

`git push -u origin <id>/<slug>`, after the final verify and the close-out commit. Never push the
base branch. No remote, or push refused → not a story failure: say so, the branch stays local,
skip the link.

## PR link — printed, never opened

Derive the compare URL from `git remote get-url origin` (normalize `git@host:owner/repo.git` and
`https://host/owner/repo.git` to `host` + `owner/repo`):

| Host | Link |
|---|---|
| `github.com` | `https://github.com/<owner>/<repo>/compare/<base>...<branch>?expand=1` |
| `gitlab.*` | `https://<host>/<owner>/<repo>/-/merge_requests/new?merge_request%5Bsource_branch%5D=<branch>` |
| `bitbucket.org` | `https://bitbucket.org/<owner>/<repo>/pull-requests/new?source=<branch>&dest=<base>` |

`git push` often prints the host's own create-PR link on stderr — if it does, prefer that verbatim
over a constructed one. Unknown host → say the branch is pushed and give no link. URL-encode the
branch (`/` → `%2F`) only where the host requires it; GitHub's compare path does not.
