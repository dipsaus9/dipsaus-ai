// Demo seam — the comfortable-collapsible and compact-headerless shapes side
// by side; the collapse callback surfaces as Demo-rendered status text.
import { useState } from "react";
import { DashboardPanel } from "./Bad";

export function DashboardPanelsDemo() {
  const [collapseState, setCollapseState] = useState("");

  return (
    <div>
      <DashboardPanel
        title="Open orders"
        subtitle="Updated every minute"
        bodyText="14 orders waiting for picking."
        footerNote="Utrecht DC"
        showHeader={true}
        showFooter={true}
        collapsible={true}
        density="comfortable"
        onToggleCollapse={(collapsed) =>
          setCollapseState(collapsed ? "collapsed" : "expanded")
        }
      />
      <DashboardPanel
        title="Picking errors"
        subtitle=""
        bodyText="No picking errors today."
        footerNote=""
        showHeader={false}
        showFooter={false}
        collapsible={false}
        density="compact"
        onToggleCollapse={() => {}}
      />
      <p role="status">{collapseState}</p>
    </div>
  );
}
