import { useEffect, useState } from 'react';
import api from '../api';
import TicketTable from './TicketTable';

const TABS = ['All', 'Open', 'In Progress', 'Resolved'];

export default function MyTickets({ admin, initialQuery, onOpenTicket, refreshKey }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(initialQuery || '');
  const [tab, setTab] = useState('All');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let ignore = false;
    api
      .get('/tickets')
      .then((res) => {
        if (ignore) return;
        setTickets(res.data);
        setError('');
      })
      .catch(() => !ignore && setError('Could not load tickets.'))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [refreshKey, reload]);

  function retry() {
    setLoading(true);
    setError('');
    setReload((n) => n + 1);
  }

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
                aria-pressed={tab === item}
                onClick={() => setTab(item)}
              >
                {item} <span className="tab-count">{count(item)}</span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="muted">Loading tickets…</p>
        ) : error ? (
          <div className="empty-state">
            <span>⚠️</span>
            <h3>Could not load tickets</h3>
            <p className="muted">{error}</p>
            <button className="btn btn-outline" onClick={retry}>Try again</button>
          </div>
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
