const EVENT_CONFIG = {
  created:        { icon: '🎫', label: (e) => 'Ticket created',                                          color: '#0d6efd' },
  assigned:       { icon: '👤', label: (e) => `Assigned to agent`,                                       color: '#6610f2' },
  status_changed: { icon: '🔄', label: (e) => `Status changed from ${fmt(e.payload?.from)} to ${fmt(e.payload?.to)}`, color: '#fd7e14' },
  replied:        { icon: '💬', label: (e) => 'Reply added',                                             color: '#20c997' },
  priority_changed:{ icon: '⚡', label: (e) => `Priority changed to ${e.payload?.to}`,                  color: '#ffc107' },
  resolved:       { icon: '✅', label: (e) => 'Ticket resolved',                                         color: '#198754' },
  closed:         { icon: '🔒', label: (e) => 'Ticket closed',                                           color: '#6c757d' },
  sla_breach:     { icon: '⏰', label: (e) => 'SLA breach detected',                                     color: '#dc3545' },
  escalated:      { icon: '🚨', label: (e) => 'Ticket escalated',                                        color: '#dc3545' },
  notified:       { icon: '📧', label: (e) => 'Notification sent',                                       color: '#adb5bd' },
};

function fmt(str) {
  return str ? str.replace('_', ' ') : '—';
}

export default function ActivityTimeline({ events = [] }) {
  if (!events.length) return null;

  const sorted = [...events].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  return (
    <div className="timeline">
      <h3 className="timeline-title">Activity Timeline</h3>
      <div className="timeline-list">
        {sorted.map((event, i) => {
          const config = EVENT_CONFIG[event.type] ?? { icon: '📌', label: () => event.type, color: '#adb5bd' };
          return (
            <div key={event.id} className="timeline-item">
              <div className="timeline-line">
                <div className="timeline-dot" style={{ background: config.color, borderColor: config.color }}>
                  <span>{config.icon}</span>
                </div>
                {i < sorted.length - 1 && <div className="timeline-connector" />}
              </div>
              <div className="timeline-content">
                <p className="timeline-label">{config.label(event)}</p>
                <div className="timeline-meta">
                  {event.user && <span className="timeline-actor">{event.user.name}</span>}
                  <span className="timeline-time">{new Date(event.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
