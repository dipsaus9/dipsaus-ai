// Clean twin — a one-off, single-shape component. The standard explicitly
// allows a single-use component to stay prop-driven: a false-positive trap.
export function UptimeBadge({
  label,
  uptimePercent,
}: {
  label: string;
  uptimePercent: number;
}) {
  return (
    <span className={uptimePercent >= 99.9 ? "uptime uptime--ok" : "uptime uptime--warn"}>
      {label}: {uptimePercent.toFixed(2)}%
    </span>
  );
}
