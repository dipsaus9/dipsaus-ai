import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SearchSummary as GoodSummary } from "./Good";

const items = ["Oak desk", "Walnut desk", "Steel lamp"];

describe("state/derived-effect good twin", () => {
  it("Good counts matching products identically", () => {
    render(<GoodSummary items={items} query="desk" />);
    expect(
      screen.getByRole("status").textContent,
    ).toBe("2 of 3 products match “desk”");
  });
});
