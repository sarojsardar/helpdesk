import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStats } from '../api/users';
import { useAuth } from '../context/AuthContext';

const PRIORITY_COLORS = { low: '#6c757d', medium: '#0d6efd', high: '#fd7e14', critical: '#dc3545' };
const STATUS_COLORS   = { open: '#0d6efd', in_progress: '#fd7e14', resolved: '#198754', closed: '#6c757d' };

export default function Dashboard() {
  const { user }            = useAuth();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  const prefix = user?.role === 'admin' ? '/admin' : '/staff';

  useEffect(() => {
    getStats()
      .then((res) => setData(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="loading-text">Loading…</p>;

  const { tickets, overdue, avg_resolution_hours, recent } = data;

  return (
    <div className="page">
      <h2>Dashboard — Welcome, {user?.name}</h2>

      <div className="stats-grid">
        <div className="stat-card blue"><h3>{tickets.open}</h3><p>Open Tickets</p></div>
        <div className="stat-card orange"><h3>{tickets.in_progress}</h3><p>In Progress</p></div>
        <div className="stat-card green"><h3>{tickets.resolved}</h3><p>Resolved</p></div>
        <div className="stat-card red"><h3>{tickets.critical}</h3><p>Critical</p></div>
        {overdue > 0 && (
          <div className="stat-card red"><h3>{overdue}</h3><p>Overdue (SLA)</p></div>
        )}
        {avg_resolution_hours != null && (
          <div className="stat-card blue"><h3>{avg_resolution_hours}h</h3><p>Avg Resolution</p></div>
        )}
      </div>

      <div className="recent-tickets">
        <div className="section-header">
          <h3>Recent Tickets</h3>
          <Link to={`${prefix}/tickets`}>View All →</Link>
        </div>
        <table className="table">
          <thead>
            <tr><th>#</th><th>Title</th><th>Priority</th><th>Status</th><th>Assigned</th></tr>
          </thead>
          <tbody>
            {recent.map((t) => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td><Link to={`${prefix}/tickets/${t.id}`}>{t.title}</Link></td>
                <td><span className="badge" style={{ background: PRIORITY_COLORS[t.priority] }}>{t.priority}</span></td>
                <td><span className="badge" style={{ background: STATUS_COLORS[t.status] }}>{t.status.replace('_', ' ')}</span></td>
                <td>{t.assignee?.name || 'Unassigned'}</td>
              </tr>
            ))}
            {recent.length === 0 && (
              <tr><td colSpan={5} className="empty-cell">No tickets yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
