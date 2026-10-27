import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './App.css';

class ErrorBoundary extends React.Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="login">
          <main className="login-form-wrap" style={{ gridColumn: '1 / -1' }}>
            <section className="login-card">
              <h2>Something went wrong</h2>
              <p className="muted">Reload the page to try again.</p>
              <button className="btn btn-primary btn-full" onClick={() => window.location.reload()}>
                Reload
              </button>
            </section>
          </main>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
