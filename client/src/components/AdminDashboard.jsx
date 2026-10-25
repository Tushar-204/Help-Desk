import { useEffect, useState } from 'react';
import api from '../api';
import TicketTable from './TicketTable';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function AdminDashboard({ user, onOpenTicket, onNavigate }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/tickets')
      .then((res) => setTickets(res.data))
      .catch(() => setError('Could not load the support queue.'))
      .finally(() => setLoading(false));
  }, []);

  const count = (status) => tickets.filter((t) => t.status === status).length;
  const highPriority = tickets.filter(
    (t) => t.priority === 'High' && t.status !== 'Resolved'
  ).length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{greeting()}, {user?.role === 'admin' ? 'Administration' : 'IT Support'} 👋</h1>
          <p className="muted">Here's what needs your attention today.</p>
        </div>
        <button className="btn btn-primary" onClick={() => onNavigate('tickets')}>
          🎫 Open Support Queue
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

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
