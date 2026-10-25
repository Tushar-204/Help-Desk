const FAQS = [
  {
    q: 'How do I reset my password?',
    a: 'Use the “Forgot password?” link on the sign-in page, or start an AI Support chat and choose Password for step-by-step help.',
  },
  {
    q: 'How do I create a support ticket?',
    a: 'Describe your issue in AI Support. If the suggested fixes do not solve it, choose “Still need help” and submit the prefilled ticket form.',
  },
  {
    q: 'How long does IT support take to respond?',
    a: 'Most tickets receive a first reply within one business day. High priority issues are picked up first.',
  },
  {
    q: 'Can I add more information to a ticket?',
    a: 'Yes. Open the ticket from My Tickets and use the conversation box to reply to IT support.',
  },
  {
    q: 'What if the AI cannot understand my problem?',
    a: 'You can create a support ticket at any time using the “Create Ticket” button in AI Support.',
  },
];

export default function HelpPage() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Help ❓</h1>
          <p className="muted">Answers to common questions and ways to reach us.</p>
        </div>
      </div>

      <div className="help-grid">
        <section className="card">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-list">
            {FAQS.map((item) => (
              <details key={item.q} className="faq">
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <aside className="card contact-card">
          <h2>Contact IT Support</h2>
          <p className="muted">Still stuck? Reach the team directly.</p>
          <div className="contact-row">
            <span>📧</span>
            <div>
              <strong>Email</strong>
              <div className="muted small">it-support@company.com</div>
            </div>
          </div>
          <div className="contact-row">
            <span>🕘</span>
            <div>
              <strong>Hours</strong>
              <div className="muted small">Mon–Fri, 9:00 AM – 6:00 PM</div>
            </div>
          </div>
          <div className="contact-row">
            <span>⚡</span>
            <div>
              <strong>Urgent issues</strong>
              <div className="muted small">Mark the ticket priority as High.</div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
