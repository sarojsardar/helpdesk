import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import Navbar           from './components/Navbar';
import AdminLayout      from './components/AdminLayout';
import ProtectedRoute   from './components/ProtectedRoute';
import Login            from './pages/auth/Login';
import Register         from './pages/auth/Register';
import Dashboard        from './pages/Dashboard';
import TicketList       from './pages/tickets/TicketList';
import TicketDetail     from './pages/tickets/TicketDetail';
import CreateTicket     from './pages/tickets/CreateTicket';
import AdminDashboard   from './pages/admin/Dashboard';
import AdminUsers       from './pages/admin/Users';
import AdminCategories  from './pages/admin/Categories';
import AdminCanned      from './pages/admin/CannedResponses';
import AdminReports     from './pages/admin/Reports';
import AdminAuditLog    from './pages/admin/AuditLog';
import AdminTags        from './pages/admin/Tags';
import Profile          from './pages/Profile';

const TITLES = {
  '/login':                'Login',
  '/register':             'Register',
  '/admin':                'Dashboard',
  '/admin/users':          'Users',
  '/admin/categories':     'Categories',
  '/admin/reports':        'Reports',
  '/admin/audit-log':      'Audit Log',
  '/admin/tags':           'Tags',
  '/admin/tickets':        'Tickets',
  '/admin/profile':        'Profile',
  '/staff/dashboard':      'Dashboard',
  '/staff/tickets':        'Tickets',
  '/staff/profile':        'Profile',
  '/user/tickets':         'My Tickets',
  '/user/profile':         'Profile',
};

function usePageTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    const match =
      TITLES[pathname] ??
      (pathname.endsWith('/create') ? 'New Ticket' :
       /\/tickets\/\d+$/.test(pathname) ? 'Ticket Detail' : null);
    document.title = match ? `${match} — HelpDesk` : 'HelpDesk';
  }, [pathname]);
}

function AppRoutes() {
  const { user } = useAuth();
  usePageTitle();

  return (
    <Routes>
      {/* Public */}
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Admin — full sidebar layout */}
      <Route path="/admin" element={<ProtectedRoute roles={['admin']} />}>
        <Route element={<AdminLayout />}>
          <Route index                   element={<AdminDashboard />} />
          <Route path="dashboard"        element={<Navigate to="/admin" replace />} />
          <Route path="users"            element={<AdminUsers />} />
          <Route path="categories"       element={<AdminCategories />} />
          <Route path="canned"           element={<AdminCanned />} />
          <Route path="tags"             element={<AdminTags />} />
          <Route path="reports"          element={<AdminReports />} />
          <Route path="audit-log"        element={<AdminAuditLog />} />
          <Route path="tickets"          element={<TicketList />} />
          <Route path="tickets/create"   element={<CreateTicket />} />
          <Route path="tickets/:id"      element={<TicketDetail />} />
          <Route path="profile"          element={<Profile />} />
        </Route>
      </Route>

      {/* Staff routes */}
      <Route path="/staff" element={<ProtectedRoute roles={['staff']} />}>
        <Route element={<NavbarLayout />}>
          <Route path="dashboard"       element={<Dashboard />} />
          <Route path="tickets"         element={<TicketList />} />
          <Route path="tickets/create"  element={<CreateTicket />} />
          <Route path="tickets/:id"     element={<TicketDetail />} />
          <Route path="profile"         element={<Profile />} />
        </Route>
      </Route>

      {/* User routes */}
      <Route path="/user" element={<ProtectedRoute roles={['user']} />}>
        <Route element={<NavbarLayout />}>
          <Route path="tickets"        element={<TicketList />} />
          <Route path="tickets/create" element={<CreateTicket />} />
          <Route path="tickets/:id"    element={<TicketDetail />} />
          <Route path="profile"        element={<Profile />} />
        </Route>
      </Route>

      <Route path="/" element={
        user
          ? <Navigate to={
              user.role === 'admin' ? '/admin' :
              user.role === 'staff' ? '/staff/dashboard' :
              '/user/tickets'
            } replace />
          : <Navigate to="/login" replace />
      } />
    </Routes>
  );
}

function NavbarLayout() {
  const { user } = useAuth();
  return (
    <>
      {user && <Navbar />}
      <main className="main-content">
        <Outlet />
      </main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <NotificationProvider>
            <AppRoutes />
          </NotificationProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
