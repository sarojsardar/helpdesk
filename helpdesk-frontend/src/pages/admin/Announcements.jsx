import { useEffect, useState } from 'react';
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../../api/admin';

const TYPES = ['info', 'warning', 'success', 'danger'];

export default function Announcements() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState(defaultForm());
  const [saving, setSaving]   = useState(false);

  function defaultForm() {
    return { title: '', body: '', type: 'info', target_roles: [], is_active: true, starts_at: '', expires_at: '' };
  }

  const load = () => {
    setLoading(true);
    getAnnouncements().then((r) => setItems(r.data.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing('new'); setForm(defaultForm()); };
  const openEdit = (item) => {
    setEditing(item);
    setForm({
      title: item.title, body: item.body, type: item.type,
      target_roles: item.target_roles || [],
      is_active: item.is_active,
      starts_at: item.starts_at?.slice(0, 16) || '',
      expires_at: item.expires_at?.slice(0, 16) || '',
    });
  };

  const toggleRole = (role) => {
    setForm((f) => ({
      ...f,
      target_roles: f.target_roles.includes(role)
        ? f.target_roles.filter((r) => r !== role)
        : [...f.target_roles, role],
    }));
  };

  const toUTC = (localDatetime) => {
    if (!localDatetime) return null;
    return new Date(localDatetime).toISOString();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      target_roles: form.target_roles.length > 0 ? form.target_roles : null,
      starts_at: toUTC(form.starts_at),
      expires_at: toUTC(form.expires_at),
    };
    try {
      if (editing === 'new') await createAnnouncement(payload);
      else await updateAnnouncement(editing.id, payload);
      setEditing(null); load();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this announcement?')) return;
    await deleteAnnouncement(id); load();
  };

  if (loading) return <div className="admin-loading"><div className="admin-loading-spinner" /><span>Loading…</span></div>;

  if (editing) {
    return (
      <div className="admin-page">
        <button className="btn-back" onClick={() => setEditing(null)}>← Back</button>
        <h2>{editing === 'new' ? 'New Announcement' : 'Edit Announcement'}</h2>
        <form className="form-card" onSubmit={handleSave}>
          <label>Title</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required maxLength={200} />

          <label>Message</label>
          <textarea rows={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required maxLength={2000} />

          <label>Type</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>

          <label>Visible to Roles (empty = all)</label>
          <div style={{ display: 'flex', gap: 12 }}>
            {['admin', 'staff', 'user'].map((role) => (
              <label key={role} className="internal-toggle">
                <input type="checkbox" checked={form.target_roles.includes(role)} onChange={() => toggleRole(role)} />
                <span>{role}</span>
              </label>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-field">
              <label>Starts At (optional)</label>
              <input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
            </div>
            <div className="form-field">
              <label>Expires At (optional)</label>
              <input type="datetime-local" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
            </div>
          </div>

          <label className="internal-toggle">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            <span>Active</span>
          </label>

          <div className="form-actions">
            <button type="button" onClick={() => setEditing(null)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <h2>Announcements</h2>
        <button onClick={openNew} className="btn-primary btn-sm">+ New Announcement</button>
      </div>

      <table className="table">
        <thead>
          <tr><th>Title</th><th>Type</th><th>Audience</th><th>Status</th><th>Expires</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {items.map((a) => (
            <tr key={a.id}>
              <td><strong>{a.title}</strong><br /><small className="text-muted">{a.body.slice(0, 60)}{a.body.length > 60 ? '…' : ''}</small></td>
              <td><span className="badge" style={{ background: { info: '#0d6efd', warning: '#fd7e14', success: '#198754', danger: '#dc3545' }[a.type] }}>{a.type}</span></td>
              <td>{a.target_roles?.join(', ') || 'All'}</td>
              <td><span className={`status-dot ${a.is_active ? 'active' : 'inactive'}`}>{a.is_active ? 'Active' : 'Inactive'}</span></td>
              <td>{a.expires_at ? new Date(a.expires_at).toLocaleDateString() : 'Never'}</td>
              <td className="action-cell">
                <button className="btn-sm btn-outline" onClick={() => openEdit(a)}>Edit</button>
                <button className="btn-sm btn-danger-outline" onClick={() => handleDelete(a.id)}>Delete</button>
              </td>
            </tr>
          ))}
          {items.length === 0 && <tr><td colSpan={6} className="empty-cell">No announcements.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
