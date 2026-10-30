const CONTENT = {
  employee: {
    subtitle: 'Answers to common questions and ways to reach us.',
    faqs: [
      {
        q: 'How do I create an account?',
        a: 'On the sign-in page, choose “Create an account” and register with your @company.com email. Your employee account is ready immediately. IT Support accounts are created by Administration.',
      },
      {
        q: 'How do I reset my password?',
        a: 'If you are signed in, open Settings → Password. If you are locked out, ask Administration at admin@company.com to reset it.',
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
        q: 'Can I create or reset employee accounts?',
        a: 'No. Administration manages employee accounts, including password resets and deactivation.',
      },
      {
        q: 'How do I get or reset my login?',
        a: 'If you can sign in, change your password in Settings → Password. If you are locked out, ask Administration to reset it.',
      },
    ],
    aside: {
      title: 'Contact Administration',
      blurb: 'Account questions go to the administration team.',
      rows: [
        ['📧', 'Email', 'admin@company.com'],
        ['🕘', 'Hours', 'Mon–Fri, 9:00 AM – 6:00 PM'],
        ['🔑', 'New accounts', 'IT support accounts are created in Administration → Manage IT Support.'],
      ],
    },
  },
  admin: {
    subtitle: 'How to manage employee and IT support accounts.',
    faqs: [
      {
        q: 'How do employees get accounts?',
        a: 'Employees can self-register from the sign-in page using a @company.com email, or you can create their account in Manage Employees and share the credentials.',
      },
      {
        q: 'How do I add an employee?',
        a: 'Open Manage Employees, enter the employee’s name, @company.com email, and a password of at least 8 characters, then choose Create account.',
      },
      {
        q: 'How do I deactivate or delete an employee?',
        a: 'Use Deactivate in Manage Employees to block sign-in and end active sessions while keeping ticket history. Delete is available only when the employee has zero tickets.',
      },
      {
        q: 'How do I add an IT support agent?',
        a: 'Open Manage IT Support, enter the agent’s name, email, and a password of at least 8 characters, then choose Create account.',
      },
      {
        q: 'How does an agent sign in?',
        a: 'Share the credentials you created. The agent signs in from the IT Support tab on the login page.',
      },
      {
        q: 'How do I reset an employee or agent password?',
        a: 'Open Manage Employees or Manage IT Support and choose Reset password. Share the generated temporary password; the user can change it in Settings → Password.',
      },
      {
        q: 'What can IT support do?',
        a: 'Agents work the Support Queue, reply to employees, and update ticket statuses. They cannot manage accounts.',
      },
      {
        q: 'Who handles the support queue?',
        a: 'IT Support handles all ticket work. Administration manages employee and IT support accounts, access, and password resets.',
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
        ['👤', 'Add an employee', 'Manage Employees in the sidebar.'],
        ['👥', 'Add an agent', 'Manage IT Support in the sidebar.'],
        ['🎫', 'Ticket queue', 'IT Support handles the Support Queue and ticket updates.'],
        ['🔐', 'Password resets', 'Use Reset password on either account page; users can change it in Settings.'],
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
