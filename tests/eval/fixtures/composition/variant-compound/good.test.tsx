import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UptimeBadge } from "./Good";

describe("composition/variant-compound good twin", () => {
  it("Good renders its single shape", () => {
    render(<UptimeBadge label="API" uptimePercent={99.95} />);
    expect(screen.getByText("API: 99.95%")).toBeDefined();
  });
});
