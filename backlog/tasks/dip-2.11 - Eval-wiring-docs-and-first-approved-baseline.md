---
id: DIP-2.11
title: 'Eval wiring, docs and first approved baseline'
status: To Do
assignee: []
created_date: '2026-07-17 14:23'
labels:
  - story
dependencies:
  - DIP-2.3
  - DIP-2.4
  - DIP-2.5
  - DIP-2.7
  - DIP-2.8
  - DIP-2.9
  - DIP-2.10
references:
  - package.json
  - README.md
  - tests/eval/
parent_task_id: DIP-2
ordinal: 14000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The harness becomes a product: package.json gains test:eval (excluded from CI and from deliver-verify by its name), tests/eval/README.md documents the full workflow (island contract, label schema, commands, flags, cost expectations, baseline update policy, judge pin policy), the repo README points to it, and the first real baseline is generated with the user present and committed after their approval. Closes the epic.

Type: deliverable
Branch: DIP-2.11/eval-docs-baseline
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 package.json test:eval runs the runner; bun run test / CI provably unaffected; deliver-skill verify skips it by name convention
- [ ] #2 tests/eval/README.md documents workflow end to end: commands, flags, label schema, thresholds, baseline policy, judge pin policy, expected cost per full run
- [ ] #3 First full review+apply baseline generated on the user's command, approved by the user, committed via --update-baseline; regressions demonstrably detectable (a deliberate temporary skill edit flips a named regression, then reverted)
- [ ] #4 Repo README + manifest descriptions updated where the repo surface changed (CLAUDE.md rule: package.json/plugin.json/marketplace.json drift)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Baseline generation costs real money and needs the user watching — delivery must stop and ask before the full run (deliver-skill constraint 5, out-of-band action). The falsifiability check (deliberate skill edit -> named regression -> revert) mirrors the DIP-1.1 guard-breaking pattern: a regression detector that cannot fire is not a detector.
<!-- SECTION:NOTES:END -->
