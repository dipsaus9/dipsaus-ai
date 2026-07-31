/**
 * Checkout review, fed by the route boundary.
 *
 * The shipping quote is server state: the route loader (or a query hook at
 * the container) owns fetching it, and this component receives the result as
 * data (state.server-fetch). The subtotal is derived from the lines during
 * render — derived values never round-trip through state and effects
 * (state.derived-effect). Inventory is consulted only through its public
 * barrel (boundary.deep-import).
 */
import { formatMoney } from "../money";
import { stockLabel } from "../inventory";

export interface CartLine {
  sku: string;
  name: string;
  unitPrice: number;
  quantity: number;
  stockLevel: number;
}

export interface ShippingQuote {
  carrier: string;
  cost: number;
}

export function CheckoutReview({
  lines,
  quote,
}: {
  lines: CartLine[];
  // Fetched by the route loader; null while the quote is in flight.
  quote: ShippingQuote | null;
}) {
  // Derived during render — one source of truth, can never go stale.
  const subtotal = lines.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0,
  );

  return (
    <section className="checkout-review">
      <h2>Review your order</h2>
      <ul className="cart-lines">
        {lines.map((line) => (
          <li key={line.sku}>
            <span className="line-name">
              {line.quantity}× {line.name}
            </span>
            <span className="line-stock">{stockLabel(line.stockLevel)}</span>
            <span className="line-price">
              {formatMoney(line.unitPrice * line.quantity)}
            </span>
          </li>
        ))}
      </ul>
      <p>Subtotal {formatMoney(subtotal)}</p>
      {quote === null ? (
        <p className="quote-pending">Fetching shipping…</p>
      ) : (
        <>
          <p>
            Shipping via {quote.carrier} {formatMoney(quote.cost)}
          </p>
          <p>Total {formatMoney(subtotal + quote.cost)}</p>
        </>
      )}
    </section>
  );
}
