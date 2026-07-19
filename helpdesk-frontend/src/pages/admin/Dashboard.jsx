import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStats } from '../../api/users';
import { useAuth } from '../../context/AuthContext';
import { SkeletonStatCard } from '../../components/Skeleton';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, LineChart, Line, CartesianGrid,
} from 'recharts';

const PRIORITY_COLORS = { low: '#6c757d', medium: '#0d6efd', high: '#fd7e14', critical: '#dc3545' };
const STATUS_COLORS   = { open: '#3b82f6', in_progress: '#f97316', resolved: '#22c55e', closed: '#6c757d' };

export default function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStats()
      .then((res) => setData(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="admin-page">
      <div className="admin-stats">
        {[1,2,3,4].map((i) => <SkeletonStatCard key={i} />)}
      </div>
    </div>
  );

  const { tickets, users, overdue, avg_resolution_hours, recent, csat_overall, volume_trend } = data;

  const volumeChartData = (volume_trend || []).slice(-14).map((d) => ({
    date: d.date.slice(5),
    count: Number(d.count),
  }));

  const statusChartData = [
    { name: 'Open',        value: tickets.open,        color: STATUS_COLORS.open },
    { name: 'In Progress', value: tickets.in_progress, color: STATUS_COLORS.in_progress },
    { name: 'Resolved',    value: tickets.resolved,    color: STATUS_COLORS.resolved },
    { name: 'Closed',      value: tickets.closed,      color: STATUS_COLORS.closed },
  ];

  const priorityChartData = [
    { name: 'Critical', value: tickets.critical, color: PRIORITY_COLORS.critical },
    { name: 'High',     value: tickets.high,     color: PRIORITY_COLORS.high },
    { name: 'Medium',   value: tickets.medium,   color: PRIORITY_COLORS.medium },
    { name: 'Low',      value: tickets.low,      color: PRIORITY_COLORS.low },
  ];

  return (
    <div className="admin-page">
      {/* Welcome */}
      <div className="admin-welcome">
        <div>
          <h1>Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p>Here's what's happening with your helpdesk today.</p>
        </div>
        <Link to="/admin/tickets" className="btn-primary">View All Tickets</Link>
      </div>

      {/* Stat cards */}
      <div className="admin-stats">
        <div className="admin-stat-card admin-stat-blue">
          <div className="admin-stat-icon">🎫</div>
          <div className="admin-stat-body">
            <span className="admin-stat-num">{tickets.open}</span>
            <span className="admin-stat-label">Open Tickets</span>
          </div>
          <div className="admin-stat-trend">Active</div>
        </div>
        <div className="admin-stat-card admin-stat-orange">
          <div className="admin-stat-icon">⚙️</div>
          <div className="admin-stat-body">
            <span className="admin-stat-num">{tickets.in_progress}</span>
            <span className="admin-stat-label">In Progress</span>
          </div>
          <div className="admin-stat-trend">Working</div>
        </div>
        <div className="admin-stat-card admin-stat-green">
          <div className="admin-stat-icon">✅</div>
          <div className="admin-stat-body">
            <span className="admin-stat-num">{tickets.resolved}</span>
            <span className="admin-stat-label">Resolved</span>
          </div>
          <div className="admin-stat-trend">Done</div>
        </div>
        <div className="admin-stat-card admin-stat-red">
          <div className="admin-stat-icon">🚨</div>
          <div className="admin-stat-body">
            <span className="admin-stat-num">{tickets.critical}</span>
            <span className="admin-stat-label">Critical</span>
          </div>
          <div className="admin-stat-trend">Urgent</div>
        </div>
        {overdue > 0 && (
          <div className="admin-stat-card admin-stat-red">
            <div className="admin-stat-icon">⏰</div>
            <div className="admin-stat-body">
              <span className="admin-stat-num">{overdue}</span>
              <span className="admin-stat-label">Overdue</span>
            </div>
            <div className="admin-stat-trend">SLA Breach</div>
          </div>
        )}
        {avg_resolution_hours != null && (
          <div className="admin-stat-card admin-stat-blue">
            <div className="admin-stat-icon">⏱️</div>
            <div className="admin-stat-body">
              <span className="admin-stat-num">{avg_resolution_hours}h</span>
              <span className="admin-stat-label">Avg Resolution</span>
            </div>
            <div className="admin-stat-trend">SLA</div>
          </div>
        )}
        {csat_overall != null && (
          <div className="admin-stat-card admin-stat-green">
            <div className="admin-stat-icon">⭐</div>
            <div className="admin-stat-body">
              <span className="admin-stat-num">{csat_overall}</span>
              <span className="admin-stat-label">CSAT Score</span>
            </div>
            <div className="admin-stat-trend">/ 5</div>
          </div>
        )}
      </div>

      {/* Charts row */}
      <div className="admin-charts-row">
        <div className="admin-card">
          <div className="admin-card-header"><h3>Tickets by Status</h3></div>
          <div style={{ padding: '16px 20px' }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={statusChartData} barSize={36}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[4,4,0,0]}>
                  {statusChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header"><h3>Tickets by Priority</h3></div>
          <div style={{ padding: '16px 20px' }}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={priorityChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {priorityChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Volume trend */}
      {volumeChartData.length > 0 && (
        <div className="admin-card">
          <div className="admin-card-header"><h3>Ticket Volume (last 14 days)</h3></div>
          <div style={{ padding: '16px 20px' }}>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={volumeChartData} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="admin-grid-2">
        {/* Recent tickets */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>Recent Tickets</h3>
            <Link to="/admin/tickets">View all →</Link>
          </div>
          <div className="admin-ticket-list">
            {recent.length === 0 ? (
              <div className="empty-state-inline">🎫 No tickets yet</div>
            ) : recent.map((t) => (
              <Link to={`/admin/tickets/${t.id}`} key={t.id} className="admin-ticket-row">
                <div className="admin-ticket-row-left">
                  <span className="admin-ticket-id">#{t.id}</span>
                  <div>
                    <p className="admin-ticket-title">{t.title}</p>
                    <p className="admin-ticket-meta">{t.user?.name} · {new Date(t.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="admin-ticket-row-right">
                  <span className="badge" style={{ background: PRIORITY_COLORS[t.priority] }}>{t.priority}</span>
                  <span className="badge" style={{ background: STATUS_COLORS[t.status] }}>{t.status.replace('_', ' ')}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="admin-right-col">
          <div className="admin-card">
            <div className="admin-card-header">
              <h3>Users</h3>
              <Link to="/admin/users">Manage →</Link>
            </div>
            <div className="admin-user-breakdown">
              {[
                { label: 'Total', value: users.total, pct: '100%', color: '#6610f2' },
                { label: 'Staff', value: users.staff, pct: `${(users.staff / (users.total || 1) * 100).toFixed(0)}%`, color: '#0d6efd' },
                { label: 'Users', value: users.user,  pct: `${(users.user  / (users.total || 1) * 100).toFixed(0)}%`, color: '#198754' },
              ].map((row) => (
                <div key={row.label} className="admin-user-stat">
                  <div className="admin-user-stat-bar" style={{ '--pct': row.pct, '--color': row.color }} />
                  <span>{row.label}</span>
                  <strong>{row.value}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-header"><h3>Quick Actions</h3></div>
            <div className="admin-quick-actions">
              <Link to="/admin/users"      className="admin-quick-btn">👥 Manage Users</Link>
              <Link to="/admin/categories" className="admin-quick-btn">🏷 Categories</Link>
              <Link to="/admin/canned"     className="admin-quick-btn">⚡ Canned Responses</Link>
              <Link to="/admin/tickets"    className="admin-quick-btn">🎫 All Tickets</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
