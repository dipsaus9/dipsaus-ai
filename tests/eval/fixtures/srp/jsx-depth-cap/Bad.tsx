// Violates srp.jsx-depth-cap: element nesting reaches depth 6
// (section > div > ul > li > div > span). Everything else within limits.
interface TeamMember {
  id: string;
  name: string;
  role: string;
}

export function TeamDirectory({ members }: { members: TeamMember[] }) {
  return (
    <section>
      <div className="directory">
        <ul>
          {members.map((member) => (
            <li key={member.id}>
              <div className="member-row">
                <span className="member-name">{member.name}</span>
                <span className="member-role">{member.role}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
