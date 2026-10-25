import { useEffect, useState } from 'react';
import api from '../api';
import { formatDate } from './TicketTable';

const EMPTY = { name: '', email: '', password: '' };

export default function ManageTeam() {
  const [form, setForm] = useState(EMPTY);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);

  useEffect(() => {
    api
      .get('/users')
      .then((res) => setAgents(res.data))
      .catch(() => setError('Could not load IT support accounts.'))
      .finally(() => setLoading(false));
  }, []);

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (saving) return;
    if (!form.name.trim() || !form.email.trim() || form.password.length < 8) {
      setError('Enter a name, email, and a password of at least 8 characters.');
      return;
    }
    setSaving(true);
    setError('');
    setCreated(null);
    try {
      const { data } = await api.post('/users', form);
      setAgents((prev) => [...prev, data]);
      setCreated({ ...data, password: form.password });
      setForm(EMPTY);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create the IT support account.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Manage IT Support 👥</h1>
          <p className="muted">
            Create logins for the agents who help employees, then share their credentials.
          </p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {created && (
        <div className="alert alert-success">
          <strong>{created.name} can now sign in.</strong>
          <span>Email: {created.email}</span>
          <span>Password: {created.password}</span>
        </div>
      )}

      <section className="card form-card">
        <h2>Add an IT support agent</h2>
        <form onSubmit={submit}>
          <div className="form-row">
            <div className="field">
              <label htmlFor="agent-name">Full name</label>
              <input
                id="agent-name"
                value={form.name}
                onChange={update('name')}
                placeholder="Riya Sharma"
                maxLength={80}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="agent-email">Work email</label>
              <input
                id="agent-email"
                type="email"
                value={form.email}
                onChange={update('email')}
                placeholder="riya@company.com"
                autoComplete="off"
                required
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="agent-password">Password</label>
            <input
              id="agent-password"
              type="text"
              value={form.password}
              onChange={update('password')}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              required
            />
            <span className="muted small">
              Share this password with the agent so they can sign in under IT Support.
            </span>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Creating…' : 'Create account'}
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>IT support accounts</h2>
          <span className="muted small">{agents.length} total</span>
        </div>

        {loading ? (
          <p className="muted">Loading accounts…</p>
        ) : agents.length === 0 ? (
          <div className="empty-state">
            <span>👥</span>
            <h3>No accounts yet</h3>
            <p className="muted">Create the first IT support login above.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Added</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr key={agent.id || agent._id}>
                    <td className="issue-title">{agent.name}</td>
                    <td>{agent.email}</td>
                    <td>
                      <span className="badge progress">IT Support</span>
                    </td>
                    <td className="muted">{formatDate(agent.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
