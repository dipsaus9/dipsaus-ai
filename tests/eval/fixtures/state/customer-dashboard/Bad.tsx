// Realistic multi-violation component. Violates at once:
// state.server-fetch (manual useEffect+useState fetch in the component),
// state.derived-effect (lifetimeValue mirrored into state from orders),
// state.prop-drilling (customerId + onContactSupport threaded through two
// silent intermediates down to SupportLink). Hooks (5) and effects (2) sit
// exactly on their caps, so no category-1 rule co-triggers mechanically —
// though the fetch+logic+presentation mix plausibly reads as mixed concerns.
import { useEffect, useState } from "react";

interface Order {
  id: string;
  total: number;
}

function SupportLink({
  customerId,
  onContactSupport,
}: {
  customerId: string;
  onContactSupport: (customerId: string) => void;
}) {
  return (
    <button type="button" onClick={() => onContactSupport(customerId)}>
      Contact support
    </button>
  );
}

function OrdersSection({
  orders,
  customerId,
  onContactSupport,
}: {
  orders: Order[];
  customerId: string;
  onContactSupport: (customerId: string) => void;
}) {
  return (
    <section className="orders">
      <ul>
        {orders.map((order) => (
          <li key={order.id}>
            {order.id} — €{order.total.toFixed(2)}
          </li>
        ))}
      </ul>
      <SupportLink customerId={customerId} onContactSupport={onContactSupport} />
    </section>
  );
}

function DashboardBody({
  orders,
  customerId,
  onContactSupport,
}: {
  orders: Order[];
  customerId: string;
  onContactSupport: (customerId: string) => void;
}) {
  return (
    <div className="dashboard-body">
      <OrdersSection
        orders={orders}
        customerId={customerId}
        onContactSupport={onContactSupport}
      />
    </div>
  );
}

export function CustomerDashboard({
  customerId,
  api,
  onContactSupport,
}: {
  customerId: string;
  api: { getOrders: (customerId: string) => Promise<Order[]> };
  onContactSupport: (customerId: string) => void;
}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [lifetimeValue, setLifetimeValue] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api.getOrders(customerId).then((result) => {
      if (!cancelled) {
        setOrders(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [customerId, api]);

  useEffect(() => {
    setLifetimeValue(orders.reduce((sum, order) => sum + order.total, 0));
  }, [orders]);

  if (loading) {
    return <p>Loading dashboard…</p>;
  }
  return (
    <main className="customer-dashboard">
      <h2>Customer {customerId}</h2>
      <p>Lifetime value €{lifetimeValue.toFixed(2)}</p>
      <DashboardBody
        orders={orders}
        customerId={customerId}
        onContactSupport={onContactSupport}
      />
    </main>
  );
}
