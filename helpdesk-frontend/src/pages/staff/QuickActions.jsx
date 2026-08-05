import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTickets } from '../../api/tickets';
import { batchReply, snoozeTicket } from '../../api/staff';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const PRIORITY_COLORS = { low: '#6c757d', medium: '#0d6efd', high: '#fd7e14', critical: '#dc3545' };

export default function QuickActions() {
  const { user } = useAuth();
  const toast    = useToast();
  const [tickets, setTickets]     = useState([]);
  const [selected, setSelected]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [message, setMessage]     = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending]     = useState(false);
  const [snoozeId, setSnoozeId]   = useState(null);
  const [snoozeDate, setSnoozeDate] = useState('');

  useEffect(() => {
    getTickets({ assigned_to: user?.id, status: 'in_progress', per_page: 50 })
      .then((res) => {
        const data = res.data.data?.data || res.data.data || [];
        setTickets(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleSelect = (id) => {
    setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  };

  const selectAll = () => {
    setSelected(selected.length === tickets.length ? [] : tickets.map((t) => t.id));
  };

  const handleBatchReply = async (e) => {
    e.preventDefault();
    if (!message.trim() || selected.length === 0) return;
    setSending(true);
    try {
      const res = await batchReply({ ticket_ids: selected, message, is_internal: isInternal });
      toast(res.data.message);
      setMessage('');
      setSelected([]);
      setIsInternal(false);
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to send');
    } finally { setSending(false); }
  };

  const handleSnooze = async (e) => {
    e.preventDefault();
    if (!snoozeId || !snoozeDate) return;
    try {
      await snoozeTicket(snoozeId, snoozeDate);
      toast('Ticket snoozed');
      setSnoozeId(null);
      setSnoozeDate('');
      // Remove from list visually
      setTickets((t) => t.filter((x) => x.id !== snoozeId));
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to snooze');
    }
  };

  if (loading) return <p className="loading-text">Loading your tickets...</p>;

  return (
    <div className="page">
      <h2>Quick Actions</h2>
      <p className="text-muted" style={{ marginBottom: 16 }}>
        Select tickets to batch reply, or snooze individual tickets to clear your queue temporarily.
      </p>

      {/* Batch reply form */}
      {selected.length > 0 && (
        <div className="quick-action-panel">
          <h3>Batch Reply to {selected.length} Ticket(s)</h3>
          <form onSubmit={handleBatchReply}>
            <div className="reply-form-toolbar">
              <label className="internal-toggle">
                <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} />
                <span>Internal note</span>
              </label>
            </div>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={isInternal ? 'Write an internal note to send to all selected tickets...' : 'Write a reply to send to all selected tickets...'}
              required
              className={isInternal ? 'reply-textarea internal-textarea' : 'reply-textarea'}
            />
            <div className="form-actions">
              <button type="button" className="btn-sm btn-outline" onClick={() => setSelected([])}>Clear Selection</button>
              <button type="submit" className={isInternal ? 'btn-sm btn-warning' : 'btn-sm btn-primary'} disabled={sending}>
                {sending ? 'Sending...' : isInternal ? 'Send Internal Note' : 'Send Reply'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Snooze modal */}
      {snoozeId && (
        <div className="quick-action-panel">
          <h3>Snooze Ticket #{snoozeId}</h3>
          <form onSubmit={handleSnooze} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div className="form-field" style={{ flex: 1 }}>
              <label>Remind me on</label>
              <input type="datetime-local" value={snoozeDate} onChange={(e) => setSnoozeDate(e.target.value)} required min={new Date().toISOString().slice(0, 16)} />
            </div>
            <button type="submit" className="btn-sm btn-primary">Snooze</button>
            <button type="button" className="btn-sm btn-outline" onClick={() => setSnoozeId(null)}>Cancel</button>
          </form>
        </div>
      )}

      {/* Ticket list */}
      <table className="table">
        <thead>
          <tr>
            <th><input type="checkbox" checked={selected.length === tickets.length && tickets.length > 0} onChange={selectAll} /></th>
            <th>#</th>
            <th>Title</th>
            <th>Priority</th>
            <th>Last Updated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t.id} className={selected.includes(t.id) ? 'row-selected' : ''}>
              <td><input type="checkbox" checked={selected.includes(t.id)} onChange={() => toggleSelect(t.id)} /></td>
              <td>{t.id}</td>
              <td><Link to={`/staff/tickets/${t.id}`}>{t.title}</Link></td>
              <td><span className="badge" style={{ background: PRIORITY_COLORS[t.priority] }}>{t.priority}</span></td>
              <td>{new Date(t.updated_at).toLocaleDateString()}</td>
              <td className="action-cell">
                <Link to={`/staff/tickets/${t.id}`} className="btn-sm btn-outline">Reply</Link>
                <button className="btn-sm btn-outline" onClick={() => setSnoozeId(t.id)} title="Snooze">💤</button>
              </td>
            </tr>
          ))}
          {tickets.length === 0 && <tr><td colSpan={6} className="empty-cell">No active tickets in your queue.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
