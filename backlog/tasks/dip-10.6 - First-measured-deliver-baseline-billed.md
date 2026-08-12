---
id: DIP-10.6
title: First measured deliver baseline (billed)
status: To Do
assignee: []
created_date: '2026-08-12 06:52'
updated_date: '2026-08-12 06:52'
labels:
  - story
dependencies:
  - DIP-10.5
references:
  - tests/eval/baseline/
  - tests/eval/README.md
parent_task_id: DIP-10
priority: medium
type: feature
ordinal: 65000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
On explicit user command (billed), run test:eval --mode deliver over the corpus, approve the results, and commit the first deliver baseline with a README verdict on where backlog-deliver stands.

Type: deliverable
Branch: DIP-10.6/deliver-first-baseline
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Deliver eval run over the full corpus executed on the user's explicit command, results approved and committed as the first baseline
- [ ] #2 README records the first-baseline verdict: per-dimension pass rates and any weak fixtures
- [ ] #3 Repo gates green; epic closed on delivery
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Gate on explicit user go (billed). 2. Full deliver run. 3. Approve + commit baseline. 4. README verdict, close epic.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Billed + agentic. Session-limit vs outage handling per the eval-run-failure-modes memory; retry pass covers transients.
<!-- SECTION:NOTES:END -->
