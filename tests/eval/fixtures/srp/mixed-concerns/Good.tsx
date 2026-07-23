// Clean twin — pricing logic lives in a custom hook; the component is
// presentational. Still has local UI state (expanded), which is fine.
import { useEffect, useState } from "react";

interface CartLine {
  sku: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

function useCartTotals(
  lines: CartLine[],
  taxRate: number,
  onTotalsViewed: (subtotal: number) => void,
) {
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

  return { subtotal, discount, tax, total };
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
  const { subtotal, discount, tax, total } = useCartTotals(
    lines,
    taxRate,
    onTotalsViewed,
  );

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
