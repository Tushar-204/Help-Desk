import { useState } from 'react';
import ChatBot from './components/ChatBot.jsx';
import TicketForm from './components/TicketForm.jsx';
import Dashboard from './components/Dashboard.jsx';

export default function App() {
  const [view, setView] = useState('home');
  const [problem, setProblem] = useState(null); // { category, description } once support is needed

  return (
    <div className="app">
      <header className="header">
        <h1>HelpDesk</h1>
        <nav>
          <button
            className={`nav-btn ${view === 'home' ? 'active' : ''} `}
            onClick={() => setView('home')}
            
          >
            Support Chat
          </button>
          <button
            className={`nav-btn ${view === 'dashboard' ? 'active' : ''}`}
            onClick={() => setView('dashboard')}
          >
            Support Dashboard
          </button>
        </nav>
      </header>

      <main className="main">
        {view === 'home' ? (
          <div className="home">
            <ChatBot onNeedSupport={setProblem} />
            {problem && <TicketForm problem={problem} onDone={() => setProblem(null)} />}
          </div>
        ) : (
          <Dashboard />
        )}
      </main>
    </div>
  );
}
