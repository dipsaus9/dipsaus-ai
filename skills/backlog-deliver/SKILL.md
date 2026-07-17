---
name: backlog-deliver
description: Drive a single backlog story ([PREFIX-n]) from queued to done for any repo using the backlog CLI (osmove/backlog) + Claude. Reads the story + its companion doc, gates on readiness, restates the contract, then runs a guarded implement->verify->commit loop on a `PREFIX-n/<slug>` story branch. Commits autonomously (every commit green, id-referenced), pushes once, and reports which files changed and why plus a compare link the human opens the PR from. Uses the git CLI only — never gh/glab or a host API. Handles Type:spike stories via a research/interview loop. Use when asked to "deliver", "pick up", "implement", "do", or "complete" a story, or given a story id to take to done. Examples: "/backlog-deliver DIP-12", "pick up the next ready story", "deliver DIP-018".
---

# backlog-deliver — take one story from queued to done

You are the orchestrator of a single story's delivery. You drive **one** `[PREFIX-n]` end to end:
readiness gate → restate → guarded implement/verify/commit loop on its own branch → push → report.

Pairs with **`backlog-plan`**, which authored the backlog you consume. The story standard and the
companion-doc format live in that skill's `reference/`; you *read and enforce* them here.

**Authority:** the project's `CLAUDE.md` / `AGENTS.md` apply at every step. Never override a hard
rule; on conflict, stop and ask. When they and this skill agree, follow them.

---

## Golden constraints (never violate)

1. **Scope discipline.** Stay strictly within the story's done-when / affected area. Out-of-scope
   work → a **new `[PREFIX-n]` story**, never silent scope creep.
2. **Backlog is source of truth.** Read/mutate the backlog only via the `backlog` CLI
   (`subtask move` / `subtask update`); never hand-edit `.backlog/*.yaml`. Story content edits go
   through `.backlog/stories/<PREFIX>-<n>.md`.
3. **The git contract below is binding** — branch name, green-per-commit, single push, human-opened
   PR. It is not configurable and not negotiable per story.
4. **Secrets.** Never read `.env*`; never commit secrets.
5. **Halt on irreversible / out-of-band actions.** Destructive migrations, infra changes, prod
   writes, anything the story can't safely do autonomously → stop and ask the user to do/decide it.
6. **Project rules win.** On any conflict with `CLAUDE.md`/`AGENTS.md`, stop and ask.
7. **One story at a time.** This skill owns a single `[PREFIX-n]` from claim to delivery.

---

## Git contract (branches, commits, delivery)

Binding for every story. The spike flow follows the same rules for its doc-only commits.

### Tooling

Use the **`git` CLI only** — `git switch`, `git add`, `git commit`, `git push`. **Never `gh`,
`glab`, `hub`, or a host's REST API**, for any purpose, even when installed and authenticated. You
never open the PR; you print a link and the human opens it.

### Branch — one story, one branch

```
<PREFIX>-<n>/<slug>            e.g.  DIP-12/parallel-agent-cap
```

- `<PREFIX>-<n>` is the story id, uppercase, verbatim. The branch is what ties the commits to the
  story — no other prefix scheme (`feat/`, `fix/`, `story/`) is allowed in front of it.
- `<slug>` — 2–4 words drawn from the story title: lowercase, hyphenated, no id repeated, no type
  prefix. Take it from the story doc's `## Branch` field when present (`backlog-plan` writes it);
  derive it yourself only when the field is absent.
