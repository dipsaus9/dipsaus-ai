// Violates boundary.deep-import: reaches into billing's internal lib/ module
// instead of the feature's public barrel.
import { calcOrderTax } from "./billing/lib/tax";

export function OrderTotalFooter({
  subtotal,
  region,
}: {
  subtotal: number;
  region: "eu" | "us";
}) {
  const tax = calcOrderTax(subtotal, region);

  return (
    <footer className="order-total">
      <p>Subtotal €{subtotal.toFixed(2)}</p>
      <p>Tax €{tax.toFixed(2)}</p>
      <p>Due €{(subtotal + tax).toFixed(2)}</p>
    </footer>
  );
}
