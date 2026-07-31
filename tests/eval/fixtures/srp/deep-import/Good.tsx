/**
 * Order total footer for the checkout summary.
 *
 * Depends on the billing feature only through its public barrel
 * (`./billing`), never on its internal modules — the boundary rule
 * (boundary.deep-import) exists so billing can reorganise its internals
 * without breaking consumers. Tax math stays inside billing, where the
 * domain knowledge lives; this component just presents the numbers.
 */
import { calcOrderTax } from "./billing";

export function OrderTotalFooter({
  subtotal,
  region,
}: {
  subtotal: number;
  region: "eu" | "us";
}) {
  // Calling billing's public API is the sanctioned way to use another
  // feature's logic — the import path is the contract.
  const tax = calcOrderTax(subtotal, region);

  return (
    <footer className="order-total">
      <p>Subtotal €{subtotal.toFixed(2)}</p>
      <p>Tax €{tax.toFixed(2)}</p>
      <p>Due €{(subtotal + tax).toFixed(2)}</p>
    </footer>
  );
}
