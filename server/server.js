require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const botRoutes = require('./routes/botRoutes');
const ticketRoutes = require('./routes/ticketRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/helpdesk';

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/bot', botRoutes);
app.use('/api/tickets', ticketRoutes);

app.use((err, req, res, next) => {
  res.status(500).json({ error: 'Server error: ' + err.message });
});

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected:', MONGO_URI);
    app.listen(PORT, () => console.log(`HelpDesk API running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
