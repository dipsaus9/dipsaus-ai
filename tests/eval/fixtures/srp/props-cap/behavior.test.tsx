import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProductTileDemo } from "./Demo";

// The bad fixture is asserted through its Demo seam only — the refactor may
// change ProductTile's API, but Demo's rendered output must survive.
describe("srp/props-cap", () => {
  it("Demo renders the full product tile", () => {
    render(<ProductTileDemo />);
    expect(screen.getByText("Walnut desk organiser")).toBeDefined();
    expect(screen.getByText("Rated 4.6 / 5")).toBeDefined();
    expect(screen.getByText("In stock")).toBeDefined();
  });
});
