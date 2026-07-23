---
id: DIP-2.5
title: State and data-boundary fixture pairs with labels
status: Done
assignee: []
created_date: '2026-07-17 14:17'
updated_date: '2026-07-23 09:26'
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
- [x] #1 Every category-3 rule has a bad fixture + good twin under tests/eval/fixtures/state/, twins covering legitimate-useEffect and genuinely-shared-state traps
- [x] #2 Each bad fixture has expected.json (DIP-2.1 ids, file+line) and passing behavior tests
- [x] #3 One realistic component mixing fetch + derived-state + drilling (multi-labeled)
- [x] #4 All fixtures compile and behavior tests pass in the eval project; repo suite untouched and green
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Dirs under tests/eval/fixtures/state/ (DIP-2.3 schema): 1. server-fetch — Bad CustomerOrdersPanel: useEffect+useState fetch via injected api client (no network); Good LiveInventoryBadge: subscription useEffect+setState — the legitimate-useEffect trap (same shape as manual fetch, but push source). 2. derived-effect — Bad SearchSummary: filtered count mirrored into state via effect; Good: same computed in render with useMemo. 3. colocate — Bad SupportPage: parent holds messageDraft only to thread it into MessageComposer, never reads it; Good OrdersWorkspace: selectedOrderId lifted AND read by two children — the genuinely-shared trap. 4. prop-drilling — Bad: email opt-in threaded through 2 silent intermediates; Good: exactly 1 silent intermediate — under the 2+ threshold. 5. global-discipline — hand-rolled module store + useSyncExternalStore (no zustand dep): Bad uiStore holds one component's filtersPanelOpen flag (global for local); Good sessionStore user/locale — legitimately cross-cutting. 6. customer-dashboard (AC3 multi): injected-api effect fetch + derived totalSpent via effect + drilling through 2 silent intermediates — expected server-fetch+derived-effect+prop-drilling, alsoAcceptable srp.mixed-concerns. No react-query/router deps; loader/boundary equivalents hand-rolled and commented. README gains state.* trigger-line sentence (offending hook line; prop-drilling labels first silent intermediate declaration). All components stay inside category-1/2 rule limits except seeded violations.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Follows DIP-2.3's label schema. Fetch fixtures must not hit the network in behavior tests — fake fetch injected or msw-free hand stub; keep the island dependency-light. react-query/router NOT added as deps: bad fixtures show the manual-fetch anti-pattern; good twins may show the loader/boundary pattern with a minimal hand-rolled equivalent, documented as such.

Deliberate cross-rule hygiene: prop-drilling Bad's root READS the flag so colocate cannot co-trigger; colocate Bad's page never reads the draft so drilling cannot; customer-dashboard sits exactly on the hooks (5) and effects (2) caps so no category-1 cap co-triggers; global-discipline uses a hand-rolled useSyncExternalStore store, zero new deps. server-fetch Bad and customer-dashboard tolerate srp.mixed-concerns via alsoAcceptable. Hook trigger lines grep-verified.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Category-3 fixture corpus under tests/eval/fixtures/state/: server-fetch (manual effect+state fetch via injected api vs subscription-useEffect trap), derived-effect (state-mirrored match count vs useMemo twin), colocate (draft state lifted to a page that never reads it vs genuinely-shared selectedOrderId read by two children), prop-drilling (two silent intermediates vs exactly one — under threshold), global-discipline (hand-rolled useSyncExternalStore store holding one component's panel flag vs legitimately cross-cutting session store), plus customer-dashboard multi-violation (server-fetch + derived-effect + prop-drilling, alsoAcceptable srp.mixed-concerns/presentational). DIP-2.3 schema followed; README gained state.* trigger-line conventions. No network in tests, no new deps. Eval suite 24 files/49 tests green; repo suite untouched (6/91). Labels AI-drafted — user approves in PR review.
<!-- SECTION:FINAL_SUMMARY:END -->
