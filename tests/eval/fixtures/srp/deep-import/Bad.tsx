import { calcOrderTax } from "./billing/lib/tax";

const FREE_SHIPPING_THRESHOLD = 50;

function formatMoney(amount: number): string {
  return `€${amount.toFixed(2)}`;
}

interface OrderLine {
  sku: string;
  name: string;
  price: number;
}

export function OrderTotalFooter({
  lines,
  region,
  shippingCost,
  deliveryEstimate,
}: {
  lines: OrderLine[];
  region: "eu" | "us";
  shippingCost: number;
  deliveryEstimate: string;
}) {
  const subtotal = lines.reduce((sum, line) => sum + line.price, 0);
  const tax = calcOrderTax(subtotal, region);
  const freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const shipping = freeShipping ? 0 : shippingCost;

  return (
    <footer className="order-total">
      <ul className="order-lines">
        {lines.map((line) => (
          <li key={line.sku}>
            {line.name} — {formatMoney(line.price)}
          </li>
        ))}
      </ul>
      <p>Subtotal {formatMoney(subtotal)}</p>
      <p>Tax {formatMoney(tax)}</p>
      <p>
        Shipping {freeShipping ? "free" : formatMoney(shipping)}
        {!freeShipping && (
          <span className="shipping-hint">
            {" "}
            (free over {formatMoney(FREE_SHIPPING_THRESHOLD)})
          </span>
        )}
      </p>
      <p>Due {formatMoney(subtotal + tax + shipping)}</p>
      <p className="delivery-estimate">
        Estimated delivery {deliveryEstimate} (VAT included in total)
      </p>
    </footer>
  );
}
