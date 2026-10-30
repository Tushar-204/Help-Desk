import { useEffect, useState } from 'react';
import api from '../api';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function AdminDashboard({ user, onNavigate }) {
  const [employees, setEmployees] = useState([]);
  const [support, setSupport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      api.get('/users', { params: { role: 'employee' } }),
      api.get('/users', { params: { role: 'support' } }),
    ])
      .then(([employeeRes, supportRes]) => {
        if (ignore) return;
        setEmployees(employeeRes.data);
        setSupport(supportRes.data);
        setError('');
      })
      .catch(() => !ignore && setError('Could not load account totals.'))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [reload]);

  function retry() {
    setLoading(true);
    setError('');
    setReload((n) => n + 1);
  }

  const activeEmployees = employees.filter((employee) => employee.active !== false).length;
  const activeSupport = support.filter((agent) => agent.active !== false).length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{greeting()}, Administration 👋</h1>
          <p className="muted">Manage employee and IT support accounts from here.</p>
        </div>
        <button className="btn btn-primary" onClick={() => onNavigate('employees')}>
          👤 Manage Employees
        </button>
      </div>

      <div className="stats">
        <div className="stat-card">
          <span className="stat-icon blue">👤</span>
          <div>
            <span className="stat-label">Employees</span>
            <strong className="stat-value">{loading ? '—' : employees.length}</strong>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon green">✅</span>
          <div>
            <span className="stat-label">Active Employees</span>
            <strong className="stat-value">{loading ? '—' : activeEmployees}</strong>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon amber">👥</span>
          <div>
            <span className="stat-label">IT Support Agents</span>
            <strong className="stat-value">{loading ? '—' : support.length}</strong>
          </div>
        </div>
      </div>

      {error ? (
        <section className="card empty-state">
          <span>⚠️</span>
          <h3>Could not load account totals</h3>
          <p className="muted">{error}</p>
          <button className="btn btn-outline" onClick={retry}>Try again</button>
        </section>
      ) : (
        <div className="settings-grid">
          <section className="card">
            <h2>Employee accounts</h2>
            <p className="muted">
              {loading
                ? 'Loading employees…'
                : `${employees.length} total · ${activeEmployees} active`}
            </p>
            <button className="btn btn-primary" onClick={() => onNavigate('employees')}>
              Manage Employees
            </button>
          </section>

          <section className="card">
            <h2>IT Support accounts</h2>
            <p className="muted">
              {loading
                ? 'Loading support agents…'
                : `${support.length} total · ${activeSupport} active`}
            </p>
            <button className="btn btn-primary" onClick={() => onNavigate('team')}>
              Manage IT Support
            </button>
          </section>
        </div>
      )}

      <section className="card">
        <h2>Ticket queue</h2>
        <p className="muted">
          The support queue belongs to the IT Support team. Administration manages accounts,
          access, and password resets.
        </p>
      </section>
    </>
  );
}
