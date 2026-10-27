import { useState } from 'react';
import api from '../api';

function initials(name = '') {
  return (
    name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?'
  );
}

export default function Settings({ user, onLogout }) {
  const roleLabel =
    user.role === 'admin' ? 'Administration' : user.role === 'support' ? 'IT Support' : 'Employee';
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const update = (field) => (e) => setPasswords((prev) => ({ ...prev, [field]: e.target.value }));

  async function changePassword(e) {
    e.preventDefault();
    if (saving) return;
    setNotice('');
    setError('');
    if (passwords.next.length < 8 || passwords.next.length > 128) {
      setError('New password must be 8 to 128 characters.');
      return;
    }
    if (passwords.next !== passwords.confirm) {
      setError('New password and confirmation do not match.');
      return;
    }
    setSaving(true);
    try {
      await api.put('/auth/password', {
        currentPassword: passwords.current,
        newPassword: passwords.next,
      });
      setPasswords({ current: '', next: '', confirm: '' });
      setNotice('Password updated.');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update your password.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Settings ⚙️</h1>
          <p className="muted">Your account and session information.</p>
        </div>
      </div>

      <div className="settings-grid">
        <section className="card">
          <h2>Profile</h2>
          <div className="profile-card">
            <span className="avatar lg">{initials(user.name)}</span>
            <div>
              <strong className="profile-name">{user.name}</strong>
              <div className="muted">{user.email}</div>
            </div>
            <span className={`badge ${user.role === 'employee' ? 'open' : 'progress'}`}>
              {roleLabel}
            </span>
          </div>
          <p className="muted small">
            {user.role === 'employee'
              ? 'Contact IT support if your name or email needs to be updated.'
              : 'Ask Administration if your name or email needs to be updated.'}
          </p>
        </section>

        <section className="card">
          <h2>Password</h2>
          {notice && <div className="alert alert-success">{notice}</div>}
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={changePassword}>
            <div className="field">
              <label htmlFor="current-password">Current password</label>
              <input
                id="current-password"
                type="password"
                value={passwords.current}
                onChange={update('current')}
                autoComplete="current-password"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="new-password">New password</label>
              <input
                id="new-password"
                type="password"
                value={passwords.next}
                onChange={update('next')}
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="confirm-password">Confirm new password</label>
              <input
                id="confirm-password"
                type="password"
                value={passwords.confirm}
                onChange={update('confirm')}
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                required
              />
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? 'Updating…' : 'Update password'}
              </button>
            </div>
          </form>
        </section>

        <section className="card">
          <h2>Session</h2>
          <p className="muted">
            You are signed in on this device. Sessions last up to 7 days.
          </p>
          <button className="btn btn-danger" onClick={onLogout}>
            🚪 Sign out
          </button>
        </section>
      </div>
    </>
  );
}
