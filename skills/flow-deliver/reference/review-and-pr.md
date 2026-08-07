# Agentic close-out: guard hooks, reviewer, and PR mode

Decision record for DIP-7.2. Freezes the three contracts the gated close-out depends on, so
DIP-7.6 (deliver close-out), DIP-7.9 (reviewer agent) and DIP-7.10 (guard hooks) can be built in
parallel without re-negotiating anything. Mechanics are proven by experiment in this repo; the raw
results are quoted inline.

---

## 1. Guard hooks (DIP-7.10) — proven mechanics

This repo already ships plugin hooks the same way DIP-7.10 will: `hooks/hooks.json` maps events to
`bun "${CLAUDE_PLUGIN_ROOT}/hooks/<name>.ts"` entrypoints. `PreToolUse` is a **blocking** event —
it can deny a tool call — so the guard is a `PreToolUse` matcher on `Bash`.

### Input / output contract (from the shipped dad-joke hooks)

A hook reads the tool call as JSON on **stdin** (`readFileSync(0, 'utf8')`); for a Bash call the
payload carries `tool_name: "Bash"`, `tool_input.command`, and `cwd`. Two ways to block:

- **exit code 2**, or
- print `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"…"}}`
  and exit 0.

The reason string is preferred: it tells the agent *why* and how to proceed, so it stops rather
than trying a workaround.

### AC#1 — a plugin hook blocks git, and no-ops without config

A throwaway `PreToolUse` guard driven with crafted payloads in a scratch git repo:

```
ON BASE BRANCH (main), config present:
  git commit -m x            -> DENY  no-commit-on-base
  git add -A                 -> DENY  scoped-staging
  git push origin main       -> DENY  no-push-base
  git commit --no-verify -m x-> DENY  never-no-verify
  gh pr create               -> DENY  no-host-cli-in-link-mode
  bun run test               -> ALLOW (exit 0, no output)
NO CONFIG present:
  git commit -m x (on base)  -> ALLOW (exit 0)   # no-op path
```

**The no-op path is the first check in the guard:** if `<cwd>/.claude/backlog-workflow.json` does
not exist, exit 0 immediately. A repo not under the workflow is never touched by installing the
plugin.

### AC#2 — the guard does not block the delivery skill's own commands

The delivery skill always operates on an `<id>/<slug>` **story** branch, never on the base branch.
So the discriminating condition is **branch identity**, proven:

```
ON STORY BRANCH (DIP-9.1/x):
  git add skills/foo.ts            -> ALLOW
  git commit -m "feat: x (DIP-9.1)"-> ALLOW
  git push -u origin DIP-9.1/x     -> ALLOW
```

Precise rules for DIP-7.10 to implement:

| Rule id | Deny when | Notes |
|---|---|---|
| `no-commit-on-base` | `git commit` **and** current branch == base | base = `git symbolic-ref --short refs/remotes/origin/HEAD` minus `origin/`, fallback `main` |
| `no-push-base` | `git push` **and** the command names the base branch | |
| `scoped-staging` | `git add -A` / `git add --all` / `git add .` | force scoped staging; never blanket |
| `never-no-verify` | any git command with `--no-verify` | |
| `no-host-cli-in-link-mode` | command starts with `gh`/`glab` **and** `pr.mode == "link"` | relaxed by setting `pr.mode: "create"` |

Two safety properties, both observed:

- **Crash-safe.** The guard wraps everything in try/catch and exits 0 on any error. In the scratch
  run `git symbolic-ref refs/remotes/origin/HEAD` failed (no remote) and the guard fell back to
  `main` and kept working — a guard that throws must never block real work.
- **Fail-open, not fail-closed.** Every non-matching command and every error path exits 0. A guard
  that blocked on uncertainty would break the very stories that fix it.

DIP-7.10 owns `hooks/hooks.json`; the prototype was never wired in.

---

## 2. Reviewer invocation (DIP-7.9 / DIP-7.6)

### AC#3 — how a skill invokes a plugin-shipped agent

