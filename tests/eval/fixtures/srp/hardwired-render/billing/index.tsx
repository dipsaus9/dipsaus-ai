// Public API of the billing feature.
export function BillingSummary({ customerId }: { customerId: string }) {
  return (
    <section className="billing-summary">
      <h3>Billing</h3>
      <p>Billing summary for {customerId}</p>
    </section>
  );
}
