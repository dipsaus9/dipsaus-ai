import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ActivityFeed } from "./Bad";
import { TagList } from "./Good";

const feedConfig = {
  renderHeading: () => <h3>Recent activity</h3>,
  renderEmpty: () => <p>All quiet.</p>,
  renderFooter: () => <a href="/activity">View all</a>,
};

describe("composition/slots-over-config", () => {
  it("Bad renders heading, items and footer when there are events", () => {
    render(
      <ActivityFeed
        events={[{ id: "e-1", message: "Order SO-812 shipped" }]}
        {...feedConfig}
      />,
    );
    expect(screen.getByText("Recent activity")).toBeDefined();
    expect(screen.getByText("Order SO-812 shipped")).toBeDefined();
    expect(screen.getByText("View all")).toBeDefined();
  });

  it("Bad renders the empty state without events", () => {
    render(<ActivityFeed events={[]} {...feedConfig} />);
    expect(screen.getByText("All quiet.")).toBeDefined();
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("Good renders tags, or the empty label", () => {
    render(<TagList tags={["oak", "walnut"]} emptyLabel="No materials" />);
    expect(screen.getByText("walnut")).toBeDefined();
    const { container } = render(<TagList tags={[]} emptyLabel="No materials" />);
    expect(container.textContent).toBe("No materials");
  });
});
