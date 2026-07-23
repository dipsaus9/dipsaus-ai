---
id: DIP-2.4
title: Composition and compound-component fixture pairs with labels
status: Done
assignee: []
created_date: '2026-07-17 14:17'
updated_date: '2026-07-23 09:20'
labels:
  - story
dependencies:
  - DIP-2.1
  - DIP-2.2
references:
  - tests/eval/fixtures/composition/
parent_task_id: DIP-2
ordinal: 7000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Minimal bad/good pairs for category-2 rules: regions-as-config-props vs slots, config-soup that demands a compound API (boolean flags, variant maps, >6 props with shared part-state), reused-in-2+-shapes must-be-compound, and children/slots-over-render-config. Good twins are legitimately prop-driven one-offs — the exact cases the skill must NOT flag. Same label schema and behavior-test rules as DIP-2.3; user approves labels in PR review.

Type: deliverable
Branch: DIP-2.4/composition-fixtures
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Every category-2 rule has a bad fixture + good twin under tests/eval/fixtures/composition/, good twins being legitimate prop-driven designs
- [x] #2 Each bad fixture has expected.json (DIP-2.1 ids, file+line) and passing behavior tests
- [x] #3 One realistic config-soup component (multi-violation, multi-labeled)
- [x] #4 All fixtures compile and behavior tests pass in the eval project; repo suite untouched and green
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Dirs under tests/eval/fixtures/composition/ (DIP-2.3 schema, not forked): 1. regions-as-slots — Bad ArticleCard: header/body/footer/action regions via 6 config props (alsoAcceptable comp.slots-over-config); Good ArticleByline: flat data props, no regions. 2. config-soup — Bad OrderConfirmDialog: 6 props with 2 visibility flags (alsoAcceptable regions-as-slots, slots-over-config); Good InlineAlert: one behavior boolean on a one-off — legit. 3. variant-compound — Bad MetricCard: variant map kpi|trend switching layouts, tested in both shapes (alsoAcceptable config-soup); Good UptimeBadge: one-off single shape. 4. slots-over-config — Bad ActivityFeed: zero-arg render-config props renderHeading/renderEmpty/renderFooter (unambiguous slot candidates, item rendering stays internal); Good TagList: data-prop empty-state, no render-config needed. 5. dashboard-panel (AC3 multi): 9 props, showHeader/showFooter/collapsible flags + density variant map + region text props — expected config-soup+regions-as-slots+slots-over-config, alsoAcceptable srp.props-cap+variant-compound. All fixtures stay inside every category-1 cap. comp.* trigger line = component declaration (README convention sentence extended, additive). Behavior tests assert >=2 usage shapes for compound-refactor candidates.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Follows the label schema defined by DIP-2.3 — do not fork it. Composition rules are judgment-heavy: bad fixtures must be unambiguous violations (the judge layer, not review scoring, handles grey areas later). Behavior tests for compound-refactor candidates should assert rendered output for at least 2 usage shapes so apply-mode refactors are genuinely constrained.

Category-2 rules overlap by design — isolation handled via alsoAcceptable: config-soup Bad tolerates regions-as-slots+slots-over-config; variant-compound Bad tolerates config-soup (variant maps are a config-soup trigger); dashboard-panel expects all three of config-soup/regions-as-slots/slots-over-config and tolerates srp.props-cap (9 props) + variant-compound (density map, reuse count not provable from one file). slots-over-config Bad uses zero-arg render-config props so the slot refactor is unambiguous. Declaration lines grep-verified.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Category-2 fixture corpus under tests/eval/fixtures/composition/: regions-as-slots (ArticleCard config-prop regions vs flat-data ArticleByline), config-soup (OrderConfirmDialog visibility flags vs one-boolean InlineAlert), variant-compound (MetricCard kpi|trend variant map behavior-tested in both shapes vs one-off UptimeBadge), slots-over-config (ActivityFeed zero-arg render-config props vs data-prop TagList), plus dashboard-panel — a realistic 9-prop flags+variant multi-violation labeled with all three of config-soup/regions-as-slots/slots-over-config and alsoAcceptable srp.props-cap + variant-compound. DIP-2.3 label schema followed unchanged; one additive README sentence: comp.* rules label the component declaration. Eval suite 18 files/38 tests green; repo suite untouched (6/91). Labels AI-drafted — user approves in PR review.
<!-- SECTION:FINAL_SUMMARY:END -->
