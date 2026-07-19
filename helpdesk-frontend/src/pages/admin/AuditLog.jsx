import { useEffect, useState, useCallback, useRef } from 'react';
import { getAuditLog } from '../../api/users';
import Pagination from '../../components/Pagination';

const EVENT_COLORS = {
  created:        '#6366f1',
  assigned:       '#0d6efd',
  replied:        '#0891b2',
  status_changed: '#f97316',
  priority_changed:'#8b5cf6',
  escalated:      '#dc3545',
  resolved:       '#22c55e',
  closed:         '#6b7280',
  sla_breach:     '#dc3545',
  notified:       '#94a3b8',
};

const EVENT_ICONS = {
  created: '🎫', assigned: '👤', replied: '💬', status_changed: '🔄',
  priority_changed: '⚡', escalated: '🚨', resolved: '✅', closed: '🔒',
  sla_breach: '⏰', notified: '🔔',
};

export default function AuditLog() {
  const [logs, setLogs]       = useState([]);
  const [meta, setMeta]       = useState({});
  const [filters, setFilters] = useState({ type: '', ticket_id: '', per_page: 30, page: 1 });
  const [loading, setLoading] = useState(true);
  const debounceRef           = useRef(null);

  const load = useCallback(() => {
    setLoading(true);
    getAuditLog(filters)
      .then((r) => { setLogs(r.data.data.data); setMeta(r.data.data); })
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const setFilter = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value, page: 1 }));

  const handleTicketSearch = (e) => {
    const val = e.target.value;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setFilters((f) => ({ ...f, ticket_id: val, page: 1 })), 400);
  };

  const formatPayload = (payload) => {
    if (!payload) return null;
    return Object.entries(payload).map(([k, v]) => (
      <span key={k} className="audit-payload-tag">{k}: <strong>{String(v)}</strong></span>
    ));
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h2>Audit Log</h2>
        <span className="meta-count">{meta.total ?? 0} events</span>
      </div>

      <div className="filters">
        <select value={filters.type} onChange={setFilter('type')}>
          <option value="">All Events</option>
          {Object.keys(EVENT_COLORS).map((t) => (
            <option key={t} value={t}>{t.replace('_', ' ')}</option>
          ))}
        </select>
        <input placeholder="Filter by ticket ID…" onChange={handleTicketSearch} className="filter-search" style={{ width: 180 }} />
      </div>

      {loading ? <p className="loading-text">Loading…</p> : (
        <div className="admin-card">
          <div className="audit-list">
            {logs.length === 0 && <div className="admin-empty">No audit events found.</div>}
            {logs.map((log) => (
              <div key={log.id} className="audit-item">
                <div className="audit-icon" style={{ background: (EVENT_COLORS[log.type] || '#6b7280') + '20', color: EVENT_COLORS[log.type] || '#6b7280' }}>
                  {EVENT_ICONS[log.type] || '📋'}
                </div>
                <div className="audit-body">
                  <div className="audit-header">
                    <span className="audit-type" style={{ color: EVENT_COLORS[log.type] || '#6b7280' }}>
                      {log.type.replace(/_/g, ' ')}
                    </span>
                    {log.ticket && <span className="audit-ticket">Ticket #{log.ticket.id} — {log.ticket.title}</span>}
                  </div>
                  <div className="audit-meta">
                    {log.user ? <span className="timeline-actor">{log.user.name} ({log.user.role})</span> : <span className="text-muted">System</span>}
                    <span className="timeline-time">{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                  {log.payload && <div className="audit-payload">{formatPayload(log.payload)}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Pagination
        meta={meta}
        perPage={filters.per_page}
        onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
        onPerPageChange={(n) => setFilters((f) => ({ ...f, per_page: n, page: 1 }))}
      />
    </div>
  );
}
