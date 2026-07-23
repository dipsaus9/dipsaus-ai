---
name: react-architecture
description: Reviews or refactors React/TypeScript components against strict architecture standards — single-responsibility hard caps, compound-component composition, and state/data boundaries. Use when asked to review, improve, audit, or refactor React component architecture, or to check a component against these standards.
---

# react-architecture

Apply the standards below to React + TypeScript components. Two modes:

- **review** (default) — read-only. Emit a structured findings report. Change nothing.
- **apply** — refactor the code to satisfy the standards (see Apply mode).

Invocation: `/react-architecture [review|apply] <path>`. `<path>` is a file or directory.
If no mode word is given, default to **review**.

---

## Standards

Three categories. Each rule has a severity: **high** (must fix), **med** (should fix), **low** (minor).

Every rule also has a **stable id** (kebab, category-prefixed: `srp.`, `boundary.`, `comp.`,
`state.`). Findings reference rules by id — see the Rule index at the end of this section.

### 1. Component design & single responsibility

Hard caps — exceeding any is a **high** finding:

| Limit | Cap | Id |
|------|-----|----|
| Lines of code per component | **150** | `srp.loc-cap` |
| Hooks per component | **5** | `srp.hooks-cap` |
| Props per component | **6** | `srp.props-cap` |
| `useEffect` per component | **2** | `srp.effects-cap` |
| JSX nesting depth | **5** | `srp.jsx-depth-cap` |

- A component must have **one reason to change**. If it mixes concerns — data fetching +
  business logic + presentation + layout — split it: extract logic into a custom hook and
  keep a presentational component. **[high]** `srp.mixed-concerns`
- Prefer presentational components driven by props/children, with logic in hooks. **[med]**
  `srp.presentational`

**Feature boundaries** — a component must not know about another feature's internals.
Flag any of these as **[high]**:

- **Deep imports** into another feature's internal modules instead of its public
  API/barrel (e.g. `import { calcTax } from "@/features/billing/lib/tax"` inside a
  `profile` component). `boundary.deep-import`
- **Embedded foreign domain logic** — logic/knowledge that belongs to a different feature
  (e.g. a profile card computing invoice/tax rules). `boundary.foreign-logic`
- **Cross-feature internal state/types** — depending on another feature's store, context,
  or internal types instead of receiving data via props/events at the boundary.
  `boundary.internal-state`
- **Hardwired child-feature rendering** — rendering another feature's concrete components
  inline instead of via composition / slots / routing. `boundary.hardwired-render`

Fix: depend only on the other feature's **public API**; receive data via **props/events**;
move misplaced logic to the **owning feature**; invert rendering via **composition/slots**.

### 2. Compound components & composition

- A component with distinct **regions** (header / body / footer / actions) must expose them
  as **slots / children**, not configuration props. **[med]** `comp.regions-as-slots`
- Use a **compound API** (`Component.Part`) with shared state via **React context** when any
  of these hold: configuration-over-composition (boolean/visibility flags like `showHeader`,
  `hideFooter`; variant maps), **> 6 props**, or state shared between parts. **[med]**
  `comp.config-soup`
- A component reused in **2+ shapes/variants** must be compound. A one-off, single-use
  component may stay prop-driven (unless it hits config-soup above). **[med]**
  `comp.variant-compound`
- Prefer **children/slots over render-config**; ban boolean-flag soup. **[med]**
  `comp.slots-over-config`

### 3. State & data boundaries

- **Server state**: never fetch with manual `useEffect` + `useState`. Use a server-state
  library (react-query / SWR) **or** the React Router **loader** pattern. Fetch at a route /
  container **boundary**, not in leaf components. **[high]** `state.server-fetch`
- **No derived state in `useEffect`**: state that mirrors or is computed from props / other
  state. Compute it during render (or `useMemo` if genuinely expensive). **[high]**
  `state.derived-effect`
