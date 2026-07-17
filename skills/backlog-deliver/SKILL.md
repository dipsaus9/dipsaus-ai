---
name: backlog-deliver
description: Drive a single backlog story (native id like DIP-1.1) from To Do to Done for any repo using Backlog.md (MrLesk/Backlog.md) + Claude. Reads the task file in full, gates on readiness, restates the contract, then runs a guarded implement->verify->commit loop on the story's frozen `<id>/<slug>` branch. Commits autonomously (every commit green, id-referenced), checks off acceptance criteria as they're met, closes the parent epic when its last story lands, pushes once, and reports which files changed and why plus a compare link the human opens the PR from. Uses the git CLI only — never gh/glab or a host API. Handles Type:spike stories via a research/interview loop. Use when asked to "deliver", "pick up", "implement", "do", or "complete" a story, or given a story id to take to done. Examples: "/backlog-deliver DIP-1.1", "pick up the next ready story", "deliver DIP-4.2".
---

# backlog-deliver — take one story from To Do to Done

You are the orchestrator of a single story's delivery. You drive **one** story end to end:
readiness gate → restate → guarded implement/verify/commit loop on its own branch → push → report.

Pairs with **`backlog-plan`**, which authored the backlog you consume. The story standard and the
field mapping live in that skill's `reference/`; you *read and enforce* them here.

