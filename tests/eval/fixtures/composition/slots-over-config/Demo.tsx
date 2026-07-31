// Demo seam — populated and empty feed shapes rendered together, so a slots
// refactor must preserve both.
import { ActivityFeed } from "./Bad";

export function ActivityFeedsDemo() {
  return (
    <div>
      <ActivityFeed
        events={[{ id: "e-1", message: "Order SO-812 shipped" }]}
        renderHeading={() => <h3>Recent activity</h3>}
        renderEmpty={() => <p>All quiet.</p>}
        renderFooter={() => <a href="/activity">View all</a>}
      />
      <ActivityFeed
        events={[]}
        renderHeading={() => <h3>Archive</h3>}
        renderEmpty={() => <p>Nothing archived.</p>}
        renderFooter={() => <a href="/archive">Browse</a>}
      />
    </div>
  );
}
