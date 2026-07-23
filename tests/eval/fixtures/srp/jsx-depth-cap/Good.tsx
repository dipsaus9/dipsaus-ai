// Clean twin — nesting is exactly depth 5 (section > ul > li > div > span),
// sitting on the cap. A false-positive trap.
interface TeamMember {
  id: string;
  name: string;
  role: string;
}

export function TeamDirectory({ members }: { members: TeamMember[] }) {
  return (
    <section className="directory">
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
    </section>
  );
}
