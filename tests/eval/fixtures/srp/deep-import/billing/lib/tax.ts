// billing-internal module — outside the feature, import via ../billing (the barrel).
export function calcOrderTax(subtotal: number, region: "eu" | "us"): number {
  return region === "eu" ? subtotal * 0.21 : subtotal * 0.08;
}
