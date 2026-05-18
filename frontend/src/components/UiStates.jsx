export const ButtonSpinner = ({ label, loadingLabel }) => (
  <span className="d-inline-flex align-items-center justify-content-center gap-2">
    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
    {loadingLabel || label}
  </span>
);

export const EmptyState = ({ icon = "fa-receipt", title, message, action }) => (
  <div className="empty-state">
    <div className="empty-state-icon">
      <i className={`fa-solid ${icon}`} />
    </div>
    <p className="empty-state-title">{title}</p>
    {message && <p className="empty-state-copy">{message}</p>}
    {action}
  </div>
);

export const SkeletonLine = ({ width = "100%", height = 12, className = "" }) => (
  <span className={`skeleton-line ${className}`} style={{ width, height }} />
);

export const StatCardSkeleton = () => (
  <div className="theme-card p-3 h-100 skeleton-card">
    <div className="d-flex justify-content-between align-items-center mb-3">
      <SkeletonLine width="45%" />
      <SkeletonLine width={32} height={32} className="rounded-3" />
    </div>
    <SkeletonLine width="70%" height={24} />
  </div>
);

export const TransactionSkeleton = ({ rows = 4 }) => (
  <div className="d-flex flex-column">
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="theme-row d-flex align-items-center gap-3 px-3 py-3">
        <SkeletonLine width={42} height={42} className="rounded-3 flex-shrink-0" />
        <div className="flex-grow-1">
          <SkeletonLine width="46%" height={14} className="mb-2" />
          <SkeletonLine width="30%" height={10} />
        </div>
        <SkeletonLine width={72} height={16} />
      </div>
    ))}
  </div>
);

export const ChartSkeleton = ({ height = 220 }) => (
  <div className="chart-skeleton" style={{ height }}>
    <SkeletonLine width="100%" height="100%" />
  </div>
);
