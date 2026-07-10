# [DIP-28] SPIKE: prove PostToolUse systemMessage renders to the user mid-turn

Type: spike
Status: ready

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
<!-- filled in during delivery: observed output, whether Claude saw the text, the decision -->
