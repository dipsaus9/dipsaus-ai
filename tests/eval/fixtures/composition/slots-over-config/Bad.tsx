// Violates comp.slots-over-config: zero-argument render-config props
// (renderHeading / renderEmpty / renderFooter) are slots in disguise — they
// take no data from the component, so children/slots is strictly better. Item
// rendering stays internal, keeping the violation unambiguous.
import type { ReactNode } from "react";

interface ActivityEvent {
  id: string;
  message: string;
}

export function ActivityFeed({
  events,
  renderHeading,
  renderEmpty,
  renderFooter,
}: {
  events: ActivityEvent[];
  renderHeading: () => ReactNode;
  renderEmpty: () => ReactNode;
  renderFooter: () => ReactNode;
}) {
  return (
    <section className="activity-feed">
      {renderHeading()}
      {events.length === 0 ? (
        renderEmpty()
      ) : (
        <ul>
          {events.map((event) => (
            <li key={event.id}>{event.message}</li>
          ))}
        </ul>
      )}
      {renderFooter()}
    </section>
  );
}
