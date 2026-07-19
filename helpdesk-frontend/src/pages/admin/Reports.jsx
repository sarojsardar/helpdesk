import { useEffect, useState } from 'react';
import { getStats } from '../../api/users';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, CartesianGrid, Legend,
} from 'recharts';

export default function Reports() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStats().then((r) => setData(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-loading"><div className="admin-loading-spinner" /><span>Loading reports…</span></div>;

  const { csat_trend, csat_overall, volume_trend, category_stats, agent_performance } = data;

  return (
    <div className="admin-page">
      {/* CSAT */}
      <div className="admin-charts-row">
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>CSAT Trend (last 6 months)</h3>
            {csat_overall && <span className="meta-count">Overall: ⭐ {csat_overall}/5</span>}
          </div>
          <div style={{ padding: '16px 20px' }}>
            {csat_trend?.length ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={csat_trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`${v}/5`, 'Avg Score']} />
                  <Line type="monotone" dataKey="avg_score" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <div className="admin-empty">No ratings yet.</div>}
          </div>
        </div>

        {/* Volume trend */}
        <div className="admin-card">
          <div className="admin-card-header"><h3>Ticket Volume (last 30 days)</h3></div>
          <div style={{ padding: '16px 20px' }}>
            {volume_trend?.length ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={volume_trend} barSize={8}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip labelFormatter={(d) => `Date: ${d}`} />
                  <Bar dataKey="count" fill="#6366f1" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="admin-empty">No data yet.</div>}
          </div>
        </div>
      </div>

      {/* Category heatmap */}
      <div className="admin-card">
        <div className="admin-card-header"><h3>Category Heatmap</h3></div>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Total Tickets</th>
                <th>Open / In Progress</th>
                <th>Overdue</th>
                <th>SLA Breach Rate</th>
              </tr>
            </thead>
            <tbody>
              {category_stats?.length ? category_stats.map((c) => {
                const breachRate = c.tickets_count > 0
                  ? ((c.overdue_count / c.tickets_count) * 100).toFixed(1)
                  : 0;
                return (
                  <tr key={c.id}>
                    <td><strong>{c.name}</strong></td>
                    <td>{c.tickets_count}</td>
                    <td>{c.open_count}</td>
                    <td>
                      <span style={{ color: c.overdue_count > 0 ? '#dc3545' : '#198754', fontWeight: 600 }}>
                        {c.overdue_count}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${breachRate}%`, height: '100%', background: breachRate > 20 ? '#dc3545' : '#f97316', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 12, minWidth: 36 }}>{breachRate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              }) : <tr><td colSpan={5} className="empty-cell">No categories yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Agent performance */}
      <div className="admin-card">
        <div className="admin-card-header"><h3>Agent Performance</h3></div>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Department</th>
                <th>Assigned</th>
                <th>Resolved</th>
                <th>Overdue</th>
                <th>Avg Resolution</th>
                <th>Avg Rating</th>
              </tr>
            </thead>
            <tbody>
              {agent_performance?.length ? agent_performance.map((a) => (
                <tr key={a.id}>
                  <td><strong>{a.name}</strong></td>
                  <td>{a.department || '—'}</td>
                  <td>{a.total_assigned}</td>
                  <td><span style={{ color: '#198754', fontWeight: 600 }}>{a.resolved_count}</span></td>
                  <td><span style={{ color: a.overdue_count > 0 ? '#dc3545' : '#6b7280', fontWeight: 600 }}>{a.overdue_count}</span></td>
                  <td>{a.avg_resolution_hours != null ? `${a.avg_resolution_hours}h` : '—'}</td>
                  <td>{a.avg_rating != null ? `⭐ ${a.avg_rating}` : '—'}</td>
                </tr>
              )) : <tr><td colSpan={7} className="empty-cell">No agents yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
