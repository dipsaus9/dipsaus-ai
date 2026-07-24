// Demo seam — the caller the behavior tests pin. The CTA click surfaces as
// Demo-rendered status text, so tests need no spies and the card's API may
// change shape as long as Demo keeps this output.
import { useState } from "react";
import { ArticleCard } from "./Bad";

export function ArticleCardDemo() {
  const [status, setStatus] = useState("");

  return (
    <div>
      <ArticleCard
        kicker="Guides"
        title="Choosing a standing desk"
        body="Height range matters more than motor speed."
        footerNote="Updated July 2026"
        ctaLabel="Read guide"
        onCta={() => setStatus("cta-clicked")}
      />
      <p role="status">{status}</p>
    </div>
  );
}
