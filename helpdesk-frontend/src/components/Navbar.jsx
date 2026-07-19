import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IconTicket, IconUser, IconDashboard, IconLogOut, IconMenu, IconPlus, IconSettings } from './Icons';

export default function Navbar() {
  const { user, logout }    = useAuth();
  const navigate            = useNavigate();
  const location            = useLocation();
  const [menuOpen, setMenuOpen]       = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        <IconTicket /> IT Helpdesk
      </Link>

      <div className={`nav-links ${menuOpen ? 'nav-links-open' : ''}`}>
        {user?.role !== 'user' && (
          <Link to="/staff/dashboard" className={isActive('/staff/dashboard') ? 'nav-active' : ''}>Dashboard</Link>
        )}
        <Link
          to={user?.role === 'admin' ? '/admin/tickets' : user?.role === 'staff' ? '/staff/tickets' : '/user/tickets'}
          className={isActive('/admin/tickets') || isActive('/staff/tickets') || isActive('/user/tickets') ? 'nav-active' : ''}
        >Tickets</Link>
        {user?.role === 'user' && (
          <Link to="/user/tickets/create" className={isActive('/user/tickets/create') ? 'nav-active' : ''}>
            <IconPlus /> New Ticket
          </Link>
        )}
        {user?.role === 'admin' && (
          <Link to="/admin" className={isActive('/admin') ? 'nav-active' : ''}>
            <IconSettings /> Admin
          </Link>
        )}
      </div>

      <div className="nav-right">
        <div className="nav-profile" ref={profileRef}>
          <button className="nav-avatar" onClick={() => setProfileOpen(!profileOpen)}>
            <span className="avatar-initials">{initials}</span>
            <span className="nav-username">{user?.name}</span>
            <span className="nav-role-badge">{user?.role}</span>
          </button>
          {profileOpen && (
            <div className="nav-profile-dropdown">
              <div className="nav-profile-info">
                <strong>{user?.name}</strong>
                <small>{user?.email}</small>
              </div>
              <hr />
              <Link to={user?.role === 'admin' ? '/admin/profile' : user?.role === 'staff' ? '/staff/profile' : '/user/profile'} onClick={() => setProfileOpen(false)}>
                <IconUser /> My Profile
              </Link>
              {user?.role === 'staff' && (
                <Link to="/staff/dashboard" onClick={() => setProfileOpen(false)}>
                  <IconDashboard /> Dashboard
                </Link>
              )}
              <hr />
              <button onClick={handleLogout} className="nav-logout-btn">
                <IconLogOut /> Sign Out
              </button>
            </div>
          )}
        </div>

        <button className="nav-hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          <IconMenu />
        </button>
      </div>
    </nav>
  );
}
