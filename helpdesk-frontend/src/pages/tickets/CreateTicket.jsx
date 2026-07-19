import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTicket } from '../../api/tickets';
import { getCategories } from '../../api/users';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function CreateTicket() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast    = useToast();
  const [categories, setCategories] = useState([]);
  const [form, setForm]   = useState({ title: '', description: '', priority: 'medium', category_id: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const prefix = user?.role === 'admin' ? '/admin' : user?.role === 'staff' ? '/staff' : '/user';

  useEffect(() => {
    getCategories().then((res) => setCategories(res.data.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await createTicket(form);
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

        <div className="form-actions">
          <button type="button" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Ticket'}
          </button>
        </div>
      </form>
    </div>
  );
}