Plugin agents live in `agents/<name>.md` (frontmatter `name`, `description`, `tools`, `model`;
body = system prompt). Once the plugin is installed they are **addressable by `<plugin>:<name>`** —
verified: this environment's installed caveman plugin exposes `caveman:cavecrew-reviewer` et al. as
selectable agent types. So the reviewer ships as `agents/story-reviewer.md` and is invoked as
subagent type **`dipsaus-ai:story-reviewer`** via the Agent/Task tool.

Context it **receives** (assembled by DIP-7.6 and passed in the prompt): the story's outcome,
acceptance criteria, and declared References, plus the diff (`git diff <base>...HEAD`) and the list
of changed paths. Context it **does not receive**: the implementing agent's conversation, plan, or
reasoning. Independence is the point — the verdict is worth having precisely because it was not
produced by the author. Read-only enforced via `tools: [Read, Grep, Bash]` (Bash for
`git diff`/`git show` only), modelled on `cavecrew-reviewer`.

### AC#5 — verdict format (JSON object)

The agent returns a single JSON object; DIP-7.6 keys off it with no prose parsing (mirrors how
`tests/eval/runner` already consumes structured agent output, and avoids the
"take-the-last-VERDICT-line" fragility DIP-4.2 had to fix):

```json
{
  "verdict": "pass" | "block",
  "criteria": [
    { "n": 1, "met": true,  "note": "…" },
    { "n": 2, "met": false, "note": "why it is not met" }
  ],
  "scopeViolations": ["path/outside/references.ts"],
  "findings": [
    { "severity": "blocking" | "advisory",
      "file": "…", "line": 42, "problem": "…", "fix": "…" }
  ]
}
```

`verdict` is `block` iff any acceptance criterion is `met: false` **or** `scopeViolations` is
non-empty. That is the only machine rule DIP-7.6 needs; `findings` carry the human detail.

### AC#4 — review loop policy (frozen)

- **Blocking** = an unmet acceptance criterion **or** a scope violation (a file changed outside the
  story's declared References). Nothing else blocks.
- **Advisory** = everything else (style, naming, non-fatal risks): recorded to the task notes and
  printed in the report, never gates the push.
- **Cap: 3 rounds.** Round = review → feed blocking findings into the implement loop → re-review.
  After the **3rd** blocking verdict, stop and **escalate to the user** with the outstanding
  findings; the push does not happen and the branch is left as-is for a human decision.
- Not "review until it passes" — the cap is what stops an autonomous run from burning a session on
  a disagreement it cannot resolve.
- `review.enabled: false` skips the gate entirely; the run behaves as it does today.

---

## 3. PR mode + gh degradation (DIP-7.6)

Config key `pr.mode`:

- **`link`** (default) — print the compare URL exactly as today; the human opens the PR. No host
  API, works identically on GitHub / GitLab / Bitbucket. Unchanged behaviour.
- **`create`** — open a draft PR with `gh pr create --draft`, body = the story outcome + acceptance
  criteria.

### AC#6 — gh detection and degradation

Before a create-mode PR, probe in order:

1. `command -v gh` (on PATH?), then
2. `gh auth status` (exit 0 = authenticated?).

If **either** fails: **degrade to `link`** — print the compare URL and a one-line reason (`gh not
found` / `gh not authenticated`), and finish the story green. A successful delivery must never hinge
on host-CLI auth. `create` mode only relaxes the `no-host-cli-in-link-mode` guard when `pr.mode`
is actually `create`; in `link` mode the guard blocks `gh` outright (§1).

This reverses the old blanket "never gh/glab/host API" rule into "git CLI only **unless** the repo
opts into `pr.mode: create`" — the CLAUDE.md change is owned by the cutover story (DIP-7.11).

---

## Summary of frozen contracts

- **Guard** = a `PreToolUse`/`Bash` hook; first check is the no-config no-op; five branch-/shape-based
  deny rules; crash-safe and fail-open. Discriminator = base branch vs `<id>/<slug>` story branch.
- **Reviewer** = `agents/story-reviewer.md`, invoked as `dipsaus-ai:story-reviewer`, read-only, fed
  only the diff + story contract, returns the **JSON verdict object** above.
- **Loop** = blocking is unmet-AC-or-scope-violation only; **3 rounds** then escalate; advisory
  never blocks.
- **PR** = `link` default, `create` opt-in via `gh`, always **probe-and-degrade to link**, never
  fail the story.
