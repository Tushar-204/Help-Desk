import TicketCard from './TicketCard.jsx';

export default function TicketList({ tickets, selectedId, onSelect, emptyText }) {
  if (!tickets.length) {
    return <p className="muted empty">{emptyText || 'No tickets found.'}</p>;
  }
  return (
    <div className="ticket-list">
      {tickets.map((t) => (
        <TicketCard
          key={t._id}
          ticket={t}
          selected={t._id === selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
