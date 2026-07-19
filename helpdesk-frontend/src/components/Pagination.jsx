export default function Pagination({ meta, onPageChange, onPerPageChange, perPage = 15 }) {
  if (!meta?.last_page) return null;

  const { current_page, last_page, total, from, to } = meta;

  const pages = buildPageRange(current_page, last_page);

  return (
    <div className="pagination-wrap">
      <span className="pagination-info">
        Showing {from}–{to} of {total}
      </span>

      <div className="pagination">
        <button
          className="page-btn"
          disabled={current_page <= 1}
          onClick={() => onPageChange(1)}
          title="First page"
        >«</button>

        <button
          className="page-btn"
          disabled={current_page <= 1}
          onClick={() => onPageChange(current_page - 1)}
        >‹ Prev</button>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="page-ellipsis">…</span>
          ) : (
            <button
              key={p}
              className={`page-btn ${p === current_page ? 'page-btn-active' : ''}`}
              onClick={() => onPageChange(p)}
            >{p}</button>
          )
        )}

        <button
          className="page-btn"
          disabled={current_page >= last_page}
          onClick={() => onPageChange(current_page + 1)}
        >Next ›</button>

        <button
          className="page-btn"
          disabled={current_page >= last_page}
          onClick={() => onPageChange(last_page)}
          title="Last page"
        >»</button>
      </div>

      {onPerPageChange && (
        <select
          className="per-page-select"
          value={perPage}
          onChange={(e) => onPerPageChange(Number(e.target.value))}
        >
          {[10, 15, 25, 50].map((n) => (
            <option key={n} value={n}>{n} / page</option>
          ))}
        </select>
      )}
    </div>
  );
}

// Build compact page range: [1, 2, '...', 8, 9, 10, '...', 19, 20]
function buildPageRange(current, last) {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);

  const pages = new Set([1, 2, current - 1, current, current + 1, last - 1, last]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= last).sort((a, b) => a - b);

  const result = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('...');
    result.push(sorted[i]);
  }
  return result;
}
