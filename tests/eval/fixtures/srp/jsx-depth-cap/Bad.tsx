import { useState } from "react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
}

export function TeamDirectory({ members }: { members: TeamMember[] }) {
  const [query, setQuery] = useState("");
  const [sortDesc, setSortDesc] = useState(false);
  const visible = members
    .filter((member) => member.name.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) =>
      sortDesc ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name),
    );
  const roles = [...new Set(visible.map((member) => member.role))].sort((a, b) =>
    a.localeCompare(b),
  );

  return (
    <section>
      <div className="directory">
        <input
          aria-label="Filter members"
          placeholder="Filter members"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <ul className="role-chips" aria-label="Roles present">
          {roles.map((role) => (
            <li key={role}>{role}</li>
          ))}
        </ul>
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
      </div>
    </section>
  );
}
