const CONTENT = {
  employee: {
    subtitle: 'Answers to common questions and ways to reach us.',
    faqs: [
      {
        q: 'How do I reset my password?',
        a: 'If you are signed in, open Settings → Password. If you are locked out, use the “Forgot password?” link on the sign-in page for instructions, or email IT support at it-support@company.com.',
      },
      {
        q: 'How do I create a support ticket?',
        a: 'Describe your issue in AI Support. If it still is not solved after 10 messages, choose “Create Support Ticket” and submit the form.',
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
        a: 'Keep the conversation going; after 10 messages you can create a ticket. You can also email IT support directly.',
      },
    ],
    aside: {
      title: 'Contact IT Support',
      blurb: 'Still stuck? Reach the team directly.',
      rows: [
        ['📧', 'Email', 'it-support@company.com'],
        ['🕘', 'Hours', 'Mon–Fri, 9:00 AM – 6:00 PM'],
        ['⚡', 'Urgent issues', 'Mark the ticket priority as High.'],
      ],
    },
  },
  support: {
    subtitle: 'How to work the queue and get help with your agent account.',
    faqs: [
      {
        q: 'How do I work the support queue?',
        a: 'Choose Support Queue in the sidebar. Tickets are listed newest first, with search and status filters.',
      },
      {
        q: 'How do I update a ticket?',
        a: 'Open a ticket and use the Status buttons to move it between Open, In Progress, and Resolved. Employees see the change immediately.',
      },
      {
        q: 'How do I reply to an employee?',
        a: 'Use the conversation box at the bottom of the ticket. Your replies are labelled IT Support.',
      },
      {
        q: 'How will I know about new tickets?',
        a: 'The bell shows recent activity, and a toast pops up when a new ticket or employee reply arrives.',
      },
      {
        q: 'How do I get or reset my login?',
        a: 'If you can sign in, change your password in Settings → Password. If you are locked out, ask Administration to remove and recreate your account.',
      },
    ],
    aside: {
      title: 'Contact Administration',
      blurb: 'Account questions go to the administration team.',
      rows: [
        ['📧', 'Email', 'admin@company.com'],
        ['🕘', 'Hours', 'Mon–Fri, 9:00 AM – 6:00 PM'],
        ['🔑', 'New accounts', 'Created in Administration → Manage IT Support.'],
      ],
    },
  },
  admin: {
    subtitle: 'How to manage IT support accounts and oversee the queue.',
    faqs: [
      {
        q: 'How do I add an IT support agent?',
        a: 'Open Manage IT Support, enter the agent’s name, email, and a password of at least 8 characters, then choose Create account.',
      },
      {
        q: 'How does the agent sign in?',
        a: 'Share the credentials you created. The agent signs in from the IT Support tab on the login page.',
      },
      {
        q: 'What can administration accounts do?',
        a: 'Create and remove IT support accounts, monitor the Support Queue, reply to tickets, and change ticket statuses.',
      },
      {
        q: 'What can IT support do?',
        a: 'Agents work the Support Queue, reply to employees, and update ticket statuses. They cannot manage accounts.',
      },
      {
        q: 'How do I reset an agent password?',
        a: 'Agents can change their own password in Settings → Password. If an agent is locked out, remove their account in Manage IT Support and create a new one.',
      },
      {
        q: 'What if I am locked out?',
        a: 'Administration passwords are reset by the system owner; IT support cannot reset them for you.',
      },
    ],
    aside: {
      title: 'Administration Tips',
      blurb: 'Quick links for account management.',
      rows: [
        ['👥', 'Add an agent', 'Manage IT Support in the sidebar.'],
        ['🎫', 'Oversee tickets', 'Open the Support Queue.'],
        ['🔐', 'Password resets', 'Agents change their own password in Settings; if locked out, remove and recreate the account.'],
      ],
    },
  },
};

export default function HelpPage({ user }) {
  const content = CONTENT[user?.role] || CONTENT.employee;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Help ❓</h1>
          <p className="muted">{content.subtitle}</p>
        </div>
      </div>

      <div className="help-grid">
        <section className="card">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-list">
            {content.faqs.map((item) => (
              <details key={item.q} className="faq">
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <aside className="card contact-card">
          <h2>{content.aside.title}</h2>
          <p className="muted">{content.aside.blurb}</p>
          {content.aside.rows.map(([icon, label, value]) => (
            <div className="contact-row" key={label}>
              <span>{icon}</span>
              <div>
                <strong>{label}</strong>
                <div className="muted small">{value}</div>
              </div>
            </div>
          ))}
        </aside>
      </div>
    </>
  );
}
