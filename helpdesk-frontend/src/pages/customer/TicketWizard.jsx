import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createTicket } from '../../api/tickets';
import { getCategories } from '../../api/users';
import { getTicketTemplates } from '../../api/admin';
import { getKbArticles } from '../../api/kb';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const STEPS = ['category', 'suggestions', 'details', 'confirm'];

export default function TicketWizard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast    = useToast();

  const [step, setStep]               = useState(0);
  const [categories, setCategories]   = useState([]);
  const [templates, setTemplates]     = useState([]);
  const [kbResults, setKbResults]     = useState([]);
  const [kbLoading, setKbLoading]     = useState(false);
  const [form, setForm]               = useState({ title: '', description: '', priority: 'medium', category_id: '' });
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState('');

  useEffect(() => {
    getCategories().then((r) => setCategories(r.data.data));
    getTicketTemplates().then((r) => setTemplates(r.data.data)).catch(() => {});
  }, []);

  // Step 1: Select category
  const selectCategory = (catId) => {
    setForm({ ...form, category_id: catId });
    setStep(1);
    // Search KB for related articles
    const catName = categories.find((c) => String(c.id) === String(catId))?.name || '';
    if (catName) {
      setKbLoading(true);
      getKbArticles({ search: catName, per_page: 5 })
        .then((r) => setKbResults(r.data.data?.data || []))
        .catch(() => setKbResults([]))
        .finally(() => setKbLoading(false));
    } else {
      setStep(2); // Skip suggestions if no category
    }
  };

  // Step 2: KB suggestions — user can skip or find answer
  const skipSuggestions = () => setStep(2);

  // Step 3: Fill details
  const handleDetailsNext = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;
    setStep(3);
  };

  // Step 4: Confirm and submit
  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      const res = await createTicket(form);
      toast('Ticket created successfully!');
      navigate(`/user/tickets/${res.data.data.id}`);
    } catch (err) {
      const errors = err.response?.data?.errors;
      setError(errors ? Object.values(errors).flat().join(' ') : 'Failed to create ticket');
      setStep(2); // Go back to details on error
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCategory = categories.find((c) => String(c.id) === String(form.category_id));

  return (
    <div className="page">
      {/* Progress indicator */}
      <div className="wizard-progress">
        {['Select Topic', 'Suggestions', 'Details', 'Confirm'].map((label, idx) => (
          <div key={idx} className={`wizard-step ${idx <= step ? 'active' : ''} ${idx === step ? 'current' : ''}`}>
            <div className="wizard-step-num">{idx < step ? '✓' : idx + 1}</div>
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* Step 0: Category selection */}
      {step === 0 && (
        <div className="wizard-panel">
          <h2>What do you need help with?</h2>
          <p className="text-muted">Select a category that best matches your issue.</p>
          <div className="wizard-category-grid">
            {categories.map((cat) => (
              <button key={cat.id} className="wizard-category-card" onClick={() => selectCategory(cat.id)}>
                <span className="wizard-category-icon">📁</span>
                <strong>{cat.name}</strong>
              </button>
            ))}
            <button className="wizard-category-card" onClick={() => { setForm({ ...form, category_id: '' }); setStep(2); }}>
              <span className="wizard-category-icon">❓</span>
              <strong>Other / Not Sure</strong>
            </button>
          </div>

          {/* Templates shortcut */}
          {templates.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <h3 style={{ fontSize: 14, color: '#6b7280', marginBottom: 10 }}>Or use a quick template:</h3>
              <div className="template-picker-grid">
                {templates.slice(0, 4).map((tpl) => (
                  <button key={tpl.id} className="template-picker-card" onClick={() => {
                    setForm({
                      title: '',
                      description: tpl.description_template || '',
                      priority: tpl.default_priority || 'medium',
                      category_id: tpl.default_category_id || '',
                    });
                    setStep(2);
                  }}>
                    <span className="template-picker-icon">{tpl.icon || '📋'}</span>
                    <strong>{tpl.name}</strong>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 1: KB Suggestions */}
      {step === 1 && (
        <div className="wizard-panel">
          <h2>Did you find your answer?</h2>
          <p className="text-muted">These articles might help resolve your issue without waiting for support.</p>

          {kbLoading ? (
            <p className="loading-text">Searching knowledge base...</p>
          ) : kbResults.length > 0 ? (
            <div className="wizard-kb-list">
              {kbResults.map((article) => (
                <Link to={`/user/kb/${article.slug}`} key={article.id} className="wizard-kb-item" target="_blank">
                  <strong>{article.title}</strong>
                  <p>{article.excerpt || article.body?.substring(0, 100)}...</p>
                  <small>{article.view_count} views • {article.helpful_count} found helpful</small>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-muted">No related articles found.</p>
          )}

          <div className="wizard-actions">
            <button className="btn-sm btn-outline" onClick={() => setStep(0)}>← Back</button>
            <button className="btn-primary" onClick={skipSuggestions}>I still need help →</button>
          </div>
        </div>
      )}

      {/* Step 2: Ticket Details */}
      {step === 2 && (
        <div className="wizard-panel">
          <h2>Describe your issue</h2>
          {selectedCategory && <p className="text-muted">Category: <strong>{selectedCategory.name}</strong></p>}
          {error && <p className="error">{error}</p>}

          <form className="wizard-form" onSubmit={handleDetailsNext}>
            <div className="form-field">
              <label>Title *</label>
              <input
                type="text" required value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Brief summary of your issue"
              />
            </div>

            <div className="form-field">
              <label>Description *</label>
              <textarea
                rows={5} required value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Please provide details: what happened, what you expected, and any steps to reproduce..."
              />
            </div>

            <div className="form-field">
              <label>How urgent is this?</label>
              <div className="wizard-priority-options">
                {[
                  { value: 'low', label: 'Low', desc: 'Minor issue, no rush', color: '#6c757d' },
                  { value: 'medium', label: 'Medium', desc: 'Affecting my work', color: '#0d6efd' },
                  { value: 'high', label: 'High', desc: 'Blocking my work', color: '#fd7e14' },
                  { value: 'critical', label: 'Critical', desc: 'System down / emergency', color: '#dc3545' },
                ].map((p) => (
                  <button
                    key={p.value} type="button"
                    className={`wizard-priority-btn ${form.priority === p.value ? 'selected' : ''}`}
                    style={{ '--priority-color': p.color }}
                    onClick={() => setForm({ ...form, priority: p.value })}
                  >
                    <strong>{p.label}</strong>
                    <small>{p.desc}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="wizard-actions">
              <button type="button" className="btn-sm btn-outline" onClick={() => setStep(form.category_id ? 1 : 0)}>← Back</button>
              <button type="submit" className="btn-primary">Review & Submit →</button>
            </div>
          </form>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && (
        <div className="wizard-panel">
          <h2>Review Your Ticket</h2>
          <div className="wizard-review">
            <div className="wizard-review-row"><span>Category:</span><strong>{selectedCategory?.name || 'General'}</strong></div>
            <div className="wizard-review-row"><span>Title:</span><strong>{form.title}</strong></div>
            <div className="wizard-review-row"><span>Priority:</span><span className="badge" style={{ background: { low:'#6c757d', medium:'#0d6efd', high:'#fd7e14', critical:'#dc3545' }[form.priority] }}>{form.priority}</span></div>
            <div className="wizard-review-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <span>Description:</span>
              <p style={{ background: '#f8fafc', padding: 12, borderRadius: 6, width: '100%', lineHeight: 1.6 }}>{form.description}</p>
            </div>
          </div>

          <div className="wizard-actions">
            <button className="btn-sm btn-outline" onClick={() => setStep(2)}>← Edit</button>
            <button className="btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
