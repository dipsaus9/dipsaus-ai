---
id: DIP-3.4
title: 'Judge hybrid: rubric criteria plus Good.tsx exemplar'
status: In Progress
assignee: []
created_date: '2026-07-31 08:20'
updated_date: '2026-07-31 11:57'
labels:
  - story
dependencies:
  - DIP-3.1
  - DIP-3.2
references:
  - tests/eval/runner/judge.ts
  - tests/eval/rubrics/
  - tests/unit/eval-runner-judge.test.ts
parent_task_id: DIP-3
ordinal: 20000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The judge grades refactors against rubric criteria calibrated by the fixture Good.tsx, passed as one acceptable target shape — not the only one. Fixtures without a Good (dashboard-panel, god-component) stay rubric-only. The variant-compound rubric is realigned to what the skill actually teaches (shared-shell extraction demand dropped), fixing the structural 0/5.

Type: deliverable
Branch: DIP-3.4/judge-good-exemplar
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 judgeRefactor accepts an optional exemplar source; judge prompt frames it as one acceptable shape and forbids demanding an exact match; absent exemplar means current rubric-only prompt
- [ ] #2 Apply flow (direct and A/B-deferred) passes the fixture Good.tsx as exemplar when it exists, read from the fixture dir, never from the sandbox
- [ ] #3 rubrics/comp.variant-compound.md no longer requires shared-shell extraction; every rubric criterion traces to skill text; rubrics/README.md notes the reset rationale
- [ ] #4 Judge unit tests cover exemplar and no-exemplar prompt shapes; repo gates green
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Extend judge prompt builder. 2. Thread exemplar through apply.ts and ab.ts judge calls. 3. Rubric realignment pass, all four comp rubrics checked against SKILL.md. 4. Unit tests.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Rubric text change requires deliberate baseline reset — happens in DIP-3.8 (same epic), per rubrics/README.md policy. Watch 2-1 vote rate in DIP-3.8 output as instability signal; if still high, future work.
<!-- SECTION:NOTES:END -->
