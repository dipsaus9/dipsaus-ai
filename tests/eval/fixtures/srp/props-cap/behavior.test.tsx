import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProductTile as BadTile } from "./Bad";
import { ProductTile as GoodTile } from "./Good";

describe("srp/props-cap", () => {
  it("Bad renders product data including the rating", () => {
    render(
      <BadTile
        id="p-201"
        title="Walnut desk organiser"
        price={34.5}
        currency="€"
        imageUrl="/img/p-201.jpg"
        rating={4.6}
        inStock={true}
      />,
    );
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
    expect(screen.getByText("Walnut desk organiser")).toBeDefined();
    expect(screen.getByText("Sold out")).toBeDefined();
  });
});
