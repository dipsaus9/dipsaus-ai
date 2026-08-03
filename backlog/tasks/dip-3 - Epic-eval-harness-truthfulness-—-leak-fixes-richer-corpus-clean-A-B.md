---
id: DIP-3
title: 'Epic: eval harness truthfulness — leak fixes, richer corpus, clean A/B'
status: Done
assignee: []
created_date: '2026-07-31 08:19'
updated_date: '2026-08-03 11:18'
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
- [x] #1 No mode sends Good.tsx to the model under evaluation; judge alone may receive it as reference
- [x] #2 Review and apply baselines regenerated and approved on the fixed harness
- [x] #3 One clean A/B report archived with per-category summary and headline answer in README
- [x] #4 Repo bun run lint/typecheck/test green throughout
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Harness truthfulness delivered across ten stories: review leak split (DIP-3.1), apply sandbox leak fix + artifacts + 900s timeout (DIP-3.2), skill rule fixes and trim (DIP-3.3), judge exemplar hybrid (DIP-3.4), Good exemplar upgrade (DIP-3.5), fixture enrichment (DIP-3.6), hard tier (DIP-3.7), rule-announcing comment strip (DIP-3.10), trustworthy baselines (DIP-3.8), and the clean A/B answer (DIP-3.9). Headline: the skill turns composition apply from 0% to 80% — the control arm cannot produce compound refactors — and lifts composition detection 77->91%, srp 88->95%, at the cost of slightly more srp false positives and a small state detection dip. Archived at tests/eval/ab/ab-2026-08-03-repaired.json; per-category table in tests/eval/README.md.
<!-- SECTION:FINAL_SUMMARY:END -->
