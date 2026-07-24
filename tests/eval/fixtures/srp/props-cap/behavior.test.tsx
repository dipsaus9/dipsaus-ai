import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProductTileDemo } from "./Demo";
import { ProductTile as GoodTile } from "./Good";

// The bad fixture is asserted through its Demo seam only — the refactor may
// change ProductTile's API, but Demo's rendered output must survive.
describe("srp/props-cap", () => {
  it("Demo renders the full product tile", () => {
    render(<ProductTileDemo />);
    expect(screen.getByText("Walnut desk organiser")).toBeDefined();
    expect(screen.getByText("Rated 4.6 / 5")).toBeDefined();
    expect(screen.getByText("In stock")).toBeDefined();
  });

  it("Good renders product data", () => {
    render(
      <GoodTile
        id="p-201"
        title="Walnut desk organiser"
        price={34.5}
        currency="€"
        imageUrl="/img/p-201.jpg"
        inStock={false}
      />,
    );
    expect(screen.getByText("Sold out")).toBeDefined();
  });
});
