import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MetricCard } from "./Bad";
import { UptimeBadge } from "./Good";

// Both Bad shapes are pinned so a compound-API refactor is genuinely
// constrained to preserve each variant's output.
describe("composition/variant-compound", () => {
  it("Bad kpi shape shows the value with a signed delta", () => {
    render(<MetricCard variant="kpi" label="Orders today" value={132} delta={-4} />);
    expect(screen.getByText("Orders today")).toBeDefined();
    expect(screen.getByText("132")).toBeDefined();
    expect(screen.getByText("▼ 4%")).toBeDefined();
  });

  it("Bad trend shape lists the data points", () => {
    render(
      <MetricCard variant="trend" label="Weekly sales" value={4800} points={[3, 5, 8]} />,
    );
    expect(screen.getByText("Weekly sales")).toBeDefined();
    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      "3",
      "5",
      "8",
    ]);
  });

  it("Good renders its single shape", () => {
    render(<UptimeBadge label="API" uptimePercent={99.95} />);
    expect(screen.getByText("API: 99.95%")).toBeDefined();
  });
});
