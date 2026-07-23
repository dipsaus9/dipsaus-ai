// Clean twin — uses billing's public barrel. Importing another feature's
// public API is allowed; a false-positive trap for over-eager boundary checks.
import { calcOrderTax } from "./billing";

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
