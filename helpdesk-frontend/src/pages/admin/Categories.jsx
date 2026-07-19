import { useEffect, useState } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../api/users';
import { useToast } from '../../context/ToastContext';
import { IconX } from '../../components/Icons';

const EMPTY = { name: '', description: '' };

export default function AdminCategories() {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(null); // null | { mode:'create'|'edit', data }
  const [saving, setSaving]         = useState(false);

  const load = () => {
    setLoading(true);
    getCategories().then((res) => setCategories(res.data.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => setModal({ mode: 'create', data: { ...EMPTY } });
  const openEdit   = (c) => setModal({ mode: 'edit',   data: { name: c.name, description: c.description || '', id: c.id } });

  const handleSave = async () => {
    if (!modal.data.name.trim()) return;
    setSaving(true);
    try {
      if (modal.mode === 'create') {
        await createCategory({ name: modal.data.name, description: modal.data.description });
        toast('Category created');
      } else {
        await updateCategory(modal.data.id, { name: modal.data.name, description: modal.data.description });
        toast('Category updated');
      }
      setModal(null);
      load();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to save category', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c) => {
    if (!confirm(`Delete category "${c.name}"?`)) return;
    try {
      await deleteCategory(c.id);
      toast('Category deleted');
      load();
    } catch {
      toast('Failed to delete category', 'error');
    }
  };

  const set = (k) => (e) => setModal({ ...modal, data: { ...modal.data, [k]: e.target.value } });

  return (
    <div className="page">
      <div className="page-header">
        <h2>Categories</h2>
        <button className="btn-primary" onClick={openCreate}>+ New Category</button>
      </div>

      {loading ? <p className="loading-text">Loading…</p> : (
        <table className="table">
          <thead>
            <tr><th>Name</th><th>Description</th><th>Tickets</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                <td><strong>{c.name}</strong></td>
                <td>{c.description || <span className="text-muted">—</span>}</td>
                <td>{c.tickets_count ?? '—'}</td>
                <td className="action-cell">
                  <button className="btn-sm btn-outline" onClick={() => openEdit(c)}>Edit</button>
                  <button className="btn-sm btn-danger-outline" onClick={() => handleDelete(c)}>Delete</button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr><td colSpan={4} className="empty-cell">No categories yet</td></tr>
            )}
          </tbody>
        </table>
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modal.mode === 'create' ? 'New Category' : 'Edit Category'}</h3>
              <button className="modal-close" onClick={() => setModal(null)}><IconX /></button>
            </div>
            <div className="modal-body">
              <div className="form-field">
                <label>Name *</label>
                <input type="text" placeholder="Category name" value={modal.data.name} onChange={set('name')} />
              </div>
              <div className="form-field">
                <label>Description</label>
                <textarea rows={3} placeholder="Optional description" value={modal.data.description} onChange={set('description')} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-sm btn-outline" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn-sm btn-primary" onClick={handleSave} disabled={saving || !modal.data.name.trim()}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
