import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTickets } from '../../api/tickets';
import { getCustomerSummary } from '../../api/customer';
import { useAuth } from '../../context/AuthContext';

const STATUS_STEPS = ['open', 'in_progress', 'resolved', 'closed'];
const STATUS_LABELS = { open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed' };
const PRIORITY_COLORS = { low: '#6c757d', medium: '#0d6efd', high: '#fd7e14', critical: '#dc3545' };

export default function MyTickets() {
  const { user }             = useAuth();
  const [tickets, setTickets] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filter, setFilter]   = useState('active'); // active | resolved | all
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getTickets({ per_page: 50 }),
      getCustomerSummary(),
    ]).then(([tRes, sRes]) => {
      const data = tRes.data.data?.data || tRes.data.data || [];
      setTickets(data);
      setSummary(sRes.data.data);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = tickets.filter((t) => {
    if (filter === 'active') return ['open', 'in_progress'].includes(t.status);
    if (filter === 'resolved') return ['resolved', 'closed'].includes(t.status);
    return true;
  });

  if (loading) return <p className="loading-text">Loading your tickets...</p>;

  return (
    <div className="page">
      <div className="page-header">
        <h2>My Support Tickets</h2>
        <Link to="/user/tickets/create" className="btn-primary">+ New Ticket</Link>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="stats-grid">
          <div className="stat-card blue"><h3>{summary.counts?.total || 0}</h3><p>Total</p></div>
          <div className="stat-card orange"><h3>{(summary.counts?.open || 0) + (summary.counts?.in_progress || 0)}</h3><p>Active</p></div>
          <div className="stat-card green"><h3>{(summary.counts?.resolved || 0) + (summary.counts?.closed || 0)}</h3><p>Resolved</p></div>
          {summary.avg_resolution_hours && <div className="stat-card" style={{ borderColor: '#6366f1' }}><h3>{summary.avg_resolution_hours}h</h3><p>Avg Resolution</p></div>}
        </div>
      )}

      {/* Filter tabs */}
      <div className="kb-manage-tabs">
        <button className={filter === 'active' ? 'active' : ''} onClick={() => setFilter('active')}>Active ({tickets.filter((t) => ['open','in_progress'].includes(t.status)).length})</button>
        <button className={filter === 'resolved' ? 'active' : ''} onClick={() => setFilter('resolved')}>Resolved ({tickets.filter((t) => ['resolved','closed'].includes(t.status)).length})</button>
        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All ({tickets.length})</button>
      </div>

      {/* Ticket cards with status tracker */}
      <div className="customer-ticket-list">
        {filtered.map((ticket) => (
          <Link to={`/user/tickets/${ticket.id}`} key={ticket.id} className="customer-ticket-card">
            <div className="customer-ticket-top">
              <span className="customer-ticket-id">#{ticket.id}</span>
              <span className="badge" style={{ background: PRIORITY_COLORS[ticket.priority] }}>{ticket.priority}</span>
            </div>
            <h4 className="customer-ticket-title">{ticket.title}</h4>
            <div className="customer-ticket-meta">
              <span>{ticket.category?.name || 'General'}</span>
              <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
            </div>
            {/* Status tracker */}
            <div className="status-tracker">
              {STATUS_STEPS.map((step, idx) => {
                const currentIdx = STATUS_STEPS.indexOf(ticket.status);
                const isComplete = idx <= currentIdx;
                const isCurrent = idx === currentIdx;
                return (
                  <div key={step} className={`status-step ${isComplete ? 'complete' : ''} ${isCurrent ? 'current' : ''}`}>
                    <div className="status-step-dot" />
                    {idx < STATUS_STEPS.length - 1 && <div className="status-step-line" />}
                    <span className="status-step-label">{STATUS_LABELS[step]}</span>
                  </div>
                );
              })}
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="kb-empty">
            <p>{filter === 'active' ? 'No active tickets. Everything is resolved!' : 'No tickets found.'}</p>
            <Link to="/user/tickets/create" className="btn-primary" style={{ marginTop: 12 }}>Create a Ticket</Link>
          </div>
        )}
      </div>
    </div>
  );
}
