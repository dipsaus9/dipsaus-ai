---
id: DIP-2.5
title: State and data-boundary fixture pairs with labels
status: To Do
assignee: []
created_date: '2026-07-17 14:17'
labels:
  - story
dependencies:
  - DIP-2.1
  - DIP-2.2
references:
  - tests/eval/fixtures/state/
parent_task_id: DIP-2
ordinal: 8000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Minimal bad/good pairs for category-3 rules: manual useEffect+useState fetch (vs query/loader at a boundary), derived state in useEffect, state lifted/globalized where local would do, prop-drilling through 2+ silent intermediates, server state in a client store. Good twins include a legitimate useEffect (subscription) and a genuinely shared lifted state — the false-positive traps that matter most here. Same label schema; user approves labels in PR review.

Type: deliverable
Branch: DIP-2.5/state-fixtures
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every category-3 rule has a bad fixture + good twin under tests/eval/fixtures/state/, twins covering legitimate-useEffect and genuinely-shared-state traps
- [ ] #2 Each bad fixture has expected.json (DIP-2.1 ids, file+line) and passing behavior tests
- [ ] #3 One realistic component mixing fetch + derived-state + drilling (multi-labeled)
- [ ] #4 All fixtures compile and behavior tests pass in the eval project; repo suite untouched and green
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Follows DIP-2.3's label schema. Fetch fixtures must not hit the network in behavior tests — fake fetch injected or msw-free hand stub; keep the island dependency-light. react-query/router NOT added as deps: bad fixtures show the manual-fetch anti-pattern; good twins may show the loader/boundary pattern with a minimal hand-rolled equivalent, documented as such.
<!-- SECTION:NOTES:END -->
