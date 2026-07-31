import { useEffect, useState } from "react";
import { formatMoney } from "./money";
import { stockLabel } from "./inventory/lib/stock";

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
  region,
  fetchQuote,
}: {
  lines: CartLine[];
  region: "eu" | "us";
  fetchQuote: (region: "eu" | "us") => Promise<ShippingQuote>;
}) {
  const [quote, setQuote] = useState<ShippingQuote | null>(null);
  const [subtotal, setSubtotal] = useState(0);

  useEffect(() => {
    let active = true;
    fetchQuote(region).then((incoming) => {
      if (active) {
        setQuote(incoming);
      }
    });
    return () => {
      active = false;
    };
  }, [region, fetchQuote]);

  useEffect(() => {
    setSubtotal(
      lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
    );
  }, [lines]);

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
