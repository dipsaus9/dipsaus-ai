import { CheckoutReview, type CartLine, type ShippingQuote } from "./CheckoutReview";

const demoLines: CartLine[] = [
  { sku: "sku-1", name: "Standing desk", unitPrice: 400, quantity: 1, stockLevel: 8 },
  { sku: "sku-2", name: "Desk lamp", unitPrice: 50, quantity: 2, stockLevel: 3 },
];

async function demoQuoteFetcher(): Promise<ShippingQuote> {
  return { carrier: "PostNL", cost: 6.95 };
}

export function CheckoutReviewDemo() {
  return (
    <CheckoutReview lines={demoLines} region="eu" fetchQuote={demoQuoteFetcher} />
  );
}
