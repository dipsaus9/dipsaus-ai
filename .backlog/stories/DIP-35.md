# [DIP-35] SPIKE: what does systemMessage actually render, and does terminalSequence OSC 777 notify?

Type: spike
Status: ready

## Outcome
A recorded, evidence-backed answer to: **what can a hook actually make the user see?** Specifically
whether ANSI colour survives inside `systemMessage`, whether emoji / multi-line / box-drawing
render, and whether `terminalSequence` with OSC 777 fires a real desktop notification — alongside
`systemMessage` or only instead of it.

Every other story in this epic assumes an answer to these. This story gets them before code is
written against them.

## Done-when
- Recorded finding: does ANSI colour (CSI SGR, e.g. `\x1b[33m`) inside a `systemMessage` string render as colour, get stripped, or print literally as escape garbage? Observed output pasted into the Findings section
- Recorded finding: do an emoji prefix, a multi-line body, and box-drawing characters render correctly in `systemMessage`? yes/no each, with observed output
- Recorded finding: does a hook emitting `terminalSequence` with OSC 777 (`\033]777;notify;Title;Message\007`) fire a real desktop notification? yes/no, with the observed result
- Recorded finding: can `terminalSequence` and `systemMessage` be emitted in the **same** hook output (both render), or does one suppress the other? This decides whether DIP-38 notifies ALONGSIDE the inline joke or INSTEAD of it
- Decision recorded with rationale: the concrete formatter design for DIP-37 and the notification design for DIP-38, based on what actually rendered

## Depends-on
- none

## Affected area
- `hooks/dad-joke/spike-render.ts` (throwaway smoke-test hook; delete once the findings are recorded)

Scoped to a single throwaway file on purpose, so it does not contend with DIP-36/37/38's file scopes.

## Branch
DIP-35/systemmessage-render-spike

## Verify
Manual smoke test, no automated verify. Same method that worked for DIP-28:

1. Register a temporary `PostToolUse` hook in `.claude/settings.local.json` (git-ignored) with
   `DAD_JOKE_THRESHOLD_MS=0` so it fires on every tool call.
2. Have it emit, on successive invocations, a matrix of payloads — plain, emoji, multi-line, ANSI
   coloured, box-drawn, `terminalSequence` alone, `terminalSequence` + `systemMessage` together.
3. Run a turn with several tool calls. **Ask the user what they observed** — the whole point is what
   renders in *their* terminal, which Claude cannot see.
4. Remove the hook registration and the throwaway file afterwards.

## Technical notes
What DIP-28 already established, and what this spike must NOT re-litigate:

- `systemMessage` renders to the human and never enters Claude's context. Proven.
- Hook stdout **must be newline-terminated** or Claude Code silently ignores valid JSON. Proven the
  hard way. Any payload this spike emits must end with `\n`.
- `terminalSequence` accepts only **allowlisted** escape sequences: OSC 777 (notify), OSC 0/1/2
  (window title), OSC 9, and BEL. It **rejects CSI sequences** — which is exactly what ANSI colour
  codes are. So colour cannot ride on `terminalSequence`; if colour is possible at all, it must
  survive *inside the `systemMessage` string*. That is the open question.

The honest prior: Claude Code renders `systemMessage` in its own UI chrome, so ANSI is more likely
stripped or literalised than honoured. If it prints literally, the user sees `\x1b[33m` garbage —
which is worse than plain text, and DIP-37 must then be emoji + structure only. Find out; do not
guess.

The `terminalSequence` + `systemMessage` coexistence question is the one the official docs are
explicitly silent on. It is load-bearing for DIP-38: if emitting both suppresses one, the
notification design changes from "alongside the joke" to "instead of the joke", and the epic's
acceptance criterion changes with it.

## Open questions
none

## Findings
<!-- filled in during delivery: the render matrix, what the user observed, the decision -->
