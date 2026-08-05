import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import Navbar              from './components/Navbar';
import AdminLayout         from './components/AdminLayout';
import AnnouncementBanner  from './components/AnnouncementBanner';
import ProtectedRoute      from './components/ProtectedRoute';
import Login               from './pages/auth/Login';
import Register            from './pages/auth/Register';
import TicketList          from './pages/tickets/TicketList';
import TicketDetail        from './pages/tickets/TicketDetail';
import CreateTicket        from './pages/tickets/CreateTicket';
import AdminDashboard      from './pages/admin/Dashboard';
import AdminUsers          from './pages/admin/Users';
import AdminCategories     from './pages/admin/Categories';
import AdminCanned         from './pages/admin/CannedResponses';
import AdminReports        from './pages/admin/Reports';
import AdminAuditLog       from './pages/admin/AuditLog';
import AdminTags           from './pages/admin/Tags';
import AdminDepartments    from './pages/admin/Departments';
import AdminSlaPolicies    from './pages/admin/SlaPolicies';
import AdminEscalationRules from './pages/admin/EscalationRules';
import AdminTicketTemplates from './pages/admin/TicketTemplates';
import AdminBusinessHours  from './pages/admin/BusinessHours';
import AdminAnnouncements  from './pages/admin/Announcements';
import KnowledgeBase       from './pages/kb/KnowledgeBase';
import KbArticleDetail     from './pages/kb/KbArticleDetail';
import KbManage            from './pages/kb/KbManage';
import Profile             from './pages/Profile';
import StaffDashboard      from './pages/staff/StaffDashboard';
import StaffQuickActions   from './pages/staff/QuickActions';
import CustomerMyTickets   from './pages/customer/MyTickets';
import CustomerTicketTracker from './pages/customer/TicketTracker';
import CustomerTicketWizard from './pages/customer/TicketWizard';
import CustomerSurvey      from './pages/customer/Survey';

const TITLES = {
  '/login':                   'Login',
  '/register':                'Register',
  '/admin':                   'Dashboard',
  '/admin/users':             'Users',
  '/admin/categories':        'Categories',
  '/admin/reports':           'Reports',
  '/admin/audit-log':         'Audit Log',
  '/admin/tags':              'Tags',
  '/admin/tickets':           'Tickets',
  '/admin/profile':           'Profile',
  '/admin/departments':       'Departments',
  '/admin/sla-policies':      'SLA Policies',
  '/admin/escalation-rules':  'Escalation Rules',
  '/admin/templates':         'Ticket Templates',
  '/admin/business-hours':    'Business Hours',
  '/admin/announcements':     'Announcements',
  '/admin/kb':                'Knowledge Base',
  '/admin/kb/manage':         'Manage KB',
  '/staff/dashboard':         'My Dashboard',
  '/staff/tickets':           'Tickets',
  '/staff/quick-actions':     'Quick Actions',
  '/staff/profile':           'Profile',
  '/staff/kb':                'Knowledge Base',
  '/staff/kb/manage':         'Manage KB',
  '/user/dashboard':          'My Tickets',
  '/user/tickets':            'My Tickets',
  '/user/tickets/create':     'Submit Request',
  '/user/profile':            'Profile',
  '/user/kb':                 'Knowledge Base',
};

function usePageTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    const match =
      TITLES[pathname] ??
      (pathname.endsWith('/create') ? 'New Ticket' :
       /\/tickets\/\d+$/.test(pathname) ? 'Ticket Detail' :
       /\/kb\/[^/]+$/.test(pathname) ? 'Article' : null);
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
          <Route index                      element={<AdminDashboard />} />
          <Route path="dashboard"           element={<Navigate to="/admin" replace />} />
          <Route path="users"               element={<AdminUsers />} />
          <Route path="categories"          element={<AdminCategories />} />
          <Route path="canned"              element={<AdminCanned />} />
          <Route path="tags"                element={<AdminTags />} />
          <Route path="reports"             element={<AdminReports />} />
          <Route path="audit-log"           element={<AdminAuditLog />} />
          <Route path="departments"         element={<AdminDepartments />} />
          <Route path="sla-policies"        element={<AdminSlaPolicies />} />
          <Route path="escalation-rules"    element={<AdminEscalationRules />} />
          <Route path="templates"           element={<AdminTicketTemplates />} />
          <Route path="business-hours"      element={<AdminBusinessHours />} />
          <Route path="announcements"       element={<AdminAnnouncements />} />
          <Route path="kb"                  element={<KnowledgeBase />} />
          <Route path="kb/manage"           element={<KbManage />} />
          <Route path="kb/:slug"            element={<KbArticleDetail />} />
          <Route path="tickets"             element={<TicketList />} />
          <Route path="tickets/create"      element={<CreateTicket />} />
          <Route path="tickets/:id"         element={<TicketDetail />} />
          <Route path="profile"             element={<Profile />} />
        </Route>
      </Route>

      {/* Staff routes */}
      <Route path="/staff" element={<ProtectedRoute roles={['staff']} />}>
        <Route element={<NavbarLayout />}>
          <Route path="dashboard"       element={<StaffDashboard />} />
          <Route path="quick-actions"   element={<StaffQuickActions />} />
          <Route path="tickets"         element={<TicketList />} />
          <Route path="tickets/create"  element={<CreateTicket />} />
          <Route path="tickets/:id"     element={<TicketDetail />} />
          <Route path="kb"              element={<KnowledgeBase />} />
          <Route path="kb/manage"       element={<KbManage />} />
          <Route path="kb/:slug"        element={<KbArticleDetail />} />
          <Route path="profile"         element={<Profile />} />
        </Route>
      </Route>

      {/* User routes */}
      <Route path="/user" element={<ProtectedRoute roles={['user']} />}>
        <Route element={<NavbarLayout />}>
          <Route path="dashboard"      element={<CustomerMyTickets />} />
          <Route path="tickets"        element={<CustomerMyTickets />} />
          <Route path="tickets/create" element={<CustomerTicketWizard />} />
          <Route path="tickets/:id"    element={<CustomerTicketTracker />} />
          <Route path="survey/:ticketId" element={<CustomerSurvey />} />
          <Route path="kb"             element={<KnowledgeBase />} />
          <Route path="kb/:slug"       element={<KbArticleDetail />} />
          <Route path="profile"        element={<Profile />} />
        </Route>
      </Route>

      <Route path="/" element={
        user
          ? <Navigate to={
              user.role === 'admin' ? '/admin' :
              user.role === 'staff' ? '/staff/dashboard' :
              '/user/dashboard'
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
      <AnnouncementBanner />
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
