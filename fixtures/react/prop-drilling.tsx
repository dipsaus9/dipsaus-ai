// FIXTURE (intentionally bad). Exercises: prop-drilling through intermediate
// components that don't use the props. Excluded from lint + typecheck.
type User = { name: string; role: string };

// `user` is threaded through Page -> Layout -> Sidebar, only used at the leaf.
export function Page({ user }: { user: User }) {
  return <Layout user={user} />;
}

function Layout({ user }: { user: User }) {
  return (
    <div className="layout">
      <Sidebar user={user} />
      <main>content</main>
    </div>
  );
}

function Sidebar({ user }: { user: User }) {
  return (
    <aside>
      <UserBadge user={user} />
    </aside>
  );
}

function UserBadge({ user }: { user: User }) {
  return (
    <span>
      {user.name} ({user.role})
    </span>
  );
}
