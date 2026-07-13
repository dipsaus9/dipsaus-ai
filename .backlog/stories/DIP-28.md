# [DIP-28] SPIKE: prove PostToolUse systemMessage renders to the user mid-turn

Type: spike
Status: done

## Outcome
A recorded, evidence-backed answer to: **can a `PostToolUse` hook print text that the human
sees in their terminal, mid-turn, without that text entering Claude's context?** Every other
story in this epic assumes yes. This story proves it before code is written against it.

## Done-when
- Recorded finding: does a PostToolUse hook printing `{"systemMessage":"..."}` on stdout with exit 0 render text to the user's terminal? yes/no, with the exact observed output pasted into the story doc Findings section
- Recorded finding: does the hook fire once per tool call during a multi-tool turn, and does systemMessage stay out of Claude's context? Confirmed by asking Claude afterwards whether it saw the joke text
- Decision recorded with rationale: proceed with the PostToolUse plan as designed, or the replan required for DIP-32/DIP-33 if the mechanism does not render

## Depends-on
- none

## Affected area
- `hooks/dad-joke/spike-smoke.ts` (throwaway smoke-test hook; delete once the finding is recorded)

Scoped to a single file on purpose: a directory scope here would overlap DIP-29/30/31/32's file
scopes, and with `claim_mode: exclusive` that makes the scheduler treat those stories as
contended with this one.

## Verify
Manual smoke test, no automated verify:

1. Register a temporary `PostToolUse` hook that unconditionally prints
   `{"systemMessage":"SPIKE: dad joke would appear here"}` and exits 0.
2. Run a prompt forcing several tool calls (e.g. "read three files and summarise them").
3. Observe the terminal. Record: does the text appear? once per tool call?
4. In the same session, ask Claude: *"what did the systemMessage say?"* — if it can quote the
   text, `systemMessage` is leaking into context and the design is wrong.

## Technical notes
This spike exists because the Claude Code hook docs are thin on exactly which output fields
surface to the user. The working model, to be confirmed or refuted:

- `systemMessage` → rendered to the **human**.
- `additionalContext` → fed to **Claude**. Wrong channel for this feature.
- Exit 0 with JSON on stdout is the non-blocking path; exit 2 with stderr is a *blocking* error.

Also worth capturing while you are in here, since it is nearly free:
- Does the hook receive `session_id` on stdin? (DIP-31 keys its state file on it.)
- Is stdout parsed as JSON only when it looks like JSON, or does stray output break the tool call?

If `systemMessage` turns out **not** to render, the fallback ladder — evaluate in order, record
which one you took:
1. `terminalSequence` with raw ANSI, writing above the prompt line.
2. Exit 2 + stderr — but this *blocks the tool call*, which violates an epic acceptance
   criterion, so it is a last resort and would require re-scoping the epic.
3. Statusline (single global slot; conflicts with the user's existing caveman statusline).

## Findings

**Decision: PROCEED with the PostToolUse plan as designed.** The mechanism works. One field-name
correction lands on DIP-32; no story needs replanning.

Method: a throwaway `PostToolUse` hook (matcher `"*"`) registered in `.claude/settings.local.json`,
printing `{"systemMessage": "SPIKE: dad joke would appear here (tool call #N)"}` on stdout with
exit 0, and appending its raw stdin to a log. Three `Read` calls were then issued in one turn.
The hook and its registration were removed afterwards.

> **⚠️ Amended after DIP-33.** This spike used `process.stdout.write(JSON.stringify(...))` with **no
> trailing newline** and it rendered — so the finding below is true but *incomplete*. When DIP-32's
> entrypoint later wrote the same JSON via `writeSync(1, ...)` without a newline, Claude Code
> silently ignored it: no error, exit 0, valid JSON, feature simply absent. Appending `\n` fixed it.
> **Terminate hook stdout with `\n`.** See DIP-33's Findings for the evidence.

### 1. Does `systemMessage` render to the human? — **YES**

Confirmed by the user, who observed the text **three times** in their terminal — once per tool
call, numbered `#1`, `#2`, `#3`. Exact string rendered:

```
SPIKE: dad joke would appear here (tool call #1)
```

### 2. Once per tool call, and does it stay out of Claude's context? — **YES to both**

The hook logged one entry per `Read`, all in the same turn — so it fires per tool call, not per
turn, and a long tool loop gives many chances to fire:

```json
{"call":1,"session_id":"b0dc5479-…","hook_event_name":"PostToolUse","tool_name":"Read","has_tool_output":false,"has_tool_response":true}
{"call":2,"session_id":"b0dc5479-…","hook_event_name":"PostToolUse","tool_name":"Read","has_tool_output":false,"has_tool_response":true}
{"call":3,"session_id":"b0dc5479-…","hook_event_name":"PostToolUse","tool_name":"Read","has_tool_output":false,"has_tool_response":true}
```

**Context isolation holds.** All three tool results came back to Claude with no injected text, and
Claude could not quote the systemMessage. `systemMessage` → human only; `additionalContext` (nested
under `hookSpecificOutput`) is the field that would have fed the model. We are on the right channel.

### 3. Incidental findings (cheap to capture, and one of them is load-bearing)

- **⚠️ The tool-result field is `tool_response`, NOT `tool_output`.** The official docs
  (`code.claude.com/docs/en/hooks.md`) document it as `tool_output`; the real payload has
  `has_tool_output: false, has_tool_response: true`. **The docs are wrong.** DIP-32 does not
  currently need the tool result, so nothing is blocked — but any story that reaches for it must
  use `tool_response`.
- **`session_id` IS on stdin** (`b0dc5479-…`), so DIP-31 can key its state file on it as designed.
- Full stdin key set: `cwd`, `duration_ms`, `effort`, `hook_event_name`, `permission_mode`,
  `prompt_id`, `session_id`, `tool_input`, `tool_name`, `tool_response`, `tool_use_id`,
  `transcript_path`.
- **Hooks hot-reload, in both directions.** Adding the hook to `settings.local.json` took effect
  immediately, with no session restart; removing the block stopped it just as immediately (the log
  froze at 8 entries — exactly the 8 tool calls made while it was registered — and every later tool
  call produced nothing). Good for iterating on DIP-32/33.
- **Matcher `"*"` really does match every tool**, as DIP-33 requires: the hook fired on `Read`,
  `Bash`, `Edit`, and even `AskUserQuestion`. (`""` and omitting `matcher` also work.)
- **The fallback ladder was never needed — and rung 1 was weaker than we thought.**
  `terminalSequence` exists but accepts only *allowlisted* escape sequences (OSC 777 notify, OSC
  0/1/2 window title, OSC 9, bell). It **cannot** write arbitrary text above the prompt line, so it
  could not have carried a joke. Had `systemMessage` failed, the real fallback would have been rung
  2 (exit 2 + stderr), which blocks the tool call and violates an epic acceptance criterion. In
  short: `systemMessage` was not merely the nicest option, it was the only viable one.

### Follow-ups

None. DIP-29 / DIP-30 / DIP-31 / DIP-32 / DIP-33 / DIP-34 stand as written; DIP-32 is unblocked.
