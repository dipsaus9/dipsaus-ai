import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MetricCardsDemo } from "./Demo";

describe("composition/variant-compound", () => {
  it("Demo renders the kpi and trend shapes", () => {
    render(<MetricCardsDemo />);
    expect(screen.getByText("Orders today")).toBeDefined();
    expect(screen.getByText("132")).toBeDefined();
    expect(screen.getByText("▼ 4%")).toBeDefined();
    expect(screen.getByText("Weekly sales")).toBeDefined();
    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      "3",
      "5",
      "8",
    ]);
  });
});
