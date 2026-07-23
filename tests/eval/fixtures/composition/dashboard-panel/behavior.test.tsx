import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DashboardPanel } from "./Bad";

const baseProps = {
  title: "Open orders",
  subtitle: "Updated every minute",
  bodyText: "14 orders waiting for picking.",
  footerNote: "Utrecht DC",
  onToggleCollapse: vi.fn(),
};

describe("composition/dashboard-panel", () => {
  it("comfortable shape shows subtitle, footer and collapses", () => {
    const onToggleCollapse = vi.fn();
    render(
      <DashboardPanel
        {...baseProps}
        onToggleCollapse={onToggleCollapse}
        showHeader={true}
        showFooter={true}
        collapsible={true}
        density="comfortable"
      />,
    );
    expect(screen.getByText("Updated every minute")).toBeDefined();
    expect(screen.getByText("Utrecht DC")).toBeDefined();
    fireEvent.click(screen.getByText("Collapse"));
    expect(onToggleCollapse).toHaveBeenCalledWith(true);
    expect(screen.queryByText("14 orders waiting for picking.")).toBeNull();
    expect(screen.queryByText("Utrecht DC")).toBeNull();
  });

  it("compact headerless shape renders only the body", () => {
    render(
      <DashboardPanel
        {...baseProps}
        showHeader={false}
        showFooter={false}
        collapsible={false}
        density="compact"
      />,
    );
    expect(screen.getByText("14 orders waiting for picking.")).toBeDefined();
    expect(screen.queryByText("Open orders")).toBeNull();
    expect(screen.queryByText("Updated every minute")).toBeNull();
  });
});
