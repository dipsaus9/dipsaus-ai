// FIXTURE (intentionally bad). Exercises: feature boundaries — a `profile`
// component that knows about the `billing` feature's internals.
// Excluded from lint + typecheck.

// 1. Deep imports into another feature's internal modules (not its public API).
import { calcTax } from "@/features/billing/lib/tax";
import { INVOICE_STATUS } from "@/features/billing/constants/internal";
// 3. Cross-feature internal state/types.
import { useBillingStore } from "@/features/billing/store/billingStore";
import type { Invoice } from "@/features/billing/types/internal";
// 4. Hardwired child-feature rendering.
import { BillingInvoiceTable } from "@/features/billing/components/BillingInvoiceTable";

export function ProfileBillingPanel({ userId }: { userId: string }) {
  const invoices = useBillingStore((s) => s.invoicesByUser[userId]) ?? [];

  // 2. Embedded foreign domain logic — invoice/tax rules belong to `billing`.
  const total = invoices
    .filter((inv: Invoice) => inv.status !== INVOICE_STATUS.VOID)
    .reduce((sum: number, inv: Invoice) => sum + inv.amount + calcTax(inv.amount, inv.region), 0);

  return (
    <section className="profile-billing">
      <h3>Billing</h3>
      <p>Outstanding total: {total}</p>
      {/* hardwired billing component inside a profile component */}
      <BillingInvoiceTable invoices={invoices} />
    </section>
  );
}
