export function SkeletonRow({ cols = 5 }) {
  return (
    <tr className="skeleton-row">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i}><div className="skeleton-cell" /></td>
      ))}
    </tr>
  );
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-line w-40" />
      <div className="skeleton-line w-60" />
      <div className="skeleton-line w-80" />
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="admin-stat-card">
      <div className="skeleton-circle" />
      <div style={{ flex: 1 }}>
        <div className="skeleton-line w-40" style={{ height: 32, marginBottom: 8 }} />
        <div className="skeleton-line w-60" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 6 }) {
  return (
    <table className="table">
      <thead>
        <tr>{Array.from({ length: cols }).map((_, i) => <th key={i}><div className="skeleton-line w-60" /></th>)}</tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, i) => <SkeletonRow key={i} cols={cols} />)}
      </tbody>
    </table>
  );
}
