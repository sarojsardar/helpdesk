import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStaffDashboard, assignTicket } from '../../api/staff';
import { updateStatus } from '../../api/tickets';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const PRIORITY_COLORS = { low: '#6c757d', medium: '#0d6efd', high: '#fd7e14', critical: '#dc3545' };
const STATUS_COLORS   = { open: '#0d6efd', in_progress: '#fd7e14', resolved: '#198754', closed: '#6c757d' };

export default function StaffDashboard() {
  const { user } = useAuth();
  const toast    = useToast();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = () => {
    getStaffDashboard()
      .then((res) => setData(res.data.data))
      .catch(() => setError('Failed to load dashboard'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handlePickUp = async (ticketId) => {
    await assignTicket(ticketId, user.id);
    toast('Ticket assigned to you');
    load();
  };

  const handleQuickResolve = async (ticketId) => {
    await updateStatus(ticketId, 'resolved');
    toast('Ticket resolved');
    load();
  };

  if (loading) return <p className="loading-text">Loading dashboard...</p>;
  if (error) return <div className="page"><p className="error">{error}</p></div>;
  if (!data) return null;

  const { counts, sla_compliance, avg_resolution_hours, csat_score, overdue, my_queue, unassigned_pool, today } = data;

  return (
    <div className="page">
      <h2>My Dashboard</h2>

      {/* Personal metrics */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <h3>{(counts?.open || 0) + (counts?.in_progress || 0)}</h3>
          <p>My Active Tickets</p>
        </div>
        <div className="stat-card orange">
          <h3>{counts?.critical_active || 0}</h3>
          <p>Critical Active</p>
        </div>
        {overdue > 0 && (
          <div className="stat-card red">
            <h3>{overdue}</h3>
            <p>Overdue (SLA)</p>
          </div>
        )}
        <div className="stat-card green">
          <h3>{today?.resolved || 0}</h3>
          <p>Resolved Today</p>
        </div>
        {sla_compliance !== null && (
          <div className="stat-card" style={{ borderColor: sla_compliance >= 80 ? '#198754' : '#fd7e14' }}>
            <h3>{sla_compliance}%</h3>
            <p>SLA Compliance</p>
          </div>
        )}
        {avg_resolution_hours !== null && (
          <div className="stat-card blue">
            <h3>{avg_resolution_hours}h</h3>
            <p>Avg Resolution</p>
          </div>
        )}
        {csat_score !== null && (
          <div className="stat-card green">
            <h3>{csat_score}/5</h3>
            <p>My CSAT Score</p>
          </div>
        )}
        <div className="stat-card" style={{ borderColor: '#6366f1' }}>
          <h3>{today?.replies || 0}</h3>
          <p>Replies Today</p>
        </div>
      </div>

      {/* My Queue */}
      <div className="recent-tickets">
        <div className="section-header">
          <h3>My Queue ({my_queue?.length || 0})</h3>
          <Link to="/staff/tickets">View All →</Link>
        </div>
        <table className="table">
          <thead>
            <tr><th>#</th><th>Title</th><th>Priority</th><th>Status</th><th>SLA Due</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {my_queue?.map((t) => (
              <tr key={t.id} className={isOverdue(t) ? 'row-overdue' : ''}>
                <td>{t.id}</td>
                <td><Link to={`/staff/tickets/${t.id}`}>{t.title}</Link></td>
                <td><span className="badge" style={{ background: PRIORITY_COLORS[t.priority] }}>{t.priority}</span></td>
                <td><span className="badge" style={{ background: STATUS_COLORS[t.status] }}>{t.status.replace('_', ' ')}</span></td>
                <td className={isOverdue(t) ? 'text-danger' : ''}>
                  {t.resolution_due_at ? formatDue(t.resolution_due_at) : '—'}
                </td>
                <td className="action-cell">
                  <Link to={`/staff/tickets/${t.id}`} className="btn-sm btn-outline">Reply</Link>
                  <button className="btn-sm btn-success-outline" onClick={() => handleQuickResolve(t.id)}>Resolve</button>
                </td>
              </tr>
            ))}
            {(!my_queue || my_queue.length === 0) && (
              <tr><td colSpan={6} className="empty-cell">No active tickets in your queue. Nice work!</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Unassigned Pool */}
      {unassigned_pool?.length > 0 && (
        <div className="recent-tickets">
          <div className="section-header">
            <h3>Unassigned Tickets ({unassigned_pool.length})</h3>
          </div>
          <table className="table">
            <thead>
              <tr><th>#</th><th>Title</th><th>Priority</th><th>From</th><th>Created</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {unassigned_pool.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td><Link to={`/staff/tickets/${t.id}`}>{t.title}</Link></td>
                  <td><span className="badge" style={{ background: PRIORITY_COLORS[t.priority] }}>{t.priority}</span></td>
                  <td>{t.user?.name || '—'}</td>
                  <td>{new Date(t.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="btn-sm btn-primary" onClick={() => handlePickUp(t.id)}>Pick Up</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function isOverdue(ticket) {
  return ticket.resolution_due_at && new Date(ticket.resolution_due_at) < new Date() && !['resolved', 'closed'].includes(ticket.status);
}

function formatDue(dateStr) {
  const due = new Date(dateStr);
  const now = new Date();
  const diffMin = Math.round((due - now) / 60000);
  if (diffMin < 0) return `${Math.abs(diffMin)}m overdue`;
  if (diffMin < 60) return `${diffMin}m left`;
  if (diffMin < 1440) return `${Math.round(diffMin / 60)}h left`;
  return due.toLocaleDateString();
}
