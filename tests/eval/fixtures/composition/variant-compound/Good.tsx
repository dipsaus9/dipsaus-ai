/**
 * Uptime badge for the status page header.
 *
 * A one-off, single-shape component: it renders one way, is used in one
 * place, and switches nothing. The compound-API rule (comp.variant-compound)
 * applies to components reused across 2+ shapes behind a variant
 * discriminator — a single-use, single-shape component stays prop-driven by
 * design. The className ternary is styling state, not a shape switch.
 */
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
