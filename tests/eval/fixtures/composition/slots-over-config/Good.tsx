/**
 * Tag list with an empty-state label.
 *
 * The empty state is one line of text, so it arrives as a data prop. The
 * slots rule (comp.slots-over-config) targets render-config — thunks
 * returning JSX and flags toggling regions; a string prop for a purely
 * textual variation keeps the caller's code smaller than a slot would.
 * If callers ever need markup in the empty state, `emptyLabel` becomes a
 * ReactNode slot — an additive change.
 */
export function TagList({
  tags,
  emptyLabel,
}: {
  tags: string[];
  emptyLabel: string;
}) {
  if (tags.length === 0) {
    return <p className="tag-list-empty">{emptyLabel}</p>;
  }
  return (
    <ul className="tag-list">
      {tags.map((tag) => (
        <li key={tag}>{tag}</li>
      ))}
    </ul>
  );
}
