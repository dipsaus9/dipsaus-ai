import type { ReactNode } from "react";
import { SidebarSection } from "./SidebarSection";

export function InboxLayout({
  filter,
  onFilterChange,
  children,
}: {
  filter: string;
  onFilterChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="inbox-layout">
      <aside className="inbox-sidebar">
        <SidebarSection filter={filter} onFilterChange={onFilterChange} />
      </aside>
      <main className="inbox-main">{children}</main>
    </div>
  );
}
