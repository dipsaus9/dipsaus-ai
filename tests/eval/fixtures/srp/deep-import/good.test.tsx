import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OrderTotalFooter as GoodFooter } from "./Good";

describe("srp/deep-import good twin", () => {
  it("Good shows US tax on the subtotal", () => {
    render(<GoodFooter subtotal={100} region="us" />);
    expect(screen.getByText("Tax €8.00")).toBeDefined();
    expect(screen.getByText("Due €108.00")).toBeDefined();
  });
});
