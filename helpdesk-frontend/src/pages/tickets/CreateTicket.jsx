import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTicket } from '../../api/tickets';
import { getCategories } from '../../api/users';
import { getTicketTemplates } from '../../api/admin';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function CreateTicket() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast    = useToast();
  const [categories, setCategories]   = useState([]);
  const [templates, setTemplates]     = useState([]);
  const [selectedTpl, setSelectedTpl] = useState(null);
  const [form, setForm]   = useState({ title: '', description: '', priority: 'medium', category_id: '' });
  const [customData, setCustomData]   = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const prefix = user?.role === 'admin' ? '/admin' : user?.role === 'staff' ? '/staff' : '/user';

  useEffect(() => {
    getCategories().then((res) => setCategories(res.data.data));
    getTicketTemplates().then((res) => setTemplates(res.data.data)).catch(() => {});
  }, []);

  const selectTemplate = (tpl) => {
    setSelectedTpl(tpl);
    setForm({
      title: '',
      description: tpl.description_template || '',
      priority: tpl.default_priority || 'medium',
      category_id: tpl.default_category_id || '',
    });
    setCustomData({});
  };

  const clearTemplate = () => {
    setSelectedTpl(null);
    setForm({ title: '', description: '', priority: 'medium', category_id: '' });
    setCustomData({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Append custom field data to description
    let finalDescription = form.description;
    if (selectedTpl?.custom_fields?.length) {
      const extras = selectedTpl.custom_fields
        .filter((f) => customData[f.label])
        .map((f) => `**${f.label}:** ${customData[f.label]}`)
        .join('\n');
      if (extras) {
        finalDescription += '\n\n---\n' + extras;
      }
    }

    try {
      const res = await createTicket({ ...form, description: finalDescription });
      toast('Ticket created successfully');
      navigate(`${prefix}/tickets/${res.data.data.id}`);
    } catch (err) {
      const errors = err.response?.data?.errors;
      setError(errors ? Object.values(errors).flat().join(' ') : 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="page">
      <h2>New Support Ticket</h2>

      {/* Template picker */}
      {templates.length > 0 && !selectedTpl && (
        <div className="template-picker">
          <p className="template-picker-label">Choose a template or start from scratch:</p>
          <div className="template-picker-grid">
            {templates.map((tpl) => (
              <button key={tpl.id} className="template-picker-card" onClick={() => selectTemplate(tpl)}>
                <span className="template-picker-icon">{tpl.icon || '📋'}</span>
                <strong>{tpl.name}</strong>
                <small>{tpl.description}</small>
              </button>
            ))}
            <button className="template-picker-card template-picker-blank" onClick={() => setSelectedTpl('blank')}>
              <span className="template-picker-icon">✏️</span>
              <strong>Blank Ticket</strong>
              <small>Start from scratch</small>
            </button>
          </div>
        </div>
      )}

      {/* Show selected template indicator */}
      {selectedTpl && selectedTpl !== 'blank' && (
        <div className="template-selected">
          <span>{selectedTpl.icon} Using template: <strong>{selectedTpl.name}</strong></span>
          <button className="btn-sm btn-outline" onClick={clearTemplate}>Change</button>
        </div>
      )}

      {/* Form (shown when template selected or no templates available) */}
      {(selectedTpl || templates.length === 0) && (
        <>
          {error && <p className="error">{error}</p>}
          <form className="form-card" onSubmit={handleSubmit}>
            <label>Title</label>
            <input type="text" required value={form.title} onChange={set('title')} placeholder="Brief description of the issue" />

            <label>Description</label>
            <textarea required rows={5} value={form.description} onChange={set('description')} placeholder="Detailed description..." />

            <label>Priority</label>
            <select value={form.priority} onChange={set('priority')}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>

            <label>Category</label>
            <select value={form.category_id} onChange={set('category_id')}>
              <option value="">Select category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            {/* Custom fields from template */}
            {selectedTpl && selectedTpl !== 'blank' && selectedTpl.custom_fields?.length > 0 && (
              <div className="template-custom-fields">
                <strong>Additional Information</strong>
                {selectedTpl.custom_fields.map((field) => (
                  <div key={field.label} className="form-field">
                    <label>{field.label}{field.required && ' *'}</label>
                    {field.type === 'textarea' ? (
                      <textarea
                        rows={3}
                        value={customData[field.label] || ''}
                        onChange={(e) => setCustomData({ ...customData, [field.label]: e.target.value })}
                        required={field.required}
                      />
                    ) : field.type === 'select' ? (
                      <select
                        value={customData[field.label] || ''}
                        onChange={(e) => setCustomData({ ...customData, [field.label]: e.target.value })}
                        required={field.required}
                      >
                        <option value="">Select…</option>
                        {(field.options || []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : field.type === 'checkbox' ? (
                      <label className="internal-toggle">
                        <input
                          type="checkbox"
                          checked={!!customData[field.label]}
                          onChange={(e) => setCustomData({ ...customData, [field.label]: e.target.checked ? 'Yes' : '' })}
                        />
                        <span>{field.label}</span>
                      </label>
                    ) : (
                      <input
                        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                        value={customData[field.label] || ''}
                        onChange={(e) => setCustomData({ ...customData, [field.label]: e.target.value })}
                        required={field.required}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="form-actions">
              <button type="button" onClick={() => navigate(-1)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
