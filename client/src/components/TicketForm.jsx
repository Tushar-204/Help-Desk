import { useEffect, useState } from 'react';
import api from '../api';

const PRIORITIES = ['Low', 'Medium', 'High'];

export default function TicketForm({ draft, onCancel, onCreated }) {
  const [title, setTitle] = useState(draft.title);
  const [description, setDescription] = useState(draft.description);
  const [category, setCategory] = useState(draft.category || 'General');
  const [priority, setPriority] = useState(draft.priority || 'Medium');
  const [steps, setSteps] = useState(
    (draft.attemptedSteps || []).map((text) => ({ text, checked: true }))
  );
  const [categories, setCategories] = useState(['General']);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/bot/instructions')
      .then((res) => setCategories(['General', ...res.data.map((c) => c.name)]))
      .catch(() => {});
  }, []);

  function toggleStep(index) {
    setSteps((prev) =>
      prev.map((step, i) => (i === index ? { ...step, checked: !step.checked } : step))
    );
  }

  async function submit(e) {
    e.preventDefault();
    if (saving) return;
    if (!title.trim() || !description.trim()) {
      setError('Please enter the issue title and describe the problem.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const { data } = await api.post('/tickets', {
        title,
        description,
        category,
        priority,
        attemptedSteps: steps.filter((s) => s.checked).map((s) => s.text),
      });
      onCreated(data);
      window.scrollTo(0, 0);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create the ticket. Please try again.');
      setSaving(false);
    }
  }

  return (
    <form className="card form-card" onSubmit={submit}>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="field">
        <label htmlFor="ticket-title">Issue Title</label>
        <input
          id="ticket-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Short summary of the problem"
          maxLength={120}
          required
        />
      </div>

      <div className="form-row">
        <div className="field">
          <label htmlFor="ticket-category">Category</label>
          <select
            id="ticket-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Priority</label>
          <div className="pills">
            {PRIORITIES.map((level) => (
              <label key={level} className={`pill ${priority === level ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="priority"
                  value={level}
                  checked={priority === level}
                  onChange={() => setPriority(level)}
                />
                {level}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="field">
        <label htmlFor="ticket-description">Description</label>
        <textarea
          id="ticket-description"
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What happened? Include any error messages."
          maxLength={2000}
          required
        />
        <span className="muted small">{description.length}/2000</span>
      </div>

      <div className="field">
        <label>AI Troubleshooting Attempted</label>
        {steps.length === 0 ? (
          <p className="muted small">No troubleshooting steps were recorded in this chat.</p>
        ) : (
          <div className="step-checklist">
            {steps.map((step, index) => (
              <label key={step.text} className="checkbox">
                <input
                  type="checkbox"
                  checked={step.checked}
                  onChange={() => toggleStep(index)}
                />
                {step.text}
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="form-actions">
        <button className="btn btn-outline" type="button" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? 'Creating…' : 'Submit Ticket'}
        </button>
      </div>
    </form>
  );
}
