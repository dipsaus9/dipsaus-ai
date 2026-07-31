/**
 * Account menu label, driven by the signed-in session.
 *
 * The session (user + locale) is a genuinely app-wide concern: navigation,
 * greetings, and localisation all read it, and no single component owns it.
 * That is the case where a client-side global store is the right call
 * (state.global-discipline) — module state exposed through
 * useSyncExternalStore, holding client state only, never server-fetched
 * data or any one component's local UI state.
 */
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
