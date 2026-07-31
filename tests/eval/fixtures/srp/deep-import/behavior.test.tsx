import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OrderTotalFooter as BadFooter } from "./Bad";

describe("srp/deep-import", () => {
  it("Bad shows EU tax on the subtotal", () => {
    render(<BadFooter subtotal={100} region="eu" />);
    expect(screen.getByText("Tax €21.00")).toBeDefined();
    expect(screen.getByText("Due €121.00")).toBeDefined();
  });
});
