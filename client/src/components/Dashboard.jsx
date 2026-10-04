import { useEffect, useState } from 'react';
import api from '../api';
import TicketList from './TicketList.jsx';

const STATUSES = ['Open', 'In Progress', 'Resolved'];
const PRIORITIES = ['Low', 'Medium', 'High'];

export default function Dashboard() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/tickets');
      setTickets(data);
    } catch (err) {
      setError('Could not load tickets: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'Open').length,
    inProgress: tickets.filter((t) => t.status === 'In Progress').length,
    resolved: tickets.filter((t) => t.status === 'Resolved').length,
  };

  const visible = tickets.filter((t) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      t.token.toLowerCase().includes(q) ||
      t.title.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  async function updateStatus(status) {
    if (!selected) return;
    setSaving(true);
    setError('');
    try {
      const { data } = await api.put(`/tickets/${selected._id}`, { status });
      setSelected(data);
      setTickets((list) => list.map((t) => (t._id === data._id ? data : t)));
    } catch (err) {
      setError('Could not update status: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!selected) return;
    if (!window.confirm(`Delete ${selected.token}?`)) return;
    try {
      await api.delete(`/tickets/${selected._id}`);
      setTickets((list) => list.filter((t) => t._id !== selected._id));
      setSelected(null);
    } catch (err) {
      setError('Could not delete ticket: ' + (err.response?.data?.error || err.message));
    }
  }

  return (
    <div className="dashboard">
      <div className="stats">
        <div className="stat card"><span>Total Tickets</span><strong>{stats.total}</strong></div>
        <div className="stat card stat-open"><span>Open</span><strong>{stats.open}</strong></div>
        <div className="stat card stat-progress"><span>In Progress</span><strong>{stats.inProgress}</strong></div>
        <div className="stat card stat-resolved"><span>Resolved</span><strong>{stats.resolved}</strong></div>
      </div>

      <div className="toolbar">
        <input
          className="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by token, title or description"
          aria-label="Search tickets"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
          <option>All</option>
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      {error && <p className="error">{error}</p>}
      {loading ? (
        <p className="muted">Loading tickets...</p>
      ) : (
        <div className="dashboard-body">
          <div className="list-pane">
            <TicketList
              tickets={visible}
              selectedId={selected?._id}
              onSelect={setSelected}
              emptyText={search || statusFilter !== 'All' ? 'No tickets match your search.' : 'No tickets yet.'}
            />
          </div>

          <div className="detail-pane">
            {!selected ? (
              <p className="muted">Select a ticket to view details.</p>
            ) : (
              <div className="card detail">
                <div className="detail-head">
                  <span className="token">{selected.token}</span>
                  <span className={`badge status-${selected.status.replace(/\s/g, '')}`}>{selected.status}</span>
                </div>
                <h3>{selected.title}</h3>
                <p className="muted">{new Date(selected.createdAt).toLocaleString()}</p>
                <p><b>Category:</b> {selected.category}</p>
                <p><b>Priority:</b> <span className={`priority priority-${selected.priority}`}>{selected.priority}</span></p>
                <p><b>Description:</b></p>
                <p className="description">{selected.description || '—'}</p>

                <label className="status-label">
                  Status
                  <select
                    value={selected.status}
                    onChange={(e) => updateStatus(e.target.value)}
                    disabled={saving}
                  >
                    {STATUSES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>

                <div className="form-actions">
                  <button className="btn btn-danger" onClick={remove}>Delete Ticket</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
