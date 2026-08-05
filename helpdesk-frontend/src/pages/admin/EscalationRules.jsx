import { useEffect, useState } from 'react';
import { getEscalationRules, createEscalationRule, updateEscalationRule, deleteEscalationRule } from '../../api/admin';
import { getCategories, getUsers } from '../../api/users';

const TRIGGER_LABELS = {
  sla_response_breach: 'SLA Response Breach',
  sla_resolution_breach: 'SLA Resolution Breach',
  time_no_update: 'No Activity (stale)',
  priority_age: 'Ticket Age (by priority)',
};

const ACTION_LABELS = {
  reassign_to_manager: 'Reassign to Manager',
  notify_manager: 'Notify Manager',
  increase_priority: 'Increase Priority',
  notify_admins: 'Notify All Admins',
  reassign_to_agent: 'Reassign to Specific Agent',
};

export default function EscalationRules() {
  const [rules, setRules]           = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState(defaultForm());
  const [saving, setSaving]         = useState(false);

  function defaultForm() {
    return {
      name: '', description: '', trigger_type: 'sla_resolution_breach',
      threshold_minutes: 60, action: 'notify_admins',
      target_user_id: '', applies_to_priority: '',
      category_id: '', is_active: true, max_escalations: 1,
    };
  }

  const load = () => {
    setLoading(true);
    Promise.all([getEscalationRules(), getCategories(), getUsers()])
      .then(([rRes, cRes, uRes]) => {
        setRules(rRes.data.data);
        setCategories(cRes.data.data);
        setUsers(uRes.data.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openEdit = (rule) => {
    setEditing(rule);
    setForm({
      name: rule.name, description: rule.description || '',
      trigger_type: rule.trigger_type, threshold_minutes: rule.threshold_minutes,
      action: rule.action, target_user_id: rule.target_user_id || '',
      applies_to_priority: rule.applies_to_priority || '',
      category_id: rule.category_id || '', is_active: rule.is_active,
      max_escalations: rule.max_escalations,
    });
  };

  const openNew = () => { setEditing('new'); setForm(defaultForm()); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      target_user_id: form.target_user_id || null,
      applies_to_priority: form.applies_to_priority || null,
      category_id: form.category_id || null,
    };
    try {
      if (editing === 'new') await createEscalationRule(payload);
      else await updateEscalationRule(editing.id, payload);
      setEditing(null); load();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this escalation rule?')) return;
    await deleteEscalationRule(id); load();
  };

  if (loading) return <div className="admin-loading"><div className="admin-loading-spinner" /><span>Loading…</span></div>;

  if (editing) {
    return (
      <div className="admin-page">
        <button className="btn-back" onClick={() => setEditing(null)}>← Back</button>
        <h2>{editing === 'new' ? 'New Escalation Rule' : 'Edit Rule'}</h2>
        <form className="form-card" onSubmit={handleSave}>
          <label>Rule Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Critical SLA breach → notify admins" />

          <label>Description</label>
          <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

          <label>Trigger Condition</label>
          <select value={form.trigger_type} onChange={(e) => setForm({ ...form, trigger_type: e.target.value })}>
            {Object.entries(TRIGGER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>

          <label>Threshold (minutes after trigger condition)</label>
          <input type="number" min={1} value={form.threshold_minutes} onChange={(e) => setForm({ ...form, threshold_minutes: +e.target.value })} required />

          <label>Action to Take</label>
          <select value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })}>
            {Object.entries(ACTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>

          {form.action === 'reassign_to_agent' && (
            <>
              <label>Target Agent</label>
              <select value={form.target_user_id} onChange={(e) => setForm({ ...form, target_user_id: e.target.value })}>
                <option value="">Select agent…</option>
                {users.filter((u) => u.role !== 'user').map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </>
          )}

          <label>Applies to Priority (optional)</label>
          <select value={form.applies_to_priority} onChange={(e) => setForm({ ...form, applies_to_priority: e.target.value })}>
            <option value="">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <label>Applies to Category (optional)</label>
          <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <label>Max Escalations per Ticket</label>
          <input type="number" min={1} max={10} value={form.max_escalations} onChange={(e) => setForm({ ...form, max_escalations: +e.target.value })} />

          <label className="internal-toggle">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            <span>Active</span>
          </label>

          <div className="form-actions">
            <button type="button" onClick={() => setEditing(null)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Rule'}</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <h2>Escalation Rules</h2>
        <button onClick={openNew} className="btn-primary btn-sm">+ New Rule</button>
      </div>

      <p className="text-muted" style={{ marginBottom: 16 }}>
        Escalation rules automatically take action on tickets that breach SLA or become stale. Rules are evaluated every 5 minutes.
      </p>

      <table className="table">
        <thead>
          <tr><th>Name</th><th>Trigger</th><th>Threshold</th><th>Action</th><th>Priority</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {rules.map((r) => (
            <tr key={r.id}>
              <td><strong>{r.name}</strong></td>
              <td>{TRIGGER_LABELS[r.trigger_type]}</td>
              <td>{r.threshold_minutes}m</td>
              <td>{ACTION_LABELS[r.action]}</td>
              <td>{r.applies_to_priority ? <span className="badge" style={{ background: '#6c757d' }}>{r.applies_to_priority}</span> : 'All'}</td>
              <td><span className={`status-dot ${r.is_active ? 'active' : 'inactive'}`}>{r.is_active ? 'Active' : 'Inactive'}</span></td>
              <td className="action-cell">
                <button className="btn-sm btn-outline" onClick={() => openEdit(r)}>Edit</button>
                <button className="btn-sm btn-danger-outline" onClick={() => handleDelete(r.id)}>Delete</button>
              </td>
            </tr>
          ))}
          {rules.length === 0 && <tr><td colSpan={7} className="empty-cell">No escalation rules configured.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
