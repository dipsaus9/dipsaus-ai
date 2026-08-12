---
id: DIP-8.4
title: 'Fix amend-mode --ref wording in backlog-plan (edit --ref replaces, not adds)'
status: To Do
assignee: []
created_date: '2026-08-12 07:51'
labels:
  - story
dependencies: []
references:
  - skills/backlog-plan/SKILL.md
parent_task_id: DIP-8
type: bug
ordinal: 66000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
backlog task edit --ref REPLACES the References set, not appends (unlike --ac). skills/backlog-plan/SKILL.md amend mode says '--ref adds', which can silently drop scope during an amend. Fix: the amend step must re-pass every existing --ref plus the new one, and the wording corrected.

Type: deliverable
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 backlog-plan amend mode documents that --ref replaces and re-passes all existing References when adding one
- [ ] #2 No other amend-mode field guidance is wrong (audit --dep too)
<!-- AC:END -->
