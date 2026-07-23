// Realistic config-soup component, multi-labeled. Violates at once:
// comp.config-soup (visibility flags + a density variant map + 9 props),
// comp.regions-as-slots (header/body/footer regions all configured via props),
// comp.slots-over-config (flag soup instead of composition). The 9 props also
// trip srp.props-cap, and the density map arguably comp.variant-compound —
// both tolerated via alsoAcceptable.
import { useState } from "react";

export function DashboardPanel({
  title,
  subtitle,
  bodyText,
  footerNote,
  showHeader,
  showFooter,
  collapsible,
  density,
  onToggleCollapse,
}: {
  title: string;
  subtitle: string;
  bodyText: string;
  footerNote: string;
  showHeader: boolean;
  showFooter: boolean;
  collapsible: boolean;
  density: "compact" | "comfortable";
  onToggleCollapse: (collapsed: boolean) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    onToggleCollapse(next);
  };

  return (
    <section className={`panel panel--${density}`}>
      {showHeader && (
        <header>
          <h3>{title}</h3>
          {density === "comfortable" && <p className="subtitle">{subtitle}</p>}
          {collapsible && (
            <button type="button" onClick={toggle}>
              {collapsed ? "Expand" : "Collapse"}
            </button>
          )}
        </header>
      )}
      {!collapsed && <p className="panel-body">{bodyText}</p>}
      {showFooter && !collapsed && (
        <footer>
          <small>{footerNote}</small>
        </footer>
      )}
    </section>
  );
}
