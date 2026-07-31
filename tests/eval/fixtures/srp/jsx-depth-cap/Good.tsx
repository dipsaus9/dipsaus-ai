/**
 * Team directory with a client-side filter.
 *
 * The markup tops out at nesting depth five (section > ul > li > div > span),
 * the deepest the depth budget allows (srp.jsx-depth-cap). The filter input
 * and summary sit as siblings of the list instead of wrapping it in another
 * div; anything richer per row — avatars, actions, presence — would become a
 * MemberRow component rather than another wrapper.
 */
import { useState } from "react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
}

export function TeamDirectory({ members }: { members: TeamMember[] }) {
  const [query, setQuery] = useState("");
  const [sortDesc, setSortDesc] = useState(false);
  // Derived during render — filtering is not state.
  const visible = members
    .filter((member) => member.name.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) =>
      sortDesc ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name),
    );
  const roles = [...new Set(visible.map((member) => member.role))].sort((a, b) =>
    a.localeCompare(b),
  );

  return (
    <section className="directory">
      <input
        aria-label="Filter members"
        placeholder="Filter members"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button type="button" onClick={() => setSortDesc(!sortDesc)}>
        Sort {sortDesc ? "A–Z" : "Z–A"}
      </button>
      <p className="directory-summary">
        {visible.length} people · {roles.length} roles
      </p>
      {visible.length === 0 ? (
        <p className="directory-empty">Nobody matches “{query}”</p>
      ) : (
        <ul>
          {visible.map((member) => (
            <li key={member.id}>
              <div className="member-row">
                <span className="member-name">{member.name}</span>
                <span className="member-role">{member.role}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
