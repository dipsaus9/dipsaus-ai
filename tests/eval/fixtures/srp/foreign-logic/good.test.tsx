import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProfileBillingCard as GoodCard } from "./Good";

describe("srp/foreign-logic good twin", () => {
  it("Good renders the amount handed to it by billing", () => {
    render(<GoodCard memberSince="2019-04-02" amountDue={114.95} />);
    expect(screen.getByText("Amount due €114.95")).toBeDefined();
  });
});
