import { useEffect, useState } from 'react';
import { getTags, createTag, updateTag, deleteTag } from '../../api/tickets';

const DEFAULT_COLORS = ['#6366f1','#0d6efd','#0891b2','#22c55e','#f59e0b','#f97316','#dc3545','#8b5cf6'];

export default function Tags() {
  const [tags, setTags]         = useState([]);
  const [form, setForm]         = useState({ name: '', color: '#6366f1' });
  const [editing, setEditing]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const load = () => getTags().then((r) => setTags(r.data.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (editing) {
        await updateTag(editing.id, form);
      } else {
        await createTag(form);
      }
      setForm({ name: '', color: '#6366f1' });
      setEditing(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save tag.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (tag) => { setEditing(tag); setForm({ name: tag.name, color: tag.color }); };
  const handleDelete = async (id) => { if (confirm('Delete this tag?')) { await deleteTag(id); load(); } };
  const cancelEdit = () => { setEditing(null); setForm({ name: '', color: '#6366f1' }); };

  return (
    <div className="admin-page">
      <div className="page-header"><h2>Tags</h2></div>

      <div className="canned-page-grid">
        {/* Form */}
        <div className="admin-card">
          <div className="admin-card-header"><h3>{editing ? 'Edit Tag' : 'New Tag'}</h3></div>
          <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {error && <div className="error">{error}</div>}
            <div className="form-field">
              <label>Tag Name</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required maxLength={50} placeholder="e.g. billing, urgent, bug" />
            </div>
            <div className="form-field">
              <label>Color</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                {DEFAULT_COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setForm((f) => ({ ...f, color: c }))}
                    style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: form.color === c ? '3px solid #1e293b' : '2px solid transparent', cursor: 'pointer' }} />
                ))}
              </div>
              <input type="color" value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} style={{ width: 48, height: 32, padding: 2, border: '1px solid #e2e8f0', borderRadius: 6 }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn-sm btn-primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Update' : 'Create Tag'}</button>
              {editing && <button type="button" className="btn-sm btn-outline" onClick={cancelEdit}>Cancel</button>}
            </div>
          </form>
        </div>

        {/* Tag list */}
        <div>
          {loading ? <p className="loading-text">Loading…</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {tags.length === 0 && <div className="empty-state"><div className="empty-icon">🏷</div><h3>No tags yet</h3><p>Create your first tag to organize tickets.</p></div>}
              {tags.map((tag) => (
                <div key={tag.id} className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: tag.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{tag.name}</span>
                  <div className="action-cell">
                    <button className="btn-sm btn-outline" onClick={() => handleEdit(tag)}>Edit</button>
                    <button className="btn-sm btn-danger-outline" onClick={() => handleDelete(tag.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
