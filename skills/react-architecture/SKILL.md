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

### 1. Component design & single responsibility

Hard caps — exceeding any is a **high** finding:

| Limit | Cap |
|------|-----|
| Lines of code per component | **150** |
| Hooks per component | **5** |
| Props per component | **6** |
| `useEffect` per component | **2** |
| JSX nesting depth | **5** |

- A component must have **one reason to change**. If it mixes concerns — data fetching +
  business logic + presentation + layout — split it: extract logic into a custom hook and
  keep a presentational component. **[high]**
- Prefer presentational components driven by props/children, with logic in hooks. **[med]**

**Feature boundaries** — a component must not know about another feature's internals.
Flag any of these as **[high]**:

- **Deep imports** into another feature's internal modules instead of its public
  API/barrel (e.g. `import { calcTax } from "@/features/billing/lib/tax"` inside a
  `profile` component).
- **Embedded foreign domain logic** — logic/knowledge that belongs to a different feature
  (e.g. a profile card computing invoice/tax rules).
- **Cross-feature internal state/types** — depending on another feature's store, context,
  or internal types instead of receiving data via props/events at the boundary.
- **Hardwired child-feature rendering** — rendering another feature's concrete components
  inline instead of via composition / slots / routing.

Fix: depend only on the other feature's **public API**; receive data via **props/events**;
move misplaced logic to the **owning feature**; invert rendering via **composition/slots**.

### 2. Compound components & composition

- A component with distinct **regions** (header / body / footer / actions) must expose them
  as **slots / children**, not configuration props. **[med]**
- Use a **compound API** (`Component.Part`) with shared state via **React context** when any
  of these hold: configuration-over-composition (boolean/visibility flags like `showHeader`,
  `hideFooter`; variant maps), **> 6 props**, or state shared between parts. **[med]**
- A component reused in **2+ shapes/variants** must be compound. A one-off, single-use
  component may stay prop-driven (unless it hits config-soup above). **[med]**
- Prefer **children/slots over render-config**; ban boolean-flag soup. **[med]**

### 3. State & data boundaries

- **Server state**: never fetch with manual `useEffect` + `useState`. Use a server-state
  library (react-query / SWR) **or** the React Router **loader** pattern. Fetch at a route /
  container **boundary**, not in leaf components. **[high]**
- **No derived state in `useEffect`**: state that mirrors or is computed from props / other
  state. Compute it during render (or `useMemo` if genuinely expensive). **[high]**
- **Colocate** state in the component that uses it; lift only when genuinely shared. Flag
  state lifted higher or made global when local would do. **[med]**
- **Prop-drilling**: props threaded through **2+ intermediate** components that don't use
  them → fix via **composition (children) first, context second**. **[med]**
- **Global-state discipline**: client global state only for truly cross-cutting concerns.
  No global store for local state; never put server state in a client store. **[med]**

> Design-system adherence is intentionally **out of scope for v1**.

---

## Review mode (output)

Emit **structured markdown**, grouped by category. Only include categories that have findings.
Each finding is one entry:

```
## <Category>
- [<severity>] <file>:<line> — <rule>
  problem: <one-line what's wrong>
  fix: <one-line concrete change>
```

Example:

```
## Component design & SRP
- [high] Card.tsx:12 — props 9 > 6
  problem: configuration soup drives a multi-part card
  fix: split into <Card.Header/> <Card.Body/> <Card.Footer/> + CardContext

## State & data
- [high] UserList.tsx:30 — derived state in useEffect
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
- After applying, summarise what changed, grouped by category, in the same finding shape.
