import { useEffect, useState } from 'react';
import { getMyStatus, updateMyStatus } from '../api/staff';

const STATUS_CONFIG = {
  online: { label: 'Online', color: '#22c55e', icon: '🟢' },
  busy:   { label: 'Busy', color: '#f97316', icon: '🟠' },
  away:   { label: 'Away', color: '#9ca3af', icon: '⚪' },
};

export default function AvailabilityToggle() {
  const [status, setStatus] = useState('online');
  const [open, setOpen]     = useState(false);

  useEffect(() => {
    getMyStatus()
      .then((res) => setStatus(res.data.data.availability_status))
      .catch(() => {});
  }, []);

  const handleChange = async (newStatus) => {
    setStatus(newStatus);
    setOpen(false);
    await updateMyStatus(newStatus).catch(() => {});
  };

  const current = STATUS_CONFIG[status];

  return (
    <div className="availability-toggle" style={{ position: 'relative' }}>
      <button
        className="availability-btn"
        onClick={() => setOpen(!open)}
        title={`Status: ${current.label}`}
      >
        <span>{current.icon}</span>
        <span className="availability-label">{current.label}</span>
      </button>
      {open && (
        <div className="availability-dropdown">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              className={`availability-option ${status === key ? 'active' : ''}`}
              onClick={() => handleChange(key)}
            >
              <span>{cfg.icon}</span>
              <span>{cfg.label}</span>
              {key === 'online' && <small>Auto-assign active</small>}
              {key === 'busy' && <small>No auto-assign</small>}
              {key === 'away' && <small>No auto-assign</small>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
