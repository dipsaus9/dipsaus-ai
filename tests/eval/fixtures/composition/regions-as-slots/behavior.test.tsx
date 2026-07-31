import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ArticleCardDemo } from "./Demo";

describe("composition/regions-as-slots", () => {
  it("Demo renders every region and surfaces the action", () => {
    render(<ArticleCardDemo />);
    expect(screen.getByText("Choosing a standing desk")).toBeDefined();
    expect(screen.getByText("Height range matters more than motor speed.")).toBeDefined();
    expect(screen.getByText("Updated July 2026")).toBeDefined();
    fireEvent.click(screen.getByText("Read guide"));
    expect(screen.getByRole("status").textContent).toBe("cta-clicked");
  });
});
