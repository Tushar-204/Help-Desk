const STATUS_CLASS = { Open: 'open', 'In Progress': 'progress', Resolved: 'resolved' };

export function StatusBadge({ status }) {
  return <span className={`badge ${STATUS_CLASS[status] || 'open'}`}>{status}</span>;
}

export function PriorityBadge({ priority }) {
  return <span className={`badge ${priority.toLowerCase()}`}>{priority}</span>;
}

export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function TicketTable({ tickets, onOpen, showEmployee = false }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Ticket</th>
            <th>Issue</th>
            {showEmployee && <th>Employee</th>}
            <th>Priority</th>
            <th>Status</th>
            <th>Created</th>
            <th aria-label="Open" />
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket._id} className="clickable" onClick={() => onOpen(ticket._id)}>
              <td className="token">{ticket.token}</td>
              <td>
                <div className="issue-title">{ticket.title}</div>
                <div className="muted small">{ticket.category}</div>
              </td>
              {showEmployee && <td>{ticket.employee}</td>}
              <td><PriorityBadge priority={ticket.priority} /></td>
              <td><StatusBadge status={ticket.status} /></td>
              <td className="muted">{formatDate(ticket.createdAt)}</td>
              <td className="row-arrow">
                <button
                  className="row-open"
                  aria-label={`Open ${ticket.token}: ${ticket.title}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpen(ticket._id);
                  }}
                >
                  →
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
