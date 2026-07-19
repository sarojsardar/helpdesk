import { useEffect, useState } from 'react';
import { getCannedResponses, createCannedResponse, updateCannedResponse, deleteCannedResponse } from '../../api/notifications';
import { useToast } from '../../context/ToastContext';

const EMPTY = { title: '', body: '' };

export default function AdminCanned() {
  const toast = useToast();
  const [list, setList]       = useState([]);
  const [form, setForm]       = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getCannedResponses()
      .then((res) => setList(res.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateCannedResponse(editing, form);
        toast('Response updated');
      } else {
        await createCannedResponse(form);
        toast('Response created');
      }
      setForm(EMPTY);
      setEditing(null);
      load();
    } catch {
      toast('Failed to save', 'error');
    }
  };

  const handleEdit = (c) => { setEditing(c.id); setForm({ title: c.title, body: c.body }); };
  const handleCancel = () => { setEditing(null); setForm(EMPTY); };

  const handleDelete = async (id) => {
    if (!confirm('Delete this canned response?')) return;
    try {
      await deleteCannedResponse(id);
      toast('Deleted');
      load();
    } catch {
      toast('Failed to delete', 'error');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>⚡ Canned Responses</h2>
        <span className="meta-count">{list.length} responses</span>
      </div>

      <div className="canned-page-grid">
        {/* Form */}
        <div className="form-card">
          <div className="form-card-title">{editing ? 'Edit Response' : 'New Response'}</div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="form-field">
              <label>Title</label>
              <input
                placeholder="e.g. Password Reset Instructions"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div className="form-field">
              <label>Body</label>
              <textarea
                rows={5}
                placeholder="Write the canned response text…"
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                required
              />
            </div>
            <div className="form-actions">
              {editing && <button type="button" className="btn-sm btn-outline" onClick={handleCancel}>Cancel</button>}
              <button type="submit" className="btn-sm btn-primary">{editing ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </div>

        {/* List */}
        <div>
          {loading ? (
            <p className="loading-text">Loading…</p>
          ) : list.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">⚡</div>
              <h3>No canned responses yet</h3>
              <p>Create your first canned response to speed up replies.</p>
            </div>
          ) : (
            <div className="canned-list-admin">
              {list.map((c) => (
                <div key={c.id} className="canned-admin-item">
                  <div className="canned-admin-header">
                    <strong>{c.title}</strong>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-sm btn-outline" onClick={() => handleEdit(c)}>Edit</button>
                      <button className="btn-sm btn-danger-outline" onClick={() => handleDelete(c.id)}>Delete</button>
                    </div>
                  </div>
                  <p className="canned-admin-body">{c.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
