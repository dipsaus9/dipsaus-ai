# Rubric: comp.slots-over-config

The component originally took render-config (zero-argument `renderX` props) or
boolean-flag soup. Judge whether the refactor moves to children/slots.

**Pass — all of:**

- Former `renderX: () => ReactNode` props are now `ReactNode` slot props, `children`,
  or compound parts — the caller writes JSX, not thunks returning JSX.
- Render props survive **only** where the component feeds data back to the caller
  (`renderItem: (item) => ReactNode` is legitimate).
- No boolean flags controlling whether a slot renders — an absent slot simply doesn't
  render.

**Fail — any of:**

- Zero-argument render functions remain on the public API under any name.
- Slots were added but the component still calls thunks internally for some regions.
- Empty/fallback content still configured via flags instead of slot presence
  (`showEmptyState` instead of an `empty` slot or `children` check).

**Explicitly NOT a violation:**

- The component choosing between its **own slot props** based on data state —
  `events.length === 0 ? empty : <ul>…</ul>` — is normal conditional rendering,
  exactly what the pass worked example below does. The fail criterion targets
  *caller-facing configuration* (flags, thunks) deciding what renders, never the
  component's internal data-driven choice between slots the caller already
  provided as plain JSX.

**Worked example — pass:**

```tsx
export function ActivityFeed({ events, heading, empty, footer }: {
  events: ActivityEvent[]; heading: ReactNode; empty: ReactNode; footer: ReactNode;
}) {
  return (
    <section>
      {heading}
      {events.length === 0 ? empty : <ul>{events.map((e) => <li key={e.id}>{e.message}</li>)}</ul>}
      {footer}
    </section>
  );
}
```

**Worked example — fail (thunks renamed, still render-config):**

```tsx
export function ActivityFeed({ events, slots }: {
  events: ActivityEvent[];
  slots: { heading: () => ReactNode; empty: () => ReactNode; footer: () => ReactNode };
}) {
  return (
    <section>
      {slots.heading()}
      {events.length === 0 ? slots.empty() : <ul>{events.map((e) => <li key={e.id}>{e.message}</li>)}</ul>}
      {slots.footer()}
    </section>
  );
}
```
