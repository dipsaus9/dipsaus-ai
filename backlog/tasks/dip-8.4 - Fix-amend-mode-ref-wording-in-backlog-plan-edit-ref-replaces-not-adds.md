---
id: DIP-8.4
title: 'Fix amend-mode --ref wording in backlog-plan (edit --ref replaces, not adds)'
status: Done
assignee: []
created_date: '2026-08-12 07:51'
updated_date: '2026-08-12 09:58'
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
Branch: DIP-8.4/amend-ref-doc-fix
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 backlog-plan amend mode documents that --ref replaces and re-passes all existing References when adding one
- [x] #2 No other amend-mode field guidance is wrong (audit --dep too)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Fixed skills/backlog-plan/SKILL.md in two places (amend-mode step + Notes). Verified empirically on a throwaway task: backlog task edit --ref REPLACES the ref set, and --dep ALSO replaces (added DIP-8.3 then --dep DIP-8 left only DIP-8) — both unlike --ac which appends. Doc now says: to add one References path or one dependency on an edit, re-pass every existing value plus the new one. AC#2 audit result: --dep had the same bug, now fixed; reference/ docs were clean. Surfaced originally during DIP-10.4 (see memory backlog-edit-ref-replaces). Markdown-only; gates green.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Corrected the backlog-plan amend-mode documentation: backlog task edit --ref and --dep both REPLACE their whole set (verified empirically), not append like --ac, so the amend step must re-pass every existing value plus the new one or silently drop scope. Fixed both the amend-mode step and the Notes line; the --dep audit (AC#2) found the same bug there and fixed it. Reference docs were already clean.
<!-- SECTION:FINAL_SUMMARY:END -->
