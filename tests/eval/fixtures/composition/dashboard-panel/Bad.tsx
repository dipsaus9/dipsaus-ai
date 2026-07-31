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
