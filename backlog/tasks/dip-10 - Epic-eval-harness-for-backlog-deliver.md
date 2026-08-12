---
id: DIP-10
title: 'Epic: eval harness for backlog-deliver'
status: To Do
assignee: []
created_date: '2026-08-12 06:51'
labels:
  - epic
dependencies: []
priority: medium
ordinal: 59000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Eval harness for backlog-deliver, refined from DIP-8.2. Run backlog-deliver headless in a throwaway git repo (with a LOCAL bare remote so the real push/PR path is exercised), then grade the result deterministically and judge quality. Reuses the existing tests/eval/ machinery (claude.ts, sandbox.ts, judge.ts, baseline.ts, report.ts, retry.ts).

Decisions (grilled 2026-08-12): scope = backlog-deliver first (plan-eval a later epic); grading = deterministic checks (branch, verify green, ACs checked, no scope violation, reviewer verdict) + an LLM judge for quality; sandbox = throwaway repo + local bare remote, real commits/push, torn down after. Mirrors the react-architecture harness (DIP-2/3) but for an agentic workflow skill rather than a review skill.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A headless backlog-deliver run in a throwaway repo + local bare remote is graded deterministically (branch, verify, ACs, scope, reviewer verdict) and by a quality judge
- [ ] #2 A fixture corpus of deliver cases across multiple stacks drives the harness
- [ ] #3 test:eval --mode deliver runs the corpus, diffs against a committed baseline, and a first baseline is measured
- [ ] #4 Grader logic ships with unit tests; the eval island stays fenced off from CI gates
<!-- AC:END -->
