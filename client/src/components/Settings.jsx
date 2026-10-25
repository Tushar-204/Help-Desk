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
            Contact IT support if your name or email needs to be updated.
          </p>
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
