---
id: DIP-10
title: 'Epic: eval harness for backlog-deliver'
status: Done
assignee: []
created_date: '2026-08-12 06:51'
updated_date: '2026-08-12 09:54'
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
- [x] #1 A headless backlog-deliver run in a throwaway repo + local bare remote is graded deterministically (branch, verify, ACs, scope, reviewer verdict) and by a quality judge
- [x] #2 A fixture corpus of deliver cases across multiple stacks drives the harness
- [x] #3 test:eval --mode deliver runs the corpus, diffs against a committed baseline, and a first baseline is measured
- [x] #4 Grader logic ships with unit tests; the eval island stays fenced off from CI gates
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Delivered the backlog-deliver eval harness across 6 stories. A spike fixed the sandbox shape (throwaway repo + local bare remote; plugin loaded via --plugin-dir, no ~/.claude install). The corpus (10.2) spans node/python/no-pipeline; the deterministic grader (10.3, reusing the collision prefix rule) scores branch/verify/acs/scope/review; the quality judge (10.4, reusing judge.ts) scores the diff, gated behind a deterministic pass. The runner (10.5) wires test:eval --mode deliver with a per-fixture baseline + diff. The first measured baseline (10.6) is 4/4 across every dimension and quality — headless backlog-deliver works end to end, nested reviewer and guard hooks included. Follow-ups remain under DIP-8 (8.3 CI review, 8.4 amend --ref doc fix); plan-eval is a future epic.
<!-- SECTION:FINAL_SUMMARY:END -->
