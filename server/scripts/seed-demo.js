const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const { User } = require('../models/User');
const { Ticket, Counter } = require('../models/Ticket');
const { hashPassword } = require('../auth');

const MONGO_URI =
  process.env.DEMO_MONGO_URI || 'mongodb://127.0.0.1:27017/helpdesk_demo';

const hoursAgo = (hours) => new Date(Date.now() - hours * 60 * 60 * 1000);

async function ensureUser({ name, email, password, role }) {
  const existing = await User.findOne({ email });
  if (existing) return existing;
  return User.create({
    name,
    email,
    passwordHash: await hashPassword(password),
    role,
    mustChangePassword: false,
  });
}

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log(`Connected to ${MONGO_URI}`);

  const users = {
    admin: await ensureUser({
      name: 'Admin',
      email: 'admin@company.com',
      password: 'admin123',
      role: 'admin',
    }),
    tushar: await ensureUser({
      name: 'Tushar',
      email: 'tushar@company.com',
      password: 'helpdesk123',
      role: 'employee',
    }),
    riya: await ensureUser({
      name: 'Riya',
      email: 'riya@company.com',
      password: 'helpdesk123',
      role: 'employee',
    }),
    arjun: await ensureUser({
      name: 'Arjun',
      email: 'arjun@company.com',
      password: 'helpdesk123',
      role: 'employee',
    }),
    support: await ensureUser({
      name: 'Support Agent',
      email: 'support@company.com',
      password: 'support123',
      role: 'support',
    }),
  };

  const messages = (items) =>
    items.map(([authorEmail, role, text, hours]) => {
      const author = users[authorEmail];
      return {
        author: author.name,
        authorId: author._id,
        role,
        text,
        createdAt: hoursAgo(hours),
      };
    });

  const demo = [
    {
      token: 'HD-0001',
      title: 'Laptop cannot connect to office Wi-Fi',
      description:
        'Since this morning my laptop connects to the guest network but not the office Wi-Fi. It worked yesterday.',
      category: 'Internet',
      priority: 'High',
      status: 'In Progress',
      employee: users.tushar.name,
      createdBy: users.tushar._id,
      updatedById: users.support._id,
      attemptedSteps: ['Restart the router or modem.'],
      createdAt: hoursAgo(3),
      updatedAt: hoursAgo(0.75),
      messages: messages([
        ['tushar', 'employee', 'I cannot connect to the office Wi-Fi after the update this morning.', 3],
        ['support', 'admin', 'I checked your device registration. Please forget the network and reconnect with your company credentials.', 1],
        ['tushar', 'employee', 'I tried that, but it is still stuck on Authenticating.', 0.75],
      ]),
    },
    {
      token: 'HD-0002',
      title: 'Outlook keeps asking for my password',
      description:
        'Outlook prompts for my password every few minutes and will not stay signed in.',
      category: 'Email',
      priority: 'High',
      status: 'Open',
      employee: users.riya.name,
      createdBy: users.riya._id,
      updatedById: users.riya._id,
      attemptedSteps: [],
      createdAt: hoursAgo(2),
      updatedAt: hoursAgo(2),
      messages: messages([
        ['riya', 'employee', 'Outlook keeps asking for my password even after I enter it.', 2],
      ]),
    },
    {
      token: 'HD-0003',
      title: 'Printer on the third floor reports a paper jam',
      description: 'The printer near the kitchen is showing a paper jam message, but I cannot find any paper stuck.',
      category: 'Hardware',
      priority: 'Low',
      status: 'Resolved',
      employee: users.arjun.name,
      createdBy: users.arjun._id,
      updatedById: users.support._id,
      attemptedSteps: ['Check the cables or wireless connection for the printer.'],
      createdAt: hoursAgo(48),
      updatedAt: hoursAgo(24),
      messages: messages([
        ['arjun', 'employee', 'The third-floor printer says paper jam but the tray looks empty.', 48],
        ['support', 'admin', 'I cleared a small torn sheet from the rear access panel. Please try printing again.', 30],
        ['arjun', 'employee', 'It is printing normally now. Thank you!', 24],
      ]),
    },
    {
      token: 'HD-0004',
      title: 'Cannot sign in to the payroll portal',
      description: 'The payroll portal says my account is locked after three attempts.',
      category: 'Login',
      priority: 'High',
      status: 'Open',
      employee: users.tushar.name,
      createdBy: users.tushar._id,
      updatedById: users.tushar._id,
      attemptedSteps: [],
      createdAt: hoursAgo(1),
      updatedAt: hoursAgo(1),
      messages: messages([
        ['tushar', 'employee', 'I am locked out of the payroll portal and need to submit my timesheet today.', 1],
      ]),
    },
    {
      token: 'HD-0005',
      title: 'Teams crashes when joining client meetings',
      description: 'Microsoft Teams closes immediately when I join a meeting with an external client.',
      category: 'Application Error',
      priority: 'Medium',
      status: 'In Progress',
      employee: users.riya.name,
      createdBy: users.riya._id,
      updatedById: users.support._id,
      attemptedSteps: ['Clear your browser cache and reload.'],
      createdAt: hoursAgo(26),
      updatedAt: hoursAgo(4),
      messages: messages([
        ['riya', 'employee', 'Teams crashes every time I join a client call.', 26],
        ['support', 'admin', 'Please try the web version of Teams while I check your desktop client version.', 4],
      ]),
    },
    {
      token: 'HD-0006',
      title: 'Need access to the Finance shared folder',
      description: 'I joined the Finance team this week and need read access to the monthly reporting folder.',
      category: 'General',
      priority: 'Medium',
      status: 'Resolved',
      employee: users.arjun.name,
      createdBy: users.arjun._id,
      updatedById: users.support._id,
      attemptedSteps: [],
      createdAt: hoursAgo(72),
      updatedAt: hoursAgo(48),
      messages: messages([
        ['arjun', 'employee', 'Could you grant me access to the Finance shared reporting folder?', 72],
        ['support', 'admin', 'Access has been granted. Please sign out and back in to refresh your permissions.', 48],
      ]),
    },
    {
      token: 'HD-0007',
      title: 'External monitor flickers after docking',
      description: 'The monitor flickers whenever I connect my laptop to the docking station.',
      category: 'Hardware',
      priority: 'Low',
      status: 'Open',
      employee: users.riya.name,
      createdBy: users.riya._id,
      updatedById: users.riya._id,
      attemptedSteps: [],
      createdAt: hoursAgo(4),
      updatedAt: hoursAgo(4),
      messages: [],
    },
    {
      token: 'HD-0008',
      title: 'Password reset for new starter',
      description: 'Please reset the temporary password for the new starter in the Design team.',
      category: 'Password',
      priority: 'Medium',
      status: 'Resolved',
      employee: users.tushar.name,
      createdBy: users.tushar._id,
      updatedById: users.support._id,
      attemptedSteps: [],
      createdAt: hoursAgo(96),
      updatedAt: hoursAgo(90),
      messages: messages([
        ['tushar', 'employee', 'The new starter cannot sign in with the temporary password we shared.', 96],
        ['support', 'admin', 'I issued a fresh temporary password. Please ask them to change it after signing in.', 90],
      ]),
    },
  ];

  let created = 0;
  for (const item of demo) {
    if (await Ticket.exists({ token: item.token })) continue;
    await Ticket.create({ ...item, assignedTo: 'IT Support' });
    created += 1;
  }

  const tickets = await Ticket.find({ token: /^HD-\d+$/ }).select('token').lean();
  const highest = tickets.reduce(
    (max, ticket) => Math.max(max, Number(ticket.token.slice(3)) || 0),
    0
  );
  if (highest) {
    await Counter.findByIdAndUpdate('ticket', { $max: { seq: highest } }, { upsert: true });
  }

  console.log(`Demo users ready (${Object.keys(users).length}).`);
  console.log(`Created ${created} demo ticket(s); ${tickets.length} total.`);
  console.log('Demo logins:');
  console.log('  admin@company.com / admin123');
  console.log('  tushar@company.com / helpdesk123');
  console.log('  support@company.com / support123');
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('Demo seed failed:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
