import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import {
  IconDashboard, IconUsers, IconTag, IconTicket, IconUser,
  IconLogOut, IconMenu, IconChevronLeft, IconChevronRight,
  IconLabel, IconBarChart, IconClipboard, IconActivity,
} from './Icons';

const NAV = [
  { to: '/admin',            icon: <IconDashboard />,  label: 'Overview',        exact: true },
  { to: '/admin/tickets',    icon: <IconTicket />,     label: 'All Tickets' },
  { to: '/admin/users',      icon: <IconUsers />,      label: 'Users' },
  { to: '/admin/categories', icon: <IconTag />,        label: 'Categories' },
  { to: '/admin/tags',       icon: <IconLabel />,      label: 'Tags' },
  { to: '/admin/canned',     icon: <IconClipboard />,  label: 'Canned Responses' },
  { to: '/admin/reports',    icon: <IconBarChart />,   label: 'Reports' },
  { to: '/admin/audit-log',  icon: <IconActivity />,   label: 'Audit Log' },
  { to: '/admin/profile',    icon: <IconUser />,       label: 'My Profile' },
];

export default function AdminLayout() {
  const { user, logout }  = useAuth();
  const location          = useLocation();
  const navigate          = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const isActive = (item) =>
    item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to);

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className={`admin-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>

      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

      <aside className={`sidebar ${mobileOpen ? 'sidebar-mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <span className="sidebar-brand-icon"><IconTicket /></span>
          {!collapsed && <span className="sidebar-brand-text">IT Helpdesk</span>}
        </div>

        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          {!collapsed && (
            <div className="sidebar-user-info">
              <strong>{user?.name}</strong>
              <span>{user?.role}</span>
            </div>
          )}
        </div>

        <div className="sidebar-divider" />

        <nav className="sidebar-nav">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`sidebar-link ${isActive(item) ? 'sidebar-link-active' : ''}`}
              title={collapsed ? item.label : ''}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              {!collapsed && <span className="sidebar-link-label">{item.label}</span>}
              {!collapsed && isActive(item) && <span className="sidebar-link-dot" />}
            </Link>
          ))}
        </nav>

        <div className="sidebar-spacer" />

        <button className="sidebar-collapse-btn" onClick={() => setCollapsed(!collapsed)}>
          <span>{collapsed ? <IconChevronRight /> : <IconChevronLeft />}</span>
          {!collapsed && <span>Collapse</span>}
        </button>

        <button className="sidebar-logout" onClick={handleLogout}>
          <span><IconLogOut /></span>
          {!collapsed && <span>Sign Out</span>}
        </button>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <button className="topbar-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}>
            <IconMenu />
          </button>
          <div className="topbar-breadcrumb">
            {location.pathname.match(/\/admin\/tickets\/\d+/) ? 'Ticket Detail' :
             location.pathname === '/admin/tickets/create' ? 'New Ticket' :
             NAV.find((n) => isActive(n))?.label || 'Admin'}
          </div>
          <div className="topbar-right">
            <NotificationBell />
            <Link to="/admin/tickets" className="topbar-link">
              <IconTicket /> Tickets
            </Link>
            <Link to="/admin/profile" className="topbar-avatar" title={user?.name}>
              {initials}
            </Link>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
