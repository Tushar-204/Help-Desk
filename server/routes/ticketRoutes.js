const express = require('express');
const { isValidObjectId } = require('mongoose');
const { Ticket, Counter, STATUSES, PRIORITIES } = require('../models/Ticket');
const { CATEGORIES } = require('../bot/instructions');
const { staffOnly, adminOnly } = require('../auth');
const { rateLimit } = require('../middleware/rateLimit');
const { EMPLOYEE_CREATE_FIELDS, STAFF_UPDATE_FIELDS, pickFields } = require('../ticketFields');

const router = express.Router();
const CATEGORY_NAMES = ['General', ...CATEGORIES.map((c) => c.name)];
const MAX_OPEN_TICKETS = 10;
const MAX_MESSAGES = 200;

const ticketLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  key: (req) => String(req.user._id),
  message: 'Too many new tickets. Try again later.',
});

const messageLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 30,
  key: (req) => String(req.user._id),
  message: 'Too many messages. Try again in a few minutes.',
});

async function nextToken() {
  const counter = await Counter.findByIdAndUpdate(
    'ticket',
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  return `HD-${String(counter.seq).padStart(4, '0')}`;
}

// Validates and normalizes ticket input. `partial` is used by PUT.
function parseTicket(body = {}, { partial = false } = {}) {
  const values = {};
  const has = (key) => body[key] !== undefined;

  if (!partial || has('title')) {
    if (typeof body.title !== 'string' || !body.title.trim()) return { error: 'Title is required.' };
    const title = body.title.trim();
    if (title.length > 120) return { error: 'Title must be 120 characters or fewer.' };
    values.title = title;
  }

  if (has('description')) {
    if (typeof body.description !== 'string') return { error: 'Description must be text.' };
    if (body.description.length > 2000) return { error: 'Description must be 2000 characters or fewer.' };
    if (!partial && !body.description.trim()) return { error: 'Description is required.' };
    values.description = body.description.trim();
  } else if (!partial) {
    return { error: 'Description is required.' };
  }

  if (has('category')) {
    if (!CATEGORY_NAMES.includes(body.category)) return { error: 'Invalid category.' };
    values.category = body.category;
  } else if (!partial) {
    values.category = 'General';
  }

  if (has('priority')) {
    if (!PRIORITIES.includes(body.priority)) return { error: 'Invalid priority.' };
    values.priority = body.priority;
  } else if (!partial) {
    values.priority = 'Medium';
  }

  if (has('status')) {
    if (!STATUSES.includes(body.status)) return { error: 'Invalid status.' };
    values.status = body.status;
  }

  if (has('assignedTo')) {
    if (typeof body.assignedTo !== 'string' || !body.assignedTo.trim()) {
      return { error: 'Assigned to must be text.' };
    }
    values.assignedTo = body.assignedTo.trim().slice(0, 80);
  }

  if (has('attemptedSteps')) {
    if (!Array.isArray(body.attemptedSteps)) return { error: 'attemptedSteps must be a list.' };
    if (body.attemptedSteps.length > 20) return { error: 'Too many troubleshooting steps.' };
    if (body.attemptedSteps.some((s) => typeof s !== 'string' || s.length > 200)) {
      return { error: 'Invalid troubleshooting step.' };
    }
    values.attemptedSteps = body.attemptedSteps.map((s) => s.trim()).filter(Boolean);
  }

  return { values };
}

async function createTicket(values) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await Ticket.create({ ...values, token: await nextToken() });
    } catch (err) {
      // Retry once on a duplicate token (counter doc was reset/raced).
      if (err.code !== 11000 || attempt >= 1) throw err;
    }
  }
}

function canAccess(user, ticket) {
  return ['admin', 'support'].includes(user.role) || String(ticket.createdBy) === String(user._id);
}

