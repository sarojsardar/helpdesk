import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTicket, addReply } from '../../api/tickets';
import { reopenTicket, followUpTicket } from '../../api/customer';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const STATUS_STEPS = ['open', 'in_progress', 'resolved', 'closed'];
const STATUS_LABELS = { open: 'Submitted', in_progress: 'Being Worked On', resolved: 'Resolved', closed: 'Closed' };

export default function TicketTracker() {
  const { id }         = useParams();
  const navigate       = useNavigate();
  const { user }       = useAuth();
  const toast          = useToast();
  const [ticket, setTicket]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [reply, setReply]           = useState('');
  const [reopenReason, setReopenReason] = useState('');
  const [followUp, setFollowUp]     = useState('');
  const [showReopen, setShowReopen] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    getTicket(id)
      .then((res) => setTicket(res.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSubmitting(true);
    try {
      await addReply(id, { message: reply });
      setReply('');
      toast('Reply sent');
      load();
    } finally { setSubmitting(false); }
  };

  const handleReopen = async (e) => {
    e.preventDefault();
    if (!reopenReason.trim()) return;
    setSubmitting(true);
    try {
      await reopenTicket(id, reopenReason);
      setReopenReason('');
      setShowReopen(false);
      toast('Ticket reopened');
      load();
    } catch (err) {
      toast(err.response?.data?.message || 'Cannot reopen ticket');
    } finally { setSubmitting(false); }
  };

  const handleFollowUp = async (e) => {
    e.preventDefault();
    if (!followUp.trim()) return;
    setSubmitting(true);
    try {
      await followUpTicket(id, followUp);
      setFollowUp('');
      setShowFollowUp(false);
      toast('Follow-up sent');
      load();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to send');
    } finally { setSubmitting(false); }
  };

  if (loading) return <p className="loading-text">Loading ticket...</p>;
  if (!ticket) return <p className="error">Ticket not found.</p>;

  const isResolved = ['resolved', 'closed'].includes(ticket.status);
  const canReopen = isResolved && ticket.resolved_at && daysSince(ticket.resolved_at) <= 7;
  const currentIdx = STATUS_STEPS.indexOf(ticket.status);

  return (
    <div className="page">
      <button className="btn-back" onClick={() => navigate(-1)}>← Back to My Tickets</button>

      {/* Header */}
      <div className="tracker-header">
        <h2>#{ticket.id} — {ticket.title}</h2>
        <div className="ticket-meta">
          <span className="badge" style={{ background: { low:'#6c757d', medium:'#0d6efd', high:'#fd7e14', critical:'#dc3545' }[ticket.priority] }}>{ticket.priority}</span>
          {ticket.category && <span className="meta-tag">{ticket.category.name}</span>}
          {ticket.assignee && <span className="meta-tag">Agent: {ticket.assignee.name}</span>}
        </div>
      </div>

      {/* Large status tracker */}
      <div className="tracker-progress">
        {STATUS_STEPS.map((step, idx) => (
          <div key={step} className={`tracker-step ${idx <= currentIdx ? 'complete' : ''} ${idx === currentIdx ? 'current' : ''}`}>
            <div className="tracker-step-circle">{idx <= currentIdx ? '✓' : idx + 1}</div>
            <span className="tracker-step-label">{STATUS_LABELS[step]}</span>
            {idx < STATUS_STEPS.length - 1 && <div className="tracker-step-connector" />}
          </div>
        ))}
      </div>

      {/* Ticket body */}
      <div className="ticket-body">
        <p>{ticket.description}</p>
        <small>Submitted on {new Date(ticket.created_at).toLocaleString()}</small>
      </div>

      {/* SLA info */}
      {ticket.resolution_due_at && !isResolved && (
        <div className={`sla-info ${new Date(ticket.resolution_due_at) < new Date() ? 'sla-info-danger' : ''}`}>
          <strong>Expected Resolution:</strong> {new Date(ticket.resolution_due_at).toLocaleString()}
        </div>
      )}

      {/* Replies */}
      <div className="replies">
        <h3>Conversation ({ticket.replies?.filter((r) => !r.is_internal).length || 0})</h3>
        {ticket.replies?.filter((r) => !r.is_internal).map((r) => (
          <div key={r.id} className={`reply ${r.user?.id === user?.id ? 'reply-mine' : ''}`}>
            <div className="reply-header">
              <div className="reply-avatar">{r.user?.name?.[0]?.toUpperCase()}</div>
              <strong>{r.user?.name}</strong>
              <span className="role-badge">{r.user?.role === 'user' ? 'You' : 'Support'}</span>
              <small>{new Date(r.created_at).toLocaleString()}</small>
            </div>
            <p>{r.message}</p>
          </div>
        ))}
      </div>

      {/* Reply form (for open tickets) */}
      {!isResolved && (
        <form className="reply-form" onSubmit={handleReply}>
          <textarea rows={3} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type your reply..." required />
          <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Sending...' : 'Send Reply'}</button>
        </form>
      )}

      {/* Actions for resolved tickets */}
      {isResolved && (
        <div className="customer-resolved-actions">
          <p className="resolved-message">This ticket has been resolved. Is there anything else we can help with?</p>
          <div className="resolved-btns">
            {canReopen && (
              <button className="btn-sm btn-danger-outline" onClick={() => setShowReopen(true)}>Reopen Ticket</button>
            )}
            <button className="btn-sm btn-outline" onClick={() => setShowFollowUp(true)}>Send Follow-up</button>
            <Link to="/user/tickets/create" className="btn-sm btn-primary">New Ticket</Link>
          </div>

          {showReopen && (
            <form className="resolved-form" onSubmit={handleReopen}>
              <label>Why are you reopening this ticket?</label>
              <textarea rows={3} value={reopenReason} onChange={(e) => setReopenReason(e.target.value)} placeholder="Please explain what's still unresolved..." required />
              <div className="form-actions">
                <button type="button" className="btn-sm btn-outline" onClick={() => setShowReopen(false)}>Cancel</button>
                <button type="submit" className="btn-sm btn-primary" disabled={submitting}>{submitting ? 'Reopening...' : 'Reopen Ticket'}</button>
              </div>
            </form>
          )}

          {showFollowUp && (
            <form className="resolved-form" onSubmit={handleFollowUp}>
              <label>Follow-up message (ticket stays resolved)</label>
              <textarea rows={3} value={followUp} onChange={(e) => setFollowUp(e.target.value)} placeholder="Add additional information or ask a related question..." required />
              <div className="form-actions">
                <button type="button" className="btn-sm btn-outline" onClick={() => setShowFollowUp(false)}>Cancel</button>
                <button type="submit" className="btn-sm btn-primary" disabled={submitting}>{submitting ? 'Sending...' : 'Send Follow-up'}</button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

function daysSince(dateStr) {
  return Math.floor((new Date() - new Date(dateStr)) / 86400000);
}
