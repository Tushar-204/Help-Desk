import { useEffect, useState } from 'react';
import api from '../api';

const ICONS = {
  Login: '🔐',
  Password: '🔑',
  Payment: '💳',
  Internet: '📶',
  Hardware: '🖨️',
  Email: '📧',
  'Application Error': '💻',
};

export default function KnowledgeBase() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let ignore = false;
    api
      .get('/bot/instructions')
      .then((res) => {
        if (ignore) return;
        setCategories(res.data);
        setError('');
      })
      .catch(() => !ignore && setError('Could not load the knowledge base.'))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [reload]);

  function retry() {
    setLoading(true);
    setError('');
    setReload((n) => n + 1);
  }

  const term = search.trim().toLowerCase();
  const filtered = categories
    .map((category) => ({
      ...category,
      steps: category.steps.filter(
        (step) => !term || step.toLowerCase().includes(term) || category.name.toLowerCase().includes(term)
      ),
    }))
    .filter((category) => category.steps.length > 0);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Knowledge Base 📚</h1>
          <p className="muted">Self-service fixes for the most common IT problems.</p>
        </div>
      </div>

      <div className="search kb-search">
        <span aria-hidden="true">🔎</span>
        <input
          type="search"
          placeholder="Search solutions…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search solutions"
        />
      </div>

      {loading && <p className="muted">Loading solutions…</p>}

      {!loading && error && (
        <div className="card empty-state">
          <span>⚠️</span>
          <h3>Could not load the knowledge base</h3>
          <p className="muted">{error}</p>
          <button className="btn btn-outline" onClick={retry}>Try again</button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="card empty-state">
          <span>🔍</span>
          <h3>No solutions found</h3>
          <p className="muted">Try a different keyword, or start an AI Support chat.</p>
        </div>
      )}

      {!error && <div className="kb-grid">
        {filtered.map((category) => (
          <details key={category.name} className="kb-card" open={term ? true : undefined}>
            <summary>
              <span className="kb-icon">{ICONS[category.name] || '🛠️'}</span>
              <span className="kb-title">
                <strong>{category.name}</strong>
                <span className="muted small">{category.steps.length} steps</span>
              </span>
              <span className="kb-chevron">▾</span>
            </summary>
            <ol className="steps kb-steps">
              {category.steps.map((step, index) => (
                <li key={step}>
                  <span className="step-num">{index + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </details>
        ))}
      </div>}
    </>
  );
}
