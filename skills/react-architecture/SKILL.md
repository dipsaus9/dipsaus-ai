---
name: react-architecture
description: Reviews or refactors React/TypeScript components against strict architecture standards — single-responsibility hard caps, compound-component composition, and state/data boundaries. Use when asked to review, improve, audit, or refactor React component architecture, or to check a component against these standards.
---

# react-architecture

Apply these standards to React + TypeScript components. Two modes: **review**
(default — read-only, emit a findings report, change nothing) and **apply** (refactor to
satisfy the standards). Invocation: `/react-architecture [review|apply] <path>`.

## Standards

Severity per rule: **high** (must fix), **med** (should fix), **low** (minor). Findings
cite rules by **stable id** — see the Rule index.

### 1. Component design & single responsibility

Hard caps — exceeding any is a **high** finding:

| Limit | Cap | Id |
|------|-----|----|
| Lines of code per component | **150** | `srp.loc-cap` |
| Hooks per component | **5** | `srp.hooks-cap` |
| Props per component | **6** | `srp.props-cap` |
| `useEffect` per component | **2** | `srp.effects-cap` |
| JSX nesting depth | **5** | `srp.jsx-depth-cap` |

- One reason to change per component. Mixing data fetching + business logic +
  presentation → extract logic into a custom hook, keep a presentational component.
  **[high]** `srp.mixed-concerns`
- Prefer presentational components driven by props/children, logic in hooks. **[med]**
  `srp.presentational`

**Feature boundaries** — a component must not know another feature's internals. All **[high]**:

- **Deep imports** past another feature's public API/barrel (e.g.
  `@/features/billing/lib/tax` from a `profile` component). `boundary.deep-import`
- **Foreign domain logic** embedded where another feature owns it (a profile card
  computing tax rules). `boundary.foreign-logic`
- **Cross-feature internal state/types** — reading another feature's store, context or
  internal types instead of props/events at the boundary. `boundary.internal-state`
- **Hardwired child-feature rendering** inline instead of composition / slots / routing.
  `boundary.hardwired-render`

Fix: public APIs, props/events at the boundary, logic to its owning feature,
composition for rendering.

### 2. Compound components & composition

- Distinct **regions** (header / body / footer / actions) must be **slots / children**,
  not configuration props. **[med]** `comp.regions-as-slots`
- **Config soup** — many independent knobs: boolean/visibility flags (`showHeader`,
  `hideFooter`), render-config props, **> 6 props**, or state shared between parts.
  Fix with a compound API (`Component.Part`) sharing state via context. **[med]**
  `comp.config-soup`
- **Variant switching** — report `comp.variant-compound` **only** when an enum-like
  discriminator prop (`variant="kpi" | "trend"`) selects between distinct shapes of a
  component reused in 2+ shapes; the fix is one compound part-set per shape. Many
  independent booleans/knobs are `comp.config-soup`, **not** variant-compound — report
  both only when both patterns are present. A one-off
  single-shape component may stay prop-driven. **[med]** `comp.variant-compound`
- Prefer **children/slots over render-config**; no boolean-flag soup. **[med]**
  `comp.slots-over-config`

In these refactors the discriminator/gate prop must **die**, not get renamed:

```tsx
// Before: <MetricCard variant="kpi" showSubtitle />
// After — the caller composes; no prop selects or gates anything:
<MetricCard.Kpi>
  <MetricCard.Subtitle>Weekly</MetricCard.Subtitle>
</MetricCard.Kpi>
```

A prop that only re-skins an always-rendered element (`compact` switching a class)
is fine; a prop that decides **what renders** is the antipattern under any name —
`variant`, `showSubtitle`, or a renamed semantic like `density`.

### 3. State & data boundaries

- **Server state**: never fetch via manual `useEffect` + `useState`. Use a server-state
  library (react-query / SWR) or route **loader**, at a route/container boundary — not in
  leaf components. **[high]** `state.server-fetch`
- **No derived state in `useEffect`** (state mirroring/computed from props or other
  state). Compute during render, `useMemo` if expensive. **[high]** `state.derived-effect`
- **Colocate** state where it is used; lift only when genuinely shared. **[med]**
  `state.colocate`
- **Prop-drilling** through 2+ intermediates that don't use the props → composition
  (children) first, context second. **[med]** `state.prop-drilling`
- **Global-state discipline**: client global stores (redux/zustand/context-as-store) only
  for truly app-wide concerns (session, theme, cart). Flag local UI state kept in a
  global store, and server data cached in a client store. **[med]**
  `state.global-discipline`

### Rule index

Ids are stable — renaming one breaks consumers of these findings.

| Id | Severity | Rule |
|----|----------|------|
| `srp.loc-cap` | high | ≤ 150 lines of code per component |
| `srp.hooks-cap` | high | ≤ 5 hooks per component |
| `srp.props-cap` | high | ≤ 6 props per component |
| `srp.effects-cap` | high | ≤ 2 `useEffect` per component |
| `srp.jsx-depth-cap` | high | JSX nesting depth ≤ 5 |
| `srp.mixed-concerns` | high | one reason to change; split into hook + presentational component |
| `srp.presentational` | med | presentational components with logic in hooks |
| `boundary.deep-import` | high | no deep imports into another feature's internals |
| `boundary.foreign-logic` | high | no embedded foreign domain logic |
| `boundary.internal-state` | high | no dependence on another feature's internal state/types |
| `boundary.hardwired-render` | high | no hardwired rendering of another feature's components |
| `comp.regions-as-slots` | med | regions exposed as slots/children, not config props |
| `comp.config-soup` | med | compound API + context when config flags, > 6 props, or shared part state |
| `comp.variant-compound` | med | enum-discriminated components reused in 2+ shapes must be compound |
| `comp.slots-over-config` | med | children/slots over render-config; no boolean-flag soup |
| `state.server-fetch` | high | no manual `useEffect`+`useState` fetching; query/loader at a boundary |
| `state.derived-effect` | high | no derived state in `useEffect`; compute during render |
| `state.colocate` | med | colocate state; lift only when genuinely shared |
| `state.prop-drilling` | med | no props threaded through 2+ non-consuming components |
| `state.global-discipline` | med | global stores only for app-wide concerns; no local or server state in them |

## Review mode (output)

Markdown grouped by category; only categories with findings. `<rule-id>` is required:

```
## <Category>
- [<severity>] `<rule-id>` <file>:<line> — <rule>
  problem: <one-line what's wrong>
  fix: <one-line concrete change>
```

Example:

```
## State & data
- [high] `state.derived-effect` UserList.tsx:30 — derived state in useEffect
  problem: `fullName` is set from first/last via useEffect
  fix: const fullName = `${first} ${last}` during render
```

No violations → say so explicitly; never invent findings.

## Apply mode

Refactor the target in place. The files are real source — ensure they are committed or
recoverable first; stop and ask if not.

- Apply all mechanically safe **high**/**med** fixes: derived state → render, extract
  hooks, split god components, manual fetch → query/loader, drilling → composition.
- Do compound refactors you are **confident** preserve behavior; on risky restructures,
  best effort plus a `// NOTE: <assumption>` at the site.
- **Preserve behavior** and correct types; change public contracts only where the
  standards require it.
- Afterwards, summarise changes per category in the finding shape, with rule ids.