The backlog tool is **Backlog.md** ([MrLesk/Backlog.md](https://github.com/MrLesk/Backlog.md)):
markdown-native tasks in `backlog/tasks/`, driven entirely by the `backlog` CLI.

**Authority:** the project's `CLAUDE.md` / `AGENTS.md` apply at every step. Never override a hard
rule; on conflict, stop and ask. When they and this skill agree, follow them.

---

## Golden constraints (never violate)

1. **Scope discipline.** Stay strictly within the story's acceptance criteria / References.
   Out-of-scope work → a **new story**, never silent scope creep.
2. **The CLI is the only writer.** Read tasks with `backlog task <id> --plain`; mutate them only
   with `backlog task edit` (status, `--check-ac`, `--append-notes`, `--final-summary`). **Never
   hand-edit files under `backlog/`** — Backlog.md's own rule, and ours.
3. **The git contract below is binding** — branch name, green-per-commit, single push, human-opened
   PR. It is not configurable and not negotiable per story.
4. **Secrets.** Never read `.env*`; never commit secrets.
5. **Halt on irreversible / out-of-band actions.** Destructive migrations, infra changes, prod
   writes, anything the story can't safely do autonomously → stop and ask the user to do/decide it.
6. **Project rules win.** On any conflict with `CLAUDE.md`/`AGENTS.md`, stop and ask.
7. **One story at a time.** This skill owns a single story from claim to delivery.

---

## Git contract (branches, commits, delivery)

Binding for every story. The spike flow follows the same rules for its doc-only commits.

### Tooling

Use the **`git` CLI only** — `git switch`, `git add`, `git commit`, `git push`. **Never `gh`,
`glab`, `hub`, or a host's REST API**, for any purpose, even when installed and authenticated. You
never open the PR; you print a link and the human opens it.

### Branch — one story, one branch

```
<id>/<slug>            e.g.  DIP-1.1/two-tier-joke-formatter
```

- `<id>` is the story's native Backlog.md id, uppercase, verbatim (dots included). The branch is
  what ties the commits to the story — no other prefix scheme (`feat/`, `fix/`, `story/`) is
  allowed in front of it.
- `<slug>` — 2–4 words drawn from the story title: lowercase, hyphenated, no id repeated, no type
  prefix. Take it from the `Branch:` line in the task's description (`backlog-plan` writes it);
  derive it yourself only when the line is absent.
- Cut from an up-to-date base: `git switch <base> && git pull --ff-only`, then
  `git switch -c <id>/<slug>`. The base is the remote's default branch
  (`git symbolic-ref refs/remotes/origin/HEAD`, else ask).
- Never reuse a branch across stories. **Never commit a story on the base branch.** Before every
  commit, confirm `git branch --show-current` is this story's branch.

### Commits — autonomous, green, and split when it helps

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

### Push — once, at the end

`git push -u origin <id>/<slug>`, after the final verify and the close-out commit. Never push the
base branch. No remote, or push refused → not a story failure: say so, the branch stays local,
skip the link.

### PR link — printed, never opened

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

---

## Verify (resolved once, up front)

1. **Auto-detect from `package.json` scripts**, in order: `lint`, `typecheck`, `test`, `build` —
   run each that exists; all must pass. **Skip** long/interactive/billed scripts by name:
   `test:eval`, `e2e`, anything matching `*:watch` or `*:dev`.
2. No `package.json` / no scripts → **degrade** to the story's own Verify steps (in its notes) +
   self-review. Never a hard failure.

Per-story Verify steps (in the task's notes) run **in addition to** the repo baseline.

## Step 0 — Intake

1. If a story id was given (`DIP-1.1`), load it. If none was given, list candidates —
   `backlog task list -s "To Do" --plain` — filter to stories (not epics) whose dependencies are
   all Done and that carry no `needs-refinement` / `needs-info` label, present the shortlist and
   **ask which to pick**. Never silently auto-start.
2. Load the story fully: `backlog task <id> --plain` — title, description (Outcome, `Type:`,
   `Branch:`), acceptance criteria, dependencies, References, plan, notes. Read it all.

## Step 1 — Readiness gate (abort or ask on failure)

Before touching code:

1. **Well-formed.** The story meets the standard: one outcome, concrete title, objective
   acceptance criteria, References present, Branch line present. If it carries a
   `needs-refinement` / `needs-info` label, has open questions in its notes, or has vague/empty
   acceptance criteria → **stop and ask to refine** (route the user to `backlog-plan`). A vague
   story can't be driven to done.
2. **Dependencies Done.** Every dependency is `Done`. If not, stop (continue only on explicit
   override).
3. **Clean git + on the base branch**, up to date. Uncommitted changes → abort. This is what makes
   autonomous commits safe: everything the branch accumulates from here is yours.
4. **Not already in progress** — status is `To Do`, and `<id>/…` doesn't already exist locally or
   on the remote (`git branch --list '<id>/*'`, `git ls-remote --heads origin '<id>/*'`). If it
   does, stop and ask.

If the description says `Type: spike`, skip to **Spike flow** below (the code loop doesn't apply).

## Step 2 — Start

1. Claim it: `backlog task edit <id> -s "In Progress"`.
2. Cut the story branch per the git contract: base up to date, then `git switch -c <id>/<slug>`.

## Step 3 — Restate + plan

1. Echo the **contract** back: outcome, acceptance criteria, References, branch name. This is what
   you will and won't do, and where it will land.
2. Think through *how*, honoring project conventions and reusing existing utilities (search first).
   Record the plan on the task: `backlog task edit <id> --plan "…"` (or refine the existing plan).
3. Proceed — you are not stopping again until the report.

## Step 4 — Implement → verify → commit (loop)

Repeat until the exit condition holds. Each pass ends in a commit or in a fix:

1. **Implement** the next slice, strictly within the References. Reuse utilities; follow the
   story's plan and notes.
2. **Self-review** the uncommitted diff against the acceptance criteria it touches and every
   project rule. Fix what you find.
3. **Verify** — run the resolved verify command(s); all must pass. Plus any per-story Verify steps.
4. **Commit** the slice per the git contract — green, scoped, Conventional, id-referenced. No
   approval. Red verify → fix and re-run; never commit through it.
5. **Check off** each acceptance criterion the slice completed:
   `backlog task edit <id> --check-ac <n>`. Record anything learned worth keeping:
   `--append-notes "…"`.

**Exit when:** every acceptance criterion is objectively met and checked, verify is green, and the
working tree is clean (everything is committed).

### Escape hatches — stop and escalate (don't spin)
- **Iteration cap** (~5 loops) without convergence → present remaining gaps for a human decision.
  Commits already made stay on the branch; say where it stands.
- **Irreversible / forbidden action required** → halt and ask (constraint 5).
- **Repeated identical failure / oscillation** → break out and escalate.
- **Scope / criteria mismatch** → pause; amend the story via `backlog-plan` or spin a new story.
  Never silently expand scope.

## Step 5 — Close out the story (on the branch)

1. `backlog task edit <id> -s Done --final-summary "<what shipped, in one paragraph>"`.
2. **Close the epic if this was its last story.** Read the parent epic
   (`backlog task <epicId> --plain`); if every subtask is now Done, close it here, on this
   branch — never later on the base branch. Check off each epic acceptance criterion the
   delivered stories objectively satisfy, then
   `backlog task edit <epicId> -s Done --final-summary "<what the epic shipped, referencing
   its stories>"`. If any epic criterion is **not** met by the delivered stories, leave the
   epic open and flag the gap in the report instead — an epic never closes on a technicality.
3. Verify once more, then commit the task-file changes as the branch's final commit:
   `chore(backlog): mark DIP-1.1 delivered (DIP-1.1)` — or, when the epic closes too,
   `chore(backlog): mark DIP-1.1 delivered, close epic DIP-1 (DIP-1.1)`. The task files under
   `backlog/tasks/` are tracked, so they belong on the branch with the work they describe.

## Step 6 — Push

`git push -u origin <id>/<slug>`. Keep the push output — it may carry the host's own create-PR
link.

## Step 7 — Report (the deliverable summary)

Present, in this order:

1. **What changed, file by file** — every file you touched, what changed in it, and **why** (tie
   each to the acceptance criterion it serves). Group by commit when there's more than one.
   ```
   | File | Change | Why |
   |---|---|---|
   | hooks/dad-joke/format.ts | new two-tier formatter | AC 4: pure formatJoke with Tier 1/2 |
   ```
2. **Commits** — `git log --oneline <base>..HEAD`.
3. **Evidence** — each acceptance criterion with the command output / observation that proves it,
   and any risks or follow-ups.
4. **The PR link, last** — derived per the git contract, on its own line, ready to click:
   ```
   Open the PR:
   https://github.com/<owner>/<repo>/compare/<base>...<id>%2F<slug>?expand=1
   ```
   You do not open it. You do not merge it.

Then record any notable design decision to memory (one lesson per file + a `MEMORY.md` pointer).

---

## Spike flow (`Type: spike`)

A spike has clear acceptance ("the question is answered with a rationale / a decision is
recorded"), but converges by **research + interview**, not code:

1. Claim it (`backlog task edit <id> -s "In Progress"`) and cut its branch — same `<id>/<slug>`
   rule.
2. **Investigate** — loop, using the tools available: **web search** and **interviewing the user**
   (one question at a time, recommend an answer) until you can satisfy the spike's acceptance
   criteria.
3. **Record findings** on the task — `backlog task edit <id> --append-notes "…"` per finding, and
   the decision + rationale in `--final-summary`.
4. **Propose follow-ups** — spin new deliverable stories the decision implies (via `backlog-plan`,
   or draft their titles + acceptance criteria for approval).
5. **Sign-off + close** — present findings and **wait for approval on the decision itself** (a
   spike converges on a human's judgement, not on a green verify). On approval:
   `backlog task edit <id> -s Done`, check the ACs, commit the task file, push, report + link per
   Steps 5–7, record the decision to memory.

No verify/code gates apply — the deliverable is the recorded decision + follow-up stories, so the
green-per-commit rule degrades to "the recorded findings are complete and coherent".

---

## Operating notes
- **Main loop implements.** Read-only subagents (Explore) for research are fine; implementation,
  verify, git, and the CLI stay in the main thread so the working tree stays coherent.
- **`--plain` on every read** — never parse the interactive TUI output.
- **One story at a time**, claim to delivery.
