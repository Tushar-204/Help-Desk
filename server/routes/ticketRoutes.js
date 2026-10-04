const express = require('express');
const { Ticket, Counter, STATUSES, PRIORITIES } = require('../models/Ticket');

const router = express.Router();

async function nextToken() {
  const counter = await Counter.findByIdAndUpdate(
    'ticket',
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  return `SUP-${new Date().getFullYear()}-${String(counter.seq).padStart(5, '0')}`;
}

// POST /api/tickets
router.post('/', async (req, res) => {
  try {
    const { title, description, category, priority } = req.body || {};
    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: 'Title is required.' });
    }

    const ticket = await Ticket.create({
      token: await nextToken(),
      title: String(title).trim(),
      description: description || '',
      category: category || 'General',
      priority: PRIORITIES.includes(priority) ? priority : 'Medium',
    });

    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ error: 'Could not create ticket: ' + err.message });
  }
});

// GET /api/tickets
router.get('/', async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: 'Could not load tickets: ' + err.message });
  }
});

// GET /api/tickets/:id
router.get('/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });
    res.json(ticket);
  } catch (err) {
    res.status(400).json({ error: 'Invalid ticket id.' });
  }
});

// PUT /api/tickets/:id
router.put('/:id', async (req, res) => {
  try {
    const { title, description, category, priority, status } = req.body || {};
    const update = {};
    if (title !== undefined) update.title = title;
    if (description !== undefined) update.description = description;
    if (category !== undefined) update.category = category;
    if (priority !== undefined) {
      if (!PRIORITIES.includes(priority)) return res.status(400).json({ error: 'Invalid priority.' });
      update.priority = priority;
    }
    if (status !== undefined) {
      if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status.' });
      update.status = status;
    }

    const ticket = await Ticket.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });
    res.json(ticket);
  } catch (err) {
    res.status(400).json({ error: 'Could not update ticket: ' + err.message });
  }
});

// DELETE /api/tickets/:id
router.delete('/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });
    res.json({ message: 'Ticket deleted.', ticket });
  } catch (err) {
    res.status(400).json({ error: 'Invalid ticket id.' });
  }
});

module.exports = router;
