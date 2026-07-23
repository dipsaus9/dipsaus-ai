// Violates srp.mixed-concerns: one component owns pricing business logic
// (tiered discount + tax), an analytics side-effect, and presentation. Stays
// under every hard cap so only the SRP rule (and its med-severity corollary,
// srp.presentational) is in play.
import { useEffect, useState } from "react";

interface CartLine {
  sku: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

export function CartTotals({
  lines,
  taxRate,
  onTotalsViewed,
}: {
  lines: CartLine[];
  taxRate: number;
  onTotalsViewed: (subtotal: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const subtotal = lines.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0,
  );
  let discountRate = 0;
  if (subtotal >= 500) {
    discountRate = 0.1;
  } else if (subtotal >= 200) {
    discountRate = 0.05;
  }
  const discount = subtotal * discountRate;
  const tax = (subtotal - discount) * taxRate;
  const total = subtotal - discount + tax;

  useEffect(() => {
    onTotalsViewed(subtotal);
  }, [subtotal, onTotalsViewed]);

  return (
    <aside className="cart-totals">
      <button type="button" onClick={() => setExpanded(!expanded)}>
        {expanded ? "Hide breakdown" : "Show breakdown"}
      </button>
      {expanded && (
        <dl>
          <dt>Subtotal</dt>
          <dd>€{subtotal.toFixed(2)}</dd>
          <dt>Discount</dt>
          <dd>−€{discount.toFixed(2)}</dd>
          <dt>Tax</dt>
          <dd>€{tax.toFixed(2)}</dd>
        </dl>
      )}
      <p>Total: €{total.toFixed(2)}</p>
    </aside>
  );
}
