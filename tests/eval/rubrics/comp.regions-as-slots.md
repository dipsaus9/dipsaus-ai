# Rubric: comp.regions-as-slots

The component originally drove distinct regions (header / body / footer / actions)
through configuration props. Judge whether the refactor genuinely exposes those regions
as composition.

**Pass — all of:**

- Distinct regions are received as `children`, named slot props of `ReactNode` type, or
  compound parts (`Card.Header`, `Card.Body`, …) — the caller places content, the
  component places structure.
- No region's content arrives as a plain string/config prop anymore (data props for
  genuinely atomic values — an id, a count — are fine).
- The public API would let a caller reorder, omit, or enrich a region without new props.

**Fail — any of:**

- Regions still arrive as scalar props (`title`, `footerText`, `ctaLabel`) merely
  renamed or regrouped into an options object.
- A single `children` swallows everything while the regions stay internally hardwired.
- Slots exist but the component also keeps the old config props as parallel API.

**Worked example — pass:**

```tsx
export function ArticleCard({ header, footer, children }: {
  header: ReactNode; footer: ReactNode; children: ReactNode;
}) {
  return (
    <article>
      <header>{header}</header>
      {children}
      <footer>{footer}</footer>
    </article>
  );
}
```

**Worked example — fail (renamed config, still prop-driven):**

```tsx
export function ArticleCard({ texts }: { texts: { title: string; body: string; footerNote: string } }) {
  return (
    <article>
      <h2>{texts.title}</h2>
      <p>{texts.body}</p>
      <footer>{texts.footerNote}</footer>
    </article>
  );
}
```
