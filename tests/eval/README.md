# Eval harness — headless skill invocation (spike result)

**Status: PROVEN.** Skills in this repo can be run headless and scored without an API key,
using the logged-in `claude` CLI session. This file is the contract the harness (st_009)
builds on.

## How a skill is invoked

Our skills live at the **plugin root** (`skills/<name>/SKILL.md`), not in `.claude/skills/`.
They are loaded for a headless run with `--plugin-dir <repo-root>`, then triggered as a
slash command. Both forms resolve:

- bare: `/<skill-name>`
- namespaced: `/dipsaus-ai:<skill-name>`

### Report mode (read-only) — the default eval path

```bash
claude -p "/react-architecture review fixtures/react/<fixture>.tsx" \
  --output-format json \
  --plugin-dir "<repo-root>" \
  --add-dir "<fixture-dir>" \
  --allowedTools "Read"
```

### Apply mode (file edits) — run on a sandbox COPY of the fixture

```bash
claude -p "/react-architecture apply <copied-fixture>" \
  --output-format json \
  --plugin-dir "<repo-root>" \
  --add-dir "<sandbox-dir>" \
  --allowedTools "Read Edit Write" \
  --permission-mode acceptEdits
```

Copy the fixture into a temp dir first so the original is never mutated; judge the diff/result.

## Output shape

`--output-format json` returns a single JSON object. The harness reads `.result` (the
skill's final text) and checks `.is_error`:

```json
{ "subtype": "success", "is_error": false, "num_turns": 2, "result": "<skill output>" }
```

## The eval: apply mode + binary checks (skill vs baseline)

A passing report alone does not prove the skill works — the base model already reviews React
well. So the eval measures the **refactor** (apply mode), compared **with and without** the
skill, against per-rule binary checks:

1. Copy a fixture to a temp dir; run `/react-architecture apply` (skill) → refactored code.
   Also run a generic "refactor for better architecture" with **no plugin** → baseline code.
2. For each rule (the "liking", defined in the test), a **separate `claude -p` context**
   answers **PASS/FAIL** on the refactored code. Binary judgments — not 0–100 scores — so
   they are stable.
3. Gate: the skill refactor must pass **all** its rules **and** score `>=` the baseline.

Why binary: a 0–100 rubric score was catastrophically noisy (same input scored 5 and 97
across runs). The same yes/no check returns identically across repeated runs. Files:
`apply.ts` (sandboxed refactor), `check.ts` (binary check), `react-architecture.test.ts`
(rules per fixture).

## Knobs

| Env | Default | Purpose |
|-----|---------|---------|
| `AI_CLI` | `claude` | CLI binary that runs the skill (swap for another agent CLI) |
| `JUDGE_MODEL` | `sonnet` | model alias passed to the judge `claude -p --model` |

## Auth & determinism

- **No `ANTHROPIC_API_KEY`.** Uses the logged-in Claude Code session (subscription).
- If the `claude` CLI is missing or not logged in, the eval **skips** (does not guess).
- LLM output is non-deterministic; a single run is asserted against the threshold. Re-run
  if a score is borderline.

## Evidence it discriminates

On `prop-drilling.tsx`, the no-skill baseline refactors with **React Context** (drilling gone,
but not the preferred fix). The skill refactors with **composition/slots**:

| rule | skill | baseline |
|------|-------|----------|
| `user` drilling eliminated | PASS | PASS |
| fixed via composition, not just Context | **PASS** | **FAIL** |

The gap is exactly the opinionated rule — the skill's distinctive value. The binary check
returned the same verdict on 3 repeated runs (no variance).

## Adding a skill's checks

Each fixture in the test carries a `rules: string[]` — plain-English PASS/FAIL statements
that encode "my liking". To raise or change the bar, edit those strings; no rubric file.

## Fallbacks (if invocation ever fails)

1. Bare `/<name>` collides with another skill → use namespaced `/dipsaus-ai:<name>`.
2. Skill doesn't trigger from the slash command alone → prepend an explicit instruction
   ("Use the <name> skill to ...") before the `/<name>` call.
3. `--plugin-dir` not loading root skills → symlink `skills/<name>` into a temp
   `.claude/skills/` and run from that project dir (the `.claude/skills/` route is also
   proven to work).
