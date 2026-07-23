// Violates comp.variant-compound: one component reused in two distinct shapes,
// switched by a variant prop whose branches render different layouts. Should be
// a compound API (MetricCard.Kpi / MetricCard.Trend) instead of a variant map.
export function MetricCard({
  variant,
  label,
  value,
  delta,
  points,
}: {
  variant: "kpi" | "trend";
  label: string;
  value: number;
  delta?: number;
  points?: number[];
}) {
  if (variant === "kpi") {
    return (
      <section className="metric-card metric-card--kpi">
        <h3>{label}</h3>
        <p className="metric-value">{value}</p>
        {delta !== undefined && (
          <p className="metric-delta">
            {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}%
          </p>
        )}
      </section>
    );
  }
  return (
    <section className="metric-card metric-card--trend">
      <h3>{label}</h3>
      <p className="metric-value">{value}</p>
      <ol className="metric-points">
        {(points ?? []).map((point, index) => (
          <li key={index}>{point}</li>
        ))}
      </ol>
    </section>
  );
}
