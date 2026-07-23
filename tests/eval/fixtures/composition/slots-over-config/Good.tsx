// Clean twin — the empty state is a plain string prop, not render-config. Data
// props are the right tool when the caller only varies text: a false-positive
// trap for "every customisation must be a slot".
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
