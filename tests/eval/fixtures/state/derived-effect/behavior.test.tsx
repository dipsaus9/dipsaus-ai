import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SearchSummary as BadSummary } from "./Bad";
import { SearchSummary as GoodSummary } from "./Good";

const items = ["Oak desk", "Walnut desk", "Steel lamp"];

describe("state/derived-effect", () => {
  it("Bad counts matching products", () => {
    render(<BadSummary items={items} query="desk" />);
    expect(
      screen.getByRole("status").textContent,
    ).toBe("2 of 3 products match “desk”");
  });

  it("Good counts matching products identically", () => {
    render(<GoodSummary items={items} query="desk" />);
    expect(
      screen.getByRole("status").textContent,
    ).toBe("2 of 3 products match “desk”");
  });
});
