// Realistic god component. Violates several category-1 rules at once:
// srp.props-cap (7 props), srp.hooks-cap (7 hooks), srp.effects-cap
// (3 effects), srp.mixed-concerns (stats/loyalty business logic + side
// effects + presentation) and srp.jsx-depth-cap (depth 6 in the orders list).
// No boundary or state-rule violations: data arrives via props, effects sync
// outward only.
import { useEffect, useState } from "react";

interface OrderSummary {
  id: string;
  placedAt: string;
  total: number;
  status: "open" | "shipped" | "delivered";
}

interface Notification {
  id: string;
  message: string;
}

export function AccountDashboard({
  displayName,
  memberSince,
  orders,
  notifications,
  taxRate,
  refreshIntervalMs,
  onAnalyticsEvent,
}: {
  displayName: string;
  memberSince: string;
  orders: OrderSummary[];
  notifications: Notification[];
  taxRate: number;
  refreshIntervalMs: number;
  onAnalyticsEvent: (name: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<"orders" | "notifications">("orders");
  const [searchQuery, setSearchQuery] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [refreshedAt, setRefreshedAt] = useState(0);

  useEffect(() => {
    document.title = `Account — ${displayName}`;
  }, [displayName]);

  useEffect(() => {
    onAnalyticsEvent(`dashboard-tab:${activeTab}`);
  }, [activeTab, onAnalyticsEvent]);

  useEffect(() => {
    const timer = setInterval(() => {
      setRefreshedAt((ticks) => ticks + 1);
    }, refreshIntervalMs);
    return () => clearInterval(timer);
  }, [refreshIntervalMs]);

  const loyaltyYears = 2026 - Number(memberSince.slice(0, 4));
  const loyaltyScore = Math.min(100, loyaltyYears * 12 + orders.length * 3);
  const openOrders = orders.filter((order) => order.status === "open");
  const lifetimeGross = orders.reduce(
    (sum, order) => sum + order.total * (1 + taxRate),
    0,
  );
  const visibleOrders = orders.filter((order) =>
    order.id.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <main className="account-dashboard">
      <header>
        <h2>{displayName}</h2>
        <p>Loyalty score {loyaltyScore}</p>
        <p>Lifetime value €{lifetimeGross.toFixed(2)}</p>
        <p data-refresh-ticks={refreshedAt}>{openOrders.length} open orders</p>
      </header>
      <nav>
        <button type="button" onClick={() => setActiveTab("orders")}>
          Orders
        </button>
        <button type="button" onClick={() => setActiveTab("notifications")}>
          Notifications
        </button>
        <button type="button" onClick={() => setPanelOpen(!panelOpen)}>
          {panelOpen ? "Hide filters" : "Show filters"}
        </button>
      </nav>
      {panelOpen && (
        <input
          aria-label="Search orders"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      )}
      {activeTab === "orders" ? (
        <section>
          <div className="orders-panel">
            <ul>
              {visibleOrders.map((order) => (
                <li key={order.id}>
                  <div className="order-row">
                    <span className="order-id">{order.id}</span>
                    <span className="order-total">€{order.total.toFixed(2)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : (
        <section>
          <ul>
            {notifications.map((notification) => (
              <li key={notification.id}>{notification.message}</li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
