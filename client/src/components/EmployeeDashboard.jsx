import { useEffect, useState } from 'react';
import api from '../api';
import TicketTable from './TicketTable';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function EmployeeDashboard({ user, onNavigate, onOpenTicket }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/tickets')
      .then((res) => setTickets(res.data))
      .catch(() => setError('Could not load your tickets.'))
      .finally(() => setLoading(false));
  }, []);

  const count = (status) => tickets.filter((t) => t.status === status).length;
  const firstName = user.name.split(' ')[0];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>
            {greeting()}, {firstName} 👋
          </h1>
          <p className="muted">Here's an overview of your support requests.</p>
        </div>
        <button className="btn btn-primary" onClick={() => onNavigate('ai')}>
          🤖 Start AI Support
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
          <span className="stat-icon green">✅</span>
          <div>
            <span className="stat-label">Resolved</span>
            <strong className="stat-value">{count('Resolved')}</strong>
          </div>
        </div>
      </div>

      <section className="help-cta">
        <div>
          <h2>Need IT Help? 🤖</h2>
          <p>Describe the issue and our AI assistant will guide you through a fix in seconds.</p>
        </div>
        <div className="help-cta-actions">
          <button className="btn btn-white" onClick={() => onNavigate('ai')}>
            Start AI Support →
          </button>
          <button className="btn btn-ghost-light" onClick={() => onNavigate('tickets')}>
            View My Tickets
          </button>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Recent Tickets</h2>
          <button className="link-btn" onClick={() => onNavigate('tickets')}>
            View all →
          </button>
        </div>

        {loading ? (
          <p className="muted">Loading tickets…</p>
        ) : tickets.length === 0 ? (
          <div className="empty-state">
            <span>🎫</span>
            <h3>No tickets yet</h3>
            <p className="muted">Start a chat with AI Support to report your first issue.</p>
            <button className="btn btn-primary" onClick={() => onNavigate('ai')}>
              Get Help Now
            </button>
          </div>
        ) : (
          <TicketTable tickets={tickets.slice(0, 5)} onOpen={onOpenTicket} />
        )}
      </section>
    </>
  );
}
