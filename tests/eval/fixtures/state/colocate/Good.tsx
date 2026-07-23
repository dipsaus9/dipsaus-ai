// Clean twin — the genuinely-shared trap: selectedOrderId is lifted to the
// workspace because BOTH children read it (the list highlights it, the detail
// pane shows it). Lifting genuinely shared state is correct.
import { useState } from "react";

interface Order {
  id: string;
  total: number;
}

function OrderList({
  orders,
  selectedId,
  onSelect,
}: {
  orders: Order[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <ul className="order-list">
      {orders.map((order) => (
        <li key={order.id}>
          <button
            type="button"
            aria-pressed={order.id === selectedId}
            onClick={() => onSelect(order.id)}
          >
            {order.id}
          </button>
        </li>
      ))}
    </ul>
  );
}

function OrderDetail({ order }: { order: Order | null }) {
  if (!order) {
    return <p>Select an order</p>;
  }
  return (
    <section className="order-detail">
      <h3>{order.id}</h3>
      <p>Total €{order.total.toFixed(2)}</p>
    </section>
  );
}

export function OrdersWorkspace({ orders }: { orders: Order[] }) {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const selected = orders.find((order) => order.id === selectedOrderId) ?? null;

  return (
    <div className="orders-workspace">
      <OrderList
        orders={orders}
        selectedId={selectedOrderId}
        onSelect={setSelectedOrderId}
      />
      <OrderDetail order={selected} />
    </div>
  );
}
