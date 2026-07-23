// Clean twin — the same value computed during render, memoised. useMemo on a
// derived value is correct and must not be confused with derived state.
import { useMemo } from "react";

export function SearchSummary({
  items,
  query,
}: {
  items: string[];
  query: string;
}) {
  const matchCount = useMemo(
    () =>
      items.filter((item) => item.toLowerCase().includes(query.toLowerCase()))
        .length,
    [items, query],
  );

  return (
    <p role="status">
      {matchCount} of {items.length} products match “{query}”
    </p>
  );
}
