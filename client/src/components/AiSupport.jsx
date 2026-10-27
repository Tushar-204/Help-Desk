import { useEffect, useRef, useState } from 'react';
import api from '../api';
import TicketForm from './TicketForm';
import { PriorityBadge } from './TicketTable';

const QUICK_HELP = [
  { label: '🌐 Wi-Fi', text: 'My Wi-Fi keeps disconnecting.' },
  { label: '🖨️ Printer', text: 'My printer is not working.' },
  { label: '💻 Computer', text: 'My computer is running very slow.' },
  { label: '🔑 Password', text: 'I need help resetting my password.' },
  { label: '📧 Email', text: 'I cannot send or receive emails.' },
  { label: '❓ Other', text: 'I have a different IT problem.' },
];

const MAX_TURNS = 10;

export default function AiSupport({ user, onOpenTicket, onNavigate }) {
  const firstName = user.name.split(' ')[0];
  const nextId = useRef(2);
  const endRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      id: 1,
      from: 'bot',
      text: `Hi ${firstName}! I'm your IT support assistant. Describe the issue and I'll walk you through fixes. If I can't solve it, I'll set up a support ticket for you.`,
      steps: [],
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [turns, setTurns] = useState(0);
  const [stepsSeen, setStepsSeen] = useState([]);
  const [category, setCategory] = useState(null);
  const [askSolved, setAskSolved] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState(null);
  const [created, setCreated] = useState(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, sending, askSolved, escalated]);

  async function send(text) {
    const clean = String(text || '').trim();
    if (!clean || sending || created) return;

    const history = messages.slice(-12).map(({ from, text: t }) => ({ from, text: t }));
    const nextTurns = turns + 1;

    setMessages((prev) => [...prev, { id: nextId.current++, from: 'user', text: clean }]);
    setInput('');
    setSending(true);
    setAskSolved(false);
    setError('');

    try {
      const { data } = await api.post('/bot/message', {
        message: clean,
        history,
        userTurns: nextTurns,
        seenSteps: stepsSeen,
        topic: category || undefined,
      });
      setTurns(nextTurns);
      setMessages((prev) => [
        ...prev,
        { id: nextId.current++, from: 'bot', text: data.reply, steps: data.steps || [] },
      ]);
      // The first matched topic is the ticket subject; later "still broken" replies
      // can false-match other keywords, so don't let them override it.
      const primary = category || data.category;
      if (data.category && !category) setCategory(data.category);
      if (data.steps?.length && data.category === primary) {
        setStepsSeen((prev) => [...new Set([...prev, ...data.steps])]);
      }
      setAskSolved(Boolean(data.steps?.length) && !data.escalate);
      if (data.escalate) setEscalated(true);
    } catch (err) {
      setError(err.response?.data?.error || 'The assistant is unavailable right now. Please try again.');
    } finally {
      setSending(false);
    }
  }

  function submit(e) {
    e.preventDefault();
    send(input);
  }

  function markSolved() {
    setMessages((prev) => [
      ...prev,
      {
        id: nextId.current++,
        from: 'bot',
        text: 'Great! I’m glad that worked. 🎉 If anything else comes up, I’m right here.',
        steps: [],
      },
    ]);
    setAskSolved(false);
  }

  function openTicketForm() {
    const userTexts = messages.filter((m) => m.from === 'user').map((m) => m.text);
    setDraft({
      title: (userTexts[0] || 'IT support request').slice(0, 80),
      description: userTexts.join('\n\n').slice(0, 2000),
      category: category || 'General',
      priority: 'Medium',
      attemptedSteps: stepsSeen,
    });
  }

  if (created) {
    return (
      <section className="success-card">
        <span className="success-icon">✅</span>
        <h1>Ticket Created Successfully</h1>
        <p className="muted">
          Your request has been sent to IT support. They will reply in the ticket conversation.
        </p>
        <div className="success-token">{created.token}</div>
        <dl className="success-details">
          <div><dt>Issue</dt><dd>{created.title}</dd></div>
          <div><dt>Category</dt><dd>{created.category}</dd></div>
          <div><dt>Priority</dt><dd><PriorityBadge priority={created.priority} /></dd></div>
        </dl>
        <div className="success-actions">
          <button className="btn btn-primary" onClick={() => onOpenTicket(created._id)}>
            View Ticket
          </button>
          <button className="btn btn-outline" onClick={() => onNavigate('dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </section>
    );
  }

  if (draft) {
    return (
      <>
        <div className="page-head">
          <div>
            <h1>Create Support Ticket</h1>
            <p className="muted">Review the details and send it to the IT support team.</p>
          </div>
        </div>
        <TicketForm draft={draft} onCancel={() => setDraft(null)} onCreated={setCreated} />
      </>
    );
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>AI Support Assistant 🤖</h1>
          <p className="muted">
            Describe your issue and chat with the assistant — a ticket is offered after 10 messages
            if it still isn't solved.
          </p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="chat-card">
        <header className="chat-head">
          <span className="bot-avatar">🤖</span>
          <div className="chat-head-copy">
            <strong>IT Support Assistant</strong>
            <span className="online"><span className="dot" /> Online</span>
          </div>
          <span className="chat-counter">
            Message {Math.min(turns, MAX_TURNS)} of {MAX_TURNS}
          </span>
        </header>

        <div className="chat-body" role="log" aria-live="polite" aria-relevant="additions">
          {messages.map((message) => (
            <div key={message.id} className={`msg ${message.from}`}>
              {message.from === 'bot' && <span className="bot-avatar sm">🤖</span>}
              <div className="msg-bubble">
                <p>{message.text}</p>
                {message.steps?.length > 0 && (
                  <ol className="steps">
                    {message.steps.map((step, index) => (
                      <li key={step}>
                        <span className="step-num">{index + 1}</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          ))}

          {sending && (
            <div className="msg bot">
              <span className="bot-avatar sm">🤖</span>
              <div className="msg-bubble typing" aria-label="Assistant is typing">
                <span /><span /><span />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {turns === 0 && (
          <div className="chips">
            {QUICK_HELP.map((item) => (
              <button key={item.label} className="chip" onClick={() => send(item.text)}>
                {item.label}
              </button>
            ))}
          </div>
        )}

        {askSolved && !escalated && (
          <div className="chat-actions">
            <button className="btn btn-outline" onClick={markSolved}>✅ Yes, solved</button>
            <button
              className="btn btn-outline"
              onClick={() => send("I tried those steps, but it's still not working.")}
            >
              ❌ Still not working
            </button>
          </div>
        )}

        {escalated ? (
          <div className="escalation">
            <span>I've passed my limit for this chat. Our IT team can take it from here. 🎫</span>
            <button className="btn btn-primary" onClick={openTicketForm}>
              Create Support Ticket
            </button>
          </div>
        ) : (
          <form className="chat-input" onSubmit={submit}>
            <input
              type="text"
              placeholder="Describe your issue…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={sending}
              maxLength={1000}
              aria-label="Message"
            />
            <button className="btn btn-primary" type="submit" disabled={sending || !input.trim()}>
              Send
            </button>
          </form>
        )}
      </section>
    </>
  );
}
