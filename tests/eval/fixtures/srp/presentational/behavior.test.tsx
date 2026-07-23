import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InvoiceHistory as BadHistory } from "./Bad";
import { InvoiceHistory as GoodHistory } from "./Good";

const invoices = [
  { id: "INV-101", issuedAt: "2025-03-10", amount: 250, status: "paid" as const },
  { id: "INV-140", issuedAt: "2026-01-05", amount: 90, status: "open" as const },
  { id: "INV-118", issuedAt: "2025-11-20", amount: 60, status: "paid" as const },
];

describe("srp/presentational", () => {
  it("Bad groups invoices by year, newest year first", () => {
    render(<BadHistory invoices={invoices} />);
    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings.map((h) => h.textContent)).toEqual(["2026", "2025"]);
    expect(screen.getByText(/INV-140/)).toBeDefined();
  });

  it("Good groups invoices identically", () => {
    render(<GoodHistory invoices={invoices} />);
    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings.map((h) => h.textContent)).toEqual(["2026", "2025"]);
    expect(screen.getByText(/INV-118/)).toBeDefined();
  });
});