- Cut from an up-to-date base: `git switch <base> && git pull --ff-only`, then
  `git switch -c <PREFIX>-<n>/<slug>`. The base is `.backlog/config.toml` `default_branch`
  (else the remote's default).
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
  `feat(scheduler): cap concurrent agents ([DIP-12])`. Body only when the *why* isn't obvious from
  the subject.
- **Stage only this story's paths** — its declared scope. Never `git add -A` / `git add .`; never
  sweep in unrelated dirt. If unrelated changes appear, stop (the readiness gate should have caught
  them).
- Use the user's own git identity — never `-c user.name` / `-c user.email`. Never `--no-verify`.
- Never amend, rebase, or force-push anything already pushed. Fix forward with a new commit.

### Push — once, at the end

`git push -u origin <PREFIX>-<n>/<slug>`, after the final verify and the close-out commit. Never
push the base branch. No remote, or push refused → not a story failure: say so, the branch stays
local, skip the link.

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

## Config (read once, up front)

Read `.backlog/standards.json` if present: `prefix`, `verify`, `gates`.

- **verify** — one command or a list (all must pass). If absent, auto-detect from `package.json`
  scripts in order `lint`, `typecheck`, `test`, `build`; skip `test:eval`, `e2e`, `*:watch`,
  `*:dev`. If neither exists, **degrade** to per-story `Verify` + self-review (never a hard failure);
  the green-per-commit rule then binds against that instead.
- **gates** (defaults): `tdd: false` · `plan_gate: false` · `external_review: null`.
  There is no commit gate and no deliver gate — the git contract above replaces both.

## Step 0 — Intake

1. If a story id was given (`DIP-12`), resolve it to its native subtask (`subtask_012`) and use it.
2. If none was given, list **ready** stories — `backlog subtask list`, filter to those whose
   dependencies are all `completed` and that aren't `needs-refinement` / `needs-info` — present the
   shortlist and **ask which to pick**. Never silently auto-start.
3. Load the story fully: the subtask (title, done-when, depends-on, scope, risk) **and** its
   companion doc `.backlog/stories/<PREFIX>-<n>.md` (Outcome, Done-when, Affected area, Branch,
   Verify, Technical notes, Open questions, Type, Status). Read both in full.

## Step 1 — Readiness gate (abort or ask on failure)

Before touching code:

1. **Well-formed.** The story meets the standard: one outcome, concrete title, objective done-when,
   verifiable. If it's `needs-refinement`, carries unresolved `needs-info` / open questions, or has
   vague/empty done-when → **stop and ask to refine** (route the user to `backlog-plan`). A vague
   story can't be driven to done.
2. **Dependencies done.** Every `depends-on` is `completed`. If not, stop (continue only on explicit
   override).
3. **Clean git + on the base branch**, up to date. Uncommitted changes → abort. This is what makes
   autonomous commits safe: everything the branch accumulates from here is yours.
4. **Not already in progress** — not already `running` / claimed, and `<PREFIX>-<n>/…` doesn't
   already exist locally or on the remote (`git branch --list`, `git ls-remote --heads origin`). If
   it does, stop and ask.

If `Type: spike`, skip to **Spike flow** below (the code loop doesn't apply).

## Step 2 — Start

1. Claim it: `backlog subtask move <id> running`.
2. Cut the story branch per the git contract: base up to date, then
   `git switch -c <PREFIX>-<n>/<slug>`. If the backlog uses `isolated_worktree` scheduling, respect
   the worktree it owns — the branch name is unchanged.

## Step 3 — Restate + plan

1. Echo the **contract** back: outcome, done-when, affected area, branch name. This is what you will
   and won't do, and where it will land.
2. Think through *how*, honoring project conventions and reusing existing utilities (search first).
   Record the plan in the companion doc under `## Technical notes` (or `## Plan`).
3. **If `gates.plan_gate`** or `external_review`: get the plan approved before implementing
   (external reviewer if configured, else present it and ask). Otherwise proceed — you are not
   stopping again until the report.

## Step 4 — Implement → verify → commit (loop)

Repeat until the exit condition holds. Each pass ends in a commit or in a fix:

1. **Implement** the next slice, strictly within the affected area. If `gates.tdd`, write a failing
   test first. Reuse utilities; follow the story's technical notes.
2. **Self-review** the uncommitted diff against the done-when criteria it touches and every project
   rule. Fix what you find.
3. **Verify** — run the resolved `verify` command(s); all must pass. Plus any per-story `Verify`.
   If `external_review` is set, run it on the diff and resolve high/medium findings.
4. **Commit** the slice per the git contract — green, scoped, Conventional, id-referenced. No
   approval. Red verify → fix and re-run; never commit through it.

**Exit when:** every done-when is objectively met, verify is green, and the working tree is clean
(everything is committed).

### Escape hatches — stop and escalate (don't spin)
- **Iteration cap** (~5 loops) without convergence → present remaining gaps for a human decision.
  Commits already made stay on the branch; say where it stands.
- **Irreversible / forbidden action required** → halt and ask (constraint 5).
- **Repeated identical failure / oscillation** → break out and escalate.
- **Scope / done-when mismatch** → pause; amend the story via `backlog-plan` or spin a new
  `[PREFIX-n]`. Never silently expand scope.

## Step 5 — Close out the story (on the branch)

1. `backlog subtask move <id> completed`; set the companion doc's `Status`.
2. Verify once more, then commit that state as the branch's final commit:
   `chore(backlog): mark [PREFIX-n] delivered ([PREFIX-n])`. `.backlog/subtasks.yaml` and the story
   doc are tracked, so this belongs on the branch with the work it describes.

## Step 6 — Push

`git push -u origin <PREFIX>-<n>/<slug>`. Keep the push output — it may carry the host's own
create-PR link.

## Step 7 — Report (the deliverable summary)

Present, in this order:

1. **What changed, file by file** — every file you touched, what changed in it, and **why** (tie
   each to the done-when it serves). Group by commit when there's more than one.
   ```
   | File | Change | Why |
   |---|---|---|
   | skills/backlog-deliver/SKILL.md | added the git contract section | done-when 1: branch + commit rules are stated |
   ```
2. **Commits** — `git log --oneline <base>..HEAD`.
3. **Evidence** — each done-when criterion with the command output / observation that proves it, and
   any risks or follow-ups.
4. **The PR link, last** — derived per the git contract, on its own line, ready to click:
   ```
   Open the PR:
   https://github.com/<owner>/<repo>/compare/<base>...<PREFIX>-<n>/<slug>?expand=1
   ```
   You do not open it. You do not merge it.

Then record any notable design decision to memory (one lesson per file + a `MEMORY.md` pointer).

---

## Spike flow (`Type: spike`)

A spike has clear acceptance ("the question is answered with a rationale / a decision is recorded"),
but converges by **research + interview**, not code:

1. Claim it (`subtask move <id> running`) and cut its branch — same `<PREFIX>-<n>/<slug>` rule.
2. **Investigate** — loop, using the tools available: **web search** and **interviewing the user**
   (one question at a time, recommend an answer) until you can satisfy the spike's done-when.
3. **Record findings** in the companion doc under `## Findings` — what was learned, sources, the
   decision + rationale.
4. **Propose follow-ups** — spin new `[PREFIX-n]` deliverable stories the decision implies (via
   `backlog-plan`, or draft their titles + done-when for approval).
5. **Sign-off + close** — present findings and **wait for approval on the decision itself** (a spike
   converges on a human's judgement, not on a green verify). On approval: `subtask move <id>
   completed`, set `Status`, commit the doc, push, report + link per Steps 5–7, record the decision
   to memory.

No verify/TDD/code gates apply — the deliverable is the recorded decision + follow-up stories, so
the green-per-commit rule degrades to "the doc is complete and coherent".

---

## Operating notes
- **Main loop implements.** Read-only subagents (Explore) for research are fine; implementation,
  verify, git, and the CLI stay in the main thread so the working tree stays coherent.
- **`[PREFIX-n]` ↔ `subtask_NNN`.** The id in the title/doc maps 1:1 to the native subtask number;
  operate the CLI on the native id, reference `[PREFIX-n]` in commits/branches/links.
- **One story at a time**, claim to delivery.
