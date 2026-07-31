/**
 * Orders workspace: list + detail, sharing a selection.
 *
 * selectedOrderId lives on the workspace because BOTH children read it —
 * the list highlights the selected row, the detail pane shows it. Lifting
 * genuinely shared state to the nearest common owner is exactly what the
 * colocation rule prescribes (state.colocate); pushing it into either child
 * would orphan the other, and pushing it higher (or into a store) would
 * widen its scope past its readers.
 */
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
  // Nearest common owner of the selection — both children consume it.
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
