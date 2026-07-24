import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardPanelsDemo } from "./Demo";

describe("composition/dashboard-panel", () => {
  it("Demo renders both shapes and surfaces the collapse", () => {
    render(<DashboardPanelsDemo />);
    // comfortable shape: subtitle + footer present
    expect(screen.getByText("Updated every minute")).toBeDefined();
    expect(screen.getByText("Utrecht DC")).toBeDefined();
    // compact headerless shape: body only
    expect(screen.getByText("No picking errors today.")).toBeDefined();
    expect(screen.queryByText("Picking errors")).toBeNull();

    fireEvent.click(screen.getByText("Collapse"));
    expect(screen.getByRole("status").textContent).toBe("collapsed");
    expect(screen.queryByText("14 orders waiting for picking.")).toBeNull();
    expect(screen.queryByText("Utrecht DC")).toBeNull();
  });
});
