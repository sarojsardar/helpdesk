import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { IconTicket, IconMail, IconLock, IconEye, IconEyeOff, IconAlertTriangle, IconCheck } from '../../components/Icons';

const DEMO = [
  { label: 'Admin',  email: 'admin@helpdesk.com', password: 'password' },
  { label: 'Staff',  email: 'staff@helpdesk.com', password: 'password' },
  { label: 'User',   email: 'user@helpdesk.com',  password: 'password' },
];

export default function Login() {
  const { login }     = useAuth();
  const navigate      = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);

  const sessionExpired = new URLSearchParams(window.location.search).get('reason') === 'session_expired';

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form);
      navigate(user.role === 'admin' ? '/admin' : user.role === 'staff' ? '/staff/dashboard' : '/user/tickets');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.email?.[0] || err.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (d) => setForm({ email: d.email, password: d.password });

  return (
    <div className="auth-split">
      <div className="auth-brand">
        <div className="auth-brand-inner">
          <div className="auth-logo"><IconTicket width={40} height={40} /></div>
          <h1>IT Helpdesk</h1>
          <p>Manage support tickets, track issues, and resolve problems — all in one place.</p>
          <div className="auth-features">
            <div className="auth-feature"><IconCheck width={14} height={14} /> Real-time ticket tracking</div>
            <div className="auth-feature"><IconCheck width={14} height={14} /> Priority-based SLA management</div>
            <div className="auth-feature"><IconCheck width={14} height={14} /> Role-based access control</div>
            <div className="auth-feature"><IconCheck width={14} height={14} /> Team collaboration tools</div>
          </div>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-card-v2">
          <div className="auth-card-header">
            <h2>Welcome back</h2>
            <p>Sign in to your account to continue</p>
          </div>

          {sessionExpired && (
            <div className="auth-alert auth-alert-warning">
              Your session has expired. Please sign in again.
            </div>
          )}

          {error && (
            <div className="auth-alert auth-alert-error">
              <IconAlertTriangle width={16} height={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="email">Email address</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon"><IconMail /></span>
                <input
                  id="email" type="email" placeholder="you@example.com"
                  required autoComplete="email"
                  value={form.email} onChange={set('email')}
                />
              </div>
            </div>

            <div className="auth-field">
              <div className="auth-field-row">
                <label htmlFor="password">Password</label>
              </div>
              <div className="auth-input-wrap">
                <span className="auth-input-icon"><IconLock /></span>
                <input
                  id="password" type={showPw ? 'text' : 'password'}
                  placeholder="Enter your password"
                  required autoComplete="current-password"
                  value={form.password} onChange={set('password')}
                />
                <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-btn-primary" disabled={loading}>
              {loading ? <span className="auth-spinner" /> : null}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="auth-demo">
            <p className="auth-demo-label">Quick demo access</p>
            <div className="auth-demo-btns">
              {DEMO.map((d) => (
                <button key={d.label} type="button" className="auth-demo-btn" onClick={() => fillDemo(d)}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <p className="auth-footer-link">
            Don't have an account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
