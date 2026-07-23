// Violates state.server-fetch: server state fetched with a manual
// useEffect + useState pair, inside a leaf component instead of at a
// route/container boundary. The api client is injected so tests stay
// offline — the anti-pattern is the effect/state plumbing, not the transport.
import { useEffect, useState } from "react";

interface Order {
  id: string;
  total: number;
}

export function CustomerOrdersPanel({
  customerId,
  api,
}: {
  customerId: string;
  api: { getOrders: (customerId: string) => Promise<Order[]> };
}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
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

  if (loading) {
    return <p>Loading orders…</p>;
  }
  return (
    <ul className="customer-orders">
      {orders.map((order) => (
        <li key={order.id}>
          {order.id} — €{order.total.toFixed(2)}
        </li>
      ))}
    </ul>
  );
}
