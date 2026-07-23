// Violates state.global-discipline: a module-level global store (hand-rolled,
// stand-in for zustand & co) holds filtersPanelOpen — UI state used by exactly
// one component. Local useState would do; nothing cross-cutting about it.
import { useSyncExternalStore } from "react";

type Listener = () => void;

const uiStore = {
  state: { filtersPanelOpen: false },
  listeners: new Set<Listener>(),
  setFiltersPanelOpen(open: boolean) {
    uiStore.state = { filtersPanelOpen: open };
    for (const listener of uiStore.listeners) {
      listener();
    }
  },
  subscribe(listener: Listener) {
    uiStore.listeners.add(listener);
    return () => uiStore.listeners.delete(listener);
  },
  getSnapshot() {
    return uiStore.state;
  },
};

export function resetUiStore() {
  uiStore.setFiltersPanelOpen(false);
}

export function CatalogFilters({ facets }: { facets: string[] }) {
  const { filtersPanelOpen } = useSyncExternalStore(
    uiStore.subscribe,
    uiStore.getSnapshot,
  );

  return (
    <div className="catalog-filters">
      <button
        type="button"
        onClick={() => uiStore.setFiltersPanelOpen(!filtersPanelOpen)}
      >
        {filtersPanelOpen ? "Hide filters" : "Show filters"}
      </button>
      {filtersPanelOpen && (
        <ul>
          {facets.map((facet) => (
            <li key={facet}>{facet}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
