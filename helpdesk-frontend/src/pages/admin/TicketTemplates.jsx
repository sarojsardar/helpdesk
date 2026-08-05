import { useEffect, useState } from 'react';
import { getTicketTemplates, createTicketTemplate, updateTicketTemplate, deleteTicketTemplate } from '../../api/admin';
import { getCategories } from '../../api/users';

export default function TicketTemplates() {
  const [templates, setTemplates]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState(defaultForm());
  const [saving, setSaving]         = useState(false);

  function defaultForm() {
    return {
      name: '', description: '', icon: '📋',
      description_template: '', default_priority: 'medium',
      default_category_id: '', custom_fields: [],
      is_active: true, sort_order: 0,
    };
  }

  const load = () => {
    setLoading(true);
    Promise.all([getTicketTemplates(), getCategories()])
      .then(([tRes, cRes]) => {
        setTemplates(tRes.data.data);
        setCategories(cRes.data.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openEdit = (tpl) => {
    setEditing(tpl);
    setForm({
      name: tpl.name, description: tpl.description || '',
      icon: tpl.icon || '📋',
      description_template: tpl.description_template || '',
      default_priority: tpl.default_priority,
      default_category_id: tpl.default_category_id || '',
      custom_fields: tpl.custom_fields || [],
      is_active: tpl.is_active, sort_order: tpl.sort_order,
    });
  };

  const openNew = () => { setEditing('new'); setForm(defaultForm()); };

  const addField = () => {
    setForm({
      ...form,
      custom_fields: [...form.custom_fields, { label: '', type: 'text', required: false, options: [] }],
    });
  };

  const updateField = (idx, key, value) => {
    const fields = [...form.custom_fields];
    fields[idx] = { ...fields[idx], [key]: value };
    setForm({ ...form, custom_fields: fields });
  };

  const removeField = (idx) => {
    setForm({ ...form, custom_fields: form.custom_fields.filter((_, i) => i !== idx) });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, default_category_id: form.default_category_id || null };
    try {
      if (editing === 'new') await createTicketTemplate(payload);
      else await updateTicketTemplate(editing.id, payload);
      setEditing(null); load();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this template?')) return;
    await deleteTicketTemplate(id); load();
  };

  if (loading) return (
    <div className="admin-loading">
      <div className="admin-loading-spinner" /><span>Loading…</span>
    </div>
  );

  if (editing) {
    return (
      <div className="admin-page">
        <button className="btn-back" onClick={() => setEditing(null)}>← Back</button>
        <h2>{editing === 'new' ? 'New Template' : 'Edit Template'}</h2>
        <form className="form-card" onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: 12 }}>
            <div className="form-field">
              <label>Icon</label>
              <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} maxLength={4} style={{ textAlign: 'center', fontSize: 20 }} />
            </div>
            <div className="form-field">
              <label>Template Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Password Reset" />
            </div>
          </div>

          <label>Helper Description (shown in picker)</label>
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description of when to use this template" />

          <label>Pre-filled Description Body</label>
          <textarea rows={5} value={form.description_template} onChange={(e) => setForm({ ...form, description_template: e.target.value })} placeholder="This text will pre-fill the ticket description field..." />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-field">
              <label>Default Priority</label>
              <select value={form.default_priority} onChange={(e) => setForm({ ...form, default_priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="form-field">
              <label>Default Category</label>
              <select value={form.default_category_id} onChange={(e) => setForm({ ...form, default_category_id: e.target.value })}>
                <option value="">None</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {/* Custom fields builder */}
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16, marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <strong>Custom Fields</strong>
              <button type="button" className="btn-sm btn-outline" onClick={addField}>+ Add Field</button>
            </div>
            {form.custom_fields.map((f, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <input placeholder="Label" value={f.label} onChange={(e) => updateField(idx, 'label', e.target.value)} style={{ flex: 2 }} />
                <select value={f.type} onChange={(e) => updateField(idx, 'type', e.target.value)} style={{ flex: 1 }}>
                  <option value="text">Text</option>
                  <option value="textarea">Textarea</option>
                  <option value="select">Dropdown</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="checkbox">Checkbox</option>
                </select>
                <label style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                  <input type="checkbox" checked={f.required} onChange={(e) => updateField(idx, 'required', e.target.checked)} /> Req
                </label>
                <button type="button" className="btn-sm btn-danger-outline" onClick={() => removeField(idx)}>×</button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <label className="internal-toggle">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              <span>Active</span>
            </label>
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => setEditing(null)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Template'}</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <h2>Ticket Templates</h2>
        <button onClick={openNew} className="btn-primary btn-sm">+ New Template</button>
      </div>
      <p className="text-muted" style={{ marginBottom: 16 }}>
        Templates pre-fill ticket forms for common request types.
      </p>
      <div className="kb-grid">
        {templates.map((t) => (
          <div key={t.id} className="kb-card" style={{ cursor: 'default' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{t.icon || '📋'}</div>
            <h3 className="kb-card-title">{t.name}</h3>
            <p className="kb-card-excerpt">{t.description || 'No description'}</p>
            <div className="kb-card-footer">
              <span className="badge" style={{ background: { critical: '#dc3545', high: '#fd7e14', medium: '#0d6efd', low: '#6c757d' }[t.default_priority] }}>{t.default_priority}</span>
              <span>{t.custom_fields?.length || 0} fields</span>
              <span className={`status-dot ${t.is_active ? 'active' : 'inactive'}`}>{t.is_active ? 'Active' : 'Off'}</span>
            </div>
            <div className="action-cell" style={{ marginTop: 12 }}>
              <button className="btn-sm btn-outline" onClick={() => openEdit(t)}>Edit</button>
              <button className="btn-sm btn-danger-outline" onClick={() => handleDelete(t.id)}>Delete</button>
            </div>
          </div>
        ))}
        {templates.length === 0 && <p className="text-muted">No templates yet. Create one to help users submit common requests faster.</p>}
      </div>
    </div>
  );
}
