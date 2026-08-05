import { useEffect, useState } from 'react';
import { getKbArticles, getKbCategories, createKbArticle, updateKbArticle, deleteKbArticle, createKbCategory, deleteKbCategory } from '../../api/kb';
import { useAuth } from '../../context/AuthContext';

export default function KbManage() {
  const { user } = useAuth();
  const [articles, setArticles]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing]       = useState(null); // null = list, 'new' or article obj
  const [form, setForm]             = useState(defaultForm());
  const [catForm, setCatForm]       = useState({ name: '', description: '' });
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [tab, setTab]               = useState('articles'); // articles | categories

  function defaultForm() {
    return { title: '', body: '', excerpt: '', category_id: '', is_published: true, is_internal: false, tags: '' };
  }

  const load = () => {
    setLoading(true);
    Promise.all([
      getKbArticles({ per_page: 50 }),
      getKbCategories(),
    ]).then(([aRes, cRes]) => {
      setArticles(aRes.data.data.data);
      setCategories(cRes.data.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openEdit = (article) => {
    setEditing(article);
    setForm({
      title: article.title,
      body: article.body,
      excerpt: article.excerpt || '',
      category_id: article.category_id || '',
      is_published: article.is_published,
      is_internal: article.is_internal,
      tags: article.tags?.join(', ') || '',
    });
  };

  const openNew = () => {
    setEditing('new');
    setForm(defaultForm());
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      category_id: form.category_id || null,
    };

    try {
      if (editing === 'new') {
        await createKbArticle(payload);
      } else {
        await updateKbArticle(editing.id, payload);
      }
      setEditing(null);
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this article?')) return;
    await deleteKbArticle(id);
    load();
  };

  const handleCatSave = async (e) => {
    e.preventDefault();
    await createKbCategory(catForm);
    setCatForm({ name: '', description: '' });
    load();
  };

  const handleCatDelete = async (id) => {
    if (!confirm('Delete this category?')) return;
    await deleteKbCategory(id);
    load();
  };

  if (loading) return <div className="admin-loading"><div className="admin-loading-spinner" /><span>Loading…</span></div>;

  // Edit/Create form
  if (editing) {
    return (
      <div className="page">
        <button className="btn-back" onClick={() => setEditing(null)}>← Back to list</button>
        <h2>{editing === 'new' ? 'New Article' : 'Edit Article'}</h2>
        <form className="form-card" onSubmit={handleSave}>
          <label>Title</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />

          <label>Excerpt (short summary)</label>
          <input value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} maxLength={500} />

          <label>Category</label>
          <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
            <option value="">None</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <label>Body (supports markdown-like formatting)</label>
          <textarea rows={12} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required />

          <label>Tags (comma-separated)</label>
          <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="vpn, network, setup" />

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <label className="internal-toggle">
              <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
              <span>Published</span>
            </label>
            <label className="internal-toggle">
              <input type="checkbox" checked={form.is_internal} onChange={(e) => setForm({ ...form, is_internal: e.target.checked })} />
              <span>Internal only (staff/admin)</span>
            </label>
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => setEditing(null)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Article'}</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Manage Knowledge Base</h2>
        <button onClick={openNew} className="btn-primary btn-sm">+ New Article</button>
      </div>

      {/* Tabs */}
      <div className="kb-manage-tabs">
        <button className={tab === 'articles' ? 'active' : ''} onClick={() => setTab('articles')}>Articles ({articles.length})</button>
        <button className={tab === 'categories' ? 'active' : ''} onClick={() => setTab('categories')}>Categories ({categories.length})</button>
      </div>

      {tab === 'articles' && (
        <table className="table">
          <thead>
            <tr><th>Title</th><th>Category</th><th>Status</th><th>Views</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {articles.map((a) => (
              <tr key={a.id}>
                <td><strong>{a.title}</strong>{a.is_internal && <span className="kb-internal-badge" style={{ marginLeft: 8 }}>Internal</span>}</td>
                <td>{a.category?.name || '—'}</td>
                <td><span className={`badge ${a.is_published ? '' : 'badge-draft'}`} style={{ background: a.is_published ? '#198754' : '#6c757d' }}>{a.is_published ? 'Published' : 'Draft'}</span></td>
                <td>{a.view_count}</td>
                <td className="action-cell">
                  <button className="btn-sm btn-outline" onClick={() => openEdit(a)}>Edit</button>
                  {user?.role === 'admin' && <button className="btn-sm btn-danger-outline" onClick={() => handleDelete(a.id)}>Delete</button>}
                </td>
              </tr>
            ))}
            {articles.length === 0 && <tr><td colSpan={5} className="empty-cell">No articles yet.</td></tr>}
          </tbody>
        </table>
      )}

      {tab === 'categories' && (
        <>
          <form onSubmit={handleCatSave} style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'flex-end' }}>
            <div className="form-field" style={{ flex: 1 }}>
              <label>Category Name</label>
              <input value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} required />
            </div>
            <div className="form-field" style={{ flex: 2 }}>
              <label>Description</label>
              <input value={catForm.description} onChange={(e) => setCatForm({ ...catForm, description: e.target.value })} />
            </div>
            <button type="submit" className="btn-primary btn-sm">Add</button>
          </form>
          <table className="table">
            <thead><tr><th>Name</th><th>Description</th><th>Articles</th><th>Actions</th></tr></thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.name}</strong></td>
                  <td>{c.description || '—'}</td>
                  <td>{c.articles_count}</td>
                  <td className="action-cell">
                    {user?.role === 'admin' && <button className="btn-sm btn-danger-outline" onClick={() => handleCatDelete(c.id)}>Delete</button>}
                  </td>
                </tr>
              ))}
              {categories.length === 0 && <tr><td colSpan={4} className="empty-cell">No categories yet.</td></tr>}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
