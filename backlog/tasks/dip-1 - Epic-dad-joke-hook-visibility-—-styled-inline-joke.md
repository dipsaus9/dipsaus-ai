---
id: DIP-1
title: 'Epic: dad-joke hook visibility — styled inline joke'
status: Done
assignee: []
created_date: '2026-07-17 13:16'
updated_date: '2026-07-17 13:51'
labels:
  - epic
dependencies: []
priority: medium
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The dad-joke hook renders, but the joke gets lost in tool-call output — it reads like another log line. Make it land.

Single story: a two-tier inline formatter. Emoji + setup/punchline structure always (survives any terminal); ANSI colour layered on top only if a first-step manual render check proves Claude Code passes it through systemMessage rather than stripping or literalising it. NO_COLOR honoured.

The story folds in the regression guard missing from the original dad-joke epic (an entrypoint smoke test on the exact stdout bytes that already failed silently once — a dropped newline disabled the feature with exit 0 and no error), ordered as the first commit so the formatter rewrite happens with the net already up. README documents the colour knobs in the same PR.

Desktop notification was cut from this epic: it solves reach-when-away, not visibility-while-watching, which is the actual problem observed.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The inline joke is visually distinct from tool-call output in any terminal, via emoji + structure; colour only where proven to render
- [x] #2 The entrypoint stdout contract (exit 0, newline-terminated valid JSON, no context leakage) is guarded by an automated test that fails on a dropped trailing newline
- [x] #3 README documents every colour knob that exists and none that don't; NO_COLOR per no-color.org is honoured
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Delivered via DIP-1.1: two-tier formatter (🥁 + structure always, bold-yellow punchline where colour proven to render), entrypoint stdout-byte guard landed as first commit and proven falsifiable, README colour knobs synced to loadConfig. Render check proved Claude Code passes ANSI through systemMessage.
<!-- SECTION:FINAL_SUMMARY:END -->
