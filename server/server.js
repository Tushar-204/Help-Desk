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
const { User } = require('./models/User');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/helpdesk';
const DEMO_MODE = process.env.NODE_ENV !== 'production' || process.env.SEED_DEMO === 'true';

if (process.env.NODE_ENV === 'production' && (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32)) {
  console.error('AUTH_SECRET must be set to at least 32 characters in production.');
  process.exit(1);
}
if (!process.env.AUTH_SECRET) {
  console.warn('AUTH_SECRET is not set; using the development secret. Set it in server/.env before deploying.');
}

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({ ok: ready });
});
app.use('/api/auth', authRoutes);
app.use('/api/bot', auth, botRoutes);
app.use('/api/tickets', auth, ticketRoutes);
app.use('/api/users', auth, userRoutes);

// Serve the built client so the app and API can run on one port (npm run build in client/).
const clientDist = path.join(__dirname, '../client/dist');
if (!fs.existsSync(path.join(clientDist, 'index.html'))) {
  console.warn('client/dist/index.html not found. Run "npm run build" in client/ to serve the app.');
}
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
  res.sendFile(path.join(clientDist, 'index.html'), (err) => err && next());
});

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
  res.status(status).json({ error: status >= 500 ? 'Internal server error.' : err.message });
});

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
  ]);
  console.log('Demo mode: seeded demo users (tushar@company.com / admin@company.com)');
}

let server;
mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');
    await seedDemoUsers();
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
