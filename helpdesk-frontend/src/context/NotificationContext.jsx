import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getNotifications, markRead, markAllRead } from '../api/notifications';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);

  const fetch = useCallback(() => {
    if (!user) return;
    getNotifications()
      .then((res) => {
        setNotifications(res.data.data);
        setUnread(res.data.unread);
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, [fetch]);

  const read = async (id) => {
    await markRead(id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
    setUnread((u) => Math.max(0, u - 1));
  };

  const readAll = async () => {
    await markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
    setUnread(0);
  };

  return (
    <NotificationContext.Provider value={{ notifications, unread, fetch, read, readAll }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
