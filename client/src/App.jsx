import { useCallback, useEffect, useState } from 'react';
import { loadSession, saveSession, clearSession } from './api';
import LoginPage from './components/LoginPage';
import Layout from './components/Layout';
import EmployeeDashboard from './components/EmployeeDashboard';
import AdminDashboard from './components/AdminDashboard';
import ManageTeam from './components/ManageTeam';
import AiSupport from './components/AiSupport';
import MyTickets from './components/MyTickets';
import TicketDetails from './components/TicketDetails';
import KnowledgeBase from './components/KnowledgeBase';
import HelpPage from './components/HelpPage';
import Settings from './components/Settings';

const PAGES = new Set(['dashboard', 'ai', 'tickets', 'ticket', 'team', 'kb', 'help', 'settings']);

export default function App() {
  const [session, setSession] = useState(loadSession);
  const [page, setPage] = useState('dashboard');
  const [ticketId, setTicketId] = useState(null);
  const [ticketQuery, setTicketQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const bumpActivity = useCallback(() => setRefreshKey((key) => key + 1), []);

  // Seed the first history entry so Back returns to the login screen instead
  // of leaving the site.
  useEffect(() => {
    window.history.replaceState({ page: session ? page : 'login' }, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onPop(event) {
      const state = event.state;
      if (!state?.page || state.page === 'login') {
        clearSession();
        setSession(null);
        setPage('dashboard');
        setTicketId(null);
        return;
      }
      if (!loadSession()) {
        setSession(null);
        return;
      }
      setPage(state.page);
      setTicketId(state.ticketId || null);
    }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    function onUnauthorized() {
      setSession(null);
      setPage('dashboard');
      setTicketId(null);
      window.history.replaceState({ page: 'login' }, '');
    }
    window.addEventListener('helpdesk:unauthorized', onUnauthorized);
    return () => window.removeEventListener('helpdesk:unauthorized', onUnauthorized);
  }, []);

  function handleLogin(next, remember) {
    saveSession(next, remember);
    setSession(next);
    setPage('dashboard');
    window.history.pushState({ page: 'dashboard' }, '');
  }

  function handleLogout() {
    clearSession();
    setSession(null);
    setPage('dashboard');
    setTicketId(null);
    window.history.replaceState({ page: 'login' }, '');
  }

  function navigate(next) {
    setPage(next);
    if (next !== 'ticket') setTicketId(null);
    if (next !== page) window.history.pushState({ page: next }, '');
    window.scrollTo(0, 0);
  }

  function openTicket(id) {
    setTicketId(id);
    setPage('ticket');
    window.history.pushState({ page: 'ticket', ticketId: id }, '');
    window.scrollTo(0, 0);
  }

  function backToTickets() {
    setPage('tickets');
    setTicketId(null);
    window.history.replaceState({ page: 'tickets' }, '');
    window.scrollTo(0, 0);
  }

  useEffect(() => {
    if (!session) return;
    const role = session.user.role;
    const blocked =
      (role !== 'employee' && (page === 'ai' || page === 'kb')) ||
      (role !== 'admin' && page === 'team');
    if (blocked) {
      setPage('dashboard');
      window.history.replaceState({ page: 'dashboard' }, '');
    }
  }, [session, page]);

  function searchTickets(value) {
    setTicketQuery(value);
    setPage('tickets');
    if (page !== 'tickets') window.history.pushState({ page: 'tickets' }, '');
  }

  if (!session) return <LoginPage onLogin={handleLogin} />;

  const isAdmin = session.user.role === 'admin';
  const isStaff = isAdmin || session.user.role === 'support';

  return (
    <Layout
      user={session.user}
      page={page}
      onNavigate={navigate}
      onLogout={handleLogout}
      onSearch={searchTickets}
      onOpenTicket={openTicket}
      onActivity={bumpActivity}
    >
      {page === 'dashboard' &&
        (isStaff ? (
          <AdminDashboard
            user={session.user}
            onOpenTicket={openTicket}
            onNavigate={navigate}
            refreshKey={refreshKey}
          />
        ) : (
          <EmployeeDashboard
            user={session.user}
            onNavigate={navigate}
            onOpenTicket={openTicket}
            refreshKey={refreshKey}
          />
        ))}
      {page === 'ai' && !isStaff && (
        <AiSupport user={session.user} onOpenTicket={openTicket} onNavigate={navigate} />
      )}
      {page === 'tickets' && (
        <MyTickets
          admin={isStaff}
          initialQuery={ticketQuery}
          onOpenTicket={openTicket}
          refreshKey={refreshKey}
        />
      )}
      {page === 'ticket' && (
        <TicketDetails
          ticketId={ticketId}
          user={session.user}
          onBack={backToTickets}
          refreshKey={refreshKey}
        />
      )}
      {page === 'team' && isAdmin && <ManageTeam />}
      {page === 'kb' && !isStaff && <KnowledgeBase />}
      {page === 'help' && <HelpPage user={session.user} />}
      {page === 'settings' && <Settings user={session.user} onLogout={handleLogout} />}
      {!PAGES.has(page) && (
        <section className="card empty-state">
          <span>🧭</span>
          <h3>Page not found</h3>
          <p className="muted">That page is not available.</p>
          <button className="btn btn-outline" onClick={() => navigate('dashboard')}>
            Back to dashboard
          </button>
        </section>
      )}
    </Layout>
  );
}
