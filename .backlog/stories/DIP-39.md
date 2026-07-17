# [DIP-39] README: document DAD_JOKE_NOTIFY, colour behaviour + NO_COLOR, OSC 777 terminal support caveat

Type: deliverable
Status: ready

## Outcome
A user can discover, configure, and switch off every visibility feature this epic added — and is
told plainly what will not work on their terminal.

## Done-when
- README's dad-joke env knob table documents `DAD_JOKE_NOTIFY` (default off) and the colour behaviour, including `NO_COLOR` and `DAD_JOKE_NO_COLOR`
- README states plainly that desktop notifications depend on the terminal supporting OSC 777, and that a terminal without it silently loses the notification but keeps the joke — the limitation is stated, not buried
- If DIP-35 found ANSI colour does **not** survive `systemMessage`, the README says so rather than implying colour that does not exist; the docs describe only what actually renders

## Depends-on
- DIP-37
- DIP-38

## Affected area
- `README.md`

## Branch
DIP-39/readme-notify-colour

## Verify
- `bun run lint && bun run typecheck && bun run test`
- Read the README's dad-joke section against the actual `loadConfig` implementation: every knob it
  documents exists, and every knob that exists is documented. No drift in either direction.

## Technical notes
The README already has a dad-joke section with a four-row env knob table, an explicit callout about
the `DAD_JOKE_DISABLE=false` footgun, and a "known limitation, by design" paragraph. Extend those;
do not start a new section.

**Document only what the code does.** This repo has been burned by aspirational documentation — the
README claimed an eval harness that had been deleted, in four separate manifests, and it took a
dedicated pass to remove. If DIP-35 killed the colour tier, the README must not hint at colour.
Write the docs from the merged code, not from this epic's original intent.

The OSC 777 caveat belongs next to the existing "no Claude Code hook is timer-driven" limitation —
same honesty, same place. A user should not discover from source-reading that their terminal will
never show them a notification.

## Open questions
none
