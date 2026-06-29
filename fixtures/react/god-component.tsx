// FIXTURE (intentionally bad). Exercises: SRP hard caps, mixed concerns,
// manual fetch, derived state in useEffect. Excluded from lint + typecheck.
import { useEffect, useMemo, useState } from "react";

type Props = {
  userId: string;
  title: string;
  subtitle: string;
  showArchived: boolean;
  pageSize: number;
  theme: "light" | "dark";
  onSelect: (id: string) => void;
};

type Order = { id: string; total: number; status: string; createdAt: string };

export function UserDashboard({
  userId,
  title,
  subtitle,
  showArchived,
  pageSize,
  theme,
  onSelect,
}: Props) {
  // Server state fetched by hand
  const [user, setUser] = useState<{ first: string; last: string } | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");

  // Derived state synced via effect (anti-pattern)
  const [fullName, setFullName] = useState("");
  useEffect(() => {
    if (user) setFullName(user.first + " " + user.last);
  }, [user]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/users/${userId}`)
      .then((r) => r.json())
      .then((u) => setUser(u))
      .catch((e) => setError(String(e)));
  }, [userId]);

  useEffect(() => {
    fetch(`/api/users/${userId}/orders?page=${page}&size=${pageSize}`)
      .then((r) => r.json())
      .then((o) => {
        setOrders(o);
        setLoading(false);
      })
      .catch((e) => setError(String(e)));
  }, [userId, page, pageSize]);

  // Business logic inline
  const visibleOrders = useMemo(() => {
    let result = orders;
    if (!showArchived) result = result.filter((o) => o.status !== "archived");
    if (query) result = result.filter((o) => o.id.includes(query));
    return result.sort((a, b) => b.total - a.total);
  }, [orders, showArchived, query]);

  const lifetimeValue = visibleOrders.reduce((sum, o) => sum + o.total, 0);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  // Presentation, layout, and behavior all here too
  return (
    <div className={theme === "dark" ? "dash dark" : "dash"}>
      <header>
        <h1>{title}</h1>
        <h2>{subtitle}</h2>
        <p>Welcome {fullName}</p>
        <input value={query} onChange={(e) => setQuery(e.target.value)} />
      </header>
      <section>
        <p>Lifetime value: {lifetimeValue}</p>
        <ul>
          {visibleOrders.map((o) => (
            <li key={o.id}>
              <button onClick={() => onSelect(o.id)}>
                <span>{o.id}</span>
                <span>{o.total}</span>
                <span>{o.status}</span>
              </button>
            </li>
          ))}
        </ul>
        <div>
          <button onClick={() => setPage((p) => Math.max(0, p - 1))}>Prev</button>
          <span>Page {page + 1}</span>
          <button onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      </section>
    </div>
  );
}
