import { useEffect, useState } from 'react';
import api from '../api';
import TicketTable from './TicketTable';

const TABS = ['All', 'Open', 'In Progress', 'Resolved'];

export default function MyTickets({ admin, initialQuery, onOpenTicket }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(initialQuery || '');
  const [tab, setTab] = useState('All');

  useEffect(() => {
    api
      .get('/tickets')
      .then((res) => setTickets(res.data))
      .catch(() => setError('Could not load tickets.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setSearch(initialQuery || '');
    setTab('All');
  }, [initialQuery]);

  const term = search.trim().toLowerCase();
  const filtered = tickets.filter((ticket) => {
    const matchesTab = tab === 'All' || ticket.status === tab;
    const matchesTerm =
      !term ||
      [ticket.token, ticket.title, ticket.category, ticket.employee]
        .join(' ')
        .toLowerCase()
        .includes(term);
    return matchesTab && matchesTerm;
  });

  const count = (status) =>
    status === 'All' ? tickets.length : tickets.filter((t) => t.status === status).length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{admin ? 'Support Queue' : 'My Tickets'}</h1>
          <p className="muted">
            {admin
              ? 'Every ticket raised by employees, newest first.'
              : 'Track the support requests you have raised.'}
          </p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="card">
        <div className="tickets-toolbar">
          <div className="search inline">
            <span aria-hidden="true">🔎</span>
            <input
              type="search"
              placeholder="Search by ticket, issue or employee…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search tickets"
            />
          </div>
          <div className="tabs">
            {TABS.map((item) => (
              <button
                key={item}
                className={`tab ${tab === item ? 'active' : ''}`}
                onClick={() => setTab(item)}
              >
                {item} <span className="tab-count">{count(item)}</span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="muted">Loading tickets…</p>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <span>🔍</span>
            <h3>No tickets found</h3>
            <p className="muted">
              {tickets.length === 0
                ? 'Nothing here yet. Tickets raised from AI Support will show up here.'
                : 'Try a different search or status filter.'}
            </p>
          </div>
        ) : (
          <TicketTable tickets={filtered} onOpen={onOpenTicket} showEmployee={admin} />
        )}
      </section>
    </>
  );
}
