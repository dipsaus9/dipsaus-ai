/**
 * Search result summary line.
 *
 * The match count is derived data, so it is computed during render —
 * memoised because the filter walks the list (state.derived-effect: derived
 * values never round-trip through useState + useEffect). There is exactly
 * one source of truth (items + query); the count can never be stale.
 */
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
