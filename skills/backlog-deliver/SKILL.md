---
name: backlog-deliver
description: Drive a single backlog story ([PREFIX-n]) from queued to done for any repo using the backlog CLI (osmove/backlog) + Claude. Reads the story + its companion doc, gates on readiness, restates the contract, runs a guarded implement->self-check->verify loop, commits (referencing the id), and delivers (branch + push, PR opt-in). Handles Type:spike stories via a research/interview loop. Use when asked to "deliver", "pick up", "implement", "do", or "complete" a story, or given a story id to take to done. Examples: "/backlog-deliver DIP-12", "pick up the next ready story", "deliver DIP-018".
---

# backlog-deliver — take one story from queued to done

You are the orchestrator of a single story's delivery. You drive **one** `[PREFIX-n]` end to end:
readiness gate → restate → guarded implement/verify loop → commit (id-referenced) → deliver.

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
3. **No blind commits.** Self-check + verify (if present) must pass first; commit references
   `[PREFIX-n]`; honor the `commit` gate (default `require-approval`).
4. **Secrets.** Never read `.env*`; never commit secrets.
5. **Halt on irreversible / out-of-band actions.** Destructive migrations, infra changes, prod
   writes, anything the story can't safely do autonomously → stop and ask the user to do/decide it.
6. **Project rules win.** On any conflict with `CLAUDE.md`/`AGENTS.md`, stop and ask.
7. **One story at a time.** This skill owns a single `[PREFIX-n]` from claim to delivery.

---

## Config (read once, up front)

Read `.backlog/standards.json` if present: `prefix`, `verify`, `gates`.

- **verify** — one command or a list (all must pass). If absent, auto-detect from `package.json`
  scripts in order `lint`, `typecheck`, `test`, `build`; skip `test:eval`, `e2e`, `*:watch`,
  `*:dev`. If neither exists, **degrade** to per-story `Verify` + self-review (never a hard failure).
- **gates** (defaults): `commit: require-approval` · `deliver: push` · `tdd: false` ·
  `plan_gate: false` · `external_review: null`.

---

## Step 0 — Intake

1. If a story id was given (`DIP-12`), resolve it to its native subtask (`subtask_012`) and use it.
2. If none was given, list **ready** stories — `backlog subtask list`, filter to those whose
   dependencies are all `completed` and that aren't `needs-refinement` / `needs-info` — present the
   shortlist and **ask which to pick**. Never silently auto-start.
3. Load the story fully: the subtask (title, done-when, depends-on, scope, risk) **and** its
   companion doc `.backlog/stories/<PREFIX>-<n>.md` (Outcome, Done-when, Affected area, Verify,
   Technical notes, Open questions, Type, Status). Read both in full.

## Step 1 — Readiness gate (abort or ask on failure)

Before touching code:

1. **Well-formed.** The story meets the standard: one outcome, concrete title, objective done-when,
   verifiable. If it's `needs-refinement`, carries unresolved `needs-info` / open questions, or has
   vague/empty done-when → **stop and ask to refine** (route the user to `backlog-plan`). A vague
   story can't be driven to done.
2. **Dependencies done.** Every `depends-on` is `completed`. If not, stop (continue only on explicit
   override).
3. **Clean git + on the base branch**, up to date. Uncommitted changes → abort.
4. **Not already in progress** — not already `running` / claimed, no existing story branch. If it
   is, stop and ask.

