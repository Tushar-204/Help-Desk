import { useEffect, useRef, useState } from 'react';
import api from '../api';
import { StatusBadge } from './TicketTable';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
  { id: 'ai', label: 'AI Support', icon: '🤖', employeeOnly: true },
  { id: 'tickets', label: 'My Tickets', icon: '🎫', adminLabel: 'Support Queue' },
  { id: 'team', label: 'Manage IT Support', icon: '👥', adminOnly: true },
  { id: 'kb', label: 'Knowledge Base', icon: '📚', employeeOnly: true },
  { id: 'help', label: 'Help', icon: '❓' },
];

function initials(name = '') {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function NotificationPanel({ onClose, onOpenTicket }) {
  const [tickets, setTickets] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/tickets')
      .then((res) => setTickets(res.data))
      .catch(() => setError('Could not load notifications.'));
  }, []);

  return (
    <div className="dropdown notif-panel">
      <div className="dropdown-head">
        <strong>Notifications</strong>
        <button className="link-btn" onClick={onClose}>Close</button>
      </div>
      {error && <p className="dropdown-empty">{error}</p>}
      {!tickets && !error && <p className="dropdown-empty">Loading…</p>}
      {tickets && tickets.length === 0 && (
        <p className="dropdown-empty">No ticket activity yet.</p>
      )}
      {tickets?.slice(0, 5).map((t) => (
        <button
          key={t._id}
          className="notif-item"
          onClick={() => {
            onOpenTicket(t._id);
            onClose();
          }}
        >
          <span className={`notif-dot ${t.status.replace(' ', '-').toLowerCase()}`} />
          <span className="notif-copy">
            <span className="notif-title">
              {t.token} · {t.title}
            </span>
            <span className="notif-meta">
              <StatusBadge status={t.status} /> <span className="muted small">{t.employee}</span>
            </span>
          </span>
        </button>
      ))}
      {tickets?.length > 0 && (
        <p className="dropdown-foot muted small">Showing the 5 most recent tickets.</p>
      )}
    </div>
  );
}

export default function Layout({
  user,
  page,
  onNavigate,
  onLogout,
  onSearch,
  onOpenTicket,
  children,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menu, setMenu] = useState(null);
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState(null);
  const seen = useRef(null);
  const isAdmin = user.role === 'admin';
  const isStaff = isAdmin || user.role === 'support';
  const roleLabel = isAdmin ? 'Administration' : user.role === 'support' ? 'IT Support' : 'Employee';
  const mySide = user.role === 'employee' ? 'employee' : 'admin';

  useEffect(() => {
    let alive = true;
    const snapshot = (t) => ({ status: t.status, count: t.messages?.length || 0 });

    async function check() {
      try {
        const { data } = await api.get('/tickets');
        if (!alive) return;
        if (!seen.current) {
          seen.current = new Map(data.map((t) => [t._id, snapshot(t)]));
          return;
        }
        const changed = [];
        for (const t of data) {
          const prev = seen.current.get(t._id);
          if (!prev) {
            if (String(t.createdBy) !== String(user.id)) changed.push({ ticket: t, fresh: true });
          } else if (prev.status !== t.status) {
            if (mySide === 'employee') changed.push({ ticket: t, fresh: false });
          } else if (prev.count !== (t.messages?.length || 0)) {
            const lastRole = t.messages?.[t.messages.length - 1]?.role;
            if (lastRole !== mySide) changed.push({ ticket: t, fresh: false });
          }
          seen.current.set(t._id, snapshot(t));
        }
        if (changed.length) setToast({ ...changed[0], count: changed.length });
      } catch {
        // ignore polling errors; the list still loads on demand
      }
    }

    check();
    const id = setInterval(check, 15000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [user.id, user.role, mySide]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(id);
  }, [toast]);

  function go(next) {
    onNavigate(next);
    setSidebarOpen(false);
    setMenu(null);
  }

  function submitSearch(e) {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      setMenu(null);
    }
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="brand">
          <span className="brand-mark">🎧</span> HelpDesk
        </div>

        <nav className="nav">
          <span className="nav-label">Menu</span>
          {NAV.filter(
            (item) =>
              (!item.adminOnly || isAdmin) &&
              (!item.employeeOnly || user.role === 'employee')
          ).map((item) => (
            <button
              key={item.id}
              className={`nav-item ${page === item.id ? 'active' : ''}`}
              onClick={() => go(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              {isStaff && item.adminLabel ? item.adminLabel : item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className={`nav-item ${page === 'settings' ? 'active' : ''}`} onClick={() => go('settings')}>
            <span className="nav-icon">⚙️</span> Settings
          </button>
          <button className="nav-item" onClick={onLogout}>
            <span className="nav-icon">🚪</span> Logout
          </button>
          <div className="user-card">
            <span className="avatar">{initials(user.name)}</span>
            <span className="user-copy">
              <strong>{user.name}</strong>
              <span className="muted small">{roleLabel}</span>
            </span>
          </div>
        </div>
      </aside>

      {sidebarOpen && <button className="sidebar-overlay" aria-label="Close menu" onClick={() => setSidebarOpen(false)} />}

      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" aria-label="Open menu" onClick={() => setSidebarOpen(true)}>
            ☰
          </button>

          <form className="search" onSubmit={submitSearch}>
            <span aria-hidden="true">🔎</span>
            <input
              type="search"
              placeholder="Search tickets, categories…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search tickets"
            />
          </form>

          <div className="topbar-actions">
            <button
              className="icon-btn"
              aria-label="Notifications"
              onClick={() => setMenu(menu === 'notifications' ? null : 'notifications')}
            >
              🔔
            </button>
            <button
              className="profile-btn"
              onClick={() => setMenu(menu === 'profile' ? null : 'profile')}
            >
              <span className="avatar sm">{initials(user.name)}</span>
              <span className="profile-copy">
                <strong>{user.name}</strong>
                <span className="muted small">{roleLabel}</span>
              </span>
              <span className="muted">▾</span>
            </button>
          </div>
        </header>

        {menu && (
          <>
            <button className="menu-backdrop" aria-label="Close menu" onClick={() => setMenu(null)} />
            {menu === 'notifications' ? (
              <NotificationPanel onClose={() => setMenu(null)} onOpenTicket={onOpenTicket} />
            ) : (
              <div className="dropdown profile-panel">
                <div className="profile-head">
                  <span className="avatar lg">{initials(user.name)}</span>
                  <div>
                    <strong>{user.name}</strong>
                    <div className="muted small">{user.email}</div>
                  </div>
                </div>
                <button className="dropdown-link" onClick={() => go('settings')}>⚙️ Settings</button>
                <button className="dropdown-link" onClick={onLogout}>🚪 Logout</button>
              </div>
            )}
          </>
        )}

        <main className="content">{children}</main>
      </div>

      {toast && (
        <button
          className="toast"
          onClick={() => {
            const id = toast.ticket._id;
            setToast(null);
            onOpenTicket(id);
          }}
        >
          <span className="toast-icon" aria-hidden="true">🔔</span>
          <span className="toast-copy">
            <strong>
              {toast.count > 1
                ? `${toast.count} new updates`
                : toast.fresh
                  ? 'New ticket'
                  : 'Ticket updated'}
            </strong>
            <span className="muted small">
              {toast.ticket.token} · {toast.ticket.title}
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
