# [DIP-38] opt-in DAD_JOKE_NOTIFY=1 desktop notification via terminalSequence OSC 777

Type: deliverable
Status: ready

## Outcome
An opt-in desktop notification, so a joke reaches you during the long turn you have walked away
from — without putting a notification in anybody's face by default.

## Done-when
- `notify.ts` exports `buildNotification(joke, cfg)` returning the OSC 777 `terminalSequence` string, or `null` when `cfg.notifyEnabled` is false — pure, no I/O
- `DAD_JOKE_NOTIFY` is parsed in `loadConfig` with the same semantics as the existing flags (any non-empty value except `'0'` enables); default **OFF**, so no notification fires unless the user opts in
- `on-post-tool-use.ts` emits the `terminalSequence` field per DIP-35's finding — alongside `systemMessage` if they coexist, otherwise per the fallback DIP-35 records — and the emitted JSON is still newline-terminated and free of `additionalContext` / `hookSpecificOutput`
- The joke text embedded in the notification is **sanitised** so it cannot break out of the OSC 777 sequence: any BEL (`\007`), ESC (`\033`) or control character in the joke is stripped before interpolation
- A terminal that ignores OSC 777 loses the notification but still gets the inline joke and never a broken tool call; both entrypoints still always exit 0; `tests/unit/dad-joke-notify.test.ts` covers enabled, disabled, and the sanitisation case

## Depends-on
- DIP-35 (does OSC 777 notify at all, and can it coexist with `systemMessage`?)
- DIP-36 (the guard on the stdout bytes this story rewrites)

## Affected area
- `hooks/dad-joke/notify.ts`
- `hooks/dad-joke/config.ts` (parse `DAD_JOKE_NOTIFY`)
- `hooks/dad-joke/on-post-tool-use.ts` (emit `terminalSequence`)
- `tests/unit/dad-joke-notify.test.ts`

## Branch
DIP-38/desktop-notify

## Verify
- `bun run test` — enabled / disabled / sanitisation paths green
- `bun run lint && bun run typecheck`
- By hand: `DAD_JOKE_NOTIFY=1` with a low threshold produces a real desktop notification; unset, it
  produces none and the emitted JSON contains no `terminalSequence` key at all
- Confirm the inline joke still renders in **both** cases

## Technical notes
OSC 777 is the one notification path the Claude Code docs explicitly allowlist:

```
\033]777;notify;<title>;<message>\007
```

`terminalSequence` **rejects** CSI sequences, so this field cannot be used for colour — colour, if
any, lives in DIP-37 inside the `systemMessage` string. These two stories touch the same entrypoint
but are otherwise independent.

**The sanitisation requirement is not paranoia.** The joke text is interpolated into an escape
sequence terminated by BEL. With `DAD_JOKE_API=1` (DIP-34) that text comes from a **third-party
API**, so it is untrusted input flowing into a terminal control sequence. A joke containing a raw
BEL or ESC could terminate the sequence early and leave the rest of the string to be interpreted by
the terminal as further control codes. Strip control characters before interpolation. Same
discipline as DIP-31's path-traversal guard: treat input from outside as hostile.

Default off is deliberate. The hook fires on every tool call and jokes up to ~5 times in a 5-minute
turn; five desktop notifications in five minutes is a different, more intrusive product than a joke
in the terminal. The user who sets `DAD_JOKE_NOTIFY=1` is explicitly asking for exactly that.

Notification content: title something short and identifiable (e.g. `Dad joke`), body the joke text.
Keep the body to one line — collapse the setup/punchline newline to a space, since notification
daemons handle multi-line inconsistently.

## Open questions
none
