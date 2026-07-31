---
id: DIP-3
title: 'Epic: eval harness truthfulness — leak fixes, richer corpus, clean A/B'
status: To Do
assignee: []
created_date: '2026-07-31 08:19'
labels:
  - epic
dependencies: []
ordinal: 16000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The eval harness currently leaks the answer (Good.tsx reaches the model in review and apply), conflates infra timeouts with model failure, grades against rubric criteria the skill never teaches, and sits at a detection ceiling (control arm ~100%) on a too-thin corpus. This epic makes the harness truthful: leak-free measurement, Good.tsx repurposed as judge exemplar and upgraded to true exemplar quality, skill text fixed where it measurably hurts (state.global-discipline 1/5), corpus enriched with distractors and a hard tier, refactor outputs preserved for human review, and a fresh baseline plus a one-time half-cost A/B run that gives epic DIP-2 its founding question an uncontaminated answer.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 No mode sends Good.tsx to the model under evaluation; judge alone may receive it as reference
- [ ] #2 Review and apply baselines regenerated and approved on the fixed harness
- [ ] #3 One clean A/B report archived with per-category summary and headline answer in README
- [ ] #4 Repo bun run lint/typecheck/test green throughout
<!-- AC:END -->
