// FIXTURE (intentionally bad). Exercises: compound components — configuration
// over composition, boolean-flag soup, >6 props, regions passed as props.
// Excluded from lint + typecheck.
type CardProps = {
  title: string;
  subtitle?: string;
  avatarUrl?: string;
  showAvatar: boolean;
  showHeader: boolean;
  hideFooter: boolean;
  footerText?: string;
  actionLabel?: string;
  onAction?: () => void;
  variant: "default" | "outlined" | "elevated";
  bodyText: string;
};

export function Card({
  title,
  subtitle,
  avatarUrl,
  showAvatar,
  showHeader,
  hideFooter,
  footerText,
  actionLabel,
  onAction,
  variant,
  bodyText,
}: CardProps) {
  return (
    <div className={`card card-${variant}`}>
      {showHeader && (
        <div className="card-header">
          {showAvatar && avatarUrl && <img src={avatarUrl} alt="" />}
          <div>
            <h3>{title}</h3>
            {subtitle && <span>{subtitle}</span>}
          </div>
        </div>
      )}
      <div className="card-body">{bodyText}</div>
      {!hideFooter && (
        <div className="card-footer">
          <span>{footerText}</span>
          {actionLabel && <button onClick={onAction}>{actionLabel}</button>}
        </div>
      )}
    </div>
  );
}

// Used in two different shapes — a strong signal it should be compound.
export function Usage() {
  return (
    <>
      <Card
        title="Profile"
        subtitle="Admin"
        avatarUrl="/a.png"
        showAvatar
        showHeader
        hideFooter={false}
        footerText="Updated today"
        actionLabel="Edit"
        onAction={() => {}}
        variant="elevated"
        bodyText="..."
      />
      <Card
        title="Notice"
        showAvatar={false}
        showHeader
        hideFooter
        variant="outlined"
        bodyText="No footer here"
      />
    </>
  );
}
