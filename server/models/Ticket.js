const { Schema, model } = require('mongoose');

const STATUSES = ['Open', 'In Progress', 'Resolved'];
const PRIORITIES = ['Low', 'Medium', 'High'];

const messageSchema = new Schema(
  {
    author: { type: String, required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['employee', 'admin'], required: true },
    text: { type: String, required: true, maxlength: 1000 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ticketSchema = new Schema({
  token: { type: String, required: true, unique: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, default: '', maxlength: 2000 },
  category: { type: String, default: 'General' },
  priority: { type: String, enum: PRIORITIES, default: 'Medium' },
  status: { type: String, enum: STATUSES, default: 'Open' },
  employee: { type: String, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  assignedTo: { type: String, default: 'IT Support' },
  updatedById: { type: Schema.Types.ObjectId, ref: 'User' },
  attemptedSteps: { type: [String], default: [] },
  messages: { type: [messageSchema], default: [] },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now },
});

ticketSchema.index({ updatedAt: -1 });
ticketSchema.index({ createdBy: 1, status: 1 });
ticketSchema.index({ createdBy: 1, updatedAt: -1 });

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
