# Rubric: comp.variant-compound

The component originally switched between 2+ distinct shapes via a variant prop. Judge
whether the refactor turns the shapes into a compound/composable API.

**Pass — all of:**

- Each former variant is expressible by composing parts (compound components, slots, or
  separate components) — no `variant` discriminator prop remains on the public API.
- Adding a third shape would need no edit to existing shapes' code paths.

**Fail — any of:**

- A `variant` / `kind` / `layout` prop still selects between branches internally.
- The compound parts exist but one "god part" takes a variant prop and re-creates the
  old switch inside.

**Explicitly NOT required:** extracting a shared shell/primitive between the shapes.
Two parts that duplicate their shared structure still **pass** — the skill teaches one
compound part-set per shape, not shell extraction. Judge only the criteria above.

**Worked example — pass:**

```tsx
function MetricShell({ label, children }: { label: string; children: ReactNode }) {
  return <section className="metric-card"><h3>{label}</h3>{children}</section>;
}
export const MetricCard = {
  Kpi: ({ label, value, delta }: KpiProps) => (
    <MetricShell label={label}><p>{value}</p>{delta !== undefined && <p>{delta}%</p>}</MetricShell>
  ),
  Trend: ({ label, value, points }: TrendProps) => (
    <MetricShell label={label}><p>{value}</p><ol>{points.map((p, i) => <li key={i}>{p}</li>)}</ol></MetricShell>
  ),
};
```

**Worked example — fail (variant prop survives):**

```tsx
export function MetricCard({ kind, ...rest }: { kind: "kpi" | "trend" } & Props) {
  return kind === "kpi" ? <KpiBody {...rest} /> : <TrendBody {...rest} />;
}
```
