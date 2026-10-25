const { Schema, model } = require('mongoose');

const userSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['employee', 'support', 'admin'], default: 'employee' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = { User: model('User', userSchema) };
