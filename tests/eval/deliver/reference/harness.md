# Deliver eval harness: sandbox shape + plugin availability

Decision record for DIP-10.1. Fixes the fixture shape the deliver eval (DIP-10.2–10.6) is built on,
with evidence gathered in this repo. **Go** on the throwaway-repo + local-bare-remote sandbox, with
one hard requirement the spike surfaced: **the plugin must be installed into the eval environment**,
because the skills reach their CLI via `${CLAUDE_PLUGIN_ROOT}`, which only resolves for an installed
plugin.

---

## AC#1 (git mechanics) — proven

A throwaway repo with a **local bare repo as `origin`** exercises the real git contract end to end:

```
git init --bare origin.git                      # the local "remote"
git init work && cd work; …commit; git push -u origin main     → pushed OK
git worktree add .worktrees/DIP-1.1 -b DIP-1.1/smoke main
  …commit feature.txt; git push -u origin DIP-1.1/smoke        → pushed OK
git ls-remote --heads origin.git                → main, DIP-1.1/smoke  (both landed)
git worktree remove … --force                   → clean teardown
```

So `backlog-deliver`'s worktree → commit → push path runs for real, entirely on disk, and tears
down cleanly. **Caveat:** `origin` is a `file://` path, not `github.com`, so `backlog-deliver`'s
PR-link derivation hits "unknown host → branch pushed, no link". That is fine — the grader
(DIP-10.3) scores the **pushed branch and its commits**, not a PR URL.

## The load-bearing finding — plugin availability

`~/.claude/plugins/installed_plugins.json` shows dipsaus-ai is **not installed** (only warp,
learning-output-style, caveman). Therefore a headless `claude -p` in a throwaway repo does **not**
see `backlog-deliver`, its `backlog-workflow` CLI, the `backlog-guard` hooks, or the
`story-reviewer` agent by default.

Copying the skill folders into the fixture's `.claude/skills/` is **not sufficient**: the skills
invoke the CLI as `bun "${CLAUDE_PLUGIN_ROOT}/bin/backlog-workflow.ts" …`, and `${CLAUDE_PLUGIN_ROOT}`
only resolves for an **installed** plugin. Project-local copies would break every CLI call.

**Decision:** the harness **installs the dipsaus-ai plugin once** into the eval environment (from
this repo as a local marketplace) before the run, so `${CLAUDE_PLUGIN_ROOT}` resolves and the CLI,
hooks and agent are all live. Each fixture is then a **pristine** repo needing only its own content
+ backlog + config + story — no per-fixture plugin plumbing. Installing the plugin mutates
`~/.claude`, so the runner must do it deliberately (and ideally restore afterwards); this is a
setup step for DIP-10.5, not something a fixture does.

## AC#3 — the fixed fixture-case shape

Each deliver eval case is a directory with:

```
<case>/
  repo/                     # the starter repo contents (source files, package.json/etc.)
  story.md                  # the ready story to deliver (or a script that creates it via the CLI)
  backlog-workflow.json     # → copied to .claude/backlog-workflow.json (worktree on, verify, pr.mode: link)
  expected.json             # expected outcome: branch <id>/<slug>, which ACs, declared References
```

The runner, per case: (1) copies `repo/` into a temp dir, `git init`, initial commit, `git init
--bare` a sibling `origin.git`, wire `origin`; (2) `backlog init` + create the story from `story.md`
(or apply a prebuilt `backlog/`); (3) drop `.claude/backlog-workflow.json`; (4) run `backlog-deliver
<id>` headless with the installed plugin; (5) hand the resulting repo + `expected.json` to the
grader (10.3) and judge (10.4); (6) tear down the temp dir + worktree.

## AC#1 (full headless run) — scope + honest limit

The git mechanics and the plugin-availability requirement are proven/decided. A **full** headless
`backlog-deliver` run (real story, real code work, nested `story-reviewer`, push) was **not**
executed in this spike: it requires installing the plugin into `~/.claude` (a deliberate env
mutation) and a billed nested `claude -p` run, which is disproportionate to run inline. It is the
**first thing DIP-10.5 does** — a single end-to-end smoke on one fixture, before the corpus runs —
and it carries the risk that headless mode may handle the nested reviewer subagent or the guard hook
differently than an interactive session. If that smoke fails, the fallback is `review.enabled:
false` fixtures (grade delivery without the review gate) until headless nesting is confirmed.
(Compare DIP-9.1, which likewise proved the mechanism and deferred the first real run.)

## Go / no-go

**GO** on the throwaway-repo + local-bare-remote sandbox and the fixture shape above, **provided**
the harness installs the plugin into the eval environment so `${CLAUDE_PLUGIN_ROOT}` resolves.
DIP-10.5 opens with a one-fixture end-to-end headless smoke to confirm the full run before the
corpus.
