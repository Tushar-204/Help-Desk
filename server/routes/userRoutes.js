const express = require('express');
const { isValidObjectId } = require('mongoose');
const { User } = require('../models/User');
const { hashPassword, adminOnly } = require('../auth');

const router = express.Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GET /api/users — administration lists the IT support accounts.
router.get('/', adminOnly, async (req, res, next) => {
  try {
    const users = await User.find({ role: 'support' })
      .select('name email role createdAt')
      .sort({ createdAt: 1 });
    res.json(users);
  } catch (err) {
    next(err);
  }
});

// POST /api/users — administration creates an IT support login.
router.post('/', adminOnly, async (req, res, next) => {
  const { name, email, password } = req.body || {};
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 80) {
    return res.status(400).json({ error: 'A name of 80 characters or fewer is required.' });
  }
  if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    return res.status(400).json({ error: 'A valid email is required.' });
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    return res.status(400).json({ error: 'Password must be 8 to 128 characters.' });
  }

  try {
    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: await hashPassword(password),
      role: 'support',
    });
    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'That email is already registered.' });
    }
    next(err);
  }
});

// DELETE /api/users/:id — administration removes an IT support login.
router.delete('/:id', adminOnly, async (req, res, next) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid account id.' });
  }
  try {
    const user = await User.findOneAndDelete({ _id: req.params.id, role: 'support' });
    if (!user) return res.status(404).json({ error: 'IT support account not found.' });
    res.json({ message: 'IT support account removed.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
