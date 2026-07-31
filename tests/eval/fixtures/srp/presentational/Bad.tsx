interface Invoice {
  id: string;
  issuedAt: string;
  amount: number;
  status: "paid" | "open" | "overdue";
}

export function InvoiceHistory({ invoices }: { invoices: Invoice[] }) {
  const byYear = new Map<string, Invoice[]>();
  for (const invoice of invoices) {
    const year = invoice.issuedAt.slice(0, 4);
    const bucket = byYear.get(year) ?? [];
    bucket.push(invoice);
    byYear.set(year, bucket);
  }
  const years = [...byYear.keys()].sort((a, b) => b.localeCompare(a));
  for (const year of years) {
    byYear
      .get(year)
      ?.sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  }

  return (
    <div className="invoice-history">
      {years.map((year) => (
        <section key={year}>
          <h3>{year}</h3>
          <ul>
            {byYear.get(year)?.map((invoice) => (
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
