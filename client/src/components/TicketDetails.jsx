import { useEffect, useState } from 'react';
import api from '../api';
import {
  StatusBadge,
  PriorityBadge,
  formatDate,
  formatTime,
} from './TicketTable';

const STATUSES = ['Open', 'In Progress', 'Resolved'];

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

export default function TicketDetails({ ticketId, user, onBack }) {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const isStaff = user.role === 'admin' || user.role === 'support';

  useEffect(() => {
    if (!ticketId) {
      setError('Ticket not found.');
      setLoading(false);
      return;
    }
    api
      .get(`/tickets/${ticketId}`)
      .then((res) => setTicket(res.data))
      .catch((err) => setError(err.response?.data?.error || 'Could not load this ticket.'))
      .finally(() => setLoading(false));
  }, [ticketId]);

  async function changeStatus(status) {
    setError('');
    try {
      const { data } = await api.put(`/tickets/${ticketId}`, { status });
      setTicket(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update the status.');
    }
  }

  async function sendReply(e) {
    e.preventDefault();
    if (!reply.trim() || sending) return;
    setSending(true);
    setError('');
    try {
      const { data } = await api.post(`/tickets/${ticketId}/messages`, { text: reply.trim() });
      setTicket(data);
      setReply('');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not send your reply.');
    } finally {
      setSending(false);
    }
  }

  if (loading) return <p className="muted">Loading ticket…</p>;

  if (!ticket) {
    return (
      <section className="card">
        <div className="empty-state">
          <span>⚠️</span>
          <h3>Ticket unavailable</h3>
          <p className="muted">{error || 'This ticket could not be found.'}</p>
          <button className="btn btn-outline" onClick={onBack}>← Back to tickets</button>
        </div>
      </section>
    );
  }

  const currentStatus = STATUSES.indexOf(ticket.status);

  return (
    <>
      <button className="back-link" onClick={onBack}>← Back to {isStaff ? 'queue' : 'my tickets'}</button>

      <div className="page-head ticket-head">
        <div>
          <div className="ticket-head-meta">
            <span className="token">{ticket.token}</span>
            <StatusBadge status={ticket.status} />
          </div>
          <h1>{ticket.title}</h1>
          <p className="muted">
            Created {formatDate(ticket.createdAt)} by {ticket.employee}
          </p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="detail-grid">
        <div className="detail-main">
          <section className="card">
            <h2>Description</h2>
            <p className="description">{ticket.description || 'No description provided.'}</p>
          </section>

          {ticket.attemptedSteps?.length > 0 && (
            <section className="card">
              <h2>AI Troubleshooting Attempted</h2>
              <ul className="check-list">
                {ticket.attemptedSteps.map((step) => (
                  <li key={step}>✅ {step}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="card">
            <h2>Conversation</h2>
            {ticket.messages.length === 0 ? (
              <p className="muted">No messages yet. Start the conversation below.</p>
            ) : (
              <div className="thread">
                {ticket.messages.map((message, index) => (
                  <div
                    key={`${message.createdAt}-${index}`}
                    className={`thread-msg ${message.role === 'admin' ? 'admin' : ''}`}
                  >
                    <span className="avatar">{initials(message.author)}</span>
                    <div className="thread-body">
                      <div className="thread-meta">
                        <strong>{message.author}</strong>
                        <span className={`role-tag ${message.role}`}>
                          {message.role === 'admin' ? 'IT Support' : 'Employee'}
                        </span>
                        <span className="muted small">{formatTime(message.createdAt)}</span>
                      </div>
                      <div className="thread-bubble">{message.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <form className="reply-form" onSubmit={sendReply}>
              <input
                type="text"
                placeholder="Write a reply…"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                maxLength={1000}
                aria-label="Reply message"
              />
              <button className="btn btn-primary" type="submit" disabled={sending || !reply.trim()}>
                {sending ? 'Sending…' : 'Send'}
              </button>
            </form>
          </section>
        </div>

        <aside className="detail-side">
          <section className="card">
            <h2>Details</h2>
            <dl className="detail-list">
              <div><dt>Category</dt><dd>{ticket.category}</dd></div>
              <div><dt>Priority</dt><dd><PriorityBadge priority={ticket.priority} /></dd></div>
              <div><dt>Assigned to</dt><dd>{ticket.assignedTo}</dd></div>
              <div><dt>Employee</dt><dd>{ticket.employee}</dd></div>
              <div><dt>Created</dt><dd>{formatDate(ticket.createdAt)}</dd></div>
            </dl>
          </section>

          <section className="card">
            <h2>Status</h2>
            {isStaff ? (
              <div className="status-options">
                {STATUSES.map((status) => (
                  <button
                    key={status}
                    className={`status-option ${ticket.status === status ? 'active' : ''}`}
                    onClick={() => changeStatus(status)}
                  >
                    {status}
                  </button>
                ))}
                <p className="muted small">Changes are visible to the employee immediately.</p>
              </div>
            ) : (
              <ol className="timeline">
                {STATUSES.map((status, index) => (
                  <li
                    key={status}
                    className={index < currentStatus ? 'done' : index === currentStatus ? 'current' : ''}
                  >
                    <span className="timeline-dot" />
                    {status}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
