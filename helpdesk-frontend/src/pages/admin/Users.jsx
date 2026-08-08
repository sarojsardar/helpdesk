import { useEffect, useState } from 'react';
import { getUsers, updateUser, createUser } from '../../api/users';
import { getDepartments } from '../../api/admin';
import { IconX } from '../../components/Icons';
import { useToast } from '../../context/ToastContext';
import Pagination from '../../components/Pagination';

const ROLES = ['admin', 'staff', 'user'];
const ROLE_COLORS = { admin: '#dc3545', staff: '#0d6efd', user: '#6c757d' };
const BLANK_NEW = { name: '', email: '', password: '', role: 'staff', department: '' };

export default function AdminUsers() {
  const toast = useToast();
  const [users, setUsers]     = useState([]);
  const [meta, setMeta]       = useState({});
  const [filters, setFilters] = useState({ role: '', search: '', page: 1, per_page: 20 });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding]   = useState(false);
  const [newUser, setNewUser] = useState(BLANK_NEW);
  const [saving, setSaving]       = useState(false);
  const [departments, setDepts]   = useState([]);

  useEffect(() => {
    getDepartments()
      .then((res) => {
        const d = res.data.data;
        setDepts(Array.isArray(d) ? d : []);
      })
      .catch(() => {});
  }, []);

  const load = () => {
    setLoading(true);
    getUsers(filters)
      .then((res) => {
        const d = res.data.data;
        setUsers(Array.isArray(d) ? d : (d.data ?? []));
        setMeta(Array.isArray(d) ? { total: d.length } : d);
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, [filters]);

  const openEdit = (u) => setEditing({ id: u.id, role: u.role, department: u.department || '', is_active: u.is_active });

  const saveEdit = async () => {
    setSaving(true);
    try {
      await updateUser(editing.id, { role: editing.role, department: editing.department, is_active: editing.is_active });
      toast('User updated successfully');
      setEditing(null);
      load();
    } catch {
      toast('Failed to update user', 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveNew = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createUser(newUser);
      toast('User created successfully');
      setAdding(false);
      setNewUser(BLANK_NEW);
      load();
    } catch (err) {
      const msg = err.response?.data?.message || Object.values(err.response?.data?.errors || {})[0]?.[0] || 'Failed to create user';
      toast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (u) => {
    try {
      await updateUser(u.id, { is_active: !u.is_active });
      toast(`User ${u.is_active ? 'deactivated' : 'activated'}`);
      load();
    } catch {
      toast('Failed to update user', 'error');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>User Management</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span className="meta-count">{meta.total || 0} users</span>
          <button className="btn-sm btn-primary" onClick={() => { setNewUser(BLANK_NEW); setAdding(true); }}>+ Add User</button>
        </div>
      </div>

      <div className="filters">
        <input
          placeholder="Search by name or email…"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
        />
        <select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value, page: 1 })}>
          <option value="">All Roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {loading ? <p className="loading-text">Loading…</p> : (
        <table className="table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td><strong>{u.name}</strong></td>
                <td>{u.email}</td>
                <td><span className="badge" style={{ background: ROLE_COLORS[u.role] }}>{u.role}</span></td>
                <td>{u.department || <span className="text-muted">—</span>}</td>
                <td>
                  <span className={`status-dot ${u.is_active ? 'active' : 'inactive'}`}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="action-cell">
                  <button className="btn-sm btn-outline" onClick={() => openEdit(u)}>Edit</button>
                  <button
                    className={`btn-sm ${u.is_active ? 'btn-danger-outline' : 'btn-success-outline'}`}
                    onClick={() => toggleActive(u)}
                  >
                    {u.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={6} className="empty-cell">No users found</td></tr>
            )}
          </tbody>
        </table>
      )}

      <Pagination
        meta={meta}
        perPage={filters.per_page}
        onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
        onPerPageChange={(n) => setFilters((f) => ({ ...f, per_page: n, page: 1 }))}
      />

      {/* Add User Modal */}
      {adding && (
        <div className="modal-overlay" onClick={() => setAdding(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New User</h3>
              <button className="modal-close" onClick={() => setAdding(false)}><IconX /></button>
            </div>
            <form onSubmit={saveNew}>
              <div className="modal-body">
                <div className="form-field">
                  <label>Full Name</label>
                  <input type="text" required placeholder="John Doe"
                    value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
                </div>
                <div className="form-field">
                  <label>Email Address</label>
                  <input type="email" required placeholder="john@example.com"
                    value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
                </div>
                <div className="form-field">
                  <label>Password</label>
                  <input type="password" required minLength={8} placeholder="Min. 8 characters"
                    value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
                </div>
                <div className="form-field">
                  <label>Role</label>
                  <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label>Department <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
                  <select value={newUser.department} onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}>
                    <option value="">— None —</option>
                    {departments.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-sm btn-outline" onClick={() => setAdding(false)}>Cancel</button>
                <button type="submit" className="btn-sm btn-primary" disabled={saving}>
                  {saving ? 'Creating…' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit User</h3>
              <button className="modal-close" onClick={() => setEditing(null)}><IconX /></button>
            </div>
            <div className="modal-body">
              <div className="form-field">
                <label>Role</label>
                <select value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value })}>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label>Department</label>
                <select value={editing.department} onChange={(e) => setEditing({ ...editing, department: e.target.value })}>
                  <option value="">— None —</option>
                  {departments.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
              </div>
              <div className="form-field form-field-row">
                <label>Active</label>
                <input
                  type="checkbox" checked={editing.is_active}
                  onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-sm btn-outline" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn-sm btn-primary" onClick={saveEdit} disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
