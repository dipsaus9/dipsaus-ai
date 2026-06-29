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

## The judge

A second `claude -p` call (no tools), default model `sonnet`:

```bash
claude -p "<rubric + skill output, ask for a 0-100 score as JSON>" \
  --output-format json --model "${JUDGE_MODEL:-sonnet}"
```

Parse `.result` for the score; assert `>= 80`.

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

## Fallbacks (if invocation ever fails)

1. Bare `/<name>` collides with another skill → use namespaced `/dipsaus-ai:<name>`.
2. Skill doesn't trigger from the slash command alone → prepend an explicit instruction
   ("Use the <name> skill to ...") before the `/<name>` call.
3. `--plugin-dir` not loading root skills → symlink `skills/<name>` into a temp
   `.claude/skills/` and run from that project dir (the `.claude/skills/` route is also
   proven to work).
