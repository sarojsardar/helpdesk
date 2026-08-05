import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTickets } from '../api/tickets';
import { getKbArticles } from '../api/kb';
import { useAuth } from '../context/AuthContext';

export default function UserDashboard() {
  const { user }           = useAuth();
  const [stats, setStats]  = useState(null);
  const [recent, setRecent] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getTickets({ per_page: 100 }),
      getTickets({ per_page: 5, sort_by: 'created_at', sort_dir: 'desc' }),
      getKbArticles({ per_page: 4 }).catch(() => ({ data: { data: { data: [] } } })),
    ]).then(([allRes, recentRes, kbRes]) => {
      const allTickets = allRes.data.data?.data || allRes.data.data || [];
      const recentTickets = recentRes.data.data?.data || recentRes.data.data || [];
      setRecent(recentTickets);
      setArticles(kbRes.data.data?.data || []);

      // Calculate stats from user's tickets
      const total = allTickets.length;
      const open = allTickets.filter((t) => t.status === 'open').length;
      const inProgress = allTickets.filter((t) => t.status === 'in_progress').length;
      const resolved = allTickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length;
      const critical = allTickets.filter((t) => t.priority === 'critical' && t.status !== 'closed' && t.status !== 'resolved').length;

      setStats({ total, open, inProgress, resolved, critical });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="loading-text">Loading...</p>;

  return (
    <div className="page">
      <h2>Welcome back, {user?.name}</h2>

      {/* Quick stats */}
      <div className="stats-grid">
        <div className="stat-card blue"><h3>{stats?.total || 0}</h3><p>Total Tickets</p></div>
        <div className="stat-card orange"><h3>{stats?.open || 0}</h3><p>Open</p></div>
        <div className="stat-card green"><h3>{stats?.resolved || 0}</h3><p>Resolved</p></div>
        {stats?.critical > 0 && <div className="stat-card red"><h3>{stats.critical}</h3><p>Critical Active</p></div>}
      </div>

      {/* Quick actions */}
      <div className="user-dash-actions">
        <Link to="/user/tickets/create" className="btn-primary">+ New Ticket</Link>
        <Link to="/user/tickets" className="btn-sm btn-outline">View All Tickets</Link>
        <Link to="/user/kb" className="btn-sm btn-outline">Browse Knowledge Base</Link>
      </div>

      {/* Recent tickets */}
      <div className="recent-tickets">
        <div className="section-header">
          <h3>Your Recent Tickets</h3>
          <Link to="/user/tickets">View All →</Link>
        </div>
        <table className="table">
          <thead>
            <tr><th>#</th><th>Title</th><th>Status</th><th>Priority</th><th>Created</th></tr>
          </thead>
          <tbody>
            {recent.map((t) => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td><Link to={`/user/tickets/${t.id}`}>{t.title}</Link></td>
                <td><span className="badge" style={{ background: { open: '#0d6efd', in_progress: '#fd7e14', resolved: '#198754', closed: '#6c757d' }[t.status] }}>{t.status.replace('_', ' ')}</span></td>
                <td><span className="badge" style={{ background: { low: '#6c757d', medium: '#0d6efd', high: '#fd7e14', critical: '#dc3545' }[t.priority] }}>{t.priority}</span></td>
                <td>{new Date(t.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {recent.length === 0 && <tr><td colSpan={5} className="empty-cell">No tickets yet. Create your first one!</td></tr>}
          </tbody>
        </table>
      </div>

      {/* KB suggestions */}
      {articles.length > 0 && (
        <div className="recent-tickets">
          <div className="section-header">
            <h3>Helpful Articles</h3>
            <Link to="/user/kb">Browse All →</Link>
          </div>
          <div className="kb-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {articles.map((a) => (
              <Link to={`/user/kb/${a.slug}`} key={a.id} className="kb-card">
                <div className="kb-card-category">{a.category?.name || 'General'}</div>
                <h3 className="kb-card-title" style={{ fontSize: 14 }}>{a.title}</h3>
                <div className="kb-card-footer"><span>{a.view_count} views</span></div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
