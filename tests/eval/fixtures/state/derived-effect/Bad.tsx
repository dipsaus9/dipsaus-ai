// Violates state.derived-effect: matchCount mirrors props (items × query)
// via useEffect + useState instead of being computed during render.
import { useEffect, useState } from "react";

export function SearchSummary({
  items,
  query,
}: {
  items: string[];
  query: string;
}) {
  const [matchCount, setMatchCount] = useState(0);

  useEffect(() => {
    setMatchCount(
      items.filter((item) => item.toLowerCase().includes(query.toLowerCase()))
        .length,
    );
  }, [items, query]);

  return (
    <p role="status">
      {matchCount} of {items.length} products match “{query}”
    </p>
  );
}
