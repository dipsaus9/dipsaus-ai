# react-architecture — judge rubric

You are scoring a **review report** produced by the `react-architecture` skill for one
fixture under `fixtures/react/`. Output a single integer score **0–100**. **Pass ≥ 80.**

## How to score

1. Find the fixture's **answer key** below (by filename).
2. Each key item has points. Award:
   - **full** — report identifies the violation with the right rule, a correct
     `file:line` location, and an actionable fix that matches the standard.
   - **half** — right violation but vague location or weak/incorrect fix.
   - **zero** — missed.
3. **Deductions** (subtract from the total, floor 0):
   - **−10** per invented / false-positive finding (a violation that isn't real).
   - **−5** per fix that contradicts the standards (e.g. "lift state up" for colocation,
     or recommending a global store for local state).
   - **−5** if findings are not grouped by category in the structured format.
4. Report the integer total. Do not pass a report that misses any **[high]** item even if
   the arithmetic is close — a missed high-severity finding caps the score at **79**.

Score only what the standards cover. Do not reward extra commentary, code snippets, or
insight blocks; do not penalise them either (beyond false-positive findings).

---

## Answer keys

### god-component.tsx  (categories: SRP, state & data)

| # | Expected finding | Sev | Pts |
|---|------------------|-----|-----|
| 1 | Derived state in `useEffect` (`fullName` from `user`) → compute in render | high | 20 |
| 2 | Manual `useEffect` + `useState` fetching (`user` and `orders`) → server-state lib (react-query/SWR) or React Router loader, at a boundary | high | 20 |
| 3 | SRP hard caps exceeded — props 7 > 6, hooks > 5, `useEffect` 3 > 2 | high | 20 |
| 4 | Mixed concerns (fetch + business logic + presentation) → split into hook(s) + presentational component | high | 20 |
| 5 | Inline business logic (`visibleOrders` filter/sort, `lifetimeValue`) extracted with the data logic | med | 10 |
| 6 | Findings have correct `file:line` and actionable fixes | — | 10 |

### cross-feature-coupling.tsx  (category: SRP / feature boundaries)

| # | Expected finding | Sev | Pts |
|---|------------------|-----|-----|
| 1 | Deep imports into `billing` internals (`lib/tax`, `constants/internal`, `types/internal`) instead of its public API | high | 20 |
| 2 | Embedded foreign domain logic (invoice/tax total) belongs to `billing` → move it there | high | 20 |
| 3 | Cross-feature internal state (`useBillingStore`) → receive data via props/events at the boundary | high | 20 |
| 4 | Hardwired child-feature rendering (`<BillingInvoiceTable/>`) → composition/slots/routing | high | 20 |
| 5 | Fix points to the owning feature's public API + inversion via props/composition | — | 10 |
| 6 | Correct `file:line` + actionable fixes | — | 10 |

### config-soup-card.tsx  (category: compound components)

| # | Expected finding | Sev | Pts |
|---|------------------|-----|-----|
| 1 | `> 6` props on `Card` (11) → compound | med | 20 |
| 2 | Configuration / boolean-flag soup (`showHeader`, `showAvatar`, `hideFooter`, `variant`) → compound API | med | 20 |
| 3 | Regions (header / body / footer) passed as props → expose as slots/children | med | 20 |
| 4 | Reused in 2+ shapes (`Usage`) → must be compound | med | 15 |
| 5 | Concrete fix shape: `<Card>` + `Card.Header/Body/Footer` with shared context | — | 15 |
| 6 | Correct `file:line` + actionable fixes | — | 10 |

### prop-drilling.tsx  (category: state & data)

| # | Expected finding | Sev | Pts |
|---|------------------|-----|-----|
| 1 | `user` prop-drilled through `Layout` → `Sidebar` (intermediates that don't use it) | med | 40 |
| 2 | Fix order: composition (children) first, context second | — | 30 |
| 3 | Correct leaf identified (`UserBadge`) + locations | — | 15 |
| 4 | No false positives (the leaf using `user` is **not** a violation) | — | 15 |

---

## Notes for the harness

- One fixture is scored per eval run; pass the fixture filename so the judge picks the key.
- The keys are the ground truth for v1; update them in lockstep with `SKILL.md` standards.
