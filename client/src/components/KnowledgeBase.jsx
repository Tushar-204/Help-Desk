import { useEffect, useState } from 'react';
import api from '../api';

const ICONS = {
  Login: '🔐',
  Password: '🔑',
  Payment: '💳',
  Internet: '📶',
  'Application Error': '💻',
};

export default function KnowledgeBase() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api
      .get('/bot/instructions')
      .then((res) => setCategories(res.data))
      .catch(() => setError('Could not load the knowledge base.'))
      .finally(() => setLoading(false));
  }, []);

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

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <p className="muted">Loading solutions…</p>}

      {!loading && filtered.length === 0 && (
        <div className="card empty-state">
          <span>🔍</span>
          <h3>No solutions found</h3>
          <p className="muted">Try a different keyword, or start an AI Support chat.</p>
        </div>
      )}

      <div className="kb-grid">
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
      </div>
    </>
  );
}
