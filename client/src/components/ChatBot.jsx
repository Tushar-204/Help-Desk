import { useState, useRef, useEffect } from 'react';
import api from '../api';

export default function ChatBot({ onNeedSupport }) {
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hello! Describe your technical problem and I will try to help.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [asked, setAsked] = useState(null); // { category, question } while buttons are shown
  const [answered, setAnswered] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(e) {
    e.preventDefault();
    const message = input.trim();
    if (!message || loading) return;

    setMessages((m) => [...m, { from: 'user', text: message }]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/bot/message', { message });
      setMessages((m) => [...m, { from: 'bot', text: data.reply, steps: data.steps }]);
      if (data.category) {
        setAsked({ category: data.category, description: message });
        setAnswered(false);
      } else {
        // no match: offer support directly
        setAsked({ category: 'General', description: message });
        setAnswered(false);
      }
    } catch (err) {
      setMessages((m) => [
        ...m,
        { from: 'bot', text: 'Sorry, the server is unreachable right now. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function solved() {
    setAsked(null);
    setAnswered(true);
    onNeedSupport(null);
    setMessages((m) => [...m, { from: 'bot', text: 'Great! Your problem is solved. 🎉 If it happens again, come back anytime.' }]);
  }

  function needSupport() {
    const problem = asked;
    setAsked(null);
    onNeedSupport(problem);
  }

  return (
    <section className="chatbox">
      <div className="chat-log">
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.from}`}>
            <p>{m.text}</p>
            {m.steps?.length > 0 && (
              <ol className="steps">
                {m.steps.map((s, j) => (
                  <li key={j}>{s}</li>
                ))}
              </ol>
            )}
          </div>
        ))}
        {loading && <div className="msg bot"><p>...</p></div>}
        {asked && !answered && (
          <div className="ask-actions">
            <p>Did this solve your problem?</p>
            <div className="ask-buttons">
              <button className="btn btn-green" onClick={solved}>Yes, Problem Solved</button>
              <button className="btn btn-red" onClick={needSupport}>No, Need Technical Support</button>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form className="chat-input" onSubmit={send}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe your problem... e.g. I cannot login"
          aria-label="Describe your problem"
        />
        <button className="btn" type="submit" disabled={loading}>Send</button>
      </form>
    </section>
  );
}
