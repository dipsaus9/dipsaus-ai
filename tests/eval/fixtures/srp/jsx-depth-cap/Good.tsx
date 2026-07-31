/**
 * Team directory list.
 *
 * The markup tops out at nesting depth five (section > ul > li > div > span),
 * the deepest the depth budget allows (srp.jsx-depth-cap). Anything richer
 * per row — avatars, actions, presence — would become a MemberRow component
 * rather than another wrapper div.
 */
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
