import { useEffect, useState } from 'react';
import api from '../api';
import { formatDate } from './TicketTable';

const EMPTY = { name: '', email: '', password: '' };

function accountId(account) {
  return account.id || account._id;
}

export default function ManageAccounts({ role }) {
  const isEmployee = role === 'employee';
  const label = isEmployee ? 'employee' : 'IT support';
  const person = isEmployee ? 'employee' : 'agent';
  const labelTitle = isEmployee ? 'Employee' : 'IT Support';

  const [form, setForm] = useState(EMPTY);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [listError, setListError] = useState('');
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState(null);
  const [reload, setReload] = useState(0);
  const [removing, setRemoving] = useState('');
  const [resetting, setResetting] = useState('');
  const [toggling, setToggling] = useState('');

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    api
      .get('/users', { params: { role } })
      .then((res) => {
        if (ignore) return;
        setAccounts(res.data);
        setListError('');
      })
      .catch(() => !ignore && setListError('Could not load accounts.'))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [reload, role]);

  function retry() {
    setLoading(true);
    setListError('');
    setReload((n) => n + 1);
  }

  async function resetPassword(account) {
    const id = accountId(account);
    if (!window.confirm(`Generate a new password for ${account.name}?`)) return;
    setResetting(id);
    setActionError('');
    try {
      const { data } = await api.put(`/users/${id}/password`);
      setNotice({ ...account, password: data.password, reset: true });
    } catch (err) {
      setActionError(err.response?.data?.error || 'Could not reset the password.');
    } finally {
      setResetting('');
    }
  }

  async function toggleActive(account) {
    const id = accountId(account);
    const activating = account.active === false;
    const prompt = activating
      ? `Reactivate ${account.name}'s account?`
      : `Deactivate ${account.name}'s account? They will be signed out and cannot sign in until reactivated.`;
    if (!window.confirm(prompt)) return;

    setToggling(id);
    setActionError('');
    try {
      const { data } = await api.patch(`/users/${id}/active`, { active: activating });
      setAccounts((prev) =>
        prev.map((item) =>
          accountId(item) === id ? { ...item, ...data, ticketCount: item.ticketCount } : item
        )
      );
    } catch (err) {
      setActionError(err.response?.data?.error || 'Could not update the account.');
    } finally {
      setToggling('');
    }
  }

  async function remove(account) {
    const id = accountId(account);
    if (isEmployee && (account.ticketCount || 0) > 0) return;
    if (!window.confirm(`Remove ${account.name}'s ${label} account?`)) return;

    setRemoving(id);
    setActionError('');
    try {
      await api.delete(`/users/${id}`);
      setAccounts((prev) => prev.filter((item) => accountId(item) !== id));
      if (notice?.email === account.email) setNotice(null);
    } catch (err) {
      setActionError(err.response?.data?.error || 'Could not remove the account.');
    } finally {
      setRemoving('');
    }
  }

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (saving) return;
    if (!form.name.trim() || !form.email.trim() || form.password.length < 8) {
      setError('Enter a name, email, and a password of at least 8 characters.');
      return;
    }
    if (isEmployee && !form.email.trim().toLowerCase().endsWith('@company.com')) {
      setError('Use a @company.com email address for employees.');
      return;
    }
    setSaving(true);
    setError('');
    setActionError('');
    setNotice(null);
    try {
      const { data } = await api.post('/users', { ...form, role });
      setAccounts((prev) => [...prev, data]);
      setNotice({ ...data, password: form.password, reset: false });
      setForm(EMPTY);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create the account.');
    } finally {
      setSaving(false);
    }
  }

  const actionsBusy = (account) => {
    const id = accountId(account);
    return resetting === id || removing === id || toggling === id;
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{isEmployee ? 'Manage Employees 👤' : 'Manage IT Support 👥'}</h1>
          <p className="muted">
            {isEmployee
              ? 'Create employee logins, reset passwords, and control account access.'
              : 'Create or reset logins for the agents who help employees, then share their credentials.'}
          </p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {actionError && <div className="alert alert-error">{actionError}</div>}

      {notice && (
        <div className="alert alert-success">
          <strong>
            {notice.name} {notice.reset ? 'has a new password.' : 'can now sign in.'}
          </strong>
          <span>Email: {notice.email}</span>
          <span>Password: {notice.password}</span>
        </div>
      )}

      <section className="card form-card">
        <h2>{isEmployee ? 'Add an employee' : 'Add an IT support agent'}</h2>
        <form onSubmit={submit}>
          <div className="form-row">
            <div className="field">
              <label htmlFor="account-name">Full name</label>
              <input
                id="account-name"
                value={form.name}
                onChange={update('name')}
                placeholder={isEmployee ? 'Asha Patel' : 'Riya Sharma'}
                maxLength={80}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="account-email">Work email</label>
              <input
                id="account-email"
                type="email"
                value={form.email}
                onChange={update('email')}
                placeholder={isEmployee ? 'asha@company.com' : 'riya@company.com'}
                autoComplete="off"
                required
              />
              <span className="muted small">
                {isEmployee
                  ? 'Must be a @company.com address.'
                  : 'The agent will use this email to sign in.'}
              </span>
            </div>
          </div>
          <div className="field">
            <label htmlFor="account-password">Password</label>
            <input
              id="account-password"
              type="text"
              value={form.password}
              onChange={update('password')}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
            />
            <span className="muted small">
              Share this password with the {person} so they can sign in and change it in Settings.
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
          <h2>{isEmployee ? 'Employee accounts' : 'IT support accounts'}</h2>
          <span className="muted small">{accounts.length} total</span>
        </div>

        {listError && <div className="alert alert-error">{listError}</div>}
        {loading ? (
          <p className="muted">Loading accounts…</p>
        ) : listError ? (
          <div className="empty-state">
            <span>⚠️</span>
            <h3>Could not load accounts</h3>
            <button className="btn btn-outline" onClick={retry}>Try again</button>
          </div>
        ) : accounts.length === 0 ? (
          <div className="empty-state">
            <span>👥</span>
            <h3>No accounts yet</h3>
            <p className="muted">
              {isEmployee
                ? 'Create the first employee login above.'
                : 'Create the first IT support login above.'}
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  {isEmployee && <th>Status</th>}
                  <th>Role</th>
                  {isEmployee && <th>Tickets</th>}
                  <th>Added</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => {
                  const id = accountId(account);
                  const inactive = account.active === false;
                  const hasTickets = (account.ticketCount || 0) > 0;
                  return (
                    <tr key={id}>
                      <td className="issue-title">{account.name}</td>
                      <td>{account.email}</td>
                      {isEmployee && (
                        <td>
                          <span className={`badge ${inactive ? 'high' : 'resolved'}`}>
                            {inactive ? 'Inactive' : 'Active'}
                          </span>
                        </td>
                      )}
                      <td>
                        <span className={`badge ${isEmployee ? 'open' : 'progress'}`}>
                          {labelTitle}
                        </span>
                      </td>
                      {isEmployee && <td>{account.ticketCount || 0}</td>}
                      <td className="muted">{formatDate(account.createdAt)}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="link-btn"
                            disabled={actionsBusy(account)}
                            onClick={() => resetPassword(account)}
                          >
                            {resetting === id ? 'Resetting…' : 'Reset password'}
                          </button>
                          {isEmployee ? (
                            <>
                              <button
                                className="link-btn"
                                disabled={actionsBusy(account)}
                                onClick={() => toggleActive(account)}
                              >
                                {toggling === id
                                  ? 'Saving…'
                                  : inactive
                                    ? 'Reactivate'
                                    : 'Deactivate'}
                              </button>
                              <button
                                className="link-btn danger"
                                disabled={actionsBusy(account) || hasTickets}
                                title={
                                  hasTickets
                                    ? 'This employee has tickets. Deactivate the account instead.'
                                    : undefined
                                }
                                onClick={() => remove(account)}
                              >
                                {removing === id ? 'Removing…' : 'Delete'}
                              </button>
                            </>
                          ) : (
                            <button
                              className="link-btn danger"
                              disabled={actionsBusy(account)}
                              onClick={() => remove(account)}
                            >
                              {removing === id ? 'Removing…' : 'Remove'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
