require('dotenv').config();
const path = require('path');
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

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/bot', auth, botRoutes);
app.use('/api/tickets', auth, ticketRoutes);
app.use('/api/users', auth, userRoutes);

// Serve the built client so the app and API can run on one port (npm run build in client/).
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
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
  if (await User.countDocuments()) return;
  await User.create([
    {
      name: 'Tushar',
      email: 'tushar@company.com',
      passwordHash: hashPassword('helpdesk123'),
      role: 'employee',
    },
    {
      name: 'Admin',
      email: 'admin@company.com',
      passwordHash: hashPassword('admin123'),
      role: 'admin',
    },
  ]);
  console.log('Seeded demo users (tushar@company.com / admin@company.com)');
}

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');
    await seedDemoUsers();
    app.listen(PORT, () => console.log(`HelpDesk API running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
