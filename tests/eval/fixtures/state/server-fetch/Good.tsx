// Clean twin — the false-positive trap that matters most here: an effect with
// the same useEffect + setState shape as a manual fetch, but it subscribes to
// a push source. Syncing with an external subscription is exactly what
// useEffect is for; there is no request/response server state involved.
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
