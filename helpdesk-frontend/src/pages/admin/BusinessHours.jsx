import { useEffect, useState } from 'react';
import { getBusinessHours, updateBusinessHours, getHolidays, createHoliday, deleteHoliday } from '../../api/admin';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function BusinessHours() {
  const [schedule, setSchedule] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [holForm, setHolForm]   = useState({ name: '', date: '', is_recurring: false });
  const [tab, setTab]           = useState('hours');

  const load = () => {
    setLoading(true);
    Promise.all([getBusinessHours(), getHolidays()])
      .then(([hRes, holRes]) => {
        const hours = hRes.data.data;
        if (hours.length === 7) {
          setSchedule(hours);
        } else {
          // Initialize defaults if empty
          setSchedule(DAY_NAMES.map((_, i) => ({
            day_of_week: i,
            start_time: '09:00',
            end_time: '17:00',
            is_working_day: i >= 1 && i <= 5,
          })));
        }
        setHolidays(holRes.data.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const updateDay = (idx, field, value) => {
    setSchedule((s) => s.map((d, i) => i === idx ? { ...d, [field]: value } : d));
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateBusinessHours(schedule);
    } finally { setSaving(false); }
  };

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    await createHoliday(holForm);
    setHolForm({ name: '', date: '', is_recurring: false });
    load();
  };

  const handleDeleteHoliday = async (id) => {
    await deleteHoliday(id);
    load();
  };

  if (loading) return (
    <div className="admin-loading">
      <div className="admin-loading-spinner" />
      <span>Loading…</span>
    </div>
  );

  return (
    <div className="admin-page">
      <h2>Business Hours &amp; Holidays</h2>
      <p className="text-muted" style={{ marginBottom: 16 }}>
        SLA calculations use these hours when a policy has "Business Hours Only" enabled.
      </p>

      <div className="kb-manage-tabs">
        <button className={tab === 'hours' ? 'active' : ''} onClick={() => setTab('hours')}>
          Working Hours
        </button>
        <button className={tab === 'holidays' ? 'active' : ''} onClick={() => setTab('holidays')}>
          Holidays ({holidays.length})
        </button>
      </div>

      {tab === 'hours' && (
        <form onSubmit={handleSaveSchedule}>
          <table className="table">
            <thead>
              <tr><th>Day</th><th>Working Day</th><th>Start</th><th>End</th></tr>
            </thead>
            <tbody>
              {schedule.map((day, idx) => (
                <tr key={idx}>
                  <td><strong>{DAY_NAMES[day.day_of_week]}</strong></td>
                  <td>
                    <input
                      type="checkbox"
                      checked={day.is_working_day}
                      onChange={(e) => updateDay(idx, 'is_working_day', e.target.checked)}
                    />
                  </td>
                  <td>
                    <input
                      type="time" value={day.start_time}
                      onChange={(e) => updateDay(idx, 'start_time', e.target.value)}
                      disabled={!day.is_working_day}
                    />
                  </td>
                  <td>
                    <input
                      type="time" value={day.end_time}
                      onChange={(e) => updateDay(idx, 'end_time', e.target.value)}
                      disabled={!day.is_working_day}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 16 }}>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save Schedule'}
            </button>
          </div>
        </form>
      )}

      {tab === 'holidays' && (
        <>
          <form
            onSubmit={handleAddHoliday}
            style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}
          >
            <div className="form-field">
              <label>Holiday Name</label>
              <input
                value={holForm.name}
                onChange={(e) => setHolForm({ ...holForm, name: e.target.value })}
                required placeholder="e.g. Christmas Day"
              />
            </div>
            <div className="form-field">
              <label>Date</label>
              <input
                type="date" value={holForm.date}
                onChange={(e) => setHolForm({ ...holForm, date: e.target.value })}
                required
              />
            </div>
            <label className="internal-toggle" style={{ marginBottom: 8 }}>
              <input
                type="checkbox" checked={holForm.is_recurring}
                onChange={(e) => setHolForm({ ...holForm, is_recurring: e.target.checked })}
              />
              <span>Recurring yearly</span>
            </label>
            <button type="submit" className="btn-primary btn-sm">Add Holiday</button>
          </form>
          <table className="table">
            <thead><tr><th>Name</th><th>Date</th><th>Recurring</th><th>Actions</th></tr></thead>
            <tbody>
              {holidays.map((h) => (
                <tr key={h.id}>
                  <td><strong>{h.name}</strong></td>
                  <td>{h.date}</td>
                  <td>{h.is_recurring ? 'Yes (yearly)' : 'No'}</td>
                  <td>
                    <button
                      className="btn-sm btn-danger-outline"
                      onClick={() => handleDeleteHoliday(h.id)}
                    >Remove</button>
                  </td>
                </tr>
              ))}
              {holidays.length === 0 && (
                <tr><td colSpan={4} className="empty-cell">No holidays configured.</td></tr>
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
