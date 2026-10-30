import { useEffect, useState } from 'react';
import api from '../api';
import TicketTable from './TicketTable';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function SupportDashboard({ user, onOpenTicket, onNavigate, refreshKey }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
      .catch(() => !ignore && setError('Could not load the support queue.'))
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

  const count = (status) => tickets.filter((t) => t.status === status).length;
  const highPriority = tickets.filter(
    (t) => t.priority === 'High' && t.status !== 'Resolved'
  ).length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{greeting()}, IT Support 👋</h1>
          <p className="muted">Here's what needs your attention today.</p>
        </div>
        <button className="btn btn-primary" onClick={() => onNavigate('tickets')}>
          🎫 Open Support Queue
        </button>
      </div>

      <div className="stats">
        <div className="stat-card">
          <span className="stat-icon blue">🎫</span>
          <div>
            <span className="stat-label">Open Tickets</span>
            <strong className="stat-value">{count('Open')}</strong>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon amber">🛠️</span>
          <div>
            <span className="stat-label">In Progress</span>
            <strong className="stat-value">{count('In Progress')}</strong>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon red">🚨</span>
          <div>
            <span className="stat-label">High Priority</span>
            <strong className="stat-value">{highPriority}</strong>
          </div>
        </div>
      </div>

      <section className="card">
        <div className="card-head">
          <h2>Support Queue</h2>
          <button className="link-btn" onClick={() => onNavigate('tickets')}>
            View all →
          </button>
        </div>

        {loading ? (
          <p className="muted">Loading queue…</p>
        ) : error ? (
          <div className="empty-state">
            <span>⚠️</span>
            <h3>Could not load the support queue</h3>
            <p className="muted">{error}</p>
            <button className="btn btn-outline" onClick={retry}>Try again</button>
          </div>
        ) : tickets.length === 0 ? (
          <div className="empty-state">
            <span>✅</span>
            <h3>The queue is clear</h3>
            <p className="muted">New employee tickets will appear here.</p>
          </div>
        ) : (
          <TicketTable tickets={tickets.slice(0, 6)} onOpen={onOpenTicket} showEmployee />
        )}
      </section>
    </>
  );
}