// POST /api/tickets
router.post('/', ticketLimiter, async (req, res, next) => {
  const parsed = parseTicket(req.body);
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  const values = pickFields(parsed.values, EMPLOYEE_CREATE_FIELDS);

  try {
    if (req.user.role === 'employee') {
      const open = await Ticket.countDocuments({
        createdBy: req.user._id,
        status: { $ne: 'Resolved' },
      });
      if (open >= MAX_OPEN_TICKETS) {
        return res.status(429).json({ error: 'You already have too many open tickets.' });
      }
    }
    const ticket = await createTicket({
      ...values,
      status: 'Open',
      assignedTo: 'IT Support',
      employee: req.user.name,
      createdBy: req.user._id,
      updatedById: req.user._id,
    });
    res.status(201).json(ticket);
  } catch (err) {
    next(err);
  }
});

// GET /api/tickets — employees see their own; IT support and admins see the queue.
router.get('/', async (req, res, next) => {
  try {
    const staff = ['admin', 'support'].includes(req.user.role);
    const filter = staff ? {} : { createdBy: req.user._id };
    res.json(await Ticket.find(filter).sort({ createdAt: -1 }));
  } catch (err) {
    next(err);
  }
});

// GET /api/tickets/activity — lightweight snapshot for the notification poll.
router.get('/activity', async (req, res, next) => {
  try {
    const staff = ['admin', 'support'].includes(req.user.role);
    const filter = staff ? {} : { createdBy: req.user._id };
    const rows = await Ticket.aggregate([
      { $match: filter },
      { $sort: { updatedAt: -1 } },
      {
        $project: {
          token: 1,
          title: 1,
          status: 1,
          createdBy: 1,
          updatedById: 1,
          updatedAt: 1,
          messageCount: { $size: { $ifNull: ['$messages', []] } },
          lastMessageRole: {
            $ifNull: [
              { $arrayElemAt: [{ $ifNull: ['$messages.role', []] }, -1] },
              null,
            ],
          },
          lastMessageAuthorId: {
            $ifNull: [
              { $arrayElemAt: [{ $ifNull: ['$messages.authorId', []] }, -1] },
              null,
            ],
          },
        },
      },
    ]);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/tickets/:id
router.get('/:id', async (req, res, next) => {
  if (!isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid ticket id.' });
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });
    if (!canAccess(req.user, ticket)) return res.status(403).json({ error: 'Not your ticket.' });
    res.json(ticket);
  } catch (err) {
    next(err);
  }
});

// PUT /api/tickets/:id — status/priority/assignment handled by IT support.
router.put('/:id', staffOnly, async (req, res, next) => {
  if (!isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid ticket id.' });

  const parsed = parseTicket(req.body, { partial: true });
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  const values = pickFields(parsed.values, STAFF_UPDATE_FIELDS);
  if (!Object.keys(values).length) return res.status(400).json({ error: 'Nothing to update.' });

  try {
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { ...values, updatedAt: Date.now(), updatedById: req.user._id },
      { new: true, runValidators: true }
    );
    if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });
    res.json(ticket);
  } catch (err) {
    next(err);
  }
});

// POST /api/tickets/:id/messages — conversation between employee and IT support.
router.post('/:id/messages', messageLimiter, async (req, res, next) => {
  if (!isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid ticket id.' });
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
  if (!text) return res.status(400).json({ error: 'Message is required.' });
  if (text.length > 1000) return res.status(400).json({ error: 'Message must be 1000 characters or fewer.' });

  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });
    if (!canAccess(req.user, ticket)) return res.status(403).json({ error: 'Not your ticket.' });
    if (ticket.messages.length >= MAX_MESSAGES) {
      return res.status(429).json({ error: 'This ticket has reached its message limit.' });
    }

    ticket.messages.push({
      author: req.user.name,
      authorId: req.user._id,
      role: req.user.role === 'employee' ? 'employee' : 'admin',
      text,
    });
    ticket.updatedAt = Date.now();
    ticket.updatedById = req.user._id;
    await ticket.save();
    res.status(201).json(ticket);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tickets/:id
router.delete('/:id', adminOnly, async (req, res, next) => {
  if (!isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid ticket id.' });
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });
    res.json({ message: 'Ticket deleted.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
