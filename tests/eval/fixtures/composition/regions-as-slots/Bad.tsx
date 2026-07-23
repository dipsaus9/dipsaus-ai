// Violates comp.regions-as-slots: distinct regions (header kicker/title, body,
// footer note + action) are all driven by configuration props instead of being
// exposed as slots/children. Six props, so srp.props-cap is not in play.
export function ArticleCard({
  kicker,
  title,
  body,
  footerNote,
  ctaLabel,
  onCta,
}: {
  kicker: string;
  title: string;
  body: string;
  footerNote: string;
  ctaLabel: string;
  onCta: () => void;
}) {
  return (
    <article className="article-card">
      <header>
        <p className="kicker">{kicker}</p>
        <h2>{title}</h2>
      </header>
      <p>{body}</p>
      <footer>
        <small>{footerNote}</small>
        <button type="button" onClick={onCta}>
          {ctaLabel}
        </button>
      </footer>
    </article>
  );
}
