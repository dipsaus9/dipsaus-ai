---
id: DIP-2
title: 'Epic: react-architecture skill eval harness'
status: Done
assignee: []
created_date: '2026-07-17 14:16'
updated_date: '2026-07-31 08:30'
labels:
  - epic
dependencies: []
ordinal: 3000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The react-architecture skill claims to make AI-written React better, but nothing proves it — AI is nondeterministic and skill edits can silently regress behaviour. This epic builds an on-command eval harness: a labeled fixture corpus (minimal bad/good pairs per rule + realistic multi-violation components), a TS runner driving headless claude CLI runs (K=5 per fixture×model, Claude model matrix), deterministic review-mode scoring against approved labels, apply-mode grading via mechanical AST checks + behavior tests + a pinned 3-vote LLM judge, skill-on/off A/B deltas, and a committed baseline that turns any rate drop into a named regression.

Decisions (locked in planning, 2026-07-17): ground truth = AI-drafted labels approved by the user in PR review; high-severity rules must hit 5/5, med/low >=4/5; judge model pinned by exact id with rubrics in-repo; eval excluded from CI and repo lint/typecheck; cost is accepted — runs happen only on the user's command.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Review and apply modes are scored against a labeled fixture corpus covering every rule in the skill, with per-rule detection rates from K=5 repeated runs across a Claude model matrix
- [ ] #2 A committed baseline turns any per-rule rate drop from a skill edit into a named regression; the baseline updates only via an explicit flag reviewed in a PR
- [ ] #3 Skill-on vs skill-off A/B comparison reports the skill's added value per rule category
- [ ] #4 Eval runs only on command (bun run test:eval), never in CI; bun run lint/typecheck/test remain green and untouched by the eval island
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Epic closed 2026-07-31 with DIP-2.12. Final summary: the harness stands — review + apply + judge + A/B modes, 23 labeled fixtures, committed baselines, Demo-seam grading. The founding question (does the skill help?) got its first A/B run on 2026-07-25 but the headline answer is contaminated: 24/25 skill-arm composition apply runs died on the 480s CLI timeout, the corpus sits at a detection ceiling (control ~100%), and both arms leaked Good.tsx into the model prompt. Honest per-category numbers and the contamination analysis live in tests/eval/README.md and tests/eval/ab/. The clean answer is epic DIP-3's exit criterion (DIP-3.9).
<!-- SECTION:NOTES:END -->
