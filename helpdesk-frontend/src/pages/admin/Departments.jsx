import { useEffect, useState } from 'react';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from '../../api/admin';
import { getUsers } from '../../api/users';

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [users, setUsers]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [editing, setEditing]         = useState(null); // null=list, 'new' or dept obj
  const [form, setForm]               = useState(defaultForm());
  const [saving, setSaving]           = useState(false);

  function defaultForm() {
    return { name: '', description: '', manager_id: '', parent_id: '', is_active: true };
  }

  const load = () => {
    setLoading(true);
    Promise.all([getDepartments(), getUsers()])
      .then(([dRes, uRes]) => {
        setDepartments(dRes.data.data);
        setUsers(uRes.data.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openEdit = (dept) => {
    setEditing(dept);
    setForm({
      name: dept.name,
      description: dept.description || '',
      manager_id: dept.manager_id || '',
      parent_id: dept.parent_id || '',
      is_active: dept.is_active,
    });
  };

  const openNew = () => {
    setEditing('new');
    setForm(defaultForm());
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, manager_id: form.manager_id || null, parent_id: form.parent_id || null };
    try {
      if (editing === 'new') {
        await createDepartment(payload);
      } else {
        await updateDepartment(editing.id, payload);
      }
      setEditing(null);
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this department? Users must be unassigned first.')) return;
    try {
      await deleteDepartment(id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Cannot delete department.');
    }
  };

  if (loading) return <div className="admin-loading"><div className="admin-loading-spinner" /><span>Loading…</span></div>;

  if (editing) {
    return (
      <div className="admin-page">
        <button className="btn-back" onClick={() => setEditing(null)}>← Back</button>
        <h2>{editing === 'new' ? 'New Department' : 'Edit Department'}</h2>
        <form className="form-card" onSubmit={handleSave}>
          <label>Department Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={100} />

          <label>Description</label>
          <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

          <label>Manager</label>
          <select value={form.manager_id} onChange={(e) => setForm({ ...form, manager_id: e.target.value })}>
            <option value="">None</option>
            {users.filter((u) => u.role !== 'user').map((u) => (
              <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
            ))}
          </select>

          <label>Parent Department</label>
          <select value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })}>
            <option value="">None (top-level)</option>
            {departments.filter((d) => d.id !== editing?.id).map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

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
        <h2>Departments</h2>
        <button onClick={openNew} className="btn-primary btn-sm">+ New Department</button>
      </div>

      <table className="table">
        <thead>
          <tr><th>Name</th><th>Manager</th><th>Parent</th><th>Users</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {departments.map((d) => (
            <tr key={d.id}>
              <td><strong>{d.name}</strong>{d.description && <small style={{ display: 'block', color: '#6b7280' }}>{d.description}</small>}</td>
              <td>{d.manager?.name || '—'}</td>
              <td>{d.parent?.name || '—'}</td>
              <td>{d.users_count}</td>
              <td><span className={`status-dot ${d.is_active ? 'active' : 'inactive'}`}>{d.is_active ? 'Active' : 'Inactive'}</span></td>
              <td className="action-cell">
                <button className="btn-sm btn-outline" onClick={() => openEdit(d)}>Edit</button>
                <button className="btn-sm btn-danger-outline" onClick={() => handleDelete(d.id)}>Delete</button>
              </td>
            </tr>
          ))}
          {departments.length === 0 && <tr><td colSpan={6} className="empty-cell">No departments yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
