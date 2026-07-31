import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TagList } from "./Good";

describe("composition/slots-over-config good twin", () => {
  it("Good renders tags, or the empty label", () => {
    render(<TagList tags={["oak", "walnut"]} emptyLabel="No materials" />);
    expect(screen.getByText("walnut")).toBeDefined();
    const { container } = render(<TagList tags={[]} emptyLabel="No materials" />);
    expect(container.textContent).toBe("No materials");
  });
});
