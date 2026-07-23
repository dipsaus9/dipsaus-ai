import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OrderDetailsPanel as BadPanel } from "./Bad";
import { OrderDetailsPanel as GoodPanel } from "./Good";

const order = {
  reference: "SO-88412",
  placedAt: "2026-07-01",
  customerName: "Marieke de Vries",
  customerEmail: "m.devries@example.com",
  customerPhone: "+31 6 1234 5678",
  customerCompany: "De Vries Interieur BV",
  vatNumber: "NL861234567B01",
  loyaltyTier: "Gold",
  shippingStreet: "Keizersgracht 221",
  shippingCity: "Amsterdam",
  shippingPostalCode: "1016 DV",
  shippingCountry: "Netherlands",
  shippingContact: "Marieke de Vries",
  shippingInstructions: "Ring the studio bell",
  paymentMethod: "iDEAL",
  cardLast4: "4421",
  billingName: "De Vries Interieur BV",
  billingEmail: "finance@devries-interieur.nl",
  billingStreet: "Keizersgracht 221",
  billingCountry: "Netherlands",
  carrier: "PostNL",
  serviceLevel: "Next day",
  trackingCode: "3SPOST9912345",
  estimatedDelivery: "2026-07-03",
  packageWeightKg: 12.4,
  subtotal: 1240.5,
  shippingCost: 24.95,
  taxAmount: 265.74,
  discountAmount: 62.03,
  currency: "EUR",
  salesChannel: "Web",
  salesRep: "Jos Timmermans",
  warehouse: "Utrecht DC",
  priority: "Standard",
  internalNotes: "Repeat customer",
  grandTotal: 1469.16,
};

describe("srp/loc-cap", () => {
  it("Bad renders the full order detail", () => {
    render(<BadPanel order={order} />);
    expect(screen.getByText("Order SO-88412")).toBeDefined();
    expect(screen.getByText("m.devries@example.com")).toBeDefined();
    expect(screen.getByText("3SPOST9912345")).toBeDefined();
    expect(screen.getByText("Grand total €1469.16")).toBeDefined();
  });

  it("Good renders the full order detail", () => {
    render(<GoodPanel order={order} />);
    expect(screen.getByText("Order SO-88412")).toBeDefined();
    expect(screen.getByText("Grand total €1469.16")).toBeDefined();
  });
});
