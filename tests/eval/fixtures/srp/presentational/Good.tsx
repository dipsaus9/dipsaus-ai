// Clean twin — grouping/sorting extracted into a hook; the component renders
// what the hook returns.
import { useMemo } from "react";

interface Invoice {
  id: string;
  issuedAt: string;
  amount: number;
  status: "paid" | "open" | "overdue";
}

function useInvoicesByYear(invoices: Invoice[]) {
  return useMemo(() => {
    const byYear = new Map<string, Invoice[]>();
    for (const invoice of invoices) {
      const year = invoice.issuedAt.slice(0, 4);
      const bucket = byYear.get(year) ?? [];
      bucket.push(invoice);
      byYear.set(year, bucket);
    }
    const years = [...byYear.keys()].sort((a, b) => b.localeCompare(a));
    return years.map((year) => ({
      year,
      invoices: (byYear.get(year) ?? []).sort((a, b) =>
        b.issuedAt.localeCompare(a.issuedAt),
      ),
    }));
  }, [invoices]);
}

export function InvoiceHistory({ invoices }: { invoices: Invoice[] }) {
  const groups = useInvoicesByYear(invoices);

  return (
    <div className="invoice-history">
      {groups.map((group) => (
        <section key={group.year}>
          <h3>{group.year}</h3>
          <ul>
            {group.invoices.map((invoice) => (
              <li key={invoice.id}>
                {invoice.id} — €{invoice.amount.toFixed(2)} ({invoice.status})
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
