import { useEffect, useState } from 'react';
import { getSlaPolicies, createSlaPolicy, updateSlaPolicy, deleteSlaPolicy } from '../../api/admin';
import { getDepartments } from '../../api/admin';
import { getCategories } from '../../api/users';

export default function SlaPolicies() {
  const [policies, setPolicies]       = useState([]);
  const [categories, setCategories]   = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [editing, setEditing]         = useState(null);
  const [form, setForm]               = useState(defaultForm());
  const [saving, setSaving]           = useState(false);

  function defaultForm() {
    return {
      name: '', description: '', priority: 'medium',
      response_minutes: 120, resolution_minutes: 480,
      business_hours_only: true, is_active: true,
      category_id: '', department_id: '',
    };
  }

  const load = () => {
    setLoading(true);
    Promise.all([getSlaPolicies(), getCategories(), getDepartments()])
      .then(([pRes, cRes, dRes]) => {
        setPolicies(pRes.data.data);
        setCategories(cRes.data.data);
        setDepartments(dRes.data.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openEdit = (policy) => {
    setEditing(policy);
    setForm({
      name: policy.name,
      description: policy.description || '',
      priority: policy.priority,
      response_minutes: policy.response_minutes,
      resolution_minutes: policy.resolution_minutes,
      business_hours_only: policy.business_hours_only,
      is_active: policy.is_active,
      category_id: policy.category_id || '',
      department_id: policy.department_id || '',
    });
  };

  const openNew = () => { setEditing('new'); setForm(defaultForm()); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, category_id: form.category_id || null, department_id: form.department_id || null };
    try {
      if (editing === 'new') await createSlaPolicy(payload);
      else await updateSlaPolicy(editing.id, payload);
      setEditing(null);
      load();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this SLA policy?')) return;
    await deleteSlaPolicy(id);
    load();
  };

  const formatTime = (mins) => {
    if (mins >= 1440) return `${(mins / 1440).toFixed(1)}d`;
    if (mins >= 60) return `${(mins / 60).toFixed(1)}h`;
    return `${mins}m`;
  };

  if (loading) return <div className="admin-loading"><div className="admin-loading-spinner" /><span>Loading…</span></div>;

  if (editing) {
    return (
      <div className="admin-page">
        <button className="btn-back" onClick={() => setEditing(null)}>← Back</button>
        <h2>{editing === 'new' ? 'New SLA Policy' : 'Edit SLA Policy'}</h2>
        <form className="form-card" onSubmit={handleSave}>
          <label>Policy Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Critical - IT Department" />

          <label>Description</label>
          <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

          <label>Priority</label>
          <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-field">
              <label>Response Time (minutes)</label>
              <input type="number" min={1} value={form.response_minutes} onChange={(e) => setForm({ ...form, response_minutes: +e.target.value })} required />
              <small className="text-muted">= {formatTime(form.response_minutes)}</small>
            </div>
            <div className="form-field">
              <label>Resolution Time (minutes)</label>
              <input type="number" min={1} value={form.resolution_minutes} onChange={(e) => setForm({ ...form, resolution_minutes: +e.target.value })} required />
              <small className="text-muted">= {formatTime(form.resolution_minutes)}</small>
            </div>
          </div>

          <label>Applies to Category (optional scope)</label>
          <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <label>Applies to Department (optional scope)</label>
          <select value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })}>
            <option value="">All Departments</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <label className="internal-toggle">
              <input type="checkbox" checked={form.business_hours_only} onChange={(e) => setForm({ ...form, business_hours_only: e.target.checked })} />
              <span>Business Hours Only</span>
            </label>
            <label className="internal-toggle">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              <span>Active</span>
            </label>
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => setEditing(null)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Policy'}</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <h2>SLA Policies</h2>
        <button onClick={openNew} className="btn-primary btn-sm">+ New Policy</button>
      </div>

      <p className="text-muted" style={{ marginBottom: 16 }}>
        SLA policies define response and resolution time targets. More specific policies (category or department scoped) take precedence over global ones.
      </p>

      <table className="table">
        <thead>
          <tr><th>Name</th><th>Priority</th><th>Response</th><th>Resolution</th><th>Scope</th><th>Hours</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {policies.map((p) => (
            <tr key={p.id}>
              <td><strong>{p.name}</strong></td>
              <td><span className="badge" style={{ background: { critical: '#dc3545', high: '#fd7e14', medium: '#0d6efd', low: '#6c757d' }[p.priority] }}>{p.priority}</span></td>
              <td>{formatTime(p.response_minutes)}</td>
              <td>{formatTime(p.resolution_minutes)}</td>
              <td>
                {p.category?.name && <span className="meta-tag">{p.category.name}</span>}
                {p.department?.name && <span className="meta-tag">{p.department.name}</span>}
                {!p.category_id && !p.department_id && <span className="text-muted">Global</span>}
              </td>
              <td>{p.business_hours_only ? '🕒 Business' : '24/7'}</td>
              <td><span className={`status-dot ${p.is_active ? 'active' : 'inactive'}`}>{p.is_active ? 'Active' : 'Inactive'}</span></td>
              <td className="action-cell">
                <button className="btn-sm btn-outline" onClick={() => openEdit(p)}>Edit</button>
                <button className="btn-sm btn-danger-outline" onClick={() => handleDelete(p.id)}>Delete</button>
              </td>
            </tr>
          ))}
          {policies.length === 0 && <tr><td colSpan={8} className="empty-cell">No SLA policies configured. System defaults will be used.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
