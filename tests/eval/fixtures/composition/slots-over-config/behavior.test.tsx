import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ActivityFeedsDemo } from "./Demo";
import { TagList } from "./Good";

describe("composition/slots-over-config", () => {
  it("Demo renders the populated feed and the empty feed", () => {
    render(<ActivityFeedsDemo />);
    expect(screen.getByText("Recent activity")).toBeDefined();
    expect(screen.getByText("Order SO-812 shipped")).toBeDefined();
    expect(screen.getByText("View all")).toBeDefined();
    expect(screen.getByText("Archive")).toBeDefined();
    expect(screen.getByText("Nothing archived.")).toBeDefined();
    expect(screen.queryByText("All quiet.")).toBeNull();
  });

  it("Good renders tags, or the empty label", () => {
    render(<TagList tags={["oak", "walnut"]} emptyLabel="No materials" />);
    expect(screen.getByText("walnut")).toBeDefined();
    const { container } = render(<TagList tags={[]} emptyLabel="No materials" />);
    expect(container.textContent).toBe("No materials");
  });
});
