import { useState } from 'react';
import api from '../api';

const ROLE_TABS = [
  { id: 'employee', label: '👤 Employee', name: 'Employee', noun: 'an employee' },
  { id: 'support', label: '🛠️ IT Support', name: 'IT Support', noun: 'an IT support' },
  { id: 'admin', label: '🛡️ Administration', name: 'Administration', noun: 'an administration' },
];

export default function LoginPage({ onLogin }) {
  const [role, setRole] = useState('employee');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (data.user.role !== role) {
        const actual = ROLE_TABS.find((tab) => tab.id === data.user.role);
        setError(
          `That is ${actual?.noun || 'a different'} account. Choose ${
            actual?.name || 'the matching tab'
          } to sign in.`
        );
        setBusy(false);
        return;
      }
      onLogin(data, remember);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not sign in. Please try again.');
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <aside className="login-hero">
        <div className="brand brand-light">
          <span className="brand-mark">🎧</span> HelpDesk
        </div>
        <div className="login-hero-copy">
          <span className="hero-pill">SMART EMPLOYEE SUPPORT</span>
          <h1>Your IT helpdesk, powered by AI.</h1>
          <p>
            Report issues, get instant troubleshooting steps, and track every support
            ticket in one place.
          </p>
          <ul className="hero-features">
            <li>🤖 AI-guided troubleshooting in seconds</li>
            <li>🎫 Create and track tickets easily</li>
            <li>⚡ Get updates from IT support live</li>
          </ul>
        </div>
        <p className="login-hero-foot">© {new Date().getFullYear()} HelpDesk · Internal IT support</p>
      </aside>

      <main className="login-form-wrap">
        <form className="login-card" onSubmit={submit}>
          <div className="brand brand-mobile">
            <span className="brand-mark">🎧</span> HelpDesk
          </div>
          <h2>Welcome back 👋</h2>
          <p className="muted">Sign in to your account to continue.</p>

          <div className="role-tabs" role="tablist" aria-label="Choose account type">
            {ROLE_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={role === tab.id}
                className={`role-tab ${role === tab.id ? 'active' : ''}`}
                onClick={() => {
                  setRole(tab.id);
                  setError('');
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="field">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <div className="password-wrap">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div className="login-row">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Remember me
            </label>
            <button
              type="button"
              className="link-btn"
              onClick={() =>
                alert(
                  role === 'admin'
                    ? 'IT support passwords are reset by the system administrator. Ask the system owner to reset your account.'
                    : 'Contact IT support at it-support@company.com to reset your password.'
                )
              }
            >
              Forgot password?
            </button>
          </div>

          <button className="btn btn-primary btn-full" type="submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>

          <div className="demo-box">
            <strong>Demo accounts</strong>
            <span>Employee · tushar@company.com / helpdesk123</span>
            <span>Administration · admin@company.com / admin123</span>
            <span>IT Support · accounts are created in Administration</span>
          </div>
        </form>
      </main>
    </div>
  );
}
