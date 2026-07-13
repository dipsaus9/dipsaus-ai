# [DIP-33] hooks.json plugin wiring with ${CLAUDE_PLUGIN_ROOT} + README install and env knobs

Type: deliverable
Status: ready

## Outcome
The hook is registered by the plugin and actually fires for a real user, and the README tells
them how to install, configure, and switch it off.

## Done-when
- `hooks/hooks.json` registers `UserPromptSubmit` -> `on-user-prompt-submit.ts` and `PostToolUse` -> `on-post-tool-use.ts`, invoking them via `bun` with paths built from `${CLAUDE_PLUGIN_ROOT}`
- The `PostToolUse` matcher covers all tools (not a single tool name), so the joke can fire during any tool loop
- Installing the plugin fresh and running a turn with several tool calls that exceeds the threshold prints a dad joke to the terminal; the observed output is pasted into the PR or story doc
- README documents both plugin install and standalone hook install, and the four env knobs: `DAD_JOKE_THRESHOLD_MS`, `DAD_JOKE_COOLDOWN_MS`, `DAD_JOKE_DISABLE`, `DAD_JOKE_API`
- README states the known limitation plainly: a long turn with zero tool calls will not fire a joke, because no Claude Code hook is timer-driven

## Depends-on
- DIP-32

## Affected area
- `hooks/hooks.json`
- `README.md`
- `.claude-plugin/plugin.json`

## Verify
- `bun run lint && bun run typecheck && bun run test`
- End-to-end, by hand: install the plugin, set `DAD_JOKE_THRESHOLD_MS=5000`, run a prompt that
  triggers several tool calls, confirm a joke appears in the terminal.
- Confirm `DAD_JOKE_DISABLE=1` fully silences it.
- Confirm Claude cannot quote the joke text when asked (it must not be in context).

## Technical notes
`hooks/hooks.json` lives at the plugin root, *not* inside `.claude-plugin/`. The repo root is the
plugin, so that is `hooks/hooks.json` here.

`${CLAUDE_PLUGIN_ROOT}` resolves wherever the plugin is installed — the same mechanism `.mcp.json`
already uses for the example MCP server, so follow that file's shape. Like the MCP, this requires
`bun` on the user's PATH; say so in the README next to the existing bun requirement.

The `PostToolUse` matcher must match all tools. A matcher scoped to one tool name would fire only
during, say, `Bash` loops, and the user would experience it as randomly broken.

Lower `DAD_JOKE_THRESHOLD_MS` while testing — waiting 30s per iteration to see whether your hook
works is its own kind of dad joke.

Add a `hooks` keyword to `.claude-plugin/plugin.json` and mention the hook in the README's
Contents table, alongside the skills and the MCP.

README should be honest about the limitation rather than burying it: *no Claude Code hook is
timer-driven, so a joke fires on the first tool call after the threshold — a long turn with zero
tool calls stays silent.* In practice long turns are tool loops, so this is rarely felt, but a
user who reads the code should not discover it as a surprise.

## Open questions
none

## Findings

### Observed end-to-end output (done-when #3)

Hook registered via the same command shape as `hooks/hooks.json`, with `DAD_JOKE_THRESHOLD_MS=5000`
and `DAD_JOKE_COOLDOWN_MS=8000`, then a turn run with several tool calls. Rendered in the user's
terminal, confirmed by the user:

```
Why did the developer go broke?
He used up all his cache.
```

State after the turn — the joke id is recorded, keyed on the real session id:

```json
{"turnStart":1783932255938,"lastJokeAt":1783932272242,"recentIds":["dev-broke-cache"]}
```

Claude never saw the joke text: the ids above were read from the state file, never from a tool
result. `systemMessage` isolation holds on the real plugin path, not just in the DIP-28 spike.

### ⚠️ Hook stdout must be newline-terminated

**The first end-to-end attempt rendered nothing at all**, despite the hook running, deciding to
joke, and writing to stdout (`lastJokeAt` is only persisted *after* the write, and it was set).
`tee` on the hook's stdout proved Claude Code was receiving syntactically valid JSON with a clean
stderr and exit 0:

```
{"systemMessage":"I was going to tell a joke about a broken pencil,\nbut it's pointless."}
```

...and silently ignoring it. The cause: the entrypoint used `writeSync(1, json)` with **no trailing
newline**. Adding `\n` made it render immediately, with nothing else changed.

This is a vicious failure mode — no error, no warning, valid JSON, exit 0, and the feature simply
does not exist. Note the DIP-28 spike used `process.stdout.write` without a newline and *did*
render, so the requirement is not obvious from that spike alone; it surfaced only once the
entrypoint switched to a raw `writeSync` (done in DIP-34 to avoid piped-stdout truncation).

**Rule for any future hook in this repo: terminate hook stdout with `\n`.**

There is no automated guard against a regression here — the entrypoints are hand-verified glue with
no unit tests, and a dropped newline would silently disable the feature again. Proposed follow-up
story: a smoke test that spawns each entrypoint and asserts exit 0 plus newline-terminated JSON on
stdout.
