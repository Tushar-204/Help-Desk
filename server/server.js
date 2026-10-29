const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const botRoutes = require('./routes/botRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const userRoutes = require('./routes/userRoutes');
const { auth, hashPassword } = require('./auth');
const { parseAccount } = require('./accountRules');
const { User } = require('./models/User');
const { Ticket, Counter } = require('./models/Ticket');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/helpdesk';
const DEMO_MODE = process.env.SEED_DEMO === 'true';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const clientDist = path.join(__dirname, '../client/dist');
const clientIndex = path.join(clientDist, 'index.html');
const SERVE_CLIENT = !['false', '0'].includes(
  String(process.env.SERVE_CLIENT || '').toLowerCase()
);
const hasClientBuild = SERVE_CLIENT && fs.existsSync(clientIndex);

if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) {
  console.error('AUTH_SECRET must be set to at least 32 characters.');
  process.exit(1);
}
if (process.env.NODE_ENV === 'production' && !process.env.MONGO_URI) {
  console.error('MONGO_URI must be set in production.');
  process.exit(1);
}
if (SERVE_CLIENT && !hasClientBuild) {
  const help =
    'Build the client (client/npm run build) or set SERVE_CLIENT=false when the frontend is hosted separately.';
  if (process.env.NODE_ENV === 'production') {
    console.error(`client/dist/index.html not found. ${help}`);
    process.exit(1);
  }
  console.warn(`client/dist/index.html not found. ${help}`);
}

app.disable('x-powered-by');
if (process.env.TRUST_PROXY) {
  const hops = Number(process.env.TRUST_PROXY);
  app.set('trust proxy', Number.isInteger(hops) ? hops : process.env.TRUST_PROXY);
}
if (process.env.CLIENT_ORIGIN) {
  const origins = process.env.CLIENT_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.use(cors({ origin: origins }));
}
app.use(express.json());

app.get('/api/health', (req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({ ok: ready, demoMode: DEMO_MODE, clientBuild: hasClientBuild });
});
app.use('/api/auth', authRoutes);
app.use('/api/bot', auth, botRoutes);
app.use('/api/tickets', auth, ticketRoutes);
app.use('/api/users', auth, userRoutes);

// Serve the built client when the frontend is not hosted separately.
if (SERVE_CLIENT) {
  app.use(
    express.static(clientDist, {
      setHeaders: (res, filePath) => {
        const immutable = !filePath.endsWith('index.html');
        res.setHeader(
          'Cache-Control',
          immutable ? 'public, max-age=31536000, immutable' : 'no-cache'
        );
      },
    })
  );
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || path.extname(req.path)) return next();
    res.sendFile(clientIndex, (err) => err && next());
  });
}

app.use((req, res) => res.status(404).json({ error: 'Not found.' }));

app.use((err, req, res, next) => {
  const status =
    err.type === 'entity.parse.failed'
      ? 400
      : err.name === 'ValidationError' || err.name === 'CastError'
        ? 400
        : err.code === 11000
          ? 409
          : err.status || 500;

  if (status >= 500) console.error(err);
  let message = err.message;
  if (status >= 500) message = 'Internal server error.';
  else if (err.code === 11000) message = 'That value is already in use.';
  else if (err.type === 'entity.parse.failed') message = 'Invalid JSON body.';
  else if (err.name === 'ValidationError' || err.name === 'CastError') message = 'Invalid request.';
  res.status(status).json({ error: message });
});

// One-time production bootstrap. Set ADMIN_EMAIL and ADMIN_PASSWORD for the first deploy.
async function ensureAdmin() {
  if (await User.exists({ role: 'admin' })) return;
  if (!ADMIN_EMAIL && !ADMIN_PASSWORD) {
    if (!DEMO_MODE) {
      console.warn('No admin account exists. Set ADMIN_EMAIL and ADMIN_PASSWORD to bootstrap one.');
    }
    return;
  }
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('Set both ADMIN_EMAIL and ADMIN_PASSWORD to bootstrap an admin.');
  }
  const parsed = parseAccount({
    name: process.env.ADMIN_NAME || 'Administrator',
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  if (parsed.error) throw new Error(`Admin bootstrap: ${parsed.error}`);
  await User.create({
    name: parsed.values.name,
    email: parsed.values.email,
    passwordHash: await hashPassword(parsed.values.password),
    role: 'admin',
  });
  console.log(`Admin account created for ${parsed.values.email}.`);
}

// ponytail: startup scan keeps a reset counter from reusing ticket tokens;
// move to a persisted high-water mark if ticket volume makes this scan slow.
async function reconcileTicketCounter() {
  const tickets = await Ticket.find({ token: /^HD-\d+$/ }).select('token').lean();
  const highest = tickets.reduce(
    (max, ticket) => Math.max(max, Number(ticket.token.slice(3)) || 0),
    0
  );
  if (!highest) return;
  await Counter.findByIdAndUpdate('ticket', { $max: { seq: highest } }, { upsert: true });
}

// ponytail: demo accounts seeded on first boot; replace with real onboarding when needed
async function seedDemoUsers() {
  if (!DEMO_MODE) return;
  if (await User.countDocuments()) return;
  await User.create([
    {
      name: 'Tushar',
      email: 'tushar@company.com',
      passwordHash: await hashPassword('helpdesk123'),
      role: 'employee',
    },
    {
      name: 'Admin',
      email: 'admin@company.com',
      passwordHash: await hashPassword('admin123'),
      role: 'admin',
    },
    {
      name: 'Support Agent',
      email: 'support@company.com',
      passwordHash: await hashPassword('support123'),
      role: 'support',
    },
  ]);
  console.log('Demo mode: seeded demo users (tushar, admin, support)');
}

let server;
mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');
    await ensureAdmin();
    await seedDemoUsers();
    await reconcileTicketCounter();
    server = app.listen(PORT, () => console.log(`HelpDesk API running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });

function shutdown(signal) {
  console.log(`${signal} received; shutting down.`);
  if (!server) return process.exit(0);
  server.close(async () => {
    await mongoose.disconnect().catch(() => {});
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
