import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AccountPage as GoodPage } from "./Good";

describe("state/prop-drilling good twin", () => {
  it("Good toggles the opt-in from the leaf", () => {
    render(<GoodPage />);
    fireEvent.click(screen.getByLabelText("Order updates by email"));
    expect(screen.getByRole("status").textContent).toBe("Email updates on");
  });
});
