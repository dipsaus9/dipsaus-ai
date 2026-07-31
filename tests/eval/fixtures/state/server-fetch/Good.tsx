/**
 * Live inventory badge fed by a push subscription.
 *
 * The effect subscribes to an external push source and cleans up on unmount
 * — synchronising with an external system is exactly what useEffect is for.
 * The server-state rule (state.server-fetch) bans request/response fetching
 * via useEffect + useState, because that data belongs to a query library or
 * route loader; a live subscription has no request lifecycle to cache, so
 * this shape is correct as written.
 */
import { useEffect, useState } from "react";

export function LiveInventoryBadge({
  sku,
  subscribe,
}: {
  sku: string;
  subscribe: (sku: string, onLevel: (level: number) => void) => () => void;
}) {
  const [level, setLevel] = useState<number | null>(null);

  useEffect(() => {
    return subscribe(sku, setLevel);
  }, [sku, subscribe]);

  if (level === null) {
    return <span className="inventory-badge">…</span>;
  }
  return (
    <span className="inventory-badge">
      {level > 0 ? `${level} in stock` : "Sold out"}
    </span>
  );
}