If `Type: spike`, skip to **Spike flow** below (the code loop doesn't apply).

## Step 2 — Start

1. Claim it: `backlog subtask move <id> running`.
2. Branch from the base: `git switch -c <prefix>-<n>-<slug>` (slug from the title, lowercase,
   hyphenated). If the backlog uses `isolated_worktree` scheduling, respect the worktree it owns.

## Step 3 — Restate + plan

1. Echo the **contract** back: outcome, done-when, affected area. This is what you will and won't do.
2. Think through *how*, honoring project conventions and reusing existing utilities (search first).
   Record the plan in the companion doc under `## Technical notes` (or `## Plan`).
3. **If `gates.plan_gate`** or `external_review`: get the plan approved before implementing
   (external reviewer if configured, else present it and ask). Otherwise proceed — the commit gate
   is the checkpoint.

## Step 4 — Implement → self-check → verify (loop; no commits here)

Repeat until the exit condition holds:

1. **Implement** the next slice, strictly within the affected area. If `gates.tdd`, write a failing
   test first. Reuse utilities; follow the story's technical notes.
2. **Self-review** the uncommitted diff against **every** done-when criterion and every project rule.
   Fix what you find.
3. **Verify** — run the resolved `verify` command(s); all must pass. Plus any per-story `Verify`.
   If `external_review` is set, run it on the diff and resolve high/medium findings.

**Exit when:** self-review is clean **and** verify passes **and** every done-when is objectively met.

### Escape hatches — stop and escalate (don't spin)
- **Iteration cap** (~5 loops) without convergence → present remaining gaps for a human decision.
- **Irreversible / forbidden action required** → halt and ask (constraint 5).
- **Repeated identical failure / oscillation** → break out and escalate.
- **Scope / done-when mismatch** → pause; amend the story via `backlog-plan` or spin a new
  `[PREFIX-n]`. Never silently expand scope.

## Step 5 — Report

Summarize: what changed, each done-when criterion with its evidence (command output / observation),
and any risks. State the change is reviewed but (by default) not yet committed.

## Step 6 — Commit + deliver

1. **Commit gate.** If `commit: require-approval` (default) — present the report and **wait for
   explicit approval**. If `autonomous`, proceed.
2. **Commit** (Conventional Commits, referencing the id):
   `git commit` with e.g. `feat(area): <what> ([PREFIX-n])`. Stage only this story's changes.
3. **Deliver** per `gates.deliver`:
   - `commit-only` — stop here.
   - `push` (default) — `git push -u origin <branch>`.
   - `pr` — push, then open a PR **by detected host** (from the git remote):
     - `github.com` → `gh pr create --base <base> --head <branch> --title … --body-file <doc summary>`;
       fallback `https://github.com/<owner>/<repo>/compare/<base>...<branch>?expand=1`.
     - `bitbucket.org` → REST `POST …/pullrequests` **if** a token env var is present (never read
       `.env`); fallback `…/pull-requests/new?source=<branch>&dest=<base>`.
     - `gitlab` → `glab mr create`; fallback the push-printed MR link.
     A missing CLI/token is **never a story failure** — the branch is pushed; print the deep link.
4. **Close out:** `backlog subtask move <id> completed`; set the companion doc `Status`. Record any
   notable design decision to memory (one lesson per file + a `MEMORY.md` pointer).

---

## Spike flow (`Type: spike`)

A spike has clear acceptance ("the question is answered with a rationale / a decision is recorded"),
but converges by **research + interview**, not code:

1. Claim it (`subtask move <id> running`).
2. **Investigate** — loop, using the tools available: **web search** and **interviewing the user**
   (one question at a time, recommend an answer) until you can satisfy the spike's done-when.
3. **Record findings** in the companion doc under `## Findings` — what was learned, sources, the
   decision + rationale.
4. **Propose follow-ups** — spin new `[PREFIX-n]` deliverable stories the decision implies (via
   `backlog-plan`, or draft their titles + done-when for approval).
5. **Sign-off + close** — present findings; on approval `subtask move <id> completed`, set `Status`,
   commit the doc (per the commit gate), record the decision to memory.

No verify/TDD/code gates apply — the deliverable is the recorded decision + follow-up stories.

---

## Operating notes
- **Main loop implements.** Read-only subagents (Explore) for research are fine; implementation,
  verify, git, and the CLI stay in the main thread so the working tree stays coherent.
- **`[PREFIX-n]` ↔ `subtask_NNN`.** The id in the title/doc maps 1:1 to the native subtask number;
  operate the CLI on the native id, reference `[PREFIX-n]` in commits/branches/PRs.
- **One story at a time**, claim to delivery.
