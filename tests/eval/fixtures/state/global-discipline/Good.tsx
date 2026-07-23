// Clean twin — the same hand-rolled store shape, but holding the signed-in
// session (user + locale): a genuinely cross-cutting client concern that many
// unrelated components read. Legitimate global state; a false-positive trap
// for "any module store is a violation".
import { useSyncExternalStore } from "react";

type Listener = () => void;

interface Session {
  userName: string;
  locale: string;
}

const sessionStore = {
  state: { userName: "anonymous", locale: "en" } as Session,
  listeners: new Set<Listener>(),
  signIn(session: Session) {
    sessionStore.state = session;
    for (const listener of sessionStore.listeners) {
      listener();
    }
  },
  subscribe(listener: Listener) {
    sessionStore.listeners.add(listener);
    return () => sessionStore.listeners.delete(listener);
  },
  getSnapshot() {
    return sessionStore.state;
  },
};

export function signIn(session: Session) {
  sessionStore.signIn(session);
}

export function AccountMenuLabel() {
  const session = useSyncExternalStore(
    sessionStore.subscribe,
    sessionStore.getSnapshot,
  );

  return (
    <span className="account-menu" lang={session.locale}>
      {session.userName}
    </span>
  );
}
