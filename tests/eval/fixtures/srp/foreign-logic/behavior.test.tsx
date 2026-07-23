import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProfileBillingCard as BadCard } from "./Bad";
import { ProfileBillingCard as GoodCard } from "./Good";

describe("srp/foreign-logic", () => {
  it("Bad computes amount due (5y loyalty discount + 21% VAT) itself", () => {
    // net 100 → 7 loyalty years → −5.00 → VAT 19.95 → due 114.95
    render(<BadCard memberSince="2019-04-02" outstandingNet={100} />);
    expect(screen.getByText("Amount due €114.95")).toBeDefined();
  });

  it("Good renders the amount handed to it by billing", () => {
    render(<GoodCard memberSince="2019-04-02" amountDue={114.95} />);
    expect(screen.getByText("Amount due €114.95")).toBeDefined();
  });
});
