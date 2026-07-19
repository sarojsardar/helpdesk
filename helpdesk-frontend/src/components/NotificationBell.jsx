import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import {
  IconBell, IconTicket, IconUser, IconMessageSquare, IconRefreshCw, IconPin,
} from './Icons';

const TYPE_ICONS = {
  ticket_created:  <IconTicket width={16} height={16} />,
  ticket_assigned: <IconUser width={16} height={16} />,
  ticket_reply:    <IconMessageSquare width={16} height={16} />,
  status_changed:  <IconRefreshCw width={16} height={16} />,
};

export default function NotificationBell() {
  const { notifications, unread, read, readAll } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleClick = async (n) => {
    if (!n.read_at) await read(n.id);
    setOpen(false);
    if (n.data?.url) navigate(n.data.url);
  };

  return (
    <div className="notif-wrap" ref={ref}>
      <button className="notif-btn" onClick={() => setOpen(!open)} title="Notifications">
        <IconBell width={20} height={20} />
        {unread > 0 && <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <span>Notifications</span>
            {unread > 0 && (
              <button className="notif-mark-all" onClick={readAll}>Mark all read</button>
            )}
          </div>
          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">No notifications yet</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`notif-item ${!n.read_at ? 'notif-unread' : ''}`}
                  onClick={() => handleClick(n)}
                >
                  <div className="notif-icon">
                    {TYPE_ICONS[n.data?.type] ?? <IconPin width={16} height={16} />}
                  </div>
                  <div className="notif-body">
                    <p className="notif-msg">{n.data?.message}</p>
                    <span className="notif-time">{timeAgo(n.created_at)}</span>
                  </div>
                  {!n.read_at && <span className="notif-dot" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
