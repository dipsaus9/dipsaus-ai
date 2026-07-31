export function SidebarSection({
  filter,
  onFilterChange,
}: {
  filter: string;
  onFilterChange: (value: string) => void;
}) {
  return (
    <div className="sidebar-section">
      <h4>Search</h4>
      <FilterBar filter={filter} onFilterChange={onFilterChange} />
    </div>
  );
}

function FilterBar({
  filter,
  onFilterChange,
}: {
  filter: string;
  onFilterChange: (value: string) => void;
}) {
  return (
    <input
      aria-label="Filter tickets"
      placeholder="Filter tickets"
      value={filter}
      onChange={(e) => onFilterChange(e.target.value)}
    />
  );
}
