import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProductTile as GoodTile } from "./Good";

describe("srp/props-cap good twin", () => {
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
