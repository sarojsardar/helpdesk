import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register as apiRegister } from '../../api/auth';
import { IconTicket, IconUser, IconMail, IconLock, IconEye, IconEyeOff, IconAlertTriangle, IconCheck } from '../../components/Icons';

function passwordStrength(pw) {
  if (!pw) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8)  score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map = [
    { label: '',        color: '' },
    { label: 'Weak',    color: '#dc3545' },
    { label: 'Fair',    color: '#fd7e14' },
    { label: 'Good',    color: '#0d6efd' },
    { label: 'Strong',  color: '#198754' },
  ];
  return { score, ...map[score] };
}

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm]       = useState({ name: '', email: '', password: '', password_confirmation: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const strength = passwordStrength(form.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.password_confirmation) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await apiRegister(form);
      localStorage.setItem('token', res.data.data.token);
      navigate('/user/tickets');
    } catch (err) {
      const errors = err.response?.data?.errors;
      setError(errors ? Object.values(errors).flat().join(' ') : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split">
      <div className="auth-brand">
        <div className="auth-brand-inner">
          <div className="auth-logo"><IconTicket width={40} height={40} /></div>
          <h1>IT Helpdesk</h1>
          <p>Join your team and start managing support tickets efficiently.</p>
          <div className="auth-features">
            <div className="auth-feature"><IconCheck width={14} height={14} /> Submit and track your tickets</div>
            <div className="auth-feature"><IconCheck width={14} height={14} /> Get notified on updates</div>
            <div className="auth-feature"><IconCheck width={14} height={14} /> Communicate with support staff</div>
            <div className="auth-feature"><IconCheck width={14} height={14} /> View resolution history</div>
          </div>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-card-v2">
          <div className="auth-card-header">
            <h2>Create account</h2>
            <p>Fill in your details to get started</p>
          </div>

          {error && (
            <div className="auth-alert auth-alert-error">
              <IconAlertTriangle width={16} height={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="name">Full name</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon"><IconUser /></span>
                <input
                  id="name" type="text" placeholder="John Doe"
                  required autoComplete="name"
                  value={form.name} onChange={set('name')}
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="reg-email">Email address</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon"><IconMail /></span>
                <input
                  id="reg-email" type="email" placeholder="you@example.com"
                  required autoComplete="email"
                  value={form.email} onChange={set('email')}
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="reg-password">Password</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon"><IconLock /></span>
                <input
                  id="reg-password" type={showPw ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  required autoComplete="new-password"
                  value={form.password} onChange={set('password')}
                />
                <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
              {form.password && (
                <div className="auth-strength">
                  <div className="auth-strength-bar">
                    {[1,2,3,4].map((i) => (
                      <div
                        key={i}
                        className="auth-strength-seg"
                        style={{ background: i <= strength.score ? strength.color : '#e9ecef' }}
                      />
                    ))}
                  </div>
                  <span style={{ color: strength.color }}>{strength.label}</span>
                </div>
              )}
            </div>

            <div className="auth-field">
              <label htmlFor="confirm-password">Confirm password</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon"><IconLock /></span>
                <input
                  id="confirm-password" type={showPw ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  required autoComplete="new-password"
                  value={form.password_confirmation} onChange={set('password_confirmation')}
                />
              </div>
              {form.password_confirmation && form.password !== form.password_confirmation && (
                <p className="auth-field-hint auth-field-hint-error">Passwords don't match</p>
              )}
              {form.password_confirmation && form.password === form.password_confirmation && (
                <p className="auth-field-hint auth-field-hint-ok"><IconCheck width={12} height={12} /> Passwords match</p>
              )}
            </div>

            <button type="submit" className="auth-btn-primary" disabled={loading}>
              {loading ? <span className="auth-spinner" /> : null}
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="auth-footer-link">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
