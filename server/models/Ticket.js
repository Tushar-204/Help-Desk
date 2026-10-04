const { Schema, model } = require('mongoose');

const STATUSES = ['Open', 'In Progress', 'Resolved'];
const PRIORITIES = ['Low', 'Medium', 'High'];

const ticketSchema = new Schema({
  token: { type: String, required: true, unique: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  category: { type: String, default: 'General' },
  priority: { type: String, enum: PRIORITIES, default: 'Medium' },
  status: { type: String, enum: STATUSES, default: 'Open' },
  createdAt: { type: Date, default: Date.now },
});

// ponytail: atomic counter for tokens — one doc, no lock table needed at this scale
const counterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

module.exports = {
  Ticket: model('Ticket', ticketSchema),
  Counter: model('Counter', counterSchema),
  STATUSES,
  PRIORITIES,
};