- **Colocate** state in the component that uses it; lift only when genuinely shared. Flag
  state lifted higher or made global when local would do. **[med]** `state.colocate`
- **Prop-drilling**: props threaded through **2+ intermediate** components that don't use
  them → fix via **composition (children) first, context second**. **[med]**
  `state.prop-drilling`
- **Global-state discipline**: client global state only for truly cross-cutting concerns.
  No global store for local state; never put server state in a client store. **[med]**
  `state.global-discipline`

> Design-system adherence is intentionally **out of scope for v1**.

### Rule index

The full id → rule contract. Ids are stable: renaming one is a breaking change to anything
that consumes these findings.

| Id | Severity | Rule |
|----|----------|------|
| `srp.loc-cap` | high | ≤ 150 lines of code per component |
| `srp.hooks-cap` | high | ≤ 5 hooks per component |
| `srp.props-cap` | high | ≤ 6 props per component |
| `srp.effects-cap` | high | ≤ 2 `useEffect` per component |
| `srp.jsx-depth-cap` | high | JSX nesting depth ≤ 5 |
| `srp.mixed-concerns` | high | one reason to change; split mixed concerns into hook + presentational component |
| `srp.presentational` | med | prefer presentational components with logic in hooks |
| `boundary.deep-import` | high | no deep imports into another feature's internals |
| `boundary.foreign-logic` | high | no embedded foreign domain logic |
| `boundary.internal-state` | high | no dependence on another feature's internal state/types |
| `boundary.hardwired-render` | high | no hardwired rendering of another feature's components |
| `comp.regions-as-slots` | med | distinct regions exposed as slots/children, not config props |
| `comp.config-soup` | med | compound API + context when config flags, > 6 props, or shared part state |
| `comp.variant-compound` | med | components reused in 2+ shapes/variants must be compound |
| `comp.slots-over-config` | med | children/slots over render-config; no boolean-flag soup |
| `state.server-fetch` | high | no manual `useEffect`+`useState` fetching; query/loader at a boundary |
| `state.derived-effect` | high | no derived state in `useEffect`; compute during render |
| `state.colocate` | med | colocate state; lift only when genuinely shared |
| `state.prop-drilling` | med | no props threaded through 2+ non-consuming components |
| `state.global-discipline` | med | global state only for cross-cutting concerns; no server state in client stores |

---

## Review mode (output)

Emit **structured markdown**, grouped by category. Only include categories that have findings.
Each finding is one entry:

```
## <Category>
- [<severity>] `<rule-id>` <file>:<line> — <rule>
  problem: <one-line what's wrong>
  fix: <one-line concrete change>
```

`<rule-id>` is the rule's stable id from the Rule index — required on every finding.

Example:

```
## Component design & SRP
- [high] `srp.props-cap` Card.tsx:12 — props 9 > 6
  problem: configuration soup drives a multi-part card
  fix: split into <Card.Header/> <Card.Body/> <Card.Footer/> + CardContext

## State & data
- [high] `state.derived-effect` UserList.tsx:30 — derived state in useEffect
  problem: `fullName` is set from first/last via useEffect
  fix: const fullName = `${first} ${last}` during render
```

If nothing violates the standards, say so explicitly — do not invent findings.

---

## Apply mode

Refactor the target to satisfy the standards, editing the files in place. These are the
user's real source files — make sure the work is committed or otherwise recoverable before
you start, and stop and ask if it is not.

- Apply all **high** and **med** findings that are mechanically safe: derived state → render,
  extract hooks, split god components, manual fetch → query/loader, prop-drilling → composition.
- Perform compound-component refactors you are **confident** preserve behavior.
- For ambiguous / risky restructures, apply your best effort and leave a clear
  `// NOTE: <assumption>` comment at the change site.
- **Preserve behavior.** Do not change public component contracts beyond what the standards
  require. Keep TypeScript types correct.
- After applying, summarise what changed, grouped by category, in the same finding shape —
  including each finding's stable rule id from the Rule index.
