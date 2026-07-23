// Violates state.colocate: the page owns messageDraft purely to thread it
// into MessageComposer. The page never reads the draft — submission flows
// through onSend from the composer — so the state belongs inside the composer.
import { useState } from "react";

export function MessageComposer({
  draft,
  onDraftChange,
  onSend,
}: {
  draft: string;
  onDraftChange: (draft: string) => void;
  onSend: (message: string) => void;
}) {
  return (
    <div className="composer">
      <textarea
        aria-label="Message"
        value={draft}
        onChange={(e) => onDraftChange(e.target.value)}
      />
      <button type="button" onClick={() => onSend(draft)}>
        Send
      </button>
    </div>
  );
}

export function SupportPage({ onSend }: { onSend: (message: string) => void }) {
  const [messageDraft, setMessageDraft] = useState("");

  return (
    <main className="support-page">
      <h2>Contact support</h2>
      <MessageComposer
        draft={messageDraft}
        onDraftChange={setMessageDraft}
        onSend={onSend}
      />
    </main>
  );
}
