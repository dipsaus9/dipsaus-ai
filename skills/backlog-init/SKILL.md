---
name: backlog-init
description: Bootstrap the backlog workflow in any repo: scan for stack, scripts and base branch, interview only for what the scan cannot settle, then write a schema-valid .claude/backlog-workflow.json and initialise a Backlog.md project when none exists. On an empty (unborn-HEAD) repo it also interviews the purpose, writes a README, and makes one bootstrap commit (pushing only when the remote base branch is absent); a repo with history is never committed to. Part of the backlog-* suite alongside backlog-plan and backlog-deliver. Use when setting up a repo for the workflow, or invoked as /backlog-init.
---

# backlog-init — bootstrap the flow workflow in a repo

Make the flow-* suite usable in a repo of any stack, without asking the user what the repo already
answers. You **scan**, then **interview only the gaps**, then **write** a validated config and
**initialise** a Backlog.md project if there is none. You never plan or deliver — that is
`backlog-plan` / `backlog-deliver`.

**Authority:** the project's `CLAUDE.md` / `AGENTS.md` apply. The CLI is the only writer of backlog
state; you write exactly one non-backlog file, `.claude/backlog-workflow.json`.

The config schema and its reader ship in `bin/backlog-workflow.ts` + `src/workflow/` (DIP-7.3).
**Never re-derive stack detection here** — call the CLI so there is one source of truth.

---

## Step 0 — Refuse-to-clobber check

