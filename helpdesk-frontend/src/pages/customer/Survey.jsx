import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getSurvey, submitSurvey } from '../../api/customer';
import { useToast } from '../../context/ToastContext';

export default function Survey() {
  const { ticketId } = useParams();
  const navigate     = useNavigate();
  const toast        = useToast();
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    score: 0, comment: '',
    resolution_helpful: null,
    response_speed: 0,
    communication_rating: 0,
    would_recommend: null,
  });

  useEffect(() => {
    getSurvey(ticketId)
      .then((res) => {
        setData(res.data.data);
        if (res.data.data.already_rated) setSubmitted(true);
      })
      .catch(() => navigate('/user/tickets'))
      .finally(() => setLoading(false));
  }, [ticketId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.score) return;
    setSubmitting(true);
    try {
      await submitSurvey(ticketId, {
        ...form,
        resolution_helpful: form.resolution_helpful,
        response_speed: form.response_speed || null,
        communication_rating: form.communication_rating || null,
        would_recommend: form.would_recommend,
      });
      setSubmitted(true);
      toast('Thank you for your feedback!');
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to submit');
    } finally { setSubmitting(false); }
  };

  if (loading) return <p className="loading-text">Loading survey...</p>;
  if (!data) return null;

  if (submitted) {
    return (
      <div className="page">
        <div className="survey-thank-you">
          <div className="survey-thank-icon">🎉</div>
          <h2>Thank You!</h2>
          <p>Your feedback helps us improve our support quality.</p>
          {data.existing_rating && (
            <div className="survey-summary">
              <p>You rated this ticket: <strong>{'★'.repeat(data.existing_rating.score)}{'☆'.repeat(5 - data.existing_rating.score)}</strong></p>
            </div>
          )}
          <div className="resolved-btns" style={{ marginTop: 20 }}>
            <Link to="/user/tickets" className="btn-primary">Back to My Tickets</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="survey-container">
        <div className="survey-header">
          <h2>How was your experience?</h2>
          <p className="text-muted">Ticket #{data.ticket.id}: {data.ticket.title}</p>
          {data.ticket.assignee && <p className="text-muted">Handled by: {data.ticket.assignee}</p>}
        </div>

        <form className="survey-form" onSubmit={handleSubmit}>
          {/* Overall score */}
          <div className="survey-question">
            <label>Overall satisfaction *</label>
            <div className="survey-stars">
              {[1,2,3,4,5].map((s) => (
                <button key={s} type="button"
                  className={`survey-star ${s <= form.score ? 'filled' : ''}`}
                  onClick={() => setForm({ ...form, score: s })}
                >★</button>
              ))}
            </div>
            <div className="survey-star-labels">
              <span>Very Poor</span><span>Excellent</span>
            </div>
          </div>

          {/* Resolution helpful */}
          <div className="survey-question">
            <label>Was the resolution helpful to your issue?</label>
            <div className="survey-toggle-btns">
              <button type="button"
                className={`survey-toggle ${form.resolution_helpful === true ? 'active-yes' : ''}`}
                onClick={() => setForm({ ...form, resolution_helpful: true })}
              >👍 Yes</button>
              <button type="button"
                className={`survey-toggle ${form.resolution_helpful === false ? 'active-no' : ''}`}
                onClick={() => setForm({ ...form, resolution_helpful: false })}
              >👎 No</button>
            </div>
          </div>

          {/* Response speed */}
          <div className="survey-question">
            <label>How would you rate the response speed?</label>
            <div className="survey-stars small">
              {[1,2,3,4,5].map((s) => (
                <button key={s} type="button"
                  className={`survey-star small ${s <= form.response_speed ? 'filled' : ''}`}
                  onClick={() => setForm({ ...form, response_speed: s })}
                >★</button>
              ))}
            </div>
          </div>

          {/* Communication quality */}
          <div className="survey-question">
            <label>How was the communication quality?</label>
            <div className="survey-stars small">
              {[1,2,3,4,5].map((s) => (
                <button key={s} type="button"
                  className={`survey-star small ${s <= form.communication_rating ? 'filled' : ''}`}
                  onClick={() => setForm({ ...form, communication_rating: s })}
                >★</button>
              ))}
            </div>
          </div>

          {/* Would recommend */}
          <div className="survey-question">
            <label>Would you recommend our support to a colleague?</label>
            <div className="survey-toggle-btns">
              <button type="button"
                className={`survey-toggle ${form.would_recommend === true ? 'active-yes' : ''}`}
                onClick={() => setForm({ ...form, would_recommend: true })}
              >Yes, definitely</button>
              <button type="button"
                className={`survey-toggle ${form.would_recommend === false ? 'active-no' : ''}`}
                onClick={() => setForm({ ...form, would_recommend: false })}
              >Not really</button>
            </div>
          </div>

          {/* Comment */}
          <div className="survey-question">
            <label>Any additional feedback? (optional)</label>
            <textarea rows={4} value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              placeholder="Tell us what we did well or how we can improve..."
            />
          </div>

          <button type="submit" className="btn-primary survey-submit" disabled={!form.score || submitting}>
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
      </div>
    </div>
  );
}
