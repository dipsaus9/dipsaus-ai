// Clean twin — the component function spans exactly 150 lines, sitting on the
// cap. A false-positive trap.
interface OrderDetails {
  reference: string;
  placedAt: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCompany: string;
  vatNumber: string;
  loyaltyTier: string;
  shippingStreet: string;
  shippingCity: string;
  shippingPostalCode: string;
  shippingCountry: string;
  shippingContact: string;
  shippingInstructions: string;
  paymentMethod: string;
  cardLast4: string;
  billingName: string;
  billingEmail: string;
  billingStreet: string;
  billingCountry: string;
  carrier: string;
  serviceLevel: string;
  trackingCode: string;
  estimatedDelivery: string;
  packageWeightKg: number;
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  discountAmount: number;
  currency: string;
  grandTotal: number;
}

export function OrderDetailsPanel({ order }: { order: OrderDetails }) {
  return (
    <article className="order-details">
      <header>
        <h2>Order {order.reference}</h2>
        <p>Placed {order.placedAt}</p>
      </header>
      <section>
        <h3>Customer</h3>
        <dl>
          <div className="field">
            <dt>Name</dt>
            <dd>{order.customerName}</dd>
          </div>
          <div className="field">
            <dt>Email</dt>
            <dd>{order.customerEmail}</dd>
          </div>
          <div className="field">
            <dt>Phone</dt>
            <dd>{order.customerPhone}</dd>
          </div>
          <div className="field">
            <dt>Company</dt>
            <dd>{order.customerCompany}</dd>
          </div>
          <div className="field">
            <dt>VAT number</dt>
            <dd>{order.vatNumber}</dd>
          </div>
          <div className="field">
            <dt>Loyalty tier</dt>
            <dd>{order.loyaltyTier}</dd>
          </div>
        </dl>
      </section>
      <section>
        <h3>Shipping address</h3>
        <dl>
          <div className="field">
            <dt>Street</dt>
            <dd>{order.shippingStreet}</dd>
          </div>
          <div className="field">
            <dt>City</dt>
            <dd>{order.shippingCity}</dd>
          </div>
          <div className="field">
            <dt>Postal code</dt>
            <dd>{order.shippingPostalCode}</dd>
          </div>
          <div className="field">
            <dt>Country</dt>
            <dd>{order.shippingCountry}</dd>
          </div>
          <div className="field">
            <dt>Contact</dt>
            <dd>{order.shippingContact}</dd>
          </div>
          <div className="field">
            <dt>Instructions</dt>
            <dd>{order.shippingInstructions}</dd>
          </div>
        </dl>
      </section>
      <section>
        <h3>Payment</h3>
        <dl>
          <div className="field">
            <dt>Method</dt>
            <dd>{order.paymentMethod}</dd>
          </div>
          <div className="field">
            <dt>Card</dt>
            <dd>•••• {order.cardLast4}</dd>
          </div>
          <div className="field">
            <dt>Billing name</dt>
            <dd>{order.billingName}</dd>
          </div>
          <div className="field">
            <dt>Billing email</dt>
            <dd>{order.billingEmail}</dd>
          </div>
          <div className="field">
            <dt>Billing street</dt>
            <dd>{order.billingStreet}</dd>
          </div>
          <div className="field">
            <dt>Billing country</dt>
            <dd>{order.billingCountry}</dd>
          </div>
        </dl>
      </section>
      <section>
        <h3>Delivery</h3>
        <dl>
          <div className="field">
            <dt>Carrier</dt>
            <dd>{order.carrier}</dd>
          </div>
          <div className="field">
            <dt>Service level</dt>
            <dd>{order.serviceLevel}</dd>
          </div>
          <div className="field">
            <dt>Tracking code</dt>
            <dd>{order.trackingCode}</dd>
          </div>
          <div className="field">
            <dt>Estimated delivery</dt>
            <dd>{order.estimatedDelivery}</dd>
          </div>
          <div className="field">
            <dt>Weight</dt>
            <dd>{order.packageWeightKg} kg</dd>
          </div>
        </dl>
      </section>
      <section>
        <h3>Totals</h3>
        <dl>
          <div className="field">
            <dt>Subtotal</dt>
            <dd>€{order.subtotal.toFixed(2)}</dd>
          </div>
          <div className="field">
            <dt>Shipping</dt>
            <dd>€{order.shippingCost.toFixed(2)}</dd>
          </div>
          <div className="field">
            <dt>Tax</dt>
            <dd>€{order.taxAmount.toFixed(2)}</dd>
          </div>
          <div className="field">
            <dt>Discount</dt>
            <dd>−€{order.discountAmount.toFixed(2)}</dd>
          </div>
          <div className="field">
            <dt>Currency</dt>
            <dd>{order.currency}</dd>
          </div>
        </dl>
      </section>
      <footer>
        <p>Grand total €{order.grandTotal.toFixed(2)}</p>
      </footer>
    </article>
  );
}
