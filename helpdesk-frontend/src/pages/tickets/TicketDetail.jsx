import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTicket, updateStatus, assignTicket, addReply, rateTicket, mergeTicket, syncTags, getTags } from '../../api/tickets';
import { getAgents } from '../../api/users';
import { useAuth } from '../../context/AuthContext';
import ActivityTimeline from '../../components/ActivityTimeline';
import FileAttachments from '../../components/FileAttachments';
import CannedResponsePicker from '../../components/CannedResponsePicker';

export default function TicketDetail() {
  const { id }          = useParams();
  const navigate        = useNavigate();
  const { user }        = useAuth();
  const [ticket, setTicket]         = useState(null);
  const [agents, setAgents]         = useState([]);
  const [allTags, setAllTags]       = useState([]);
  const [reply, setReply]           = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [rating, setRating]         = useState({ score: 0, comment: '' });
  const [mergeId, setMergeId]       = useState('');
  const [merging, setMerging]       = useState(false);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState(null);

  const load = () => {
    setError(null);
    return getTicket(id)
      .then((res) => {
        const t = res.data.data;
        setTicket(t);
        document.title = `#${t.id} ${t.title} — HelpDesk`;
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load ticket.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setLoading(true);
    load();
    if (user?.role !== 'user') {
      getAgents().then((res) => setAgents(res.data.data));
      getTags().then((res) => setAllTags(res.data.data));
    }
  }, [id]);

  const handleStatus = async (status) => { await updateStatus(id, status); load(); };
  const handleAssign = async (e)      => { await assignTicket(id, e.target.value); load(); };

  const handleTagToggle = async (tagId) => {
    const current = ticket.tags?.map((t) => t.id) || [];
    const updated = current.includes(tagId) ? current.filter((x) => x !== tagId) : [...current, tagId];
    await syncTags(id, updated);
    load();
  };

  const handleMerge = async (e) => {
    e.preventDefault();
    if (!mergeId) return;
    setMerging(true);
    try {
      await mergeTicket(id, Number(mergeId));
      setMergeId('');
      load();
    } finally {
      setMerging(false);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSubmitting(true);
    try {
      await addReply(id, { message: reply, is_internal: isInternal });
      setReply('');
      setIsInternal(false);
      load();
    } finally {
      setSubmitting(false);
    }
  };

  const handleRate = async (e) => {
    e.preventDefault();
    if (!rating.score) return;
    await rateTicket(id, rating);
    load();
  };

  if (loading) return (
    <div className="ticket-skeleton">
      {[1,2,3].map((i) => <div key={i} className="skeleton-card" style={{ marginBottom: 16 }}><div className="skeleton-line w-80" /><div className="skeleton-line w-60" /></div>)}
    </div>
  );
  if (error)   return <p className="error">{error}</p>;
  if (!ticket) return <p>Ticket not found.</p>;

  const canManage = user?.role === 'admin' || user?.role === 'staff';

  return (
    <div className="page">
      {/* Header */}
      <div className="ticket-header">
        <div className="ticket-header-top">
          <button className="btn-back" onClick={() => navigate(-1)}>← Back</button>
        </div>
        <h2>#{ticket.id} — {ticket.title}</h2>
        <div className="ticket-meta">
          <span className="badge" style={{ background: PRIORITY_COLORS[ticket.priority] }}>{ticket.priority}</span>
          <span className="badge" style={{ background: STATUS_COLORS[ticket.status] }}>{ticket.status.replace('_', ' ')}</span>
          {ticket.category && <span className="meta-tag">{ticket.category.name}</span>}
          {ticket.is_overdue  && <span className="sla-badge sla-overdue">⏰ Overdue</span>}
          {ticket.is_due_soon && <span className="sla-badge sla-soon">⚠️ Due Soon</span>}
        </div>
      </div>

      {/* Description */}
      <div className="ticket-body">
        <p>{ticket.description}</p>
        <small>Submitted by <strong>{ticket.user?.name}</strong> on {new Date(ticket.created_at).toLocaleString()}</small>
      </div>

      {/* SLA */}
      {ticket.resolution_due_at && (
        <div className={`sla-info ${ticket.is_overdue ? 'sla-info-danger' : ticket.is_due_soon ? 'sla-info-warn' : ''}`}>
          <strong>SLA Resolution Due:</strong> {new Date(ticket.resolution_due_at).toLocaleString()}
          {ticket.response_due_at && (
            <> &nbsp;|&nbsp; <strong>Response Due:</strong> {new Date(ticket.response_due_at).toLocaleString()}</>
          )}
        </div>
      )}

      {/* Merged notice */}
      {ticket.merged_into && (
        <div className="sla-info sla-info-danger">
          🔀 This ticket has been merged into <strong>Ticket #{ticket.merged_into}</strong>. It is now closed.
        </div>
      )}

      {/* Staff Controls */}
      {canManage && (
        <div className="ticket-controls">
          <div>
            <label>Status</label>
            <select value={ticket.status} onChange={(e) => handleStatus(e.target.value)}>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label>Assign To</label>
            <select value={ticket.assigned_to || ''} onChange={handleAssign}>
              <option value="">Unassigned</option>
              {agents.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.open_tickets} open)</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Tags */}
      {canManage && allTags.length > 0 && (
        <div className="ticket-tags-panel">
          <span className="ticket-tags-label">🏷 Tags:</span>
          <div className="ticket-tags-list">
            {allTags.map((tag) => {
              const active = ticket.tags?.some((t) => t.id === tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() => handleTagToggle(tag.id)}
                  className="tag-toggle-btn"
                  style={{
                    background: active ? tag.color : tag.color + '18',
                    color: active ? '#fff' : tag.color,
                    border: `1.5px solid ${tag.color}`,
                  }}
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Merge ticket (admin only) */}
      {user?.role === 'admin' && !ticket.merged_into && ticket.status !== 'closed' && (
        <div className="ticket-merge-panel">
          <span className="ticket-tags-label">🔀 Merge into ticket:</span>
          <form onSubmit={handleMerge} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="number"
              placeholder="Target ticket ID…"
              value={mergeId}
              onChange={(e) => setMergeId(e.target.value)}
              min={1}
              style={{ width: 160, padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13 }}
            />
            <button type="submit" className="btn-sm btn-danger-outline" disabled={merging || !mergeId}>
              {merging ? 'Merging…' : 'Merge'}
            </button>
          </form>
          <small style={{ color: '#94a3b8', fontSize: 12 }}>This ticket's replies will move to the target and this ticket will be closed.</small>
        </div>
      )}

      {/* Attachments */}
      <FileAttachments
        ticketId={id}
        attachments={ticket.attachments || []}
        onUpdate={load}
        canDelete={canManage || user?.id === ticket.user_id}
      />

      {/* Replies */}
      <div className="replies">
        <h3>Replies ({ticket.replies?.length || 0})</h3>
        {ticket.replies?.length === 0 && (
          <div className="empty-state-inline">💬 No replies yet. Be the first to respond.</div>
        )}
        {ticket.replies?.map((r) => (
          <div key={r.id} className={`reply ${r.is_internal ? 'internal' : ''}`}>
            <div className="reply-header">
              <div className="reply-avatar">{r.user?.name?.[0]?.toUpperCase()}</div>
              <strong>{r.user?.name}</strong>
              <span className="role-badge">{r.user?.role}</span>
              {r.is_internal && <span className="internal-badge">🔒 Internal Note</span>}
              <small>{new Date(r.created_at).toLocaleString()}</small>
            </div>
            <p>{r.message}</p>
          </div>
        ))}
      </div>

      {/* Reply Form */}
      {ticket.status !== 'closed' && (
        <form className="reply-form" onSubmit={handleReply}>
          {canManage && (
            <div className="reply-form-toolbar">
              <label className="internal-toggle">
                <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} />
                <span>Internal note (not visible to user)</span>
              </label>
              <CannedResponsePicker onSelect={(text) => setReply((prev) => prev ? prev + '\n\n' + text : text)} />
            </div>
          )}
          <textarea
            rows={4}
            placeholder={isInternal ? 'Write an internal note…' : 'Write a reply…'}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            className={isInternal ? 'reply-textarea internal-textarea' : 'reply-textarea'}
            required
          />
          <button type="submit" className={isInternal ? 'btn-warning' : 'btn-primary'} disabled={submitting}>
            {submitting ? 'Sending…' : isInternal ? '🔒 Add Internal Note' : 'Send Reply'}
          </button>
        </form>
      )}

      {/* Activity Timeline */}
      <ActivityTimeline events={ticket.events} />

      {/* Satisfaction Rating */}
      {['resolved', 'closed'].includes(ticket.status) && user?.id === ticket.user_id && (
        <div className="rating-section">
          <h3>{ticket.rating ? '⭐ Your Rating' : 'Rate this ticket'}</h3>
          {ticket.rating ? (
            <div className="rating-display">
              <div className="stars">
                {[1,2,3,4,5].map((s) => (
                  <span key={s} className={s <= ticket.rating.score ? 'star filled' : 'star'}>★</span>
                ))}
              </div>
              {ticket.rating.comment && <p className="rating-comment">{ticket.rating.comment}</p>}
            </div>
          ) : (
            <form className="rating-form" onSubmit={handleRate}>
              <div className="stars">
                {[1,2,3,4,5].map((s) => (
                  <span key={s} className={s <= rating.score ? 'star filled' : 'star'}
                    onClick={() => setRating((r) => ({ ...r, score: s }))}>★</span>
                ))}
              </div>
              <textarea rows={2} placeholder="Optional comment..."
                value={rating.comment}
                onChange={(e) => setRating((r) => ({ ...r, comment: e.target.value }))}
              />
              <button type="submit" className="btn-primary" disabled={!rating.score}>Submit Rating</button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

const PRIORITY_COLORS = { low: '#6c757d', medium: '#0d6efd', high: '#fd7e14', critical: '#dc3545' };
const STATUS_COLORS   = { open: '#0d6efd', in_progress: '#fd7e14', resolved: '#198754', closed: '#6c757d' };
