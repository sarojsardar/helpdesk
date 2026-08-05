import { useEffect, useState } from 'react';
import { getActiveAnnouncements } from '../api/admin';

const TYPE_STYLES = {
  info:    { bg: '#eff6ff', border: '#bfdbfe', color: '#1e40af', icon: 'ℹ️' },
  warning: { bg: '#fffbeb', border: '#fde68a', color: '#92400e', icon: '⚠️' },
  success: { bg: '#f0fdf4', border: '#bbf7d0', color: '#166534', icon: '✅' },
  danger:  { bg: '#fef2f2', border: '#fecaca', color: '#991b1b', icon: '🚨' },
};

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState([]);
  const [dismissed, setDismissed]         = useState([]);

  useEffect(() => {
    getActiveAnnouncements()
      .then((res) => setAnnouncements(res.data.data || []))
      .catch(() => {});
  }, []);

  const dismiss = (id) => setDismissed((d) => [...d, id]);

  const visible = announcements.filter((a) => !dismissed.includes(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="announcement-stack">
      {visible.map((a) => {
        const style = TYPE_STYLES[a.type] || TYPE_STYLES.info;
        return (
          <div key={a.id} className="announcement-bar" style={{ background: style.bg, borderColor: style.border, color: style.color }}>
            <span className="announcement-icon">{style.icon}</span>
            <div className="announcement-content">
              <strong>{a.title}</strong>
              <span>{a.body}</span>
            </div>
            <button className="announcement-dismiss" onClick={() => dismiss(a.id)} aria-label="Dismiss">✕</button>
          </div>
        );
      })}
    </div>
  );
}
