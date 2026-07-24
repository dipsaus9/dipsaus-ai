import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ArticleCardDemo } from "./Demo";
import { ArticleByline } from "./Good";

describe("composition/regions-as-slots", () => {
  it("Demo renders every region and surfaces the action", () => {
    render(<ArticleCardDemo />);
    expect(screen.getByText("Choosing a standing desk")).toBeDefined();
    expect(screen.getByText("Height range matters more than motor speed.")).toBeDefined();
    expect(screen.getByText("Updated July 2026")).toBeDefined();
    fireEvent.click(screen.getByText("Read guide"));
    expect(screen.getByRole("status").textContent).toBe("cta-clicked");
  });

  it("Good renders the byline", () => {
    render(
      <ArticleByline author="Sanne Bakker" publishedAt="2026-07-12" readMinutes={6} />,
    );
    expect(
      screen.getByText("By Sanne Bakker · 2026-07-12 · 6 min read"),
    ).toBeDefined();
  });
});
