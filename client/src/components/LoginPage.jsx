import { useEffect, useState } from 'react';
import api from '../api';

const ROLE_TABS = [
  { id: 'employee', label: '👤 Employee', name: 'Employee', noun: 'an employee' },
  { id: 'support', label: '🛠️ IT Support', name: 'IT Support', noun: 'an IT support' },
  { id: 'admin', label: '🛡️ Administration', name: 'Administration', noun: 'an administration' },
];

const RESET_MESSAGES = {
  employee: 'Ask Administration at admin@company.com to reset your password.',
  support: 'Only an administrator can reset your password. Contact admin@company.com.',
  admin: 'Administration passwords are reset by the system owner. Contact them for help.',
};

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('signin');
  const [role, setRole] = useState('employee');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    let alive = true;
    api
      .get('/health')
      .then(({ data }) => {
        if (alive) setDemoMode(Boolean(data.demoMode));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  function switchMode(next) {
    setMode(next);
    setError('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
  }

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setError('');

    if (mode === 'register') {
      if (!email.trim().toLowerCase().endsWith('@company.com')) {
        setError('Use your @company.com email address.');
        return;
      }
      if (password.length < 8 || password.length > 128) {
        setError('Password must be 8 to 128 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('New password and confirmation do not match.');
        return;
      }
    }

    setBusy(true);
    try {
      const { data } =
        mode === 'register'
          ? await api.post('/auth/register', {
              name,
              email,
              password,
            })
          : await api.post('/auth/login', { email, password });

      if (mode === 'signin' && data.user.role !== role) {
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
          <h2>{mode === 'register' ? 'Create your account' : 'Welcome back 👋'}</h2>
          <p className="muted">
            {mode === 'register'
              ? 'Register with your company email to start using HelpDesk.'
              : 'Sign in to your account to continue.'}
          </p>

          {mode === 'signin' && (
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
          )}

          {error && <div className="alert alert-error">{error}</div>}

          {mode === 'register' && (
            <div className="field">
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                autoComplete="name"
                placeholder="Your name"
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

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
            {mode === 'register' && (
              <span className="muted small">Use your @company.com email address.</span>
            )}
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <div className="password-wrap">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                placeholder={mode === 'register' ? 'At least 8 characters' : 'Enter your password'}
                minLength={mode === 'register' ? 8 : undefined}
                maxLength={mode === 'register' ? 128 : undefined}
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

          {mode === 'register' && (
            <div className="field">
              <label htmlFor="confirm-password">Confirm password</label>
              <input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Repeat your password"
                minLength={8}
                maxLength={128}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}

          <div className="login-row">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Remember me
            </label>
            {mode === 'signin' && (
              <button
                type="button"
                className="link-btn"
                onClick={() => alert(RESET_MESSAGES[role])}
              >
                Forgot password?
              </button>
            )}
          </div>

          <button className="btn btn-primary btn-full" type="submit" disabled={busy}>
            {busy
              ? mode === 'register'
                ? 'Creating account…'
                : 'Signing in…'
              : mode === 'register'
                ? 'Create account'
                : 'Sign in'}
          </button>

          {mode === 'signin' ? (
            <>
              <p className="auth-switch muted">
                New employee?{' '}
                <button type="button" className="link-btn" onClick={() => switchMode('register')}>
                  Create an account
                </button>
              </p>
              {demoMode && (
                <div className="demo-box">
                  <strong>Demo accounts</strong>
                  <span>Employee · tushar@company.com / helpdesk123</span>
                  <span>IT Support · support@company.com / support123</span>
                  <span>Administration · admin@company.com / admin123</span>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="auth-switch muted">
                Already have an account?{' '}
                <button type="button" className="link-btn" onClick={() => switchMode('signin')}>
                  Sign in
                </button>
              </p>
              <p className="muted small">
                Employee self-registration is limited to @company.com. IT Support accounts are
                created by Administration.
              </p>
            </>
          )}
        </form>
      </main>
    </div>
  );
}
