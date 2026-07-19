import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile, changePassword, send2FA, verify2FA } from '../api/users';
import { useToast } from '../context/ToastContext';

export default function Profile() {
  const { user, setUser } = useAuth();
  const toast = useToast();

  const [info, setInfo]       = useState({ name: user?.name || '', email: user?.email || '' });
  const [pw, setPw]           = useState({ current_password: '', password: '', password_confirmation: '' });
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingPw, setSavingPw]     = useState(false);
  const [showPw, setShowPw]         = useState(false);

  // 2FA state
  const [twoFaStep, setTwoFaStep]   = useState(null); // null | 'sent'
  const [twoFaCode, setTwoFaCode]   = useState('');
  const [twoFaLoading, setTwoFaLoading] = useState(false);

  const handleInfo = async (e) => {
    e.preventDefault();
    setSavingInfo(true);
    try {
      const res = await updateProfile(info);
      setUser(res.data.data);
      toast('Profile updated');
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setSavingInfo(false);
    }
  };

  const handlePw = async (e) => {
    e.preventDefault();
    if (pw.password !== pw.password_confirmation) { toast('Passwords do not match', 'error'); return; }
    setSavingPw(true);
    try {
      await changePassword(pw);
      toast('Password changed successfully');
      setPw({ current_password: '', password: '', password_confirmation: '' });
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setSavingPw(false);
    }
  };

  const handle2FaSend = async () => {
    setTwoFaLoading(true);
    try {
      await send2FA();
      setTwoFaStep('sent');
      toast('Verification code sent to your email.');
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to send code.', 'error');
    } finally {
      setTwoFaLoading(false);
    }
  };

  const handle2FaVerify = async (e) => {
    e.preventDefault();
    setTwoFaLoading(true);
    try {
      const res = await verify2FA(twoFaCode);
      setUser((u) => ({ ...u, two_factor_enabled: res.data.two_factor_enabled }));
      toast(res.data.message);
      setTwoFaStep(null);
      setTwoFaCode('');
    } catch (err) {
      toast(err.response?.data?.message || 'Invalid code.', 'error');
    } finally {
      setTwoFaLoading(false);
    }
  };

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="page">
      <h2>My Profile</h2>

      <div className="profile-grid">
        {/* Avatar card */}
        <div className="profile-avatar-card">
          <div className="avatar-circle">{initials}</div>
          <h3>{user?.name}</h3>
          <span className="badge" style={{ background: user?.role === 'admin' ? '#dc3545' : user?.role === 'staff' ? '#0d6efd' : '#6c757d' }}>
            {user?.role}
          </span>
          {user?.department && <p className="profile-dept">{user.department}</p>}
          <p className="profile-email">{user?.email}</p>
          <div style={{ marginTop: 8, fontSize: 12, color: user?.two_factor_enabled ? '#166534' : '#6b7280' }}>
            {user?.two_factor_enabled ? '🔐 2FA Enabled' : '🔓 2FA Disabled'}
          </div>
        </div>

        <div className="profile-forms">
          {/* Personal info */}
          <div className="form-card">
            <h3 className="form-card-title">Personal Information</h3>
            <form onSubmit={handleInfo}>
              <div className="form-field">
                <label>Full Name</label>
                <input type="text" required value={info.name} onChange={(e) => setInfo({ ...info, name: e.target.value })} />
              </div>
              <div className="form-field">
                <label>Email Address</label>
                <input type="email" required value={info.email} onChange={(e) => setInfo({ ...info, email: e.target.value })} />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={savingInfo}>{savingInfo ? 'Saving…' : 'Save Changes'}</button>
              </div>
            </form>
          </div>

          {/* Change password */}
          <div className="form-card">
            <h3 className="form-card-title">Change Password</h3>
            <form onSubmit={handlePw}>
              <div className="form-field">
                <label>Current Password</label>
                <input type={showPw ? 'text' : 'password'} required value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} />
              </div>
              <div className="form-field">
                <label>New Password</label>
                <input type={showPw ? 'text' : 'password'} required minLength={8} value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} />
              </div>
              <div className="form-field">
                <label>Confirm New Password</label>
                <input type={showPw ? 'text' : 'password'} required value={pw.password_confirmation} onChange={(e) => setPw({ ...pw, password_confirmation: e.target.value })} />
              </div>
              <div className="form-field form-field-row">
                <label style={{ fontWeight: 400, color: '#6b7280' }}>
                  <input type="checkbox" checked={showPw} onChange={(e) => setShowPw(e.target.checked)} style={{ width: 'auto', marginRight: 6 }} />
                  Show passwords
                </label>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={savingPw}>{savingPw ? 'Updating…' : 'Update Password'}</button>
              </div>
            </form>
          </div>

          {/* 2FA */}
          <div className="form-card">
            <h3 className="form-card-title">Two-Factor Authentication</h3>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
              {user?.two_factor_enabled
                ? 'Two-factor authentication is currently enabled. Disable it below.'
                : 'Add an extra layer of security. A code will be sent to your email on each login.'}
            </p>
            {twoFaStep === null ? (
              <button className="btn-sm btn-primary" onClick={handle2FaSend} disabled={twoFaLoading}>
                {twoFaLoading ? 'Sending…' : user?.two_factor_enabled ? 'Disable 2FA' : 'Enable 2FA'}
              </button>
            ) : (
              <form onSubmit={handle2FaVerify} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontSize: 13, color: '#374151' }}>Enter the 6-digit code sent to <strong>{user?.email}</strong>:</p>
                <input
                  type="text" inputMode="numeric" maxLength={6} required
                  value={twoFaCode} onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  style={{ width: 140, padding: '8px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 20, letterSpacing: 6, textAlign: 'center' }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" className="btn-sm btn-primary" disabled={twoFaLoading || twoFaCode.length < 6}>
                    {twoFaLoading ? 'Verifying…' : 'Verify'}
                  </button>
                  <button type="button" className="btn-sm btn-outline" onClick={() => { setTwoFaStep(null); setTwoFaCode(''); }}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
