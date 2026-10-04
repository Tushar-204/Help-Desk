export default function TicketCard({ ticket, selected, onSelect }) {
  return (
    <button
      type="button"
      className={`ticket-card ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(ticket)}
    >
      <div className="ticket-card-top">
        <span className="token">{ticket.token}</span>
        <span className={`badge status-${ticket.status.replace(/\s/g, '')}`}>{ticket.status}</span>
      </div>
      <strong>{ticket.title}</strong>
      <div className="ticket-card-meta">
        <span>{ticket.category}</span>
        <span className={`priority priority-${ticket.priority}`}>{ticket.priority}</span>
      </div>
    </button>
  );
}