If `.claude/backlog-workflow.json` already exists, **stop before doing anything else**: show the
user the current config, say what your scan would change, and proceed only on explicit
confirmation (AC#5). Never silently overwrite an existing config.

## Step 1 — Scan (don't ask what the repo tells you)

Detect, and record for the interview:

1. **Stack + package manager**, by manifest and lockfile:
   | Stack | Manifest | Lockfile / PM signal |
   |---|---|---|
   | node/bun | `package.json` | `bun.lock`→bun, `pnpm-lock.yaml`→pnpm, `package-lock.json`→npm |
   | python | `pyproject.toml` / `setup.py` | `uv.lock`, `poetry.lock` |
   | go | `go.mod` | — |
   | rust | `Cargo.toml` | `Cargo.lock` |
   | java | `pom.xml` / `build.gradle` | maven / gradle |
   | php | `composer.json` | `composer.lock` |
   | ruby | `Gemfile` | `Gemfile.lock` |
   | dotnet | `*.csproj` / `*.sln` | — |
   A repo may hit several (polyglot) — record all.
2. **Verify commands** — `bun "${CLAUDE_PLUGIN_ROOT}/bin/backlog-workflow.ts" verify-detect`. This
   resolves the ordered list from the repo itself (node scripts, and python/go/rust canonicals);
   empty is fine (delivery degrades to per-story Verify).
3. **Base branch** — `git symbolic-ref refs/remotes/origin/HEAD` (else `git remote show origin`,
   else note there is no remote).
4. **Existing backlog** — is there a `backlog/config.yml` (or a `.backlog/`)? Read `task_prefix`
   and `auto_commit` if so.
5. **Repo name** — from `package.json` `name`, else the directory name — to propose the task prefix.
6. **Repo state — empty vs existing.** Is HEAD **unborn** (no commits — `git rev-parse --verify
   HEAD` fails)? An unborn HEAD means a freshly `git init`ed repo and triggers the **empty-repo
   bootstrap** (Step 5). A repo that already has history stays **hands-off** — init writes files but
   never commits or pushes. Also note whether the base branch already exists on the remote
   (`git ls-remote --heads origin <base>`), which decides whether the bootstrap may push.

## Step 2 — Interview (only the gaps, one question at a time)

Ask only what the scan cannot settle. Each question carries a **recommended** answer. One at a time.

- **Repo purpose/goal** — **empty-repo bootstrap only** (unborn HEAD, from Step 1.6): what is this
  repo for — its goal, scope, how it is run. Its answer becomes the README written in Step 5. Skip
  entirely for a repo that already has history.
- **Task prefix** — propose from the repo name (`dipsaus-ai`→`DIP`, `acme-web`→`AW`). Skip if a
  backlog already exists (its prefix is frozen).
- **`parallelism.maxAgents`** — how many stories may be in flight at once (recommend 3).
- **`worktree.path` / `worktree.install`** — where per-story worktrees are created (recommend
  `.worktrees`) and the install command run inside a fresh one (from the detected PM, e.g.
  `bun install`). Isolation is **auto-detected at delivery time**, not configured — there is no
  `worktree.enabled` question (the key was removed in DIP-11.1).
- **`pr.mode`** — `link` (print a compare URL, recommended default) or `create` (open a draft PR
  via `gh`).
- **`review.model`** — the reviewer agent's model (recommend empty = inherit the session default);
  confirm `review.enabled` (recommend on) and `review.maxRounds` (recommend 3).

## Step 3 — Write the config

Write `.claude/backlog-workflow.json` with every field the schema requires (see
`bin/backlog-workflow.ts` / `src/workflow/schema.ts`):

```json
{
  "parallelism": { "maxAgents": 3 },
  "worktree": { "path": ".worktrees", "install": "bun install", "includeGitignored": [] },
  "verify": ["bun run lint", "bun run typecheck", "bun run test"],
  "pr": { "mode": "link" },
  "review": { "enabled": true, "model": "", "maxRounds": 3 },
  "backlog": { "dir": "backlog", "prefix": "DIP" }
}
```

Then **validate it**: `bun "${CLAUDE_PLUGIN_ROOT}/bin/backlog-workflow.ts" validate`. It must exit 0
(AC#3). Fix any field-level error it reports before continuing.

## Step 4 — Initialise the backlog (only if none exists)

If the scan found **no** backlog, initialise one (never re-initialise an existing one — AC#4):

```
backlog init "<project>" --defaults --integration-mode cli --agent-instructions none \
  --backlog-dir backlog --config-location folder --task-prefix <PREFIX>
```

`auto_commit` must be **`false`** — the git contract owns every commit. If an existing backlog has
`auto_commit: true`, stop and ask the user to set it false (`backlog config set auto_commit false`);
do not proceed with it on.

## Step 5 — Empty-repo bootstrap (unborn HEAD only)

**Only when Step 1.6 found an unborn HEAD.** A repo that already has history is **hands-off**: init
writes its files (`.claude/backlog-workflow.json`, the `backlog/` scaffold) but makes **no commit
and no push** — the user commits them however they like, exactly as today. Skip this entire step
for such a repo.

On an unborn HEAD, give the new repo its first content and its first commit:

1. **Write `README.md`** from the purpose interview (Step 2): a title, a one-paragraph statement of
   what the repo is for, and how it is run if known. This is the repo's first real file.
2. **One bootstrap commit on the base branch**, bundling everything init produced — `README.md`,
   `.claude/backlog-workflow.json`, and the Backlog.md scaffold (`backlog/`). Stage exactly those
   paths (scoped, **never** `git add -A`) and commit once: `chore: bootstrap backlog workflow`. The
   guard permits this base commit **only because HEAD is unborn** — the empty-repo exception from
   DIP-11.2. It is the single commit init ever makes.
3. **Push only when the remote base branch is absent.** Check `git ls-remote --heads origin <base>`:
   - **empty** → `git push -u origin <base>` (the guard permits a base push only when the remote
     branch does not yet exist — DIP-11.2);
   - **already present** → **do not push**; tell the user the remote base already exists and to
     reconcile it manually (init never force-pushes or overwrites history);
   - **no remote configured** → skip the push and say so; the bootstrap commit stays local.

## Step 6 — Report (end by showing the resolved verify list)

Report: the detected stack(s) and package manager, the config path written, whether a backlog was
initialised or reused, whether an **empty-repo bootstrap** ran (README + bootstrap commit, and
whether it pushed), and — last — the **resolved verify command list** from Step 1.2, so the user
sees exactly what `backlog-deliver` will run in this repo before trusting it (AC#6). If the list is
empty, say so and that delivery will fall back to each story's own Verify steps.

Then hand off: the repo is ready for `backlog-plan` to plan an epic and `backlog-deliver` to deliver it.

---

## Notes

- **You write one config file** (`.claude/backlog-workflow.json`) and optionally run `backlog init`.
  Everything else is read-only scanning + interview — **except the empty-repo bootstrap** (Step 5),
  which, on an unborn HEAD only, additionally writes a `README.md` and makes the single bootstrap
  commit (guard-permitted per DIP-11.2). A repo with history is never committed to.
- **The CLI is the source of truth** for detection and validation — never duplicate its logic in
  prose here.
- **`--plain` on every backlog read** — never parse the TUI.
