// Demo seam — both variant shapes rendered side by side, so a compound
// refactor must preserve each shape's output.
import { MetricCard } from "./Bad";

export function MetricCardsDemo() {
  return (
    <div>
      <MetricCard variant="kpi" label="Orders today" value={132} delta={-4} />
      <MetricCard
        variant="trend"
        label="Weekly sales"
        value={4800}
        points={[3, 5, 8]}
      />
    </div>
  );
}
