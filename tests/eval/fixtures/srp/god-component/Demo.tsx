// Demo seam — the caller the behavior tests pin. Analytics evidence renders as
// a list so tests need no spies; a refactor may split AccountDashboard however
// it likes as long as Demo is updated to keep this output.
import { useCallback, useState } from "react";
import { AccountDashboard } from "./Bad";

export function AccountDashboardDemo() {
  const [analyticsEvents, setAnalyticsEvents] = useState<string[]>([]);
  // stable identity: the dashboard's analytics effect depends on this callback,
  // and an inline arrow would re-trigger it every render
  const recordEvent = useCallback((name: string) => {
    setAnalyticsEvents((events) => [...events, name]);
  }, []);

  return (
    <div>
      <AccountDashboard
        displayName="Dennis"
        memberSince="2020-02-02"
        orders={[
          { id: "SO-1", placedAt: "2026-05-01", total: 100, status: "open" },
          { id: "SO-2", placedAt: "2026-06-12", total: 50, status: "delivered" },
        ]}
        notifications={[{ id: "n-1", message: "Your order SO-1 is being picked" }]}
        taxRate={0.21}
        refreshIntervalMs={60000}
        onAnalyticsEvent={recordEvent}
      />
      <ol aria-label="analytics">
        {analyticsEvents.map((event, index) => (
          <li key={index}>{event}</li>
        ))}
      </ol>
    </div>
  );
}
