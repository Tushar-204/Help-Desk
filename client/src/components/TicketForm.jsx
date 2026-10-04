import { useState } from 'react';
import api from '../api';

const CATEGORIES = ['Login', 'Password', 'Payment', 'Internet', 'Application Error', 'General'];
const PRIORITIES = ['Low', 'Medium', 'High'];

export default function TicketForm({ problem, onDone }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState(problem?.description || '');
  const [category, setCategory] = useState(problem?.category || 'General');
  const [priority, setPriority] = useState('Medium');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!title.trim()) {
      setError('Please enter a title for your request.');
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.post('/tickets', { title, description, category, priority });
      setCreated(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create the support request.');
    } finally {
      setSaving(false);
    }
  }

  if (created) {
    return (
      <section className="ticket-form card">
        <h3>Support request created</h3>
        <p>Your support token is:</p>
        <p className="token">{created.token}</p>
        <p className="muted">Save this token — quote it when you contact support.</p>
        <button className="btn" onClick={onDone}>Back to Chatbot</button>
      </section>
    );
  }

  return (
    <section className="ticket-form card">
      <h3>Create a technical support request</h3>
      {error && <p className="error">{error}</p>}
      <form onSubmit={submit}>
        <label>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short summary of the problem" />
        </label>
        <label>
          Description
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What happened? What did you already try?"
          />
        </label>
        <div className="row">
          <label>
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Priority
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              {PRIORITIES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="form-actions">
          <button className="btn" type="submit" disabled={saving}>
            {saving ? 'Creating...' : 'Create Support Request'}
          </button>
          <button className="btn btn-ghost" type="button" onClick={onDone}>Cancel</button>
        </div>
      </form>
    </section>
  );
}
